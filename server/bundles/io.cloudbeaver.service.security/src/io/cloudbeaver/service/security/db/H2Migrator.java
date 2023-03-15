package io.cloudbeaver.service.security.db;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.Properties;

public class H2Migrator {

    private static final Log log = Log.getLog(H2Migrator.class);

    private static final String H2_PROVIDER_ID = "h2";
    private static final String H2_DRIVER_NAME = "h2_embedded";

    private static final String H2_V2_DRIVER_NAME = "h2_embedded_v2";
    private static final String EXPORT_FILE_NAME = "H2v1ExportScript";
    @SuppressWarnings("SqlNoDataSourceInspection")
    // language=H2
    private static final String EXPORT_STATEMENT = "SCRIPT TO ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8'";
    @SuppressWarnings("SqlNoDataSourceInspection")
    // language=H2
    private static final String IMPORT_STATEMENT = "RUNSCRIPT FROM ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8' FROM_1X";

    private final DBRProgressMonitor monitor;
    private final DataSourceProviderRegistry dataSourceProviderRegistry;
    private final CBDatabaseConfig databaseConfiguration;
    private final Driver v1Driver;
    private final String dbUrl;
    private final Properties dbProperties;

    public H2Migrator(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DataSourceProviderRegistry dataSourceProviderRegistry,
        @NotNull CBDatabaseConfig databaseConfiguration,
        @NotNull Driver v1Driver,
        @NotNull String dbUrl,
        @NotNull Properties dbProperties
    ) {
        this.monitor = monitor;
        this.dataSourceProviderRegistry = dataSourceProviderRegistry;
        this.databaseConfiguration = databaseConfiguration;
        this.v1Driver = v1Driver;
        this.dbUrl = dbUrl;
        this.dbProperties = dbProperties;
    }

    public void tryToMigrateDb() {
        var v2Driver = getV2DriverIfMigrationNeeded();
        if (v2Driver == null) {
            if (H2_DRIVER_NAME.equals(databaseConfiguration.getDriver())) {
                updateConfig(); // if it is already migrated H2 v2 we need to update the config
            }
            return;
        }

        var workPaths = new WorkspacePaths(dbUrl);
        try {
            migrateDb(workPaths, v2Driver);
        } catch (Exception e) {
            rollback(workPaths);
            log.error("H2 to v2 migration failed and reverted", e);
        }
    }

    @Nullable
    private Driver getV2DriverIfMigrationNeeded() {
        if (!H2_DRIVER_NAME.equals(databaseConfiguration.getDriver()) &&
            !H2_V2_DRIVER_NAME.equals(databaseConfiguration.getDriver())
        ) {
            return null;
        }

        if (dbUrl.startsWith("jdbc:h2:mem:")) {
            log.debug("In-memory database detected. No migration needed");
            return null;
        }

        Driver v2Driver;
        try {
            var driverProvider = dataSourceProviderRegistry.findDriver(H2_V2_DRIVER_NAME);
            if (driverProvider == null) {
                log.error("Failed to initialize H2 v2 driver");
                return null;
            }
            v2Driver = driverProvider.getDriverInstance(monitor);
        } catch (DBException e) {
            log.error("Failed to initialize H2 v2 driver", e);
            return null;
        }

        try (var ignored = v2Driver.connect(dbUrl, dbProperties)) {
            log.debug("Current H2 database is v2. No migration needed");
        } catch (SQLException connectionException) {
            if (connectionException.getMessage().startsWith("General error: \"The write format 1 is smaller than the supported format 2")) {
                return v2Driver;
            } else {
                log.error("Unexpected exception. Migration aborted", connectionException);
            }
        }
        return null;
    }

    private void updateConfig() {
        log.info("Using '" + H2_V2_DRIVER_NAME + "' instead of '" + H2_DRIVER_NAME + "' from config");
        databaseConfiguration.setDriver(H2_V2_DRIVER_NAME);
    }

    private void migrateDb(@NotNull WorkspacePaths workspacePaths, @NotNull Driver v2Driver) throws SQLException, IOException, DBException {
        log.info("H2 database v1 -> v2 migration started");

        createV1Script(workspacePaths.dbFolderPath);

        Files.move(workspacePaths.dbPath, workspacePaths.dbV1BackupPath, StandardCopyOption.REPLACE_EXISTING);

        try (
            var connection = v2Driver.connect(dbUrl, dbProperties);
            var statement = connection.prepareStatement(IMPORT_STATEMENT)
        ) {
            statement.setString(1, workspacePaths.dbPath.resolve(EXPORT_FILE_NAME).toString());
            statement.setString(2, dbProperties.getProperty(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD));
            if (!statement.execute()) {
                throw new DBException("Failed to execute import query");
            }
        }

        removeExportScript(workspacePaths.dbFolderPath);

        updateConfig();
    }

    private void createV1Script(@NotNull Path dbFolderPath) throws SQLException, DBException {
        try (
            var connection = v1Driver.connect(dbUrl, dbProperties);
            var statement = connection.prepareStatement(EXPORT_STATEMENT)
        ) {
            statement.setString(1, dbFolderPath.resolve(EXPORT_FILE_NAME).toString());
            statement.setString(2, dbProperties.getProperty(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD));
            if (!statement.execute()) {
                throw new DBException("Failed to execute export query");
            }
        }
    }

    private void rollback(@NotNull WorkspacePaths workspacePaths) {
        removeExportScript(workspacePaths.dbFolderPath);
        try {
            Files.move(workspacePaths.dbV1BackupPath, workspacePaths.dbPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Unable to restore old database file '" + workspacePaths.dbPath + "'");
        }
    }

    private void removeExportScript(@NotNull Path dbFolderPath) {
        var dbFolder = dbFolderPath.toFile();
        if (!dbFolder.exists()) {
            return;
        }
        var exportScript = dbFolder.listFiles((file, name) -> name.equals(EXPORT_FILE_NAME));
        if (exportScript == null || exportScript.length == 0) {
            return;
        }
        var fileDeleted = exportScript[0].delete();
        if (!fileDeleted) {
            log.error("Unable to remove H2 v1 export script file");
        }
    }

    private static class WorkspacePaths {
        @NotNull
        private final Path dbPath;
        @NotNull
        private final Path dbFolderPath;
        @NotNull
        private final Path dbV1BackupPath;

        WorkspacePaths(@NotNull String dbUrl) {
            dbPath = createDbPath(dbUrl);
            dbFolderPath = dbPath.getParent();
            dbV1BackupPath = dbFolderPath.resolve("h2db_backup");
        }

        @NotNull
        private static Path createDbPath(@NotNull String dbUrl) {
            var filePath = dbUrl.substring("jdbc:h2:".length());
            if (!filePath.endsWith(".mv.db")) {
                filePath += ".mv.db";
            }
            return Paths.get(filePath);
        }
    }
}

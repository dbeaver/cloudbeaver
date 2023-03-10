package io.cloudbeaver.service.security.db;

import org.jkiss.code.NotNull;
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
    @SuppressWarnings("SqlNoDataSourceInspection")
    // language=H2
    private static final String EXPORT_STATEMENT = "SCRIPT TO ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8'";
    @SuppressWarnings("SqlNoDataSourceInspection")
    // language=H2
    private static final String IMPORT_STATEMENT = "RUNSCRIPT FROM ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8' FROM_1X";
    public static final String EXPORT_FILE_NAME = "H2v1ExportScript";

    private final DBRProgressMonitor monitor;
    private final DataSourceProviderRegistry dataSourceProviderRegistry;
    private final CBDatabaseConfig databaseConfiguration;
    private final Driver v1Driver;
    private final String dbUrl;
    private final Properties dbProperties;
    private final Path dbFolderPath;
    private final Path dbPath;
    private final Path dbV1BackupPath;

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

        dbPath = createDbPath(dbUrl);
        dbFolderPath = dbPath.getParent();
        dbV1BackupPath = dbFolderPath.resolve("h2db.backup");
    }

    public void tryToMigrateDb() {
        if (!H2_DRIVER_NAME.equals(databaseConfiguration.getDriver())) {
            log.debug("");
            return;
        }
        try {
            migrateDb();
        } catch (Exception e) {
            rollback();
            log.error("H2 to v2 migration failed and reverted", e);
        }
    }

    private void migrateDb() throws H2V2MigrationException, SQLException, IOException, DBException {
        createV1Script();

        Files.move(dbPath, dbV1BackupPath, StandardCopyOption.REPLACE_EXISTING);

        var v2Driver = getV2Driver();
        try (
            var connection = v2Driver.connect(dbUrl, dbProperties);
            var statement = connection.prepareStatement(IMPORT_STATEMENT)
        ) {
            statement.setString(1, dbFolderPath.resolve(EXPORT_FILE_NAME).toString());
            statement.setString(2, dbProperties.getProperty(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD));
            if (!statement.execute()) {
                throw new H2V2MigrationException("Failed to execute import query");
            }
        }

        removeExportScript();
    }

    private void createV1Script() throws SQLException, H2V2MigrationException {
        try (
            var connection = v1Driver.connect(dbUrl, dbProperties);
            var statement = connection.prepareStatement(EXPORT_STATEMENT)
        ) {
            statement.setString(1, dbFolderPath.resolve(EXPORT_FILE_NAME).toString());
            statement.setString(2, dbProperties.getProperty(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD));
            if (!statement.execute()) {
                throw new H2V2MigrationException("Failed to execute export query");
            }
        }
    }

    @NotNull
    private Driver getV2Driver() throws DBException, H2V2MigrationException {
        var h2Provider = dataSourceProviderRegistry.getDataSourceProvider(H2_PROVIDER_ID);
        if (h2Provider == null) {
            throw new H2V2MigrationException("Unable to find H2 datasource provider");
        }
        var v2DriverDescriptor = h2Provider.getDriver(H2_V2_DRIVER_NAME);
        if (v2DriverDescriptor == null) {
            throw new H2V2MigrationException("Unable to find H2 v2 driver descriptor");
        }
        return v2DriverDescriptor.getDriverInstance(monitor);
    }

    private void rollback() {
        removeExportScript();

        try {
            Files.move(dbV1BackupPath, dbPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Unable to restore old database file '" + dbPath + "'");
        }
    }

    private void removeExportScript() {
        var dbFolder = dbFolderPath.toFile();
        if (dbFolder.exists()) {
            var exportScript = dbFolder.listFiles((file, name) -> name.equals(EXPORT_FILE_NAME));
            if (exportScript != null && exportScript.length > 0) {
                var fileDeleted = exportScript[0].delete();
                if (!fileDeleted) {
                    log.error("Unable to remove H2 v1 export script file");
                }
            }
        }
    }

    @NotNull
    private static Path createDbPath(@NotNull String dbUrl) {
        var filePath = dbUrl.substring(8); // remove jdbc:h2:
        if (!filePath.endsWith(".mv.db")) {
            filePath += ".mv.db";
        }
        return Paths.get(filePath);
    }

    private static class H2V2MigrationException extends Exception {

        H2V2MigrationException(@NotNull String message) {
            super(message);
        }

        H2V2MigrationException(@NotNull String message, @NotNull Throwable cause) {
            super(message, cause);
        }

        public H2V2MigrationException(@NotNull Throwable cause) {
            super(cause);
        }
    }
}

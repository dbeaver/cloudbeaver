/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

    private static final String H2_DRIVER_NAME = "h2_embedded";
    private static final String H2_V2_DRIVER_NAME = "h2_embedded_v2";
    private static final String BACKUP_V1_FILENAME = "h2db_backup";
    private static final String EXPORT_FILE_NAME = "H2v1ExportScript";
    // language=H2
    private static final String EXPORT_SCRIPT = "SCRIPT TO ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8'";

    // no 'language=H2' — due to an annoying error about unresolvable statement 'FROM_1X'
    private static final String IMPORT_SCRIPT = "RUNSCRIPT FROM ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8' FROM_1X";

    private final DBRProgressMonitor monitor;
    private final DataSourceProviderRegistry dataSourceProviderRegistry;
    private final CBDatabaseConfig databaseConfiguration;
    private final String dbUrl;
    private final Properties dbProperties;

    public H2Migrator(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DataSourceProviderRegistry dataSourceProviderRegistry,
        @NotNull CBDatabaseConfig databaseConfiguration,
        @NotNull String dbUrl,
        @NotNull Properties dbProperties
    ) {
        this.monitor = monitor;
        this.dataSourceProviderRegistry = dataSourceProviderRegistry;
        this.databaseConfiguration = databaseConfiguration;
        this.dbUrl = dbUrl;
        this.dbProperties = dbProperties;
    }

    /**
     * Migrates the H2 database from version 1 to version 2.
     * <p>
     * IMPORTANT: if the database is already version 2, but the driver in the configuration is version 1,
     * this method updates the database configuration instance in memory only.
     * </p>
     */
    public void tryToMigrateDb() {
        Driver v2Driver = getV2DriverIfMigrationNeeded();
        if (v2Driver == null) {
            if (H2_DRIVER_NAME.equals(databaseConfiguration.getDriver())) {
                updateConfig(); // if it is already migrated H2 v2 we need to update the config
            }
            return;
        }

        var workPaths = new WorkspacePaths(dbUrl);
        try {
            migrateDb(workPaths, v2Driver);
            updateConfig();
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
            log.trace("Non-H2 database detected. No migration needed");
            return null;
        }

        if (dbUrl.startsWith("jdbc:h2:mem:")) {
            log.trace("In-memory database detected. No migration needed");
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
            log.trace("Current H2 database is v2. No migration needed");
            return null;
        } catch (SQLException connectionException) {
            if (connectionException.getMessage().startsWith("General error: \"The write format 1 is smaller than the supported format 2")) {
                return v2Driver;
            } else {
                log.error("Unexpected exception. Migration aborted", connectionException);
                return null;
            }
        }
    }

    private void updateConfig() {
        log.info("Using '" + H2_V2_DRIVER_NAME + "' instead of '" + H2_DRIVER_NAME + "' from config");
        databaseConfiguration.setDriver(H2_V2_DRIVER_NAME);
    }

    private void migrateDb(
        @NotNull WorkspacePaths workspacePaths,
        @NotNull Driver v2Driver
    ) throws SQLException, IOException, DBException {
        log.info("H2 database v1 -> v2 migration started");

        var exportFilePath = workspacePaths.exportFilePath.toString();
        var password = dbProperties.getProperty(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD);

        //noinspection ConstantConditions by this time driver availability has already been checked by CBDatabase
        Driver v1Driver = dataSourceProviderRegistry.findDriver(H2_DRIVER_NAME)
            .getDriverInstance(monitor);

        log.info("Exporting v1 database");
        executeScript(v1Driver, EXPORT_SCRIPT, exportFilePath, password);

        log.info("Creating v1 database backup in '" + workspacePaths.dbV1BackupPath + "'");
        Files.move(workspacePaths.dbPath, workspacePaths.dbV1BackupPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Importing data to new v2 database");
        executeScript(v2Driver, IMPORT_SCRIPT, exportFilePath, password);

        removeExportFile(workspacePaths.dbFolderPath);
        log.debug("Export file removed");
    }

    private void executeScript(
        @NotNull Driver driver,
        @NotNull String script,
        @NotNull String filePath,
        @NotNull String password
    ) throws SQLException {
        try (
            var connection = driver.connect(dbUrl, dbProperties);
            var statement = connection.prepareStatement(script)
        ) {
            statement.setString(1, filePath);
            statement.setString(2, password);
            statement.execute();
        }
    }

    private void rollback(@NotNull WorkspacePaths workspacePaths) {
        removeExportFile(workspacePaths.dbFolderPath);
        try {
            Files.move(workspacePaths.dbV1BackupPath, workspacePaths.dbPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Unable to restore old database file '" + workspacePaths.dbPath + "'");
        }
    }

    private void removeExportFile(@NotNull Path dbFolderPath) {
        var dbFolder = dbFolderPath.toFile();
        if (!dbFolder.exists()) {
            return;
        }
        var exportFile = dbFolder.listFiles((file, name) -> name.equals(EXPORT_FILE_NAME));
        if (exportFile == null || exportFile.length == 0) {
            return;
        }
        var fileDeleted = exportFile[0].delete();
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
        @NotNull
        private final Path exportFilePath;

        WorkspacePaths(@NotNull String dbUrl) {
            dbPath = createDbPath(dbUrl);
            dbFolderPath = dbPath.getParent();
            dbV1BackupPath = dbFolderPath.resolve(BACKUP_V1_FILENAME);
            exportFilePath = dbFolderPath.resolve(EXPORT_FILE_NAME);
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

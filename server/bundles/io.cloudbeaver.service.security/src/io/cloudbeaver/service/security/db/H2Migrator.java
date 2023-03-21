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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.utils.CommonUtils;

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

    private static final String V1_DRIVER_NAME = "h2_embedded";
    private static final String H2_V2_DRIVER_NAME = "h2_embedded_v2";

    // language=H2
    private static final String EXPORT_SCRIPT = "SCRIPT TO ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8'";
    // no 'language=H2' — due to an annoying error about unresolvable statement 'FROM_1X'
    private static final String IMPORT_SCRIPT = "RUNSCRIPT FROM ? COMPRESSION DEFLATE CIPHER AES PASSWORD ? CHARSET 'UTF-8' FROM_1X";

    @NotNull
    private final DBRProgressMonitor monitor;
    @NotNull
    private final DataSourceProviderRegistry dataSourceProviderRegistry;
    @NotNull
    private final CBDatabaseConfig databaseConfiguration;
    @NotNull
    private final String dbUrl;
    @NotNull
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
     * <p>
     * Migrates the H2 database from version 1 to version 2.
     * </p>
     * <p>
     * IMPORTANT: if the database is already version 2, but the driver in the configuration is version 1,
     * or the link points to a v1 file, this method updates the database configuration.
     * </p>
     */
    public void migrateDatabaseIfNeeded() {
        if (!dbUrl.endsWith(WorkspacePaths.V1_DB_NAME) ||
            !V1_DRIVER_NAME.equals(databaseConfiguration.getDriver()) ||
            dbUrl.startsWith("jdbc:h2:mem:")
        ) {
            log.trace("No migration needed");
            return;
        }

        var workspacePaths = new WorkspacePaths(dbUrl);

        // the changed config is not written to disk immediately, so it is possible that the database is migrated, but the config on disk remains old
        if (workspacePaths.v2Paths.dbDataFile.toFile().exists() &&
            (dbUrl.endsWith(WorkspacePaths.V1_DB_NAME) || V1_DRIVER_NAME.equals(databaseConfiguration.getDriver()))
        ) {
            updateConfig(workspacePaths);
            return;
        }

        try {
            migrateDatabase(workspacePaths);
            log.info("H2 v1->v2 migration was successful");
        } catch (Exception e) {
            log.error("Migration H2 v1->v2 failed", e);
            rollback(workspacePaths);
        }
    }

    private void migrateDatabase(@NotNull WorkspacePaths workspacePaths) throws DBException, SQLException, IOException {
        log.info("H2 database v1 -> v2 migration started");

        final var v1Driver = getDriver(V1_DRIVER_NAME);
        final var v2Driver = getDriver(H2_V2_DRIVER_NAME);

        final var exportFilePath = workspacePaths.exportFilePath.toString();
        final var password = dbProperties.getProperty(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD);

        log.info("Exporting v1 database");
        executeScript(v1Driver, EXPORT_SCRIPT, exportFilePath, password);

        log.info("Creating v1 database backup '" + workspacePaths.v1DataBackupPath + "'");
        Files.move(workspacePaths.v1Paths.dbDataFile, workspacePaths.v1DataBackupPath, StandardCopyOption.REPLACE_EXISTING);
        if (workspacePaths.v1Paths.dbTraceFile.toFile().exists()) {
            Files.move(workspacePaths.v1Paths.dbTraceFile, workspacePaths.v1TraceBackupPath, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("Importing data to new v2 database");
        executeScript(v2Driver, IMPORT_SCRIPT, exportFilePath, password);

        updateConfig(workspacePaths);

        removeExportFile(workspacePaths);
        log.debug("Export file removed '" + workspacePaths.exportFilePath + "'");
    }

    @NotNull
    private Driver getDriver(@NotNull String driverName) throws DBException {
        var driverDescriptor = dataSourceProviderRegistry.findDriver(driverName);
        if (driverDescriptor == null) {
            throw new DBException("Driver '" + driverName + "' couldn't be resolved");
        }
        return driverDescriptor.getDriverInstance(monitor);
    }

    private void executeScript(
        @NotNull Driver driver,
        @NotNull String script,
        @NotNull String filePath,
        @NotNull String password
    ) throws SQLException {
        try (var connection = driver.connect(dbUrl, dbProperties);
             var statement = connection.prepareStatement(script)
        ) {
            statement.setString(1, filePath);
            statement.setString(2, password);
            statement.execute();
        }
    }

    private void updateConfig(@NotNull WorkspacePaths workspacePaths) {
        if (!H2_V2_DRIVER_NAME.equals(databaseConfiguration.getDriver())) {
            log.info("Using database driver '" + H2_V2_DRIVER_NAME + "' instead of '" + V1_DRIVER_NAME + "' from config");
            databaseConfiguration.setDriver(H2_V2_DRIVER_NAME);
        }

        var updatedDbUrl = CommonUtils.replaceLast(dbUrl, workspacePaths.v1Paths.dbName, workspacePaths.v2Paths.dbName);
        if (!updatedDbUrl.equals(databaseConfiguration.getUrl())) {
            log.info("Using database file '" + workspacePaths.v2Paths.dbDataFile + "' instead of '" + workspacePaths.v1Paths.dbDataFile + "' from config");
            databaseConfiguration.setUrl(updatedDbUrl);
        }
    }

    private void removeExportFile(@NotNull WorkspacePaths workspacePaths) {
        var exportFile = workspacePaths.exportFilePath.toFile();
        if (exportFile.exists()) {
            if (!exportFile.delete()) {
                log.error("Unable to remove H2 v1 export script file");
            }
        }
    }

    private void rollback(@NotNull WorkspacePaths workspacePaths) {
        removeExportFile(workspacePaths);
        try {
            Files.move(workspacePaths.v1DataBackupPath, workspacePaths.v1Paths.dbDataFile, StandardCopyOption.REPLACE_EXISTING);
            if (workspacePaths.v1TraceBackupPath.toFile().exists()) {
                Files.move(workspacePaths.v1TraceBackupPath, workspacePaths.v1Paths.dbTraceFile, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("v1 files restored");
        } catch (IOException e) {
            log.error("Unable to restore old database file '" + workspacePaths.v1Paths.dbDataFile + "'");
        }
    }


    private static class WorkspacePaths {

        private static final String V1_DB_NAME = "cb.h2.dat";
        private static final String V2_DB_NAME = "cb.h2v2.dat";

        private static final String V1_DATA_BACKUP_FILE_NAME = "h2db_v1_backup";
        private static final String V1_TRACE_BACKUP_FILE_NAME = "h2db_trace_v1_backup";

        private static final String EXPORT_SCRIPT_FILE_NAME = "H2v1ExportScript";

        @NotNull
        private final H2FilesPaths v1Paths;
        @NotNull
        private final H2FilesPaths v2Paths;

        @NotNull
        private final Path v1DataBackupPath;
        @NotNull
        private final Path v1TraceBackupPath;
        @NotNull
        private final Path exportFilePath;

        private WorkspacePaths(@NotNull String dbUrl) {
            var dbFolderPath = getFolderPath(dbUrl);

            v1Paths = new H2FilesPaths(dbFolderPath, V1_DB_NAME);
            v2Paths = new H2FilesPaths(dbFolderPath, V2_DB_NAME);

            v1DataBackupPath = dbFolderPath.resolve(V1_DATA_BACKUP_FILE_NAME);
            v1TraceBackupPath = dbFolderPath.resolve(V1_TRACE_BACKUP_FILE_NAME);

            exportFilePath = dbFolderPath.resolve(EXPORT_SCRIPT_FILE_NAME);
        }

        @NotNull
        private static Path getFolderPath(@NotNull String dbUrl) {
            var filePath = Paths.get(dbUrl.substring("jdbc:h2:".length()));
            return filePath.getParent();
        }
    }

    private static class H2FilesPaths {
        @NotNull
        private final String dbName;
        @NotNull
        private final Path dbDataFile;
        @NotNull
        private final Path dbTraceFile;

        private H2FilesPaths(@NotNull Path folderPath, @NotNull String dbName) {
            this.dbName = dbName;

            dbDataFile = folderPath.resolve(dbName + ".mv.db");
            dbTraceFile = folderPath.resolve(dbName + ".trace.db");
        }
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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
package io.cloudbeaver.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.DBWSecurityController;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import org.apache.commons.dbcp2.DriverConnectionFactory;
import org.apache.commons.dbcp2.PoolableConnection;
import org.apache.commons.dbcp2.PoolableConnectionFactory;
import org.apache.commons.dbcp2.PoolingDataSource;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.sql.schema.ClassLoaderScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaManager;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;
import org.jkiss.utils.SecurityUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.*;

/**
 * Database management
 */
public class CBDatabase {
    private static final Log log = Log.getLog(CBDatabase.class);

    public static final String SCHEMA_CREATE_SQL_PATH = "db/cb_schema_create.sql";
    public static final String SCHEMA_UPDATE_SQL_PATH = "db/cb_schema_update_";

    private static final int LEGACY_SCHEMA_VERSION = 1;
    private static final int CURRENT_SCHEMA_VERSION = 2;

    private static final String DEFAULT_DB_USER_NAME = "cb-data";
    private static final String DEFAULT_DB_PWD_FILE = ".database-credentials.dat";

    private final CBApplication application;
    private final CBDatabaseConfig databaseConfiguration;
    private PoolingDataSource<PoolableConnection> cbDataSource;

    CBDatabase(CBApplication application, CBDatabaseConfig databaseConfiguration) {
        this.application = application;
        this.databaseConfiguration = databaseConfiguration;
    }

    public static CBDatabase getInstance() {
        return CBPlatform.getInstance().getApplication().getDatabase();
    }

    public Connection openConnection() throws SQLException {
        return cbDataSource.getConnection();
    }

    public PoolingDataSource<PoolableConnection> getConnectionPool() {
        return cbDataSource;
    }

    void initialize() throws DBException {
        if (CommonUtils.isEmpty(databaseConfiguration.getDriver())) {
            throw new DBException("No database driver configured for CloudBeaver database");
        }
        DBPDriver driver = DataSourceProviderRegistry.getInstance().findDriver(databaseConfiguration.getDriver());
        if (driver == null) {
            throw new DBException("Driver '" + databaseConfiguration.getDriver() + "' not found");
        }

        log.debug("Initializing database connection");
        LoggingProgressMonitor monitor = new LoggingProgressMonitor();

        String dbUser = databaseConfiguration.getUser();
        String dbPassword = databaseConfiguration.getPassword();
        if (CommonUtils.isEmpty(dbUser) && databaseConfiguration.getUrl().startsWith("jdbc:h2")) {
            // No database credentials specified
            dbUser = DEFAULT_DB_USER_NAME;

            // Load or generate random password
            File pwdFile = new File(application.getDataDirectory(true), DEFAULT_DB_PWD_FILE);
            if (pwdFile.exists()) {
                try (FileReader fr = new FileReader(pwdFile)) {
                    dbPassword = IOUtils.readToString(fr);
                } catch (Exception e) {
                    log.error(e);
                }
            }
            if (CommonUtils.isEmpty(dbPassword)) {
                dbPassword = SecurityUtils.generatePassword(8);
                try {
                    IOUtils.writeFileFromString(pwdFile, dbPassword);
                } catch (IOException e) {
                    log.error(e);
                }
            }
        }

        Driver driverInstance = driver.getDriverInstance(monitor);

        SystemVariablesResolver variablesResolver = new SystemVariablesResolver();
        String dbURL = GeneralUtils.replaceVariables(databaseConfiguration.getUrl(), variablesResolver);
        Properties dbProperties = new Properties();
        if (!CommonUtils.isEmpty(dbUser)) {
            dbProperties.put(DBConstants.DATA_SOURCE_PROPERTY_USER, dbUser);
            if (!CommonUtils.isEmpty(dbPassword)) {
                dbProperties.put(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD, dbPassword);
            }
        }

        // Create connection pool with custom connection factory
        DriverConnectionFactory conFactory = new DriverConnectionFactory(driverInstance, dbURL, dbProperties);
        PoolableConnectionFactory pcf = new PoolableConnectionFactory(conFactory, null);
        pcf.setValidationQuery(databaseConfiguration.getPool().getValidationQuery());

        GenericObjectPoolConfig<PoolableConnection> config = new GenericObjectPoolConfig<>();
        config.setMinIdle(databaseConfiguration.getPool().getMinIdleConnections());
        config.setMaxIdle(databaseConfiguration.getPool().getMaxIdleConnections());
        config.setMaxTotal(databaseConfiguration.getPool().getMaxConnections());
        GenericObjectPool<PoolableConnection> connectionPool = new GenericObjectPool<>(pcf, config);
        pcf.setPool(connectionPool);
        cbDataSource = new PoolingDataSource<>(connectionPool);

        try (Connection connection = cbDataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            log.debug("Connected to " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());

            SQLSchemaManager schemaManager = new SQLSchemaManager(
                "CB",
                new ClassLoaderScriptSource(
                    CBDatabase.class.getClassLoader(),
                    SCHEMA_CREATE_SQL_PATH,
                    SCHEMA_UPDATE_SQL_PATH),
                monitor1 -> connection,
                new CBSchemaVersionManager(),
                driver.getScriptDialect().createInstance(),
                null,
                CURRENT_SCHEMA_VERSION,
                0);
            schemaManager.updateSchema(monitor);
        } catch (SQLException e) {
            throw new DBException("Error connecting to '" + dbURL + "'", e);
        }
    }

    void finishConfiguration(@NotNull String adminName, @Nullable String adminPassword, @NotNull List<WebAuthInfo> authInfoList) throws DBException {
        if (!application.isConfigurationMode()) {
            throw new DBException("Database is already configured");
        }

        log.info("Configure CB database security");
        CBDatabaseInitialData initialData = getInitialData();
        if (initialData != null && !CommonUtils.isEmpty(initialData.getAdminName()) && !CommonUtils.equalObjects(initialData.getAdminName(), adminName)) {
            // Delete old admin user
            application.getSecurityController().deleteUser(initialData.getAdminName());
        }
        // Create new admin user
        createAdminUser(adminName, adminPassword);

        // Associate all auth credentials with admin user
        for (WebAuthInfo ai : authInfoList) {
            if (!ai.getAuthProvider().equals(LocalAuthProvider.PROVIDER_ID)) {
                WebAuthProviderDescriptor authProvider = ai.getAuthProviderDescriptor();
                Map<String, Object> userCredentials = ai.getUserCredentials();
                if (!CommonUtils.isEmpty(userCredentials)) {
                    application.getSecurityController().setUserCredentials(adminName, authProvider, userCredentials);
                }
            }
        }
    }

    @Nullable
    CBDatabaseInitialData getInitialData() {
        String initialDataPath = databaseConfiguration.getInitialDataConfiguration();
        if (CommonUtils.isEmpty(initialDataPath)) {
            return null;
        }

        initialDataPath = CBApplication.getRelativePath(
            databaseConfiguration.getInitialDataConfiguration(), application.getHomeDirectory());
        try (Reader reader = new InputStreamReader(new FileInputStream(initialDataPath), StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder().setLenient().create();
            return gson.fromJson(reader, CBDatabaseInitialData.class);
        } catch (Exception e) {
            log.error("Error loading initial data configuration", e);
            return null;
        }
    }

    @NotNull
    private WebUser createAdminUser(@NotNull String adminName, @Nullable String adminPassword) throws DBCException {
        DBWSecurityController serverController = application.getSecurityController();
        WebUser adminUser = serverController.getUserById(adminName);
        if (adminUser == null) {
            adminUser = new WebUser(adminName);
            serverController.createUser(adminUser);
        }

        if (!CommonUtils.isEmpty(adminPassword)) {
            // This is how client password will be transmitted from client
            String clientPassword = LocalAuthProvider.makeClientPasswordHash(adminUser.getUserId(), adminPassword);

            Map<String, Object> credentials = new LinkedHashMap<>();
            credentials.put(LocalAuthProvider.CRED_USER, adminUser.getUserId());
            credentials.put(LocalAuthProvider.CRED_PASSWORD, clientPassword);

            WebAuthProviderDescriptor authProvider = WebServiceRegistry.getInstance().getAuthProvider(LocalAuthProvider.PROVIDER_ID);
            if (authProvider != null) {
                serverController.setUserCredentials(adminUser.getUserId(), authProvider, credentials);
            }
        }

        grantAdminPermissionsToUser(adminUser.getUserId());

        return adminUser;
    }

    private void grantAdminPermissionsToUser(String userId) throws DBCException {
        // Grant all roles
        DBWSecurityController securityController = application.getSecurityController();
        WebRole[] allRoles = securityController.readAllRoles();
        securityController.setUserRoles(
            userId,
            Arrays.stream(allRoles).map(WebRole::getRoleId).toArray(String[]::new),
            userId);
    }

    void shutdown() {
        log.debug("Shutdown database");
        if (cbDataSource != null) {
            try {
                cbDataSource.close();
            } catch (SQLException e) {
                log.error(e);
            }
        }
    }

    private class CBSchemaVersionManager implements SQLSchemaVersionManager {

        @Override
        public int getCurrentSchemaVersion(DBRProgressMonitor monitor, Connection connection, String schemaName) throws DBException, SQLException {
            // Check and update schema
            try {
                return CommonUtils.toInt(JDBCUtils.executeQuery(connection,
                    "SELECT VERSION FROM CB_SCHEMA_INFO"));
            } catch (SQLException e) {
                try {
                    Object legacyVersion = CommonUtils.toInt(JDBCUtils.executeQuery(connection,
                        "SELECT SCHEMA_VERSION FROM CB_SERVER"));
                    // Table CB_SERVER exist - this is a legacy schema
                    return LEGACY_SCHEMA_VERSION;
                } catch (SQLException ex) {
                    // Empty schema. Create it from scratch
                    return -1;
                }
            }
        }

        @Override
        public void updateCurrentSchemaVersion(DBRProgressMonitor monitor, Connection connection, String schemaName) throws DBException, SQLException {
            if (JDBCUtils.executeUpdate(
                connection,
                "UPDATE CB_SCHEMA_INFO SET VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP",
                CURRENT_SCHEMA_VERSION) <= 0)
            {
                JDBCUtils.executeSQL(
                    connection,
                    "INSERT INTO CB_SCHEMA_INFO (VERSION,UPDATE_TIME) VALUES(?,CURRENT_TIMESTAMP)",
                    CURRENT_SCHEMA_VERSION);
            }
        }

        @Override
        public void fillInitialSchemaData(DBRProgressMonitor monitor, Connection connection) throws DBException, SQLException {
            // Fill initial data
            DBWSecurityController serverController = application.getSecurityController();

            CBDatabaseInitialData initialData = getInitialData();
            if (initialData == null) {
                return;
            }

            String adminName = initialData.getAdminName();
            String adminPassword = initialData.getAdminPassword();

            if (!CommonUtils.isEmpty(initialData.getRoles())) {
                // Create roles
                for (WebRole role : initialData.getRoles()) {
                    serverController.createRole(role, adminName);
                    if (adminName != null) {
                        serverController.setSubjectPermissions(role.getRoleId(), role.getPermissions().toArray(new String[0]), adminName);
                    }
                }
            }

            if (!CommonUtils.isEmpty(adminName)) {
                // Create admin user
                createAdminUser(adminName, adminPassword);
            }
        }
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.service.security.internal.db;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.auth.provider.local.LocalAuthProviderConstants;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.utils.WebAppUtils;
import org.apache.commons.dbcp2.*;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.impl.jdbc.exec.JDBCTransaction;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.user.SMRole;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.model.sql.schema.ClassLoaderScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaManager;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;
import org.jkiss.utils.SecurityUtils;

import java.io.*;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

/**
 * Database management
 */
public class CBDatabase {
    private static final Log log = Log.getLog(CBDatabase.class);

    public static final String SCHEMA_CREATE_SQL_PATH = "db/cb_schema_create.sql";
    public static final String SCHEMA_UPDATE_SQL_PATH = "db/cb_schema_update_";

    private static final int LEGACY_SCHEMA_VERSION = 1;
    private static final int CURRENT_SCHEMA_VERSION = 5;

    private static final String DEFAULT_DB_USER_NAME = "cb-data";
    private static final String DEFAULT_DB_PWD_FILE = ".database-credentials.dat";

    private final WebApplication application;
    private final CBDatabaseConfig databaseConfiguration;
    private PoolingDataSource<PoolableConnection> cbDataSource;
    private transient volatile Connection exclusiveConnection;

    private String instanceId;
    private SMAdminController adminSecurityController;

    public CBDatabase(WebApplication application, CBDatabaseConfig databaseConfiguration) {
        this.application = application;
        this.databaseConfiguration = databaseConfiguration;
    }

    public void setAdminSecurityController(SMAdminController adminSecurityController) {
        this.adminSecurityController = adminSecurityController;
    }

    public String getInstanceId() {
        return instanceId;
    }

    public Connection openConnection() throws SQLException {
        if (exclusiveConnection != null) {
            return exclusiveConnection;
        }
        return cbDataSource.getConnection();
    }

    public PoolingDataSource<PoolableConnection> getConnectionPool() {
        return cbDataSource;
    }

    public void initialize() throws DBException {
        log.debug("Initiate management database");
        if (CommonUtils.isEmpty(databaseConfiguration.getDriver())) {
            throw new DBException("No database driver configured for CloudBeaver database");
        }
        DBPDriver driver = DataSourceProviderRegistry.getInstance().findDriver(databaseConfiguration.getDriver());
        if (driver == null) {
            throw new DBException("Driver '" + databaseConfiguration.getDriver() + "' not found");
        }

        LoggingProgressMonitor monitor = new LoggingProgressMonitor(log);

        String dbUser = databaseConfiguration.getUser();
        String dbPassword = databaseConfiguration.getPassword();
        if (CommonUtils.isEmpty(dbUser) && driver.isEmbedded()) {
            File pwdFile = application.getDataDirectory(true).resolve(DEFAULT_DB_PWD_FILE).toFile();
            if (!driver.isAnonymousAccess()) {
                // No database credentials specified
                dbUser = DEFAULT_DB_USER_NAME;

                // Load or generate random password
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
        log.debug("\tInitiate connection pool with management database (" + driver.getFullName() + "; " + dbURL + ")");
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
            log.debug("\tConnected to " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());

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

            validateInstancePersistentState(connection);
        } catch (Exception e) {
            throw new DBException("Error updating management database schema", e);
        }
        log.debug("\tManagement database connection established");
    }

    //TODO move out
    public void finishConfiguration(@NotNull String adminName, @Nullable String adminPassword, @NotNull List<WebAuthInfo> authInfoList) throws DBException {
        if (!application.isConfigurationMode()) {
            throw new DBException("Database is already configured");
        }

        log.info("Configure CB database security");
        CBDatabaseInitialData initialData = getInitialData();
        if (initialData != null && !CommonUtils.isEmpty(initialData.getAdminName()) && !CommonUtils.equalObjects(initialData.getAdminName(), adminName)) {
            // Delete old admin user
            adminSecurityController.deleteUser(initialData.getAdminName());
        }
        // Create new admin user
        createAdminUser(adminName, adminPassword);

        // Associate all auth credentials with admin user
        for (WebAuthInfo ai : authInfoList) {
            if (!ai.getAuthProvider().equals(LocalAuthProviderConstants.PROVIDER_ID)) {
                AuthProviderDescriptor authProvider = ai.getAuthProviderDescriptor();
                Map<String, Object> userCredentials = ai.getUserCredentials();
                if (!CommonUtils.isEmpty(userCredentials)) {
                    adminSecurityController.setUserCredentials(adminName, authProvider.getId(), userCredentials);
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

        initialDataPath = WebAppUtils.getRelativePath(
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
    private SMUser createAdminUser(@NotNull String adminName, @Nullable String adminPassword) throws DBException {
        SMUser adminUser = adminSecurityController.getUserById(adminName);

        if (adminUser == null) {
            adminUser = new SMUser(adminName);
            adminSecurityController.createUser(adminUser.getUserId(), adminUser.getMetaParameters());
        }

        if (!CommonUtils.isEmpty(adminPassword)) {
            // This is how client password will be transmitted from client
            String clientPassword = SecurityUtils.makeDigest(adminPassword);

            Map<String, Object> credentials = new LinkedHashMap<>();
            credentials.put(LocalAuthProviderConstants.CRED_USER, adminUser.getUserId());
            credentials.put(LocalAuthProviderConstants.CRED_PASSWORD, clientPassword);

            AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(LocalAuthProviderConstants.PROVIDER_ID);
            if (authProvider != null) {
                adminSecurityController.setUserCredentials(adminUser.getUserId(), authProvider.getId(), credentials);
            }
        }

        grantAdminPermissionsToUser(adminUser.getUserId());

        return adminUser;
    }

    private void grantAdminPermissionsToUser(String userId) throws DBException {
        // Grant all roles
        SMRole[] allRoles = adminSecurityController.readAllRoles();
        adminSecurityController.setUserRoles(
            userId,
            Arrays.stream(allRoles).map(SMRole::getRoleId).toArray(String[]::new),
            userId);
    }

    public void shutdown() {
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
                int version = CommonUtils.toInt(JDBCUtils.executeQuery(connection,
                    "SELECT VERSION FROM CB_SCHEMA_INFO"));
                return version == 0 ? 1 : version;
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
                CURRENT_SCHEMA_VERSION) <= 0) {
                JDBCUtils.executeSQL(
                    connection,
                    "INSERT INTO CB_SCHEMA_INFO (VERSION,UPDATE_TIME) VALUES(?,CURRENT_TIMESTAMP)",
                    CURRENT_SCHEMA_VERSION);
            }
        }

        @Override
        //TODO move out
        public void fillInitialSchemaData(DBRProgressMonitor monitor, Connection connection) throws DBException, SQLException {
            // Set exclusive connection. Otherwise security controller will open a new one and won't see new schema objects.
            exclusiveConnection = new DelegatingConnection<Connection>(connection) {
                @Override
                public void close() throws SQLException {
                    // do nothing
                }
            };

            try {
                // Fill initial data

                CBDatabaseInitialData initialData = getInitialData();
                if (initialData == null) {
                    return;
                }

                String adminName = initialData.getAdminName();
                String adminPassword = initialData.getAdminPassword();

                if (!CommonUtils.isEmpty(initialData.getRoles())) {
                    // Create roles
                    for (SMRole role : initialData.getRoles()) {
                        adminSecurityController.createRole(role.getRoleId(), role.getName(), role.getDescription(), adminName);
                        if (adminName != null) {
                            adminSecurityController.setSubjectPermissions(role.getRoleId(), new ArrayList<>(role.getPermissions()), adminName);
                        }
                    }
                }

                if (!CommonUtils.isEmpty(adminName)) {
                    // Create admin user
                    createAdminUser(adminName, adminPassword);
                }
            } finally {
                exclusiveConnection = null;
            }
        }
    }

    //////////////////////////////////////////
    // Persistence


    private void validateInstancePersistentState(Connection connection) throws IOException, SQLException {
        try (JDBCTransaction txn = new JDBCTransaction(connection)) {
            checkInstanceRecord(connection);
            txn.commit();
        }
    }

    private void checkInstanceRecord(Connection connection) throws SQLException, IOException {
        InetAddress localHost = InetAddress.getLocalHost();
        String hostName = localHost.getHostName();
        byte[] hardwareAddress = RuntimeUtils.getLocalMacAddress();
        String macAddress = CommonUtils.toHexString(hardwareAddress);

        instanceId = getCurrentInstanceId();

        String productName = CommonUtils.truncateString(GeneralUtils.getProductName(), 100);
        String versionName = CommonUtils.truncateString(GeneralUtils.getProductVersion().toString(), 32);

        boolean hasInstanceRecord = JDBCUtils.queryString(connection,
            "SELECT HOST_NAME FROM CB_INSTANCE WHERE INSTANCE_ID=?", instanceId) != null;
        if (!hasInstanceRecord) {
            JDBCUtils.executeSQL(
                connection,
                "INSERT INTO CB_INSTANCE (INSTANCE_ID,MAC_ADDRESS,HOST_NAME,PRODUCT_NAME,PRODUCT_VERSION,UPDATE_TIME) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)",
                instanceId,
                macAddress,
                hostName,
                productName,
                versionName);
        } else {
            JDBCUtils.executeSQL(
                connection,
                "UPDATE CB_INSTANCE SET HOST_NAME=?,PRODUCT_NAME=?,PRODUCT_VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP WHERE INSTANCE_ID=?",
                hostName,
                productName,
                versionName,
                instanceId);
        }
        JDBCUtils.executeSQL(connection, "DELETE FROM CB_INSTANCE_DETAILS WHERE INSTANCE_ID=?", instanceId);

        Map<String, String> instanceDetails = new LinkedHashMap<>();
        for (Map.Entry<Object, Object> spe : System.getProperties().entrySet()) {
            instanceDetails.put(
                CommonUtils.truncateString(CommonUtils.toString(spe.getKey()), 32),
                CommonUtils.truncateString(CommonUtils.toString(spe.getValue()), 255));
        }

        try (PreparedStatement dbStat = connection.prepareStatement("INSERT INTO CB_INSTANCE_DETAILS(INSTANCE_ID,FIELD_NAME,FIELD_VALUE) VALUES(?,?,?)")) {
            dbStat.setString(1, instanceId);
            for (Map.Entry<String, String> ide : instanceDetails.entrySet()) {
                dbStat.setString(2, ide.getKey());
                dbStat.setString(3, ide.getValue());
                dbStat.execute();
            }
        }
    }

    private String getCurrentInstanceId() throws IOException {
        // 12 chars - mac address
        String macAddress = CommonUtils.toHexString(RuntimeUtils.getLocalMacAddress());
        // 16 chars - workspace ID
        String workspaceId = DBWorkbench.getPlatform().getWorkspace().getWorkspaceId();
        if (workspaceId.length() > 16) {
            workspaceId = workspaceId.substring(0, 16);
        }

        StringBuilder id = new StringBuilder(36);
        id.append(macAddress);
        id.append(":").append(workspaceId).append(":");
        while (id.length() < 36) {
            id.append("X");
        }
        return id.toString();
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.Base64;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Database management
 */
public class CBDatabase {
    private static final Log log = Log.getLog(CBDatabase.class);

    public static final String SCHEMA_CREATE_SQL_PATH = "db/cb-schema-create.sql";
    private static final String CURRENT_SCHEMA_VERSION = "6.beta";

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

        Driver driverInstance = driver.getDriverInstance(monitor);

        SystemVariablesResolver variablesResolver = new SystemVariablesResolver();
        String dbURL = GeneralUtils.replaceVariables(databaseConfiguration.getUrl(), variablesResolver);
        Properties dbProperties = new Properties();
        if (!CommonUtils.isEmpty(databaseConfiguration.getUser())) {
            dbProperties.put(DBConstants.DATA_SOURCE_PROPERTY_USER, databaseConfiguration.getUser());
            if (!CommonUtils.isEmpty(databaseConfiguration.getPassword())) {
                dbProperties.put(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD,
                    new String(Base64.decode(databaseConfiguration.getPassword())));
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
        } catch (SQLException e) {
            throw new DBException("Error connecting to '" + dbURL + "'", e);
        }

        checkDatabaseStructure();
    }

    private void checkDatabaseStructure() throws DBException {
        try (Connection connection = cbDataSource.getConnection()) {
            connection.setAutoCommit(true);
            String currentSchemaVersion;
            try (Statement dbStat = connection.createStatement()) {
                try (ResultSet dbResult = dbStat.executeQuery("SELECT * FROM CB_SERVER")) {
                    if (dbResult.next()) {
                        currentSchemaVersion = dbResult.getString("SCHEMA_VERSION");
                    } else {
                        currentSchemaVersion = "0.beta";
                    }
                } catch (SQLException e) {
                    currentSchemaVersion = null;
                }
            }

            if (currentSchemaVersion == null) {
                createDatabaseSchema(connection, true);
            } else {
                if (currentSchemaVersion.equals(CURRENT_SCHEMA_VERSION)) {
                    // no changes
                } else if (currentSchemaVersion.endsWith(".beta")) {
                    // Different beta schema version - recreate schema
                    createDatabaseSchema(connection, false);
                    createDatabaseSchema(connection, true);
                }
            }
        } catch (SQLException e) {
            throw new DBException("Error initializing schema", e);
        }
    }

    private void createDatabaseSchema(Connection connection, boolean create) throws DBException {
        if (create) {
            log.debug("Create database schema");
        } else {
            log.debug("Cleanup old database schema");
        }
        InputStream ddlStream = getClass().getClassLoader().getResourceAsStream(SCHEMA_CREATE_SQL_PATH);
        if (ddlStream == null) {
            throw new DBException("Can't find schema file " + SCHEMA_CREATE_SQL_PATH);
        }
        try {
            connection.setAutoCommit(false);

            Pattern ctPattern = Pattern.compile("CREATE TABLE ([\\w_]+)\\s*\\(");
            ByteArrayOutputStream ddlBuffer = new ByteArrayOutputStream();
            IOUtils.copyStream(ddlStream, ddlBuffer);
            String ddl = new String(ddlBuffer.toByteArray(), StandardCharsets.UTF_8);
            List<String> dropQueries = new ArrayList<>();
            for (String line : ddl.split(";")) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                if (!create) {
                    Matcher matcher = ctPattern.matcher(line);
                    if (matcher.find()) {
                        dropQueries.add("DROP TABLE " + matcher.group(1));
                    }
                    continue;
                }
                try (Statement dbStat = connection.createStatement()) {
                    dbStat.execute(line);
                }
            }
            if (!dropQueries.isEmpty()) {
                for (String query : dropQueries) {
                    try (Statement dbStat = connection.createStatement()) {
                        dbStat.execute(query);
                    }
                    catch (SQLException e) {
                        // Ignore error
                        log.debug(e.getMessage());
                    }
                }
            }
            if (create) {
                // Create server info
                try (PreparedStatement dbStat = connection.prepareStatement("INSERT INTO CB_SERVER(SERVER_NAME,SERVER_VERSION,SCHEMA_VERSION) VALUES(?,?,?)")) {
                    dbStat.setString(1, CommonUtils.truncateString(GeneralUtils.getProductName(), 100));
                    dbStat.setString(2, CommonUtils.truncateString(GeneralUtils.getProductVersion().toString(), 10));
                    dbStat.setString(3, CURRENT_SCHEMA_VERSION);
                    dbStat.execute();
                }
                fillInitialData();
            }

            connection.commit();
            connection.setAutoCommit(true);
        } catch (Exception e) {
            try {
                connection.rollback();
            } catch (SQLException ex) {
                log.error(e);
            }
            throw new DBException("Error creating database schema", e);
        } finally {
            ContentUtils.close(ddlStream);
        }
    }

    private void fillInitialData() throws DBCException {
        // Fill initial data
        DBWSecurityController serverController = application.getSecurityController();
        String initialDataPath = databaseConfiguration.getInitialDataConfiguration();
        if (CommonUtils.isEmpty(initialDataPath)) {
            return;
        }

        initialDataPath = CBApplication.getRelativePath(
            databaseConfiguration.getInitialDataConfiguration(), application.getHomeDirectory());

        try (Reader reader = new InputStreamReader(new FileInputStream(initialDataPath), StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder().setLenient().create();
            CBDatabaseInitialData initialData = gson.fromJson(reader, CBDatabaseInitialData.class);

            WebUser adminUser = null;
            if (!CommonUtils.isEmpty(initialData.getAdminName())) {
                // Create admin user
                adminUser = new WebUser(initialData.getAdminName());
                serverController.createUser(adminUser);

                String userPassword = initialData.getAdminPassword();

                // This is how client password will be transmitted from client
                String clientPassword = LocalAuthProvider.makeClientPasswordHash(adminUser.getUserId(), userPassword);

                Map<String, Object> credentials = new LinkedHashMap<>();
                credentials.put(LocalAuthProvider.CRED_USER, adminUser.getUserId());
                credentials.put(LocalAuthProvider.CRED_PASSWORD, clientPassword);

                WebAuthProviderDescriptor authProvider = WebServiceRegistry.getInstance().getAuthProvider(LocalAuthProvider.PROVIDER_ID);
                if (authProvider != null) {
                    serverController.setUserCredentials(adminUser.getUserId(), authProvider, credentials);
                }
            }

            if (!CommonUtils.isEmpty(initialData.getRoles())) {
                // Create roles
                for (WebRole role : initialData.getRoles()) {
                    serverController.createRole(role);
                    if (adminUser != null) {
                        serverController.setSubjectPermissions(role.getRoleId(), role.getPermissions().toArray(new String[0]), adminUser.getUserId());
                    }
                }
            }

            if (adminUser != null) {
                // Grant all roles
                WebRole[] allRoles = serverController.readAllRoles();
                serverController.setUserRoles(
                    adminUser.getUserId(),
                    Arrays.stream(allRoles).map(WebRole::getRoleId).toArray(String[]::new),
                    adminUser.getUserId());
            }
        } catch (Exception e) {
            log.error("Error loading initial data configuration", e);
        }
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
}

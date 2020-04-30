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

import org.apache.commons.dbcp2.DriverConnectionFactory;
import org.apache.commons.dbcp2.PoolableConnection;
import org.apache.commons.dbcp2.PoolableConnectionFactory;
import org.apache.commons.dbcp2.PoolingDataSource;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.Properties;

/**
 * Database management
 */
public class CBDatabase {
    private static final Log log = Log.getLog(CBDatabase.class);
    public static final String SCHEMA_SQL_PATH = "db/cb-schema.sql";

    private final CBApplication application;
    private final CBDatabaseConfig databaseConfiguration;
    private PoolingDataSource<PoolableConnection> cdDataSource;

    public CBDatabase(CBApplication application, CBDatabaseConfig databaseConfiguration) {
        this.application = application;
        this.databaseConfiguration = databaseConfiguration;
    }

    public PoolingDataSource<PoolableConnection> getConnectionPool() {
        return cdDataSource;
    }

    void connect() throws DBException {
        if (CommonUtils.isEmpty(databaseConfiguration.getDriver())) {
            throw new DBException("Database driver not specified");
        }
        DriverDescriptor driver = DataSourceProviderRegistry.getInstance().findDriver(databaseConfiguration.getDriver());
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
                dbProperties.put(DBConstants.DATA_SOURCE_PROPERTY_PASSWORD, databaseConfiguration.getPassword());
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
        cdDataSource = new PoolingDataSource<>(connectionPool);

        try (Connection connection = cdDataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            log.debug("Connected to " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());
        } catch (SQLException e) {
            throw new DBException("Error connecting to '" + dbURL + "'", e);
        }

        checkDatabaseStructure();
    }

    private void checkDatabaseStructure() throws DBException {
        try (Connection connection = cdDataSource.getConnection()) {
            boolean schemaExists = false;
            try (Statement dbStat = connection.createStatement()) {
                try (ResultSet dbResult = dbStat.executeQuery("SELECT * FROM CB_SERVER")) {
                    schemaExists = true;
                } catch (SQLException e) {
                    schemaExists = false;
                }
            }
            if (!schemaExists) {
                createDatabaseSchema(connection);
            }
        } catch (SQLException e) {
            throw new DBException("Error initializing schema", e);
        }
    }

    private void createDatabaseSchema(Connection connection) throws DBException {
        log.debug("Create database schema");
        InputStream ddlStream = getClass().getClassLoader().getResourceAsStream(SCHEMA_SQL_PATH);
        if (ddlStream == null) {
            throw new DBException("Can't find schema file " + SCHEMA_SQL_PATH);
        }
        try {
            ByteArrayOutputStream ddlBuffer = new ByteArrayOutputStream();
            IOUtils.copyStream(ddlStream, ddlBuffer);
            String ddl = new String(ddlBuffer.toByteArray(), StandardCharsets.UTF_8);
            for (String line : ddl.split(";")) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                try (Statement dbStat = connection.createStatement()) {
                    dbStat.execute(line);
                }
            }
        } catch (Exception e) {
            throw new DBException("Error processing schema DDL", e);
        } finally {
            ContentUtils.close(ddlStream);
        }
    }

}

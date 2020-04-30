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

import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.CommonUtils;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Database management
 */
public class CBDatabase {
    private static final Log log = Log.getLog(CBDatabase.class);

    private final CBApplication application;
    private final CBDatabaseConfig databaseConfiguration;
    private Connection connection;

    public CBDatabase(CBApplication application, CBDatabaseConfig databaseConfiguration) {
        this.application = application;
        this.databaseConfiguration = databaseConfiguration;
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
        try {
            connection = driverInstance.connect(dbURL, dbProperties);
        } catch (SQLException e) {
            throw new DBException("Error connecting to '" + dbURL + "'", e);
        }

        try {
            DatabaseMetaData metaData = connection.getMetaData();
            log.debug("Connected to " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());
        } catch (SQLException e) {
            throw new DBException("Error getting database metadata", e);
        }

        checkDatabaseStructure();
    }

    private void checkDatabaseStructure() {

    }
}

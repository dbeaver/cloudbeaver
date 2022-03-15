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

/**
 * Database configuration
 */
public class CBDatabaseConfig {
    private String driver;
    private String url;
    private String user;
    private String password;

    private boolean createDatabase = true;
    private boolean allowPublicAccess = true;
    private String initialDataConfiguration;

    private final Pool pool = new Pool();

    public static class Pool {
        private int minIdleConnections = 2;
        private int maxIdleConnections = 10;
        private int maxConnections = 1000;
        private String validationQuery = "SELECT 1";

        public int getMinIdleConnections() {
            return minIdleConnections;
        }

        public int getMaxIdleConnections() {
            return maxIdleConnections;
        }

        public int getMaxConnections() {
            return maxConnections;
        }

        public String getValidationQuery() {
            return validationQuery;
        }
    }

    public String getDriver() {
        return driver;
    }

    public void setDriver(String driver) {
        this.driver = driver;
    }

    public String getUrl() {
        return url;
    }

    public String getUser() {
        return user;
    }

    public String getPassword() {
        return password;
    }

    public boolean isCreateDatabase() {
        return createDatabase;
    }

    public boolean isAllowPublicAccess() {
        return allowPublicAccess;
    }

    public String getInitialDataConfiguration() {
        return initialDataConfiguration;
    }

    public Pool getPool() {
        return pool;
    }

}

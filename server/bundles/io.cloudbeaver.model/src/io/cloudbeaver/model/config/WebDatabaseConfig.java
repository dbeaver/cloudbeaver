/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.model.config;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.connection.InternalDatabaseConfig;

/**
 * Database configuration
 */
public class WebDatabaseConfig implements InternalDatabaseConfig {
    private String driver;
    private String url;
    private String user;
    private String password;
    private String schema;

    private String initialDataConfiguration;

    private boolean backupEnabled;

    private final Pool pool = new Pool();

    @Override
    public String getDriver() {
        return driver;
    }

    public void setDriver(String driver) {
        this.driver = driver;
    }

    @Override
    @NotNull
    public String getUrl() {
        return url;
    }

    public void setUrl(@NotNull String url) {
        this.url = url;
    }

    public void setBackupEnabled(boolean backupEnabled) {
        this.backupEnabled = backupEnabled;
    }

    @Override
    public String getUser() {
        return user;
    }


    @Override
    public String getPassword() {
        return password;
    }

    public String getInitialDataConfiguration() {
        return initialDataConfiguration;
    }

    public Pool getPool() {
        return pool;
    }

    @Override
    public boolean isBackupEnabled() {
        return backupEnabled;
    }

    public String getSchema() {
        return schema;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }

    public void setUser(String user) {
        this.user = user;
    }
}

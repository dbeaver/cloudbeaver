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
package io.cloudbeaver.service.core;

import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

public class WebDatabaseDriverConfig {

    private String providerId;
    private String driverId;
    private String driverName;
    private String driverClass;
    private String driverURL;
    private String driverPort;
    private String driverDescription;
    private String driverUser;
    private String driverDatabase;

    public WebDatabaseDriverConfig(Map<String, Object> params) {
        if (!params.isEmpty()) {
            this.providerId = JSONUtils.getString(params, "providerId");
            this.driverId = JSONUtils.getString(params, "id");
            this.driverName = JSONUtils.getString(params, "name");
            this.driverClass = JSONUtils.getString(params, "driverClass");
            this.driverURL = JSONUtils.getString(params, "url");
            this.driverPort = JSONUtils.getString(params, "port");
            this.driverDescription = JSONUtils.getString(params, "description");
            this.driverUser = JSONUtils.getString(params, "defaultUser");
            this.driverDatabase = JSONUtils.getString(params, "defaultDatabase");
        }
    }

    public String getProviderId() {
        return providerId;
    }

    public String getDriverName() {
        return driverName;
    }

    public String getDriverClass() {
        return driverClass;
    }

    public String getDriverURL() {
        return driverURL;
    }

    public String getDriverPort() {
        return driverPort;
    }

    public String getDriverDescription() {
        return driverDescription;
    }

    public String getDriverUser() {
        return driverUser;
    }

    public String getDriverDatabase() {
        return driverDatabase;
    }

    public String getDriverId() {
        return driverId;
    }
}

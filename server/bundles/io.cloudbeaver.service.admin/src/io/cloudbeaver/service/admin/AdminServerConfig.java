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
package io.cloudbeaver.service.admin;

import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

/**
 * Server configuration for admin API
 */
public class AdminServerConfig {

    private String serverName;

    private String adminName;
    private String adminPassword;

    private boolean anonymousAccessEnabled;
    private boolean authenticationEnabled;
    private boolean customConnectionsEnabled;

    public AdminServerConfig(Map<String, Object> params) {
        this.serverName = JSONUtils.getString(params, "serverName");
        this.adminName = JSONUtils.getString(params, "adminName");
        this.adminPassword = JSONUtils.getString(params, "adminPassword");

        this.anonymousAccessEnabled = JSONUtils.getBoolean(params, "anonymousAccessEnabled");
        this.authenticationEnabled = JSONUtils.getBoolean(params, "authenticationEnabled");
        this.customConnectionsEnabled = JSONUtils.getBoolean(params, "customConnectionsEnabled");
    }

    public String getServerName() {
        return serverName;
    }

    public void setServerName(String serverName) {
        this.serverName = serverName;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public boolean isAnonymousAccessEnabled() {
        return anonymousAccessEnabled;
    }

    public void setAnonymousAccessEnabled(boolean anonymousAccessEnabled) {
        this.anonymousAccessEnabled = anonymousAccessEnabled;
    }

    public boolean isAuthenticationEnabled() {
        return authenticationEnabled;
    }

    public void setAuthenticationEnabled(boolean authenticationEnabled) {
        this.authenticationEnabled = authenticationEnabled;
    }

    public boolean isCustomConnectionsEnabled() {
        return customConnectionsEnabled;
    }

    public void setCustomConnectionsEnabled(boolean customConnectionsEnabled) {
        this.customConnectionsEnabled = customConnectionsEnabled;
    }
}

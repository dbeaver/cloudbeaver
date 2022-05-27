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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Server configuration for admin API
 */
public class AdminServerConfig {

    private String serverName;
    private String serverURL;

    private String adminName;
    private String adminPassword;

    private final boolean anonymousAccessEnabled;
    private final boolean resourceManagerEnabled;
    private final boolean customConnectionsEnabled;
    private final boolean publicCredentialsSaveEnabled;
    private final boolean adminCredentialsSaveEnabled;
    private final List<String> enabledFeatures;
    private final List<String> enabledAuthProviders;
    private final String[] enabledDrivers;
    private final String[] disabledDrivers;

    private long sessionExpireTime;

    public AdminServerConfig(Map<String, Object> params) {
        this.serverName = JSONUtils.getString(params, "serverName");
        this.serverURL = JSONUtils.getString(params, "serverURL");
        this.adminName = JSONUtils.getString(params, "adminName");
        this.adminPassword = JSONUtils.getString(params, "adminPassword");

        CBAppConfig appConfig = CBApplication.getInstance().getAppConfiguration();
        this.anonymousAccessEnabled = JSONUtils.getBoolean(params, "anonymousAccessEnabled", appConfig.isAnonymousAccessEnabled());
        this.customConnectionsEnabled = JSONUtils.getBoolean(params, "customConnectionsEnabled", appConfig.isSupportsCustomConnections());
        this.publicCredentialsSaveEnabled = JSONUtils.getBoolean(params, "publicCredentialsSaveEnabled", appConfig.isPublicCredentialsSaveEnabled());
        this.adminCredentialsSaveEnabled = JSONUtils.getBoolean(params, "adminCredentialsSaveEnabled", appConfig.isAdminCredentialsSaveEnabled());
        this.resourceManagerEnabled = JSONUtils.getBoolean(params, "resourceManagerEnabled", appConfig.isResourceManagerEnabled());

        if (params.containsKey("enabledFeatures")) {
            this.enabledFeatures = JSONUtils.getStringList(params, "enabledFeatures");
        } else {
            this.enabledFeatures = Arrays.asList(appConfig.getEnabledFeatures());
        }

        if (params.containsKey("enabledAuthProviders")) {
            this.enabledAuthProviders = JSONUtils.getStringList(params, "enabledAuthProviders");
        } else {
            this.enabledAuthProviders = Arrays.asList(appConfig.getEnabledAuthProviders());
        }

        this.sessionExpireTime = JSONUtils.getLong(params, "sessionExpireTime", -1);

        if (params.containsKey("enabledDrivers")) {
            this.enabledDrivers = JSONUtils.getStringList(params, "enabledDrivers").toArray(new String[0]);
        } else {
            this.enabledDrivers = appConfig.getEnabledDrivers();
        }

        if (params.containsKey("disabledDrivers")) {
            this.disabledDrivers = JSONUtils.getStringList(params, "disabledDrivers").toArray(new String[0]);
        } else {
            this.disabledDrivers = appConfig.getDisabledDrivers();
        }
    }

    public String getServerName() {
        return serverName;
    }

    public void setServerName(String serverName) {
        this.serverName = serverName;
    }

    public String getServerURL() {
        return serverURL;
    }

    public void setServerURL(String serverURL) {
        this.serverURL = serverURL;
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

    public boolean isCustomConnectionsEnabled() {
        return customConnectionsEnabled;
    }

    public boolean isPublicCredentialsSaveEnabled() {
        return publicCredentialsSaveEnabled;
    }

    public boolean isAdminCredentialsSaveEnabled() {
        return adminCredentialsSaveEnabled;
    }

    public long getSessionExpireTime() {
        return sessionExpireTime;
    }

    public void setSessionExpireTime(long sessionExpireTime) {
        this.sessionExpireTime = sessionExpireTime;
    }

    public List<String> getEnabledFeatures() {
        return enabledFeatures;
    }

    public List<String> getEnabledAuthProviders() {
        return enabledAuthProviders;
    }

    public String[] getEnabledDrivers() {
        return enabledDrivers;
    }

    public String[] getDisabledDrivers() {
        return disabledDrivers;
    }

    public boolean isResourceManagerEnabled() {
        return resourceManagerEnabled;
    }
}

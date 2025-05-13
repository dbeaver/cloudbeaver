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
package io.cloudbeaver.model;

import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.connection.DBPDriverConfigurationType;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Web connection config
 */
public class WebConnectionConfig {

    private String connectionId;
    private String driverId;

    private boolean readOnly;

    private String host;
    private String port;
    private String serverName;
    private String databaseName;
    private String url;

    private int keepAliveInterval;

    private String name;
    private String description;
    private String folder;
    private Map<String, Object> properties;
    private String userName;
    private String userPassword;

    private String authModelId;
    private Map<String, Object> credentials;
    private boolean saveCredentials;
    private boolean sharedCredentials;
    private Map<String, Object> mainPropertyValues;
    private Map<String, Object> providerProperties;
    private List<WebNetworkHandlerConfigInput> networkHandlersConfig;
    private DBPDriverConfigurationType configurationType;
    private String selectedSecretId;
    private boolean defaultAutoCommit;
    private String defaultCatalogName;
    private String defaultSchemaName;

    public WebConnectionConfig() {
    }

    public WebConnectionConfig(Map<String, Object> params) {
        if (!CommonUtils.isEmpty(params)) {
            connectionId = JSONUtils.getString(params, "connectionId");
            driverId = JSONUtils.getString(params, "driverId");
            readOnly = JSONUtils.getBoolean(params, "readOnly");

            host = JSONUtils.getString(params, "host");
            port = JSONUtils.getString(params, "port");
            serverName = JSONUtils.getString(params, "serverName");
            databaseName = JSONUtils.getString(params, "databaseName");
            url = JSONUtils.getString(params, "url");

            keepAliveInterval = JSONUtils.getInteger(params, "keepAliveInterval", -1);
            defaultAutoCommit = JSONUtils.getBoolean(params, "autocommit", true);

            name = JSONUtils.getString(params, "name");
            description = JSONUtils.getString(params, "description");
            folder = JSONUtils.getString(params, "folder");

            properties = JSONUtils.getObjectOrNull(params, "properties");
            userName = JSONUtils.getString(params, "userName");
            userPassword = JSONUtils.getString(params, "userPassword");
            selectedSecretId = JSONUtils.getString(params, "selectedSecretId");

            authModelId = JSONUtils.getString(params, "authModelId");
            credentials = JSONUtils.getObjectOrNull(params, "credentials");
            saveCredentials = JSONUtils.getBoolean(params, "saveCredentials");
            sharedCredentials = JSONUtils.getBoolean(params, "sharedCredentials");

            mainPropertyValues = JSONUtils.getObjectOrNull(params, "mainPropertyValues");
            providerProperties = JSONUtils.getObjectOrNull(params, "providerProperties");
            defaultCatalogName = JSONUtils.getString(params, "defaultCatalogName");
            defaultSchemaName = JSONUtils.getString(params, "defaultSchemaName");

            String configType = JSONUtils.getString(params, "configurationType");
            configurationType = configType == null ? null : DBPDriverConfigurationType.valueOf(configType);

            networkHandlersConfig = new ArrayList<>();
            for (Map<String, Object> nhc : JSONUtils.getObjectList(params, "networkHandlersConfig")) {
                networkHandlersConfig.add(new WebNetworkHandlerConfigInput(nhc));
            }
        }
    }

    @Property
    public String getConnectionId() {
        return connectionId;
    }

    @Property
    public String getDriverId() {
        return driverId;
    }

    @Property
    public boolean isReadOnly() {
        return readOnly;
    }

    @Property
    public String getName() {
        return name;
    }

    @Property
    public String getDescription() {
        return description;
    }

    @Property
    public String getFolder() {
        return folder;
    }

    @Property
    public String getHost() {
        return host;
    }

    @Property
    public String getPort() {
        return port;
    }

    @Property
    public String getServerName() {
        return serverName;
    }

    @Property
    public String getDatabaseName() {
        return databaseName;
    }

    @Property
    public String getUrl() {
        return url;
    }

    @Property
    public Map<String, Object> getProperties() {
        return properties;
    }

    @Property
    public String getUserName() {
        return userName;
    }

    @Property
    public String getUserPassword() {
        return userPassword;
    }

    @Property
    public String getAuthModelId() {
        return authModelId;
    }

    @Property
    public DBPDriverConfigurationType getConfigurationType() {
        return configurationType;
    }

    @Property
    public Map<String, Object> getCredentials() {
        return credentials;
    }

    public List<WebNetworkHandlerConfigInput> getNetworkHandlersConfig() {
        return networkHandlersConfig;
    }

    @Property
    public boolean isSaveCredentials() {
        return saveCredentials;
    }

    @Property
    public boolean isSharedCredentials() {
        return sharedCredentials;
    }

    public void setSaveCredentials(boolean saveCredentials) {
        this.saveCredentials = saveCredentials;
    }

    @Property
    public Map<String, Object> getMainPropertyValues() {
        return mainPropertyValues;
    }

    @Property
    public Map<String, Object> getProviderProperties() {
        return providerProperties;
    }

    @Property
    public Integer getKeepAliveInterval() {
        return keepAliveInterval;
    }

    @Property
    public Boolean isDefaultAutoCommit() {
        return defaultAutoCommit;
    }

    @Nullable
    public String getSelectedSecretId() {
        return selectedSecretId;
    }

    @Property
    public String getDefaultCatalogName() {
        return defaultCatalogName;
    }

    @Property
    public String getDefaultSchemaName() {
        return defaultSchemaName;
    }
}

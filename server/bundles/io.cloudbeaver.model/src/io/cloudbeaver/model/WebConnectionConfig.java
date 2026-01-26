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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.connection.DBPDriverConfigurationType;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.meta.Property;

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

    private Integer keepAliveInterval;

    private String name;
    private String description;
    private String folder;
    private Map<String, Object> properties;
    private String userName;
    private String userPassword;

    private String authModelId;
    private Map<String, Object> credentials;
    private Boolean saveCredentials;
    private Boolean sharedCredentials;
    private Map<String, Object> mainPropertyValues;
    private Map<String, Object> expertSettingsValues;
    private Map<String, Object> providerProperties;
    private List<WebNetworkHandlerConfigInput> networkHandlersConfig;
    private DBPDriverConfigurationType configurationType;
    private String selectedSecretId;
    private Boolean defaultAutoCommit;
    private String defaultCatalogName;
    private String defaultSchemaName;

    public WebConnectionConfig() {
    }

    public WebConnectionConfig(@NotNull Map<String, Object> params) {
        connectionId = JSONUtils.getString(params, "connectionId");
        driverId = JSONUtils.getString(params, "driverId");

        host = JSONUtils.getString(params, "host");
        port = JSONUtils.getString(params, "port");
        serverName = JSONUtils.getString(params, "serverName");
        databaseName = JSONUtils.getString(params, "databaseName");
        url = JSONUtils.getString(params, "url");

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
        expertSettingsValues = JSONUtils.getObjectOrNull(params, "expertSettingsValues");
        keepAliveInterval = JSONUtils.getInteger(
            expertSettingsValues != null ? expertSettingsValues : params, WebExpertSettingsProperties.PROP_KEEP_ALIVE_INTERVAL, -1);
        readOnly = JSONUtils.getBoolean(
            expertSettingsValues != null ? expertSettingsValues : params, WebExpertSettingsProperties.PROP_READ_ONLY);
        defaultAutoCommit = JSONUtils.getBoolean(
            expertSettingsValues != null ? expertSettingsValues : params, WebExpertSettingsProperties.PROP_AUTO_COMMIT, true);
        defaultCatalogName = JSONUtils.getString(
            expertSettingsValues != null ? expertSettingsValues : params, WebExpertSettingsProperties.PROP_DEFAULT_CATALOG);
        defaultSchemaName = JSONUtils.getString(
            expertSettingsValues != null ? expertSettingsValues : params,
            WebExpertSettingsProperties.PROP_DEFAULT_SCHEMA
        );

        String configType = JSONUtils.getString(params, "configurationType");
        configurationType = configType == null ? null : DBPDriverConfigurationType.valueOf(configType);

        networkHandlersConfig = new ArrayList<>();
        for (Map<String, Object> nhc : JSONUtils.getObjectList(params, "networkHandlersConfig")) {
            networkHandlersConfig.add(new WebNetworkHandlerConfigInput(nhc));
        }
    }

    @Property
    public String getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(String connectionId) {
        this.connectionId = connectionId;
    }

    @Property
    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    @Property
    public boolean isReadOnly() {
        return readOnly;
    }

    public void setReadOnly(boolean readOnly) {
        this.readOnly = readOnly;
    }

    @Property
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Property
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Property
    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    @Property
    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    @Property
    public String getPort() {
        return port;
    }

    public void setPort(String port) {
        this.port = port;
    }

    @Property
    public String getServerName() {
        return serverName;
    }

    public void setServerName(String serverName) {
        this.serverName = serverName;
    }

    @Property
    public String getDatabaseName() {
        return databaseName;
    }

    public void setDatabaseName(String databaseName) {
        this.databaseName = databaseName;
    }

    @Property
    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    @Property
    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    @Property
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    @Property
    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    @Property
    public String getAuthModelId() {
        return authModelId;
    }

    public void setAuthModelId(String authModelId) {
        this.authModelId = authModelId;
    }

    @Property
    public DBPDriverConfigurationType getConfigurationType() {
        return configurationType;
    }

    public void setConfigurationType(DBPDriverConfigurationType configurationType) {
        this.configurationType = configurationType;
    }

    @Property
    public Map<String, Object> getCredentials() {
        return credentials;
    }

    public void setCredentials(Map<String, Object> credentials) {
        this.credentials = credentials;
    }

    public List<WebNetworkHandlerConfigInput> getNetworkHandlersConfig() {
        return networkHandlersConfig;
    }

    public void setNetworkHandlersConfig(List<WebNetworkHandlerConfigInput> networkHandlersConfig) {
        this.networkHandlersConfig = networkHandlersConfig;
    }

    @Property
    public boolean isSaveCredentials() {
        return saveCredentials;
    }

    public void setSaveCredentials(boolean saveCredentials) {
        this.saveCredentials = saveCredentials;
    }

    @Property
    public boolean isSharedCredentials() {
        return sharedCredentials;
    }

    public void setSharedCredentials(boolean sharedCredentials) {
        this.sharedCredentials = sharedCredentials;
    }

    @Property
    public Map<String, Object> getMainPropertyValues() {
        return mainPropertyValues;
    }

    public void setMainPropertyValues(Map<String, Object> mainPropertyValues) {
        this.mainPropertyValues = mainPropertyValues;
    }

    @Property
    public Map<String, Object> getExpertSettingsValues() {
        return expertSettingsValues;
    }

    public void setExpertSettingsValues(Map<String, Object> expertSettingsValues) {
        this.expertSettingsValues = expertSettingsValues;
    }

    @Property
    public Map<String, Object> getProviderProperties() {
        return providerProperties;
    }

    public void setProviderProperties(Map<String, Object> providerProperties) {
        this.providerProperties = providerProperties;
    }

    @Property
    public Integer getKeepAliveInterval() {
        return keepAliveInterval;
    }

    public void setKeepAliveInterval(int keepAliveInterval) {
        this.keepAliveInterval = keepAliveInterval;
    }

    @Property
    public Boolean isDefaultAutoCommit() {
        return defaultAutoCommit;
    }

    public void setDefaultAutoCommit(boolean defaultAutoCommit) {
        this.defaultAutoCommit = defaultAutoCommit;
    }

    @Nullable
    public String getSelectedSecretId() {
        return selectedSecretId;
    }

    public void setSelectedSecretId(String selectedSecretId) {
        this.selectedSecretId = selectedSecretId;
    }

    @Property
    public String getDefaultCatalogName() {
        return defaultCatalogName;
    }

    public void setDefaultCatalogName(String defaultCatalogName) {
        this.defaultCatalogName = defaultCatalogName;
    }

    @Property
    public String getDefaultSchemaName() {
        return defaultSchemaName;
    }

    public void setDefaultSchemaName(String defaultSchemaName) {
        this.defaultSchemaName = defaultSchemaName;
    }
}

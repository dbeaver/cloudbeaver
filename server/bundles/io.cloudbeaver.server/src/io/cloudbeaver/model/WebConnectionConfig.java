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
package io.cloudbeaver.model;

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
    private String templateId;
    private String driverId;

    private boolean template;
    private boolean readOnly;

    private String host;
    private String port;
    private String serverName;
    private String databaseName;
    private String url;

    private String name;
    private String description;
    private Map<String, Object> properties;
    private String userName;
    private String userPassword;

    private String authModelId;
    private Map<String, Object> credentials;
    private boolean saveCredentials;
    private Map<String, Object> providerProperties;
    private List<WebNetworkHandlerConfigInput> networkHandlersConfig;

    public WebConnectionConfig() {
    }

    public WebConnectionConfig(Map<String, Object> params) {
        if (!CommonUtils.isEmpty(params)) {
            connectionId = JSONUtils.getString(params, "connectionId");
            templateId = JSONUtils.getString(params, "templateId");
            String dataSourceId = JSONUtils.getString(params, "dataSourceId");
            if (CommonUtils.isEmpty(templateId) && !CommonUtils.isEmpty(dataSourceId)) {
                templateId = dataSourceId;
            }
            driverId = JSONUtils.getString(params, "driverId");

            template = JSONUtils.getBoolean(params, "template");
            readOnly = JSONUtils.getBoolean(params, "readOnly");

            host = JSONUtils.getString(params, "host");
            port = JSONUtils.getString(params, "port");
            serverName = JSONUtils.getString(params, "serverName");
            databaseName = JSONUtils.getString(params, "databaseName");
            url = JSONUtils.getString(params, "url");

            name = JSONUtils.getString(params, "name");
            description = JSONUtils.getString(params, "description");

            properties = JSONUtils.getObjectOrNull(params, "properties");
            userName = JSONUtils.getString(params, "userName");
            userPassword = JSONUtils.getString(params, "userPassword");

            authModelId = JSONUtils.getString(params, "authModelId");
            credentials = JSONUtils.getObjectOrNull(params, "credentials");
            saveCredentials = JSONUtils.getBoolean(params, "saveCredentials");

            providerProperties = JSONUtils.getObjectOrNull(params, "providerProperties");

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
    public String getTemplateId() {
        return templateId;
    }

    @Property
    public String getDriverId() {
        return driverId;
    }

    @Property
    public boolean isTemplate() {
        return template;
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

    public void setSaveCredentials(boolean saveCredentials) {
        this.saveCredentials = saveCredentials;
    }

    @Property
    public Map<String, Object> getProviderProperties() {
        return providerProperties;
    }
}

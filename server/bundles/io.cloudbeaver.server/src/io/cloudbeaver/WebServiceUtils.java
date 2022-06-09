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
package io.cloudbeaver;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.session.WebActionParameters;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.utils.WebCommonUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNativeCredentials;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.ssh.SSHConstants;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.registry.DataSourceProviderDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Various constants
 */
public class WebServiceUtils extends WebCommonUtils {

    private static final Log log = Log.getLog(WebServiceUtils.class);

    private static final Gson gson = new GsonBuilder().create();

    @NotNull
    public static DBPDriver getDriverById(String id) throws DBWebException {
        int divPos = id.indexOf(':');
        if (divPos < 0) {
            throw new DBWebException("Bad driver id [" + id + "]");
        }
        String dsId = id.substring(0, divPos);
        String driverId = id.substring(divPos + 1);
        DataSourceProviderDescriptor dsProvider = DataSourceProviderRegistry.getInstance().getDataSourceProvider(dsId);
        if (dsProvider == null) {
            throw new DBWebException("Data source provider '" + dsId + "' not found");
        }
        DriverDescriptor driver = dsProvider.getDriver(driverId);
        if (driver == null) {
            throw new DBWebException("Driver '" + driverId + "' not found in provider '" + dsId + "'");
        }
        return driver;
    }

    @NotNull
    public static DBPDataSourceRegistry getGlobalDataSourceRegistry() throws DBWebException {
        DBPDataSourceRegistry registry = DBWorkbench.getPlatform().getWorkspace().getDefaultDataSourceRegistry();
        if (registry == null) {
            throw new DBWebException("No activate data source registry");
        }
        return registry;
    }

    @NotNull
    public static DBNModel getGlobalNavigatorModel() throws DBWebException {
        return DBWorkbench.getPlatform().getNavigatorModel();
    }

    public static InputStream openStaticResource(String path) {
        return WebServiceUtils.class.getClassLoader().getResourceAsStream(path);
    }

    @NotNull
    public static DBPDataSourceContainer createConnectionFromConfig(WebConnectionConfig config, DBPDataSourceRegistry registry) throws DBWebException {
        DBPDataSourceContainer newDataSource;
        if (!CommonUtils.isEmpty(config.getTemplateId())) {
            DBPDataSourceContainer tpl = registry.getDataSource(config.getTemplateId());
            if (tpl == null) {
                throw new DBWebException("Template connection '" + config.getTemplateId() + "' not found");
            }
            newDataSource = registry.createDataSource(tpl);
        } else if (!CommonUtils.isEmpty(config.getDriverId())) {
            String driverId = config.getDriverId();
            if (CommonUtils.isEmpty(driverId)) {
                throw new DBWebException("Driver not specified");
            }
            DBPDriver driver = getDriverById(driverId);

            DBPConnectionConfiguration dsConfig = new DBPConnectionConfiguration();

            setConnectionConfiguration(driver, dsConfig, config);

            newDataSource = registry.createDataSource(driver, dsConfig);
        } else {
            throw new DBWebException("Template connection or driver must be specified");
        }

        newDataSource.setSavePassword(true);
        newDataSource.setName(config.getName());
        newDataSource.setDescription(config.getDescription());
        ((DataSourceDescriptor)newDataSource).setTemplate(config.isTemplate());

        // Set default navigator settings
        DataSourceNavigatorSettings navSettings = new DataSourceNavigatorSettings(
            CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());
        //navSettings.setShowSystemObjects(false);
        ((DataSourceDescriptor)newDataSource).setNavigatorSettings(navSettings);

        saveAuthProperties(newDataSource, newDataSource.getConnectionConfiguration(), config.getCredentials(), config.isSaveCredentials());


        return newDataSource;
    }

    public static void setConnectionConfiguration(DBPDriver driver, DBPConnectionConfiguration dsConfig, WebConnectionConfig config) {
        if (!CommonUtils.isEmpty(config.getUrl())) {
            dsConfig.setUrl(config.getUrl());
        } else {
            if (config.getHost() != null) {
                dsConfig.setHostName(config.getHost());
            }
            if (config.getPort() != null) {
                dsConfig.setHostPort(config.getPort());
            }
            if (config.getDatabaseName() != null) {
                dsConfig.setDatabaseName(config.getDatabaseName());
            }
            if (config.getServerName() != null) {
                dsConfig.setServerName(config.getServerName());
            }
            dsConfig.setUrl(driver.getConnectionURL(dsConfig));
        }
        if (config.getProperties() != null) {
            Map<String, String> newProps = new LinkedHashMap<>();
            for (Map.Entry<String, Object> pe : config.getProperties().entrySet()) {
                newProps.put(pe.getKey(), CommonUtils.toString(pe.getValue()));
            }
            dsConfig.setProperties(newProps);
        }
        if (config.getUserName() != null) {
            dsConfig.setUserName(config.getUserName());
        }
        if (config.getUserPassword() != null) {
            dsConfig.setUserPassword(config.getUserPassword());
        }
        if (config.getAuthModelId() != null) {
            dsConfig.setAuthModelId(config.getAuthModelId());
        }
        // Save provider props
        if (config.getProviderProperties() != null) {
            dsConfig.setProviderProperties(new LinkedHashMap<>());
            for (Map.Entry<String, Object> e : config.getProviderProperties().entrySet()) {
                dsConfig.setProviderProperty(e.getKey(), CommonUtils.toString(e.getValue()));
            }
        }
        // Save network handlers
        if (config.getNetworkHandlersConfig() != null) {
            for (WebNetworkHandlerConfigInput nhc : config.getNetworkHandlersConfig()) {
                DBWHandlerConfiguration handlerConfig = dsConfig.getHandler(nhc.getId());
                if (handlerConfig == null) {
                    NetworkHandlerDescriptor handlerDescriptor = NetworkHandlerRegistry.getInstance().getDescriptor(nhc.getId());
                    if (handlerDescriptor == null) {
                        log.warn("Can't find network handler '" + nhc.getId() + "'");
                        continue;
                    } else {
                        handlerConfig = new DBWHandlerConfiguration(handlerDescriptor, null);
                        updateHandlerConfig(handlerConfig, nhc);
                    }
                } else {
                    updateHandlerConfig(handlerConfig, nhc);
                }
                dsConfig.updateHandler(handlerConfig);
            }
        }
    }

    public static void updateHandlerConfig(DBWHandlerConfiguration handlerConfig, WebNetworkHandlerConfigInput cfgInput) {
        if (cfgInput.isEnabled() != null) {
            handlerConfig.setEnabled(cfgInput.isEnabled());
        }
        if (cfgInput.getProperties() != null) {
            handlerConfig.setProperties(cfgInput.getProperties());
        }

        if (cfgInput.getAuthType() != null) {
            handlerConfig.setProperty(SSHConstants.PROP_AUTH_TYPE,
                CommonUtils.valueOf(SSHConstants.AuthType.class, cfgInput.getAuthType(), SSHConstants.AuthType.PASSWORD));
        }
        if (cfgInput.isSavePassword() != null) {
            handlerConfig.setSavePassword(cfgInput.isSavePassword());
        } else {
            handlerConfig.setSavePassword(false);
        }
        if (cfgInput.getUserName() != null) {
            handlerConfig.setUserName(cfgInput.getUserName());
        }
        if (cfgInput.getPassword() != null) {
            handlerConfig.setPassword(cfgInput.getPassword());
        }
        if (cfgInput.getKey() != null) {
            handlerConfig.setSecureProperty(SSHConstants.PROP_KEY_VALUE, cfgInput.getKey());
        }
    }

    public static void saveAuthProperties(
        @NotNull DBPDataSourceContainer dataSourceContainer,
        @NotNull DBPConnectionConfiguration configuration,
        @Nullable Map<String, Object> authProperties,
        boolean saveCredentials)
    {
        dataSourceContainer.setSavePassword(saveCredentials);
        if (!saveCredentials) {
            // Reset credentials
            if (authProperties == null) {
                authProperties = new LinkedHashMap<>();
            }
            authProperties.replace(AuthModelDatabaseNativeCredentials.PROP_USER_PASSWORD, null);
        } else {
            if (authProperties == null) {
                // No changes
                return;
            }
        }
        if (!saveCredentials) {
            configuration.setUserPassword(null);
        }
        {
            // Read save credentials
            DBAAuthCredentials credentials = configuration.getAuthModel().loadCredentials(dataSourceContainer, configuration);

            if (!authProperties.isEmpty()) {

                // Make new Gson parser with type adapters to deserialize into existing credentials
                InstanceCreator<DBAAuthCredentials> credTypeAdapter = type -> credentials;
                Gson credGson = new GsonBuilder()
                    .setLenient()
                    .registerTypeAdapter(credentials.getClass(), credTypeAdapter)
                    .create();

                credGson.fromJson(credGson.toJsonTree(authProperties), credentials.getClass());
            }

            configuration.getAuthModel().saveCredentials(dataSourceContainer, configuration, credentials);
        }
    }

    public static void updateConnectionFromConfig(DBPDataSourceContainer dataSource, WebConnectionConfig config) {
        setConnectionConfiguration(dataSource.getDriver(), dataSource.getConnectionConfiguration(), config);
        dataSource.setName(config.getName());
        dataSource.setDescription(config.getDescription());
        saveAuthProperties(dataSource, dataSource.getConnectionConfiguration(), config.getCredentials(), config.isSaveCredentials());
    }

    public static DBNBrowseSettings parseNavigatorSettings(Map<String, Object> settingsMap) {
        return gson.fromJson(
            gson.toJsonTree(settingsMap), DataSourceNavigatorSettings.class);
    }

    public static void checkServerConfigured() throws DBWebException {
        if (CBApplication.getInstance().isConfigurationMode()) {
            throw new DBWebException("Server is in configuration mode");
        }
    }

    public static void addResponseCookie(HttpServletRequest request, HttpServletResponse response, String cookieName, String cookieValue, long maxSessionIdleTime) {
        addResponseCookie(request, response, cookieName, cookieValue, maxSessionIdleTime, null);
    }

    public static void addResponseCookie(HttpServletRequest request, HttpServletResponse response, String cookieName, String cookieValue, long maxSessionIdleTime, @Nullable String sameSite) {
        Cookie sessionCookie = new Cookie(cookieName, cookieValue);
        if (maxSessionIdleTime > 0) {
            sessionCookie.setMaxAge((int) (maxSessionIdleTime / 1000));
        }

        String path = CBApplication.getInstance().getRootURI();

        if (sameSite != null) {
            if (sameSite.toLowerCase() == "none" && request.isSecure() == false) {
                log.debug("Attempt to set Cookie `" + cookieName + "` with `SameSite=None` failed, it require a secure context/HTTPS");
            } else {
                sessionCookie.setSecure(true);
                path = path.concat("; SameSite=" + sameSite);
            }
        }

        sessionCookie.setPath(path);
        response.addCookie(sessionCookie);
    }

    public static String getRequestCookie(HttpServletRequest request, String cookieName) {
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(cookieName)) {
                return cookie.getValue();
            }
        }
        return null;
    }

    @NotNull
    public static String removeSideSlashes(String action) {
        if (CommonUtils.isEmpty(action)) {
            return action;
        }
        while (action.startsWith("/")) action = action.substring(1);
        while (action.endsWith("/")) action = action.substring(0, action.length() - 1);
        return action;
    }

    @NotNull
    public static StringBuilder getApiPrefix(String serviceId) {
        CBApplication application = CBApplication.getInstance();
        StringBuilder apiPrefix = new StringBuilder();
        apiPrefix.append(removeSideSlashes(application.getServerURL()));
        apiPrefix.append("/");
        String rootURI = removeSideSlashes(application.getRootURI());
        if (!CommonUtils.isEmpty(rootURI)) {
            apiPrefix.append(rootURI).append("/");
        }
        apiPrefix.append(removeSideSlashes(application.getServicesURI()));
        apiPrefix.append("/").append(serviceId).append("/");
        return apiPrefix;
    }

    public static void fireActionParametersOpenEditor(WebSession webSession, DBPDataSourceContainer dataSource, boolean addEditorName) {
        Map<String, Object> actionParameters = new HashMap<>();
        actionParameters.put("action", "open-sql-editor");
        actionParameters.put("connection-id", dataSource.getId());
        if (addEditorName) {
            actionParameters.put("editor-name", dataSource.getName() + "-sql");
        }
        WebActionParameters.saveToSession(webSession, actionParameters);
    }

}

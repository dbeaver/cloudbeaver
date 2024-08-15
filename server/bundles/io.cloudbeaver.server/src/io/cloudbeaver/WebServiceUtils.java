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
package io.cloudbeaver;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebActionParameters;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.navigator.WebPropertyFilter;
import io.cloudbeaver.utils.WebAppUtils;
import io.cloudbeaver.utils.WebCommonUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.registry.DataSourceProviderDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;
import org.jkiss.utils.CommonUtils;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

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
        return WebDataSourceUtils.getGlobalDataSourceRegistry();
    }

    public static DBPDataSourceRegistry getGlobalRegistry(WebSession session) {
        return session.getProjectById(WebAppUtils.getGlobalProjectId()).getDataSourceRegistry();
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
        if (config.getFolder() != null) {
            newDataSource.setFolder(registry.getFolder(config.getFolder()));
        }
        ((DataSourceDescriptor)newDataSource).setTemplate(config.isTemplate());

        // Set default navigator settings
        DataSourceNavigatorSettings navSettings = new DataSourceNavigatorSettings(
            CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());
        //navSettings.setShowSystemObjects(false);
        ((DataSourceDescriptor)newDataSource).setNavigatorSettings(navSettings);

        WebDataSourceUtils.saveAuthProperties(
            newDataSource,
            newDataSource.getConnectionConfiguration(),
            config.getCredentials(),
            config.isSaveCredentials(),
            config.isSharedCredentials()
        );


        return newDataSource;
    }

    public static void setConnectionConfiguration(DBPDriver driver, DBPConnectionConfiguration dsConfig, WebConnectionConfig config) {
        setMainProperties(dsConfig, config);
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
        if (config.getKeepAliveInterval() >= 0) {
            dsConfig.setKeepAliveInterval(config.getKeepAliveInterval());
        }
        if (config.isDefaultAutoCommit() != null) {
            dsConfig.getBootstrap().setDefaultAutoCommit(config.isDefaultAutoCommit());
        }
        // Save provider props
        if (config.getProviderProperties() != null) {
            dsConfig.setProviderProperties(new LinkedHashMap<>());
            for (Map.Entry<String, Object> e : config.getProviderProperties().entrySet()) {
                dsConfig.setProviderProperty(e.getKey(), CommonUtils.toString(e.getValue()));
            }
        }
        if (config.getConfigurationType() != null) {
            dsConfig.setConfigurationType(config.getConfigurationType());
        }
        if (CommonUtils.isEmpty(config.getUrl())) {
            dsConfig.setUrl(driver.getConnectionURL(dsConfig));
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
                        WebDataSourceUtils.updateHandlerConfig(handlerConfig, nhc);
                    }
                } else {
                    WebDataSourceUtils.updateHandlerConfig(handlerConfig, nhc);
                }
                dsConfig.updateHandler(handlerConfig);
            }
        }
    }

    private static void setMainProperties(DBPConnectionConfiguration dsConfig, WebConnectionConfig config) {
        if (CommonUtils.isNotEmpty(config.getUrl())) {
            dsConfig.setUrl(config.getUrl());
            return;
        }
        if (config.getMainPropertyValues() != null) {
            for (Map.Entry<String, Object> e : config.getMainPropertyValues().entrySet()) {
                if (e.getValue() == null) {
                    continue;
                }
                switch (e.getKey()) {
                    case DBConstants.PROP_HOST -> dsConfig.setHostName(CommonUtils.toString(e.getValue()));
                    case DBConstants.PROP_PORT -> dsConfig.setHostPort(CommonUtils.toString(e.getValue()));
                    case DBConstants.PROP_DATABASE -> dsConfig.setDatabaseName(CommonUtils.toString(e.getValue()));
                    case DBConstants.PROP_SERVER -> dsConfig.setServerName(CommonUtils.toString(e.getValue()));
                    default -> throw new IllegalStateException("Unexpected value: " + e.getKey());
                }
            }
            return;
        }
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

    public static void fireActionParametersOpenEditor(WebSession webSession, DBPDataSourceContainer dataSource, boolean addEditorName) {
        Map<String, Object> actionParameters = new HashMap<>();
        actionParameters.put("action", "open-sql-editor");
        actionParameters.put("connection-id", dataSource.getId());
        actionParameters.put("project-id", dataSource.getProject().getId());
        if (addEditorName) {
            actionParameters.put("editor-name", dataSource.getName() + "-sql");
        }
        WebActionParameters.saveToSession(webSession, actionParameters);
    }

    public static String getConnectionContainerInfo(DBPDataSourceContainer container) {
        if (container == null) {
            return null;
        }
        return container.getName() + " [" + container.getId() + "]";
    }

    public static void updateConfigAndRefreshDatabases(WebSession session, String projectId) {
        DBNProject projectNode = session.getNavigatorModel().getRoot().getProjectNode(session.getProjectById(projectId));
        DBNModel.updateConfigAndRefreshDatabases(projectNode.getDatabases());
    }

    public static List<WebAuthProviderDescriptor> getEnabledAuthProviders() {
        List<WebAuthProviderDescriptor> result = new ArrayList<>();
        CBAppConfig appConfig = CBApplication.getInstance().getAppConfiguration();
        String[] authProviders = appConfig.getEnabledAuthProviders();
        for (String apId : authProviders) {
            WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(apId);
            if (authProvider != null) {
                result.add(authProvider);
            }
        }
        return result;
    }

    /**
     * Returns set of applicable ids of drivers.
     */
    @NotNull
    public static Set<String> getApplicableDriversIds() {
        return CBPlatform.getInstance().getApplicableDrivers().stream()
            .map(DBPDriver::getId)
            .collect(Collectors.toSet());
    }

    /**
     * Returns filtered properties collected from object.
     */
    @NotNull
    public static WebPropertyInfo[] getObjectFilteredProperties(
        @NotNull WebSession session,
        @NotNull DBPObject object,
        @Nullable WebPropertyFilter filter
    ) {
        PropertyCollector propertyCollector = new PropertyCollector(object, true);
        propertyCollector.setLocale(session.getLocale());
        propertyCollector.collectProperties();
        List<WebPropertyInfo> webProps = new ArrayList<>();
        for (DBPPropertyDescriptor prop : propertyCollector.getProperties()) {
            if (filter != null && !CommonUtils.isEmpty(filter.getIds()) && !filter.getIds().contains(CommonUtils.toString(prop.getId()))) {
                continue;
            }
            WebPropertyInfo webProperty = new WebPropertyInfo(session, prop, propertyCollector);
            if (filter != null) {
                if (!CommonUtils.isEmpty(filter.getFeatures()) && !webProperty.hasAnyFeature(filter.getFeatures())) {
                    continue;
                }
                if (!CommonUtils.isEmpty(filter.getCategories()) && !filter.getCategories().contains(webProperty.getCategory())) {
                    continue;
                }
            }
            webProps.add(webProperty);
        }
        return webProps.toArray(new WebPropertyInfo[0]);
    }
}

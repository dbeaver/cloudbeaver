/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.utils;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderDescriptor;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNativeCredentials;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.ssh.SSHConstants;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceDisconnectEvent;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.PropertySerializationUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public class WebDataSourceUtils {

    private static final Log log = Log.getLog(WebDataSourceUtils.class);

    private WebDataSourceUtils() {
    }

    public static void saveCredentialsInDataSource(WebConnectionInfo webConnectionInfo, DBPDataSourceContainer dataSourceContainer, DBPConnectionConfiguration configuration) {
        // Properties passed from web
        // webConnectionInfo may be null in some cases (e.g. connection test when no actual connection exist yet)
        Map<String, Object> authProperties = webConnectionInfo.getSavedAuthProperties();
        if (authProperties != null) {
            authProperties.forEach((s, o) -> configuration.setAuthProperty(s, CommonUtils.toString(o)));
        }
        List<WebNetworkHandlerConfigInput> networkCredentials = webConnectionInfo.getSavedNetworkCredentials();
        if (networkCredentials != null) {
            networkCredentials.forEach(c -> {
                if (c != null) {
                    DBWHandlerConfiguration handlerCfg = configuration.getHandler(c.getId());
                    if (handlerCfg != null) {
                        updateHandlerCredentials(handlerCfg, c);
                    }
                }
            });
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
        setSecureProperties(handlerConfig, cfgInput, true);
        if (cfgInput.getKey() != null) { // backward compatibility
            handlerConfig.setSecureProperty(SSHConstants.PROP_KEY_VALUE, cfgInput.getKey());
        }
    }

    private static void setSecureProperties(DBWHandlerConfiguration handlerConfig, WebNetworkHandlerConfigInput cfgInput, boolean ignoreNulls) {
        var secureProperties = cfgInput.getSecureProperties();
        if (secureProperties == null) {
            if (!handlerConfig.isSavePassword()) {
                // clear all secure properties from handler config
                handlerConfig.setSecureProperties(Map.of());
            }
            return;
        }
        for (var pr : secureProperties.entrySet()) {
            if (ignoreNulls && pr.getValue() == null) {
                continue;
            }
            handlerConfig.setSecureProperty(pr.getKey(), pr.getValue());
        }
    }

    @Nullable
    public static DBPDataSourceContainer getLocalOrGlobalDataSource(
        WebSession webSession, @Nullable String projectId, String connectionId
    ) throws DBWebException {
        DBPDataSourceContainer dataSource = null;
        if (!CommonUtils.isEmpty(connectionId)) {
            WebSessionProjectImpl project = webSession.getProjectById(projectId);
            if (project == null) {
                throw new DBWebException("Project '" + projectId + "' not found");
            }
            dataSource = project.getDataSourceRegistry().getDataSource(connectionId);
            if (dataSource == null &&
                (webSession.hasPermission(DBWConstants.PERMISSION_ADMIN) || webSession.getApplication().isConfigurationMode())) {
                // If called for new connection in admin mode then this connection may absent in session registry yet
                project = webSession.getGlobalProject();
                if (project != null) {
                    dataSource = project.getDataSourceRegistry().getDataSource(connectionId);
                }
            }
        }
        return dataSource;
    }

    @NotNull
    public static DBPDataSourceRegistry getGlobalDataSourceRegistry() throws DBWebException {
        DBPProject activeProject = DBWorkbench.getPlatform().getWorkspace().getActiveProject();
        if (activeProject != null) {
            return activeProject.getDataSourceRegistry();
        }

        throw new DBWebException("No activate data source registry");
    }

    public static void updateHandlerCredentials(DBWHandlerConfiguration handlerCfg, WebNetworkHandlerConfigInput webConfig) {
        handlerCfg.setUserName(webConfig.getUserName());
        handlerCfg.setPassword(webConfig.getPassword());
        setSecureProperties(handlerCfg, webConfig, false);
        handlerCfg.setSecureProperty(SSHConstants.PROP_KEY_VALUE, webConfig.getKey()); // backward compatibility
    }


    public static boolean disconnectDataSource(@NotNull WebSession webSession, @NotNull DBPDataSourceContainer dataSource) {
        if (dataSource.isConnected()) {
            try {
                dataSource.disconnect(webSession.getProgressMonitor());
                webSession.addSessionEvent(
                    new WSDataSourceDisconnectEvent(
                        dataSource.getProject().getId(),
                        dataSource.getId(),
                        webSession.getSessionId(),
                        webSession.getUserId()
                    )
                );
                return true;
            } catch (DBException e) {
                log.error("Error closing connection", e);
            }
            // Disconnect in async mode?
            //new DisconnectJob(connectionInfo.getDataSource()).schedule();
        }
        return false;
    }

    /**
     * The method that seeks for web connection in session cache by connection id.
     * Mostly used when project id is not defined.
     */
    @NotNull
    public static WebConnectionInfo getWebConnectionInfo(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        if (projectId == null) {
            webSession.addWarningMessage("Project id is not defined in request. Try to find it from connection cache");
            // try to find connection in all accessible projects
            Optional<WebConnectionInfo> optional = webSession.getAccessibleProjects().stream()
                .flatMap(p -> p.getConnections().stream()) // get connection cache from web projects
                .filter(e -> e.getId().contains(connectionId))
                .findFirst();
            if (optional.isPresent()) {
                return optional.get();
            }
        }
        return webSession.getAccessibleProjectById(projectId).getWebConnectionInfo(connectionId);
    }

    public static void updateCredentialsFromProperties(
        @NotNull DBRProgressMonitor progressMonitor,
        @NotNull DBAAuthCredentials credentials,
        @Nullable Map<String, ?> properties
    ) {
        if (properties == null) {
            return;
        }
        PropertySerializationUtils.updateCredentialsFromProperties(progressMonitor, credentials, properties);
    }

    public static void saveAuthProperties(
        @NotNull DBRProgressMonitor progressMonitor,
        @NotNull DBPDataSourceContainer dataSourceContainer,
        @NotNull DBPConnectionConfiguration configuration,
        @Nullable Map<String, Object> authProperties,
        boolean saveCredentials,
        boolean sharedCredentials
    ) {
        saveAuthProperties(progressMonitor, dataSourceContainer, configuration, authProperties, saveCredentials, sharedCredentials, false);
    }

    public static void saveAuthProperties(
        @NotNull DBRProgressMonitor progressMonitor,
        @NotNull DBPDataSourceContainer dataSourceContainer,
        @NotNull DBPConnectionConfiguration configuration,
        @Nullable Map<String, Object> authProperties,
        boolean saveCredentials,
        boolean sharedCredentials,
        boolean isTest
    ) {
        dataSourceContainer.setSavePassword(saveCredentials);
        dataSourceContainer.setSharedCredentials(sharedCredentials);
        if (!saveCredentials) {
            // Reset credentials
            if (authProperties == null) {
                authProperties = new LinkedHashMap<>();
            }
            authProperties.replace(AuthModelDatabaseNativeCredentials.PROP_USER_PASSWORD, null);
            dataSourceContainer.resetPassword();
        } else {
            if (authProperties == null) {
                // No changes
                return;
            }
        }
        {
            // Read save credentials
            DBAAuthCredentials credentials = configuration.getAuthModel().loadCredentials(dataSourceContainer, configuration);

            if (isTest) {
                var currentAuthProps = new HashMap<String, String>();
                for (Map.Entry<String, Object> stringObjectEntry : authProperties.entrySet()) {
                    var value = stringObjectEntry.getValue() == null ? null : stringObjectEntry.getValue().toString();
                    currentAuthProps.put(stringObjectEntry.getKey(), value);
                }
                configuration.setAuthProperties(currentAuthProps);
            }
            if (!authProperties.isEmpty()) {
                updateCredentialsFromProperties(progressMonitor, credentials, authProperties);
            }

            configuration.getAuthModel().saveCredentials(dataSourceContainer, configuration, credentials);
        }
    }

    public static void setConnectionConfiguration(
        @NotNull DBPDriver driver,
        @NotNull DBPConnectionConfiguration dsConfig,
        @NotNull WebConnectionConfig config
    ) {
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
        dsConfig.getBootstrap().setDefaultCatalogName(config.getDefaultCatalogName());
        dsConfig.getBootstrap().setDefaultSchemaName(config.getDefaultSchemaName());
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

    public static void setMainProperties(@NotNull DBPConnectionConfiguration dsConfig, @NotNull WebConnectionConfig config) {
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

    @NotNull
    public static DBPDriver getDriverById(String id) throws DBWebException {
        int divPos = id.indexOf(':');
        if (divPos < 0) {
            throw new DBWebException("Bad driver id [" + id + "]");
        }
        String dsId = id.substring(0, divPos);
        String driverId = id.substring(divPos + 1);
        DBPDataSourceProviderDescriptor dsProvider = DBWorkbench.getPlatform().getDataSourceProviderRegistry().getDataSourceProvider(dsId);
        if (dsProvider == null) {
            throw new DBWebException("Data source provider '" + dsId + "' not found");
        }
        DBPDriver driver = dsProvider.getDriver(driverId);
        if (driver == null) {
            throw new DBWebException("Driver '" + driverId + "' not found in provider '" + dsId + "'");
        }
        return driver;
    }

    public static String getConnectionContainerInfo(@Nullable DBPDataSourceContainer container) {
        if (container == null) {
            return null;
        }
        return container.getName() + " [" + container.getId() + "]";
    }
}

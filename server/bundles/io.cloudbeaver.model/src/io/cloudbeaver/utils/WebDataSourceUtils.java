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
package io.cloudbeaver.utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNativeCredentials;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.dbeaver.model.net.ssh.SSHConstants;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
        WebApplication application, WebSession webSession, @Nullable String projectId, String connectionId
    ) throws DBWebException {
        DBPDataSourceContainer dataSource = null;
        if (!CommonUtils.isEmpty(connectionId)) {
            dataSource = webSession.getProjectById(projectId).getDataSourceRegistry().getDataSource(connectionId);
            if (dataSource == null && (webSession.hasPermission(DBWConstants.PERMISSION_ADMIN) || application.isConfigurationMode())) {
                // If called for new connection in admin mode then this connection may absent in session registry yet
                dataSource = getGlobalDataSourceRegistry().getDataSource(connectionId);
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

    public static boolean isGlobalProject(DBPProject project) {
        return project.getId().equals(RMProjectType.GLOBAL.getPrefix() + "_" + BaseApplicationImpl.getInstance().getDefaultProjectName());
    }

    public static boolean disconnectDataSource(@NotNull WebSession webSession, @NotNull DBPDataSourceContainer dataSource) {
        if (dataSource.isConnected()) {
            try {
                dataSource.disconnect(webSession.getProgressMonitor());
                return true;
            } catch (DBException e) {
                log.error("Error closing connection", e);
            }
            // Disconnect in async mode?
            //new DisconnectJob(connectionInfo.getDataSource()).schedule();
        }
        return false;
    }


    public static void saveAuthProperties(
        @NotNull DBPDataSourceContainer dataSourceContainer,
        @NotNull DBPConnectionConfiguration configuration,
        @Nullable Map<String, Object> authProperties,
        boolean saveCredentials,
        boolean sharedCredentials
    ) {
        saveAuthProperties(dataSourceContainer, configuration, authProperties, saveCredentials, sharedCredentials, false);
    }

    public static void saveAuthProperties(
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
            log.debug("saveAuthProperties: dataSourceContainer.resetPassword()");
        } else {
            if (authProperties == null) {
                // No changes
                log.debug("saveAuthProperties: authProperties == null");
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

    public static void updateConnectionCredentials(@NotNull DBPDataSourceContainer dataSourceContainer,
                                                   @NotNull Map<String, Object> authProperties,
                                                   @Nullable List<WebNetworkHandlerConfigInput> networkCredentials,
                                                   @Nullable Boolean saveCredentials,
                                                   @Nullable Boolean sharedCredentials,
                                                   @Nullable WebConnectionInfo connectionInfo) throws DBWebException {
        boolean saveConfig = false;

        if (networkCredentials != null) {
            for (WebNetworkHandlerConfigInput c: networkCredentials) {
                if (CommonUtils.toBoolean(c.isSavePassword())) {
                    DBWHandlerConfiguration handlerCfg = dataSourceContainer.getConnectionConfiguration().getHandler(c.getId());
                    if (handlerCfg != null &&
                        // check username param only for ssh config
                        !(CommonUtils.isEmpty(c.getUserName()) && CommonUtils.equalObjects(handlerCfg.getType(),
                            DBWHandlerType.TUNNEL))
                    ) {
                        WebDataSourceUtils.updateHandlerCredentials(handlerCfg, c);
                        handlerCfg.setSavePassword(true);
                        saveConfig = true;
                    }
                }
            }
        }
        if (saveCredentials != null) {
            // Save all passed credentials in the datasource container
            WebDataSourceUtils.saveAuthProperties(
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration(),
                authProperties,
                saveCredentials,
                sharedCredentials == null ? false : sharedCredentials
            );

            var project = dataSourceContainer.getProject();
            if (project.isUseSecretStorage()) {
                try {
                    dataSourceContainer.persistSecrets(
                        DBSSecretController.getProjectSecretController(dataSourceContainer.getProject())
                    );
                } catch (DBException e) {
                    throw new DBWebException("Failed to save credentials", e);
                }
            }

            // TODO it seems that webConnectionInfo.getSavedAuthProperties() and webConnectionInfo.getSavedNetworkCredentials()
            //  are always null here, so this call apparently is redundant, but let it bee for now because just moving code for another feature
            if (connectionInfo != null) {
                WebDataSourceUtils.saveCredentialsInDataSource(connectionInfo,
                    dataSourceContainer,
                    dataSourceContainer.getConnectionConfiguration());
            }
            saveConfig = true;
        }
        if (WebDataSourceUtils.isGlobalProject(dataSourceContainer.getProject())) {
            // Do not flush config for global project (only admin can do it - CB-2415)
            saveConfig = false;
        }
        if (saveConfig) {
            log.debug("updateConnectionCredentials: dataSourceContainer.persistConfiguration(saveCredentials: " + dataSourceContainer.isSavePassword() + ")");
            dataSourceContainer.persistConfiguration();
        }
    }
}

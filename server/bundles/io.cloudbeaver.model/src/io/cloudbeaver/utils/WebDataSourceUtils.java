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
import com.google.gson.Strictness;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.access.DBAAuthCredentialsWithComplexProperties;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.ssh.SSHConstants;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceDisconnectEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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


    public static void updateCredentialsFromProperties(@NotNull DBAAuthCredentials credentials, @NotNull Map<String, ?> properties) {
        InstanceCreator<DBAAuthCredentials> credTypeAdapter = type -> credentials;
        Gson credGson = new GsonBuilder()
            .setStrictness(Strictness.LENIENT)
            .registerTypeAdapter(credentials.getClass(), credTypeAdapter)
            .create();

        if (credentials instanceof DBAAuthCredentialsWithComplexProperties complexProperties) {
            complexProperties.updateCredentialsFromComplexProperties(properties);
        }
        credGson.fromJson(credGson.toJsonTree(properties), credentials.getClass());
    }
}

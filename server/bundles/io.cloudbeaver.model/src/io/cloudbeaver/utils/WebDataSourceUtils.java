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
package io.cloudbeaver.utils;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.ssh.SSHConstants;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.List;
import java.util.Map;

public class WebDataSourceUtils {
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
                        updateHandlerConfig(handlerCfg, c);
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
        if (cfgInput.getKey() != null) {
            handlerConfig.setSecureProperty(SSHConstants.PROP_KEY_VALUE, cfgInput.getKey());
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
}

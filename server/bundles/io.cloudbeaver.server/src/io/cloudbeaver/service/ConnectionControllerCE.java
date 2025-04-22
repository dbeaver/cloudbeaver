/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service;

import io.cloudbeaver.*;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.exec.DBCConnectException;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceConnectEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.jobs.ConnectionTestJob;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import java.util.List;
import java.util.Map;

public class ConnectionControllerCE implements ConnectionController {

    private static final Log log = Log.getLog(ConnectionController.class);


    @Override
    public DBPDataSourceContainer createDataSourceContainer(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig connectionConfig
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        var rmProject = project.getRMProject();
        if (rmProject.getType() == RMProjectType.USER
            && !webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)
            && !ServletAppUtils.getServletApplication().getAppConfiguration().isSupportsCustomConnections()
        ) {
            throw new DBWebException("New connection create is restricted by server configuration");
        }
        webSession.addInfoMessage("Create new connection");
        DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();

        // we don't need to save credentials for templates
        if (connectionConfig.isTemplate()) {
            connectionConfig.setSaveCredentials(false);
        }
        DBPDataSourceContainer newDataSource = WebServiceUtils.createConnectionFromConfig(connectionConfig,
            sessionRegistry);
        if (CommonUtils.isEmpty(newDataSource.getName())) {
            newDataSource.setName(CommonUtils.notNull(connectionConfig.getName(), "NewConnection"));
        }
        return newDataSource;
    }

    @Override
    @NotNull
    public WebConnectionInfo createConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        DBPDataSourceRegistry sessionRegistry,
        DBPDataSourceContainer newDataSource
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        try {
            sessionRegistry.addDataSource(newDataSource);

            sessionRegistry.checkForErrors();
        } catch (DBException e) {
            sessionRegistry.removeDataSource(newDataSource);
            throw new DBWebException("Failed to create connection", e);
        }

        WebConnectionInfo connectionInfo = project.addConnection(newDataSource);
        webSession.addInfoMessage("New connection was created - " + WebServiceUtils.getConnectionContainerInfo(
            newDataSource));
        WebEventUtils.addDataSourceUpdatedEvent(
            webSession.getProjectById(projectId),
            webSession,
            connectionInfo.getId(),
            WSConstants.EventAction.CREATE,
            WSDataSourceProperty.CONFIGURATION
        );
        log.info(String.format(
            "New connection was created: [info=%s, user=%s]",
            WebServiceUtils.getConnectionContainerInfo(newDataSource),
            webSession.getUserId()
        ));
        return connectionInfo;
    }

    @Override
    public DBPDataSourceContainer getDatasourceConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig config
    ) throws DBWebException {
        // Do not check for custom connection option. Already created connections can be edited.
        // Also template connections can be edited
//        if (!CBApplication.getInstance().getAppConfiguration().isSupportsCustomConnections()) {
//            throw new DBWebException("Connection edit is restricted by server configuration");
//        }

        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, config.getConnectionId());
        DBPDataSourceContainer dataSource = connectionInfo.getDataSourceContainer();
        webSession.addInfoMessage("Update connection - " + WebServiceUtils.getConnectionContainerInfo(dataSource));
        getOldDataSource(dataSource);
        if (!CommonUtils.isEmpty(config.getName())) {
            dataSource.setName(config.getName());
        }

        if (config.getDescription() != null) {
            dataSource.setDescription(config.getDescription());
        }

        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();
        dataSource.setFolder(config.getFolder() != null ? sessionRegistry.getFolder(config.getFolder()) : null);
        if (config.isDefaultAutoCommit() != null) {
            dataSource.setDefaultAutoCommit(config.isDefaultAutoCommit());
        }
        dataSource.setConnectionReadOnly(config.isReadOnly());
        WebServiceUtils.setConnectionConfiguration(dataSource.getDriver(),
            dataSource.getConnectionConfiguration(),
            config);

        // we should check that the config has changed but not check for password changes
        dataSource.setSharedCredentials(config.isSharedCredentials());
        dataSource.setSavePassword(config.isSaveCredentials());
        boolean sharedCredentials = isSharedCredentials(dataSource);
        if (sharedCredentials) {
            //we must notify about the shared password change
            WebServiceUtils.saveAuthProperties(
                dataSource,
                dataSource.getConnectionConfiguration(),
                config.getCredentials(),
                config.isSaveCredentials(),
                config.isSharedCredentials()
            );
        }
        connectionInfo.setCredentialsSavedInSession(null);
        // same here
        return dataSource;
    }

    private static boolean isSharedCredentials(DBPDataSourceContainer dataSource) {
        return dataSource.isSharedCredentials() || !dataSource.getProject()
            .isUseSecretStorage() && dataSource.isSavePassword();
    }

    private static DataSourceDescriptor getOldDataSource(DBPDataSourceContainer dataSource) {
        DataSourceDescriptor oldDataSource;
        oldDataSource = dataSource.getRegistry().createDataSource(dataSource);
        oldDataSource.setId(dataSource.getId());
        return oldDataSource;
    }

    @Override
    public WebConnectionInfo updateConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig config,
        DBPDataSourceContainer dataSource,
        DBPDataSourceRegistry sessionRegistry
    ) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, config.getConnectionId());
        boolean sendEvent = !((DataSourceDescriptor) dataSource).equalSettings(getOldDataSource(dataSource));
        if (!isSharedCredentials(dataSource)) {
            // secret controller is responsible for notification, password changes applied after checks
            WebServiceUtils.saveAuthProperties(
                dataSource,
                dataSource.getConnectionConfiguration(),
                config.getCredentials(),
                config.isSaveCredentials(),
                config.isSharedCredentials()
            );
        }

        WSDataSourceProperty property = getDatasourceEventProperty(getOldDataSource(dataSource), dataSource);

        try {
            sessionRegistry.updateDataSource(dataSource);
            sessionRegistry.checkForErrors();
        } catch (DBException e) {
            throw new DBWebException("Failed to update connection", e);
        }
        if (sendEvent) {
            WebEventUtils.addDataSourceUpdatedEvent(
                webSession.getProjectById(projectId),
                webSession,
                connectionInfo.getId(),
                WSConstants.EventAction.UPDATE,
                property
            );
        }
        log.info(String.format(
            "Connection updated: [info=%s, userId=%s]",
            WebServiceUtils.getConnectionContainerInfo(dataSource),
            webSession.getUser()
        ));
        return connectionInfo;
    }

    @Override
    public boolean deleteConnection(
        @NotNull WebSession webSession, @Nullable String projectId, @NotNull String connectionId
    ) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, connectionId);
        if (connectionInfo.getDataSourceContainer().getProject() != getProjectById(webSession, projectId)) {
            throw new DBWebException("Global connection '" + connectionInfo.getName() + "' configuration cannot be deleted");
        }
        webSession.addInfoMessage("Delete connection - " +
            WebServiceUtils.getConnectionContainerInfo(connectionInfo.getDataSourceContainer()));
        closeAndDeleteConnection(webSession, projectId, connectionId, true);
        WebEventUtils.addDataSourceUpdatedEvent(
            webSession.getProjectById(projectId),
            webSession,
            connectionId,
            WSConstants.EventAction.DELETE,
            WSDataSourceProperty.CONFIGURATION
        );

        log.info(String.format(
            "Connection deleted: [info=%s, userId=%s]",
            WebServiceUtils.getConnectionContainerInfo(connectionInfo.getDataSourceContainer()),
            webSession.getUserId()
        ));
        return true;
    }

    @Override
    public DataSourceDescriptor prepareTestConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig connectionConfig
    ) throws DBWebException {
        String connectionId = connectionConfig.getConnectionId();

        connectionConfig.setSaveCredentials(true); // It is used in createConnectionFromConfig

        DataSourceDescriptor dataSource = (DataSourceDescriptor) WebDataSourceUtils.getLocalOrGlobalDataSource(
            webSession, projectId, connectionId);

        validateConnection(dataSource);

        WebProjectImpl project = getProjectById(webSession, projectId);
        DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();
        DataSourceDescriptor testDataSource;
        if (dataSource != null) {
            try {
                // Check that creds are saved to trigger secrets resolve
                dataSource.isCredentialsSaved();
            } catch (DBException e) {
                throw new DBWebException("Can't determine whether datasource credentials are saved", e);
            }

            testDataSource = (DataSourceDescriptor) dataSource.createCopy(dataSource.getRegistry());
            WebServiceUtils.setConnectionConfiguration(
                testDataSource.getDriver(),
                testDataSource.getConnectionConfiguration(),
                connectionConfig
            );
            if (connectionConfig.getSelectedSecretId() != null) {
                try {
                    dataSource.listSharedCredentials()
                        .stream()
                        .filter(secret -> connectionConfig.getSelectedSecretId().equals(secret.getSubjectId()))
                        .findFirst()
                        .ifPresent(testDataSource::setSelectedSharedCredentials);

                } catch (DBException e) {
                    throw new DBWebException("Failed to load secret value: " + connectionConfig.getSelectedSecretId());
                }
            }
            WebServiceUtils.saveAuthProperties(
                testDataSource,
                testDataSource.getConnectionConfiguration(),
                connectionConfig.getCredentials(),
                true,
                false,
                true
            );
        } else {
            testDataSource = (DataSourceDescriptor) WebServiceUtils.createConnectionFromConfig(connectionConfig,
                sessionRegistry);
        }
        return testDataSource;
    }

    @Override
    @NotNull
    public WebConnectionInfo testConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig connectionConfig,
        DataSourceDescriptor testDataSource
    ) throws DBWebException {
        validateDriverLibrariesPresence(testDataSource);
        webSession.provideAuthParameters(webSession.getProgressMonitor(),
            testDataSource,
            testDataSource.getConnectionConfiguration());
        testDataSource.setSavePassword(true); // We need for test to avoid password callback
        if (DataSourceDescriptor.class.isAssignableFrom(testDataSource.getClass())) {
            testDataSource.setAccessCheckRequired(!webSession.hasPermission(DBWConstants.PERMISSION_ADMIN));
        }
        try {
            ConnectionTestJob ct = new ConnectionTestJob(testDataSource, param -> {
            });
            ct.run(webSession.getProgressMonitor());
            if (ct.getConnectError() != null) {
                if (ct.getConnectError() instanceof DBCConnectException error) {
                    Throwable rootCause = CommonUtils.getRootCause(error);
                    if (rootCause instanceof ClassNotFoundException) {
                        throwDriverNotFoundException(testDataSource);
                    }
                }
                throw new DBWebException("Connection failed", ct.getConnectError());
            }
            WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, testDataSource);
            connectionInfo.setConnectError(ct.getConnectError());
            connectionInfo.setServerVersion(ct.getServerVersion());
            connectionInfo.setClientVersion(ct.getClientVersion());
            connectionInfo.setConnectTime(RuntimeUtils.formatExecutionTime(ct.getConnectTime()));
            return connectionInfo;
        } catch (DBException e) {
            throw new DBWebException("Error connecting to database", e);
        }
    }

    private WebSessionProjectImpl getProjectById(WebSession webSession, String projectId) throws DBWebException {
        WebSessionProjectImpl project = webSession.getProjectById(projectId);
        if (project == null) {
            throw new DBWebException("Project '" + projectId + "' not found");
        }
        return project;
    }

    private WSDataSourceProperty getDatasourceEventProperty(
        DataSourceDescriptor oldDataSource,
        DBPDataSourceContainer dataSource
    ) {
        if (!oldDataSource.equalConfiguration((DataSourceDescriptor) dataSource)) {
            return WSDataSourceProperty.CONFIGURATION;
        }

        var nameChanged = !CommonUtils.equalObjects(oldDataSource.getName(), dataSource.getName());
        var descriptionChanged = !CommonUtils.equalObjects(oldDataSource.getDescription(), dataSource.getDescription());
        if (nameChanged && descriptionChanged) {
            return WSDataSourceProperty.CONFIGURATION;
        }

        return nameChanged ? WSDataSourceProperty.NAME : WSDataSourceProperty.CONFIGURATION;
    }

    @NotNull
    private WebConnectionInfo closeAndDeleteConnection(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String connectionId,
        boolean forceDelete
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        WebConnectionInfo connectionInfo = project.getWebConnectionInfo(connectionId);

        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        boolean disconnected = WebDataSourceUtils.disconnectDataSource(webSession, dataSourceContainer);
        if (forceDelete) {
            DBPDataSourceRegistry registry = project.getDataSourceRegistry();
            registry.removeDataSource(dataSourceContainer);
            try {
                registry.checkForErrors();
            } catch (DBException e) {
                try {
                    registry.addDataSource(dataSourceContainer);
                } catch (DBException ex) {
                    log.error("Error re-adding after delete attempt", e);
                }
                throw new DBWebException("Failed to delete connection", e);
            }
            project.removeConnection(dataSourceContainer);
        } else {
            // Just reset saved credentials
            connectionInfo.clearCache();
        }

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo getConnectionState(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        return WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, connectionId);
    }

    @Override
    public WebConnectionInfo initConnection(@NotNull WebSession webSession, @Nullable String projectId, @NotNull String connectionId, @NotNull Map<String, Object> authProperties, @Nullable List<WebNetworkHandlerConfigInput> networkCredentials, boolean saveCredentials, boolean sharedCredentials, @Nullable String selectedSecretId) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, connectionId);
        connectionInfo.setSavedCredentials(authProperties, networkCredentials);

        var dataSourceContainer = connectionInfo.getDataSourceContainer();;
        validateConnection(dataSourceContainer);
        if (dataSourceContainer.isConnected()) {
            throw new DBWebException("Datasource '" + dataSourceContainer.getName() + "' is already connected");
        }
        if (dataSourceContainer.isSharedCredentials() && selectedSecretId != null) {
            List<DBSSecretValue> allSecrets;
            try {
                allSecrets = dataSourceContainer.listSharedCredentials();
            } catch (DBException e) {
                throw new DBWebException("Error loading connection secret", e);
            }
            DBSSecretValue selectedSecret =
                allSecrets.stream()
                    .filter(secret -> selectedSecretId.equals(secret.getUniqueId()))
                    .findFirst().orElse(null);
            if (selectedSecret == null) {
                throw new DBWebException("Secret not found:" + selectedSecretId);
            }
            dataSourceContainer.setSelectedSharedCredentials(selectedSecret);
        }

        boolean oldSavePassword = dataSourceContainer.isSavePassword();
        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        validateDriverLibrariesPresence(dataSourceContainer);
        try {
            boolean connect = dataSourceContainer.connect(monitor, true, false);
            if (connect) {
                webSession.addSessionEvent(
                    new WSDataSourceConnectEvent(
                        projectId,
                        connectionId,
                        webSession.getSessionId(),
                        webSession.getUserId()
                    )
                );
            }
        } catch (Exception e) {
            if (e instanceof DBCConnectException) {
                Throwable rootCause = CommonUtils.getRootCause(e);
                if (rootCause instanceof ClassNotFoundException) {
                    throwDriverNotFoundException(dataSourceContainer);
                }
            }
            throw new DBWebException("Error connecting to database", e);
        } finally {
            dataSourceContainer.setSavePassword(oldSavePassword);
            connectionInfo.clearCache();
        }
        // Mark all specified network configs as saved
        boolean[] saveConfig = new boolean[1];

        if (networkCredentials != null) {
            networkCredentials.forEach(c -> {
                if (CommonUtils.toBoolean(c.isSavePassword())) {
                    DBWHandlerConfiguration handlerCfg = dataSourceContainer.getConnectionConfiguration()
                        .getHandler(c.getId());
                    if (handlerCfg != null &&
                        // check username param only for ssh config
                        !(CommonUtils.isEmpty(c.getUserName()) && CommonUtils.equalObjects(handlerCfg.getType(),
                            DBWHandlerType.TUNNEL))
                    ) {
                        WebDataSourceUtils.updateHandlerCredentials(handlerCfg, c);
                        handlerCfg.setSavePassword(true);
                        saveConfig[0] = true;
                    }
                }
            });
        }
        if (saveCredentials) {
            // Save all passed credentials in the datasource container
            WebServiceUtils.saveAuthProperties(
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration(),
                authProperties,
                true,
                sharedCredentials
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

            WebDataSourceUtils.saveCredentialsInDataSource(connectionInfo,
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration());
            saveConfig[0] = true;
        }
        if (WebServiceUtils.isGlobalProject(dataSourceContainer.getProject())) {
            // Do not flush config for global project (only admin can do it - CB-2415)
            if (saveCredentials) {
                connectionInfo.setCredentialsSavedInSession(true);
            }
            saveConfig[0] = false;
        }
        if (saveConfig[0]) {
            dataSourceContainer.persistConfiguration();
        }

        return connectionInfo;
    }

    @Override
    public void validateConnection(DBPDataSourceContainer dataSourceContainer) throws DBWebException {
    }

    public WebPropertyInfo[] getExternalInfo(WebSession session) {
        return null;
    }


    private void validateDriverLibrariesPresence(@NotNull DBPDataSourceContainer container) throws DBWebException {
        if (!DBWorkbench.isDistributed() && container.getDriver().getDriverLoader(container).needsExternalDependencies()) {
            throwDriverNotFoundException(container);
        }
    }

    @NotNull
    private static String throwDriverNotFoundException(@NotNull DBPDataSourceContainer container) throws DBWebException {
        throw new DBWebException("Driver files for %s are not found. Please ask the administrator to download it."
            .formatted(container.getDriver().getName()));
    }
}

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
package io.cloudbeaver.service.core.impl;


import io.cloudbeaver.*;
import io.cloudbeaver.model.*;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.core.DBWServiceCore;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebCommonUtils;
import io.cloudbeaver.utils.WebConnectionFolderUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.exec.DBCConnectException;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.dbeaver.model.net.DBWNetworkHandler;
import org.jkiss.dbeaver.model.net.DBWTunnel;
import org.jkiss.dbeaver.model.net.ssh.SSHSession;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.registry.settings.ProductSettingDescriptor;
import org.jkiss.dbeaver.registry.settings.ProductSettingsRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.jobs.ConnectionTestJob;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceCore implements DBWServiceCore {

    private static final Log log = Log.getLog(WebServiceCore.class);

    @Override
    public WebServerConfig getServerConfig(@Nullable WebSession webSession) {
        WebServerConfig webServerConfig = WebAppUtils.getWebApplication().getWebServerConfig();
        webServerConfig.setProvideSensitiveInformation(webServerConfig.isConfigurationMode() ||
            (webSession != null && webSession.getUser() != null));
        return webServerConfig;
    }

    @Override
    public WebPropertyInfo[] getSystemInformationProperties(@NotNull WebSession webSession) {
        return WebCommonUtils.getObjectProperties(
            webSession,
            WebAppUtils.getWebApplication().getSystemInformationCollector()
        );
    }

    @Override
    public List<WebDatabaseDriverInfo> getDriverList(@NotNull WebSession webSession, String driverId) {
        List<WebDatabaseDriverInfo> result = new ArrayList<>();
        for (DBPDriver driver : WebAppUtils.getWebApplication().getDriverRegistry().getApplicableDrivers()) {
            if (driverId == null || driverId.equals(driver.getFullId())) {
                result.add(new WebDatabaseDriverInfo(webSession, driver));
            }
        }
        return result;
    }

    @Override
    public List<WebDatabaseAuthModel> getAuthModels(@NotNull WebSession webSession) {
        return DataSourceProviderRegistry.getInstance().getAllAuthModels().stream()
            .map(am -> new WebDatabaseAuthModel(webSession, am)).collect(Collectors.toList());
    }

    @Override
    public List<WebNetworkHandlerDescriptor> getNetworkHandlers(@NotNull WebSession webSession) {
        return NetworkHandlerRegistry.getInstance().getDescriptors().stream()
            .filter(d -> !d.isDesktopHandler())
            .map(d -> new WebNetworkHandlerDescriptor(webSession, d)).collect(Collectors.toList());
    }

    @Override
    public List<WebConnectionInfo> getUserConnections(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @Nullable String id,
        @Nullable List<String> projectIds
    ) throws DBWebException {
        if (id != null) {
            WebConnectionInfo connectionInfo = getConnectionState(webSession, projectId, id);
            if (connectionInfo != null) {
                return Collections.singletonList(connectionInfo);
            }
        }
        var stream = webSession.getAccessibleProjects().stream();
        if (projectId != null) {
            stream = stream.filter(c -> c.getId().equals(projectId));
        }
        if (projectIds != null) {
            stream = stream.filter(c -> projectIds.contains(c.getId()));
        }
        Set<String> applicableDrivers = WebServiceUtils.getApplicableDriversIds();
        return stream
            .flatMap(p -> p.getConnections().stream())
            .filter(c -> applicableDrivers.contains(c.getDataSourceContainer().getDriver().getId()))
            .toList();
    }

    @Override
    public List<WebConnectionFolderInfo> getConnectionFolders(
        @NotNull WebSession webSession, @Nullable String projectId, @Nullable String id
    ) throws DBWebException {
        if (projectId == null) {
            return webSession.getAccessibleProjects().stream()
                .flatMap(pr -> getConnectionFoldersFromProject(webSession, pr).stream())
                .collect(Collectors.toList());
        }
        if (id != null) {
            WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(webSession, projectId, id);
            return Collections.singletonList(folderInfo);
        }
        DBPProject project = getProjectById(webSession, projectId);
        return getConnectionFoldersFromProject(webSession, project);
    }

    private List<WebConnectionFolderInfo> getConnectionFoldersFromProject(
        @NotNull WebSession webSession,
        @NotNull DBPProject project
    ) {
        return project.getDataSourceRegistry().getAllFolders().stream()
            .map(f -> new WebConnectionFolderInfo(webSession, f)).collect(Collectors.toList());
    }

    @Override
    public String[] getSessionPermissions(@NotNull WebSession webSession) throws DBWebException {
        if (ServletAppUtils.getServletApplication().isConfigurationMode()) {
            return new String[]{
                DBWConstants.PERMISSION_ADMIN
            };
        }
        return webSession.getSessionPermissions().toArray(new String[0]);
    }

    @Override
    public WebSession openSession(
        @NotNull WebSession webSession,
        @Nullable String defaultLocale,
        @NotNull HttpServletRequest servletRequest,
        @NotNull HttpServletResponse servletResponse
    ) throws DBWebException {
        for (WebSessionHandlerDescriptor hd : WebHandlerRegistry.getInstance().getSessionHandlers()) {
            try {
                hd.getInstance().handleSessionOpen(webSession, servletRequest, servletResponse);
            } catch (Exception e) {
                log.error("Error calling session handler '" + hd.getId() + "'", e);
                webSession.addSessionError(e);
            }
        }
        webSession.setLocale(defaultLocale);
        return webSession;
    }

    /**
     * Updates the user's permissions
     *
     * @deprecated CB-2773. The actual way to get session state is {@code WSSessionStateEvent} which sends periodically via web socket.
     */
    @Deprecated
    @Override
    public WebSession getSessionState(@NotNull WebSession webSession) throws DBWebException {
        try {
            webSession.getUserContext().refreshPermissions();
        } catch (DBException e) {
            throw new DBWebException("Cannot refresh user permissions", e);
        }
        return webSession;
    }

    @Override
    public List<WebServerMessage> readSessionLog(
        @NotNull WebSession webSession,
        Integer maxEntries,
        Boolean clearEntries
    ) {
        return webSession.readLog(maxEntries, clearEntries);
    }

    @Override
    public boolean closeSession(HttpServletRequest request) throws DBWebException {
        try {
            var baseWebSession = WebAppUtils.getWebApplication().getSessionManager().closeSession(request);
            if (baseWebSession instanceof WebSession webSession) {
                for (WebSessionHandlerDescriptor hd : WebHandlerRegistry.getInstance().getSessionHandlers()) {
                    try {
                        hd.getInstance().handleSessionClose(webSession);
                    } catch (Exception e) {
                        log.error("Error calling session handler '" + hd.getId() + "'", e);
                        baseWebSession.addSessionError(e);
                    }
                }
                return true;
            }
        } catch (Exception e) {
            throw new DBWebException("Error closing session", e);
        }
        return false;
    }

    @Override
    @Deprecated
    public boolean touchSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException {
        return WebAppUtils.getWebApplication().getSessionManager().touchSession(request, response);
    }

    @Override
    @Deprecated
    public WebSession updateSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response)
        throws DBWebException {
        var sessionManager = WebAppUtils.getWebApplication().getSessionManager();
        sessionManager.touchSession(request, response);
        return sessionManager.getWebSession(request, response, true);
    }

    @Override
    public boolean refreshSessionConnections(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response)
        throws DBWebException {
        WebSession session = WebAppUtils.getWebApplication().getSessionManager().getWebSession(request, response);
        if (session == null) {
            return false;
        } else {
            // We do full user refresh because we need to get config from global project
            session.refreshUserData();
            return true;
        }
    }

    @Override
    public boolean changeSessionLanguage(@NotNull WebSession webSession, String locale) {
        webSession.setLocale(locale);
        return true;
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
    public WebConnectionInfo initConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId,
        @Nullable Map<String, Object> authProperties,
        @Nullable List<WebNetworkHandlerConfigInput> networkCredentials,
        boolean saveCredentials,
        boolean sharedCredentials,
        @Nullable String selectedSecretId
    ) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, connectionId);
        connectionInfo.validateConnection();
        connectionInfo.setSavedCredentials(authProperties, networkCredentials);

        var dataSourceContainer = connectionInfo.getDataSourceContainer();
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
                        !(CommonUtils.isEmpty(c.getUserName()) && CommonUtils.equalObjects(
                            handlerCfg.getType(),
                            DBWHandlerType.TUNNEL
                        ))
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
            WebDataSourceUtils.saveAuthProperties(
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

            WebDataSourceUtils.saveCredentialsInDataSource(
                connectionInfo,
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration()
            );
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
    public WebConnectionInfo createConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        return getProjectById(webSession, projectId).createConnection(connectionConfig);
    }

    @Override
    public WebConnectionInfo updateConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        return getProjectById(webSession, projectId).updateConnection(connectionConfig);
    }

    @Override
    public boolean deleteConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        return getProjectById(webSession, projectId).deleteConnection(connectionId);

    }

    @Override
    public WebConnectionInfo copyConnectionFromNode(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String nodePath,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        try {
            DBNModel navigatorModel = webSession.getNavigatorModelOrThrow();
            WebSessionProjectImpl project = getProjectById(webSession, projectId);
            DBPDataSourceRegistry dataSourceRegistry = project.getDataSourceRegistry();

            DBNNode srcNode = navigatorModel.getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (srcNode == null) {
                throw new DBException("Node '" + nodePath + "' not found");
            }
            if (!(srcNode instanceof DBNDataSource dbnDataSource)) {
                throw new DBException("Node '" + nodePath + "' is not a datasource node");
            }
            DBPDataSourceContainer dataSourceTemplate = dbnDataSource.getDataSourceContainer();

            DataSourceDescriptor newDataSource = dataSourceRegistry.createDataSource(dataSourceTemplate);

            ServletApplication app = ServletAppUtils.getServletApplication();
            if (app instanceof WebApplication webApplication) {
                newDataSource.setNavigatorSettings(webApplication.getAppConfiguration().getDefaultNavigatorSettings());
            }

            WebConnectionConfig config = project.getConnectionConfigInput(connectionConfig);

            // Copy props from config
            if (!CommonUtils.isEmpty(config.getName())) {
                newDataSource.setName(config.getName());
            }
            if (!CommonUtils.isEmpty(config.getDescription())) {
                newDataSource.setDescription(config.getDescription());
            }

            dataSourceRegistry.addDataSource(newDataSource);

            dataSourceRegistry.checkForErrors();
            return project.addConnection(newDataSource);
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    public WebConnectionInfo testConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        WebConnectionConfig configInput = project.getConnectionConfigInput(connectionConfig);

        DataSourceDescriptor dataSource = (DataSourceDescriptor) WebDataSourceUtils.getLocalOrGlobalDataSource(
            webSession, projectId, configInput.getConnectionId());

        DataSourceDescriptor testDataSource;
        if (dataSource != null) {
            try {
                // Check that creds are saved to trigger secrets resolve
                dataSource.isCredentialsSaved();
            } catch (DBException e) {
                throw new DBWebException("Can't determine whether datasource credentials are saved", e);
            }

            testDataSource = (DataSourceDescriptor) dataSource.createCopy(dataSource.getRegistry());
            WebDataSourceUtils.setConnectionConfiguration(
                testDataSource.getDriver(),
                testDataSource.getConnectionConfiguration(),
                configInput
            );
            if (configInput.getSelectedSecretId() != null) {
                try {
                    dataSource.listSharedCredentials()
                        .stream()
                        .filter(secret -> configInput.getSelectedSecretId().equals(secret.getSubjectId()))
                        .findFirst()
                        .ifPresent(testDataSource::setSelectedSharedCredentials);

                } catch (DBException e) {
                    throw new DBWebException("Failed to load secret value: " + configInput.getSelectedSecretId());
                }
            }
            WebDataSourceUtils.saveAuthProperties(
                testDataSource,
                testDataSource.getConnectionConfiguration(),
                configInput.getCredentials(),
                true,
                false,
                true
            );
        } else {
            testDataSource = project.getDataSourceContainerFromInput(connectionConfig);
        }
        validateDriverLibrariesPresence(testDataSource);
        webSession.provideAuthParameters(
            webSession.getProgressMonitor(),
            testDataSource,
            testDataSource.getConnectionConfiguration()
        );
        testDataSource.setSavePassword(true); // We need for test to avoid password callback
        testDataSource.setAccessCheckRequired(!webSession.hasPermission(DBWConstants.PERMISSION_ADMIN));
        try {
            ConnectionTestJob ct = new ConnectionTestJob(
                testDataSource, param -> {
            }
            );
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
            WebConnectionInfo connectionInfo = project.createConnectionInfo(testDataSource);
            connectionInfo.setConnectError(ct.getConnectError());
            connectionInfo.setServerVersion(ct.getServerVersion());
            connectionInfo.setClientVersion(ct.getClientVersion());
            connectionInfo.setConnectTime(RuntimeUtils.formatExecutionTime(ct.getConnectTime()));
            return connectionInfo;
        } catch (DBException e) {
            throw new DBWebException("Error connecting to database", e);
        }
    }

    @Override
    public WebNetworkEndpointInfo testNetworkHandler(
        @NotNull WebSession webSession,
        @NotNull WebNetworkHandlerConfigInput nhConfig
    ) throws DBWebException {
        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        monitor.beginTask("Instantiate SSH tunnel", 2);

        NetworkHandlerDescriptor handlerDescriptor = NetworkHandlerRegistry.getInstance()
            .getDescriptor(nhConfig.getId());
        if (handlerDescriptor == null) {
            throw new DBWebException("Network handler '" + nhConfig.getId() + "' not found");
        }
        try {
            DBWNetworkHandler handler = handlerDescriptor.createHandler(DBWNetworkHandler.class);
            if (handler instanceof DBWTunnel tunnel) {
                DBPConnectionConfiguration connectionConfig = new DBPConnectionConfiguration();
                connectionConfig.setHostName(DBConstants.HOST_LOCALHOST);
                connectionConfig.setHostPort(CommonUtils.toString(nhConfig.getProperties()
                    .get(DBWHandlerConfiguration.PROP_PORT)));
                try {
                    monitor.subTask("Initialize tunnel");

                    DBWHandlerConfiguration configuration = new DBWHandlerConfiguration(handlerDescriptor, null);
                    WebDataSourceUtils.updateHandlerConfig(configuration, nhConfig);
                    configuration.setSavePassword(true);
                    configuration.setEnabled(true);
                    tunnel.initializeHandler(monitor, configuration, connectionConfig);
                    monitor.worked(1);
                    // Get info
                    if (tunnel.getImplementation() instanceof SSHSession session) {
                        return new WebNetworkEndpointInfo(
                            "Connected",
                            session.getClientVersion(),
                            session.getServerVersion());
                    } else {
                        return new WebNetworkEndpointInfo("Connected");
                    }
                } finally {
                    monitor.subTask("Close tunnel");
                    tunnel.closeTunnel(monitor);
                    monitor.worked(1);
                }
            } else {
                return new WebNetworkEndpointInfo(nhConfig.getId() + " is not a tunnel");
            }
        } catch (Exception e) {
            throw new DBWebException("Error testing network handler endpoint", e);
        } finally {
            // Close it
            monitor.done();
        }
    }

    @Override
    public WebConnectionInfo closeConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        WebConnectionInfo connectionInfo = project.getWebConnectionInfo(connectionId);

        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        boolean disconnected = WebDataSourceUtils.disconnectDataSource(webSession, dataSourceContainer);
        return connectionInfo;
    }

    // Projects
    @Override
    public List<WebProjectInfo> getProjects(@NotNull WebSession session) {
        var customConnectionsEnabled =
            ServletAppUtils.getServletApplication().getAppConfiguration().isSupportsCustomConnections()
                || SMUtils.isRMAdmin(session);
        return session.getAccessibleProjects().stream()
            .filter(pr -> customConnectionsEnabled || !RMProjectType.USER.equals(pr.getRMProject().getType()))
            .map(pr -> new WebProjectInfo(session, pr, customConnectionsEnabled))
            .collect(Collectors.toList());
    }

    // Folders
    @Override
    public WebConnectionFolderInfo createConnectionFolder(
        @NotNull WebSession session,
        @Nullable String projectId,
        @Nullable String parentPath,
        @NotNull String folderName
    ) throws DBWebException {
        WebConnectionFolderUtils.validateConnectionFolder(folderName);
        session.addInfoMessage("Create new folder");
        WebConnectionFolderInfo parentFolder = null;
        try {
            if (parentPath != null) {
                parentFolder = WebConnectionFolderUtils.getFolderInfo(session, projectId, parentPath);
            }
            WebProjectImpl project = getProjectById(session, projectId);
            DBPDataSourceRegistry registry = project.getDataSourceRegistry();
            DBPDataSourceFolder newFolder = registry.addFolder(
                parentFolder == null ? null : parentFolder.getDataSourceFolder(), folderName
            );
            WebServiceUtils.refreshDatabases(session, projectId);
            return new WebConnectionFolderInfo(session, newFolder);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public WebConnectionFolderInfo renameConnectionFolder(
        @NotNull WebSession session,
        @Nullable String projectId,
        @NotNull String folderPath,
        @NotNull String newPath
    ) throws DBWebException {
        WebConnectionFolderUtils.validateConnectionFolder(newPath);
        WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, projectId, folderPath);
        folderInfo.getDataSourceFolder().setName(newPath);
        WebServiceUtils.refreshDatabases(session, projectId);
        return folderInfo;
    }

    @Override
    public boolean deleteConnectionFolder(
        @NotNull WebSession session, @Nullable String projectId, @NotNull String folderPath
    ) throws DBWebException {
        try {
            WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, projectId, folderPath);
            DBPDataSourceFolder folder = folderInfo.getDataSourceFolder();
            WebProjectImpl project = getProjectById(session, projectId);
            if (folder.getDataSourceRegistry().getProject() != project) {
                throw new DBWebException("Global folder '" + folderInfo.getId() + "' cannot be deleted");
            }
            session.addInfoMessage("Delete folder");
            DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();
            sessionRegistry.removeFolder(folderInfo.getDataSourceFolder(), false);
            WebServiceUtils.refreshDatabases(session, projectId);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
        return true;
    }

    @Override
    public WebConnectionInfo setConnectionNavigatorSettings(
        WebSession webSession, @Nullable String projectId, String id, DBNBrowseSettings settings
    ) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, id);
        DataSourceDescriptor dataSourceDescriptor = ((DataSourceDescriptor) connectionInfo.getDataSourceContainer());
        dataSourceDescriptor.setNavigatorSettings(settings);
        dataSourceDescriptor.persistConfiguration();
        return connectionInfo;
    }

    @Override
    public WebAsyncTaskInfo getAsyncTaskInfo(WebSession webSession, String taskId, Boolean removeOnFinish)
        throws DBWebException {
        return webSession.asyncTaskStatus(taskId, CommonUtils.toBoolean(removeOnFinish));
    }

    @Override
    public boolean cancelAsyncTask(WebSession webSession, String taskId) throws DBWebException {
        return webSession.asyncTaskCancel(taskId);
    }

    @Override
    public WebGroupPropertiesInfo<ProductSettingDescriptor> getProductSettings(@NotNull WebSession webSession) {
        return new WebGroupPropertiesInfo<>(webSession, ProductSettingsRegistry.getInstance().getSettings());
    }

    @NotNull
    private WebSessionProjectImpl getProjectById(@NotNull WebSession webSession, @Nullable String projectId) throws DBWebException {
        WebSessionProjectImpl project = webSession.getProjectById(projectId);
        if (project == null) {
            throw new DBWebException("Project '" + projectId + "' not found");
        }
        return project;
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

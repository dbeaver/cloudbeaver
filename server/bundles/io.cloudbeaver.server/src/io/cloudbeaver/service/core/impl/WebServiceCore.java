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
import io.cloudbeaver.utils.*;
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
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWNetworkHandler;
import org.jkiss.dbeaver.model.net.DBWTunnel;
import org.jkiss.dbeaver.model.net.ssh.SSHSession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.registry.settings.ProductSettingsRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceCore implements DBWServiceCore {

    private static final Log log = Log.getLog(WebServiceCore.class);

    @Override
    public WebServerConfig getServerConfig() {
        return WebAppUtils.getWebApplication().getWebServerConfig();
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

    @Deprecated
    @Override
    public List<WebDataSourceConfig> getTemplateDataSources() throws DBWebException {

        List<WebDataSourceConfig> result = new ArrayList<>();
        DBPDataSourceRegistry dsRegistry = WebServiceUtils.getGlobalDataSourceRegistry();

        for (DBPDataSourceContainer ds : dsRegistry.getDataSources()) {
            if (ds.isTemplate()) {
                if (WebAppUtils.getWebApplication().getDriverRegistry().getApplicableDrivers().contains(ds.getDriver())) {
                    result.add(new WebDataSourceConfig(ds));
                } else {
                    log.debug("Template datasource '" + ds.getName() + "' ignored - driver is not applicable");
                }
            }
        }

        return result;
    }

    @Override
    public List<WebConnectionInfo> getTemplateConnections(
        @NotNull WebSession webSession, @Nullable String projectId
    ) throws DBWebException {
        if (webSession.getApplication().isDistributed()) {
            return List.of();
        }
        List<WebConnectionInfo> result = new ArrayList<>();
        if (projectId == null) {
            for (WebSessionProjectImpl project : webSession.getAccessibleProjects()) {
                getTemplateConnectionsFromProject(webSession, project, result);
            }
        } else {
            WebSessionProjectImpl project = getProjectById(webSession, projectId);
            getTemplateConnectionsFromProject(webSession, project, result);
        }
        return result;
    }

    private void getTemplateConnectionsFromProject(
        @NotNull WebSession webSession,
        @NotNull WebSessionProjectImpl project,
        List<WebConnectionInfo> result
    ) {
        DBPDataSourceRegistry registry = project.getDataSourceRegistry();
        for (DBPDataSourceContainer ds : registry.getDataSources()) {
            if (ds.isTemplate() && WebAppUtils.getWebApplication().getDriverRegistry().getApplicableDrivers().contains(ds.getDriver())) {
                result.add(new WebConnectionInfo(webSession, ds));
            }
        }
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
        return WebAppUtils.getWebApplication().getConnectionController().getConnectionState(webSession, projectId, connectionId);
    }


    @Override
    public WebConnectionInfo initConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId,
        @NotNull Map<String, Object> authProperties,
        @Nullable List<WebNetworkHandlerConfigInput> networkCredentials,
        boolean saveCredentials,
        boolean sharedCredentials,
        @Nullable String selectedSecretId
    ) throws DBWebException {
        return WebAppUtils.getWebApplication().getConnectionController().initConnection(webSession, projectId,
            connectionId, authProperties, networkCredentials, saveCredentials, sharedCredentials, selectedSecretId);
    }

    @Override
    public WebConnectionInfo createConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig connectionConfig
    ) throws DBWebException {
        DBPDataSourceContainer dataSourceContainer =
            WebAppUtils.getWebApplication().getConnectionController().createDataSourceContainer(webSession, projectId, connectionConfig);
        return WebAppUtils.getWebApplication().getConnectionController().createConnection(
            webSession,
            projectId,
            dataSourceContainer.getRegistry(),
            dataSourceContainer
        );
    }

    @Override
    public WebConnectionInfo updateConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig config
    ) throws DBWebException {
        DBPDataSourceContainer dataSourceContainer =
            WebAppUtils.getWebApplication().getConnectionController().getDatasourceConnection(webSession, projectId, config);
        return WebAppUtils.getWebApplication().getConnectionController().updateConnection(
            webSession,
            projectId,
            config,
            dataSourceContainer,
            dataSourceContainer.getRegistry()
        );
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

    @Override
    public boolean deleteConnection(
        @NotNull WebSession webSession, @Nullable String projectId, @NotNull String connectionId
    ) throws DBWebException {
        return WebAppUtils.getWebApplication().getConnectionController().deleteConnection(webSession, projectId, connectionId);

    }

    @Override
    @Deprecated
    public WebConnectionInfo createConnectionFromTemplate(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String templateId,
        @Nullable String connectionName
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        DBPDataSourceRegistry templateRegistry = project.getDataSourceRegistry();
        DBPDataSourceContainer dataSourceTemplate = templateRegistry.getDataSource(templateId);
        if (dataSourceTemplate == null) {
            throw new DBWebException("Template data source '" + templateId + "' not found");
        }

        DBPDataSourceRegistry projectRegistry = webSession.getSingletonProject().getDataSourceRegistry();
        DBPDataSourceContainer newDataSource = projectRegistry.createDataSource(dataSourceTemplate);

        ServletApplication app = ServletAppUtils.getServletApplication();
        if (app instanceof WebApplication webApplication) {
            ((DataSourceDescriptor) newDataSource).setNavigatorSettings(
                webApplication.getAppConfiguration().getDefaultNavigatorSettings());
        }

        if (!CommonUtils.isEmpty(connectionName)) {
            newDataSource.setName(connectionName);
        }
        try {
            projectRegistry.addDataSource(newDataSource);

            projectRegistry.checkForErrors();
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }

        return project.addConnection(newDataSource);
    }

    @Override
    public WebConnectionInfo copyConnectionFromNode(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String nodePath,
        @NotNull WebConnectionConfig config
    ) throws DBWebException {
        try {
            DBNModel navigatorModel = webSession.getNavigatorModelOrThrow();
            WebSessionProjectImpl project = getProjectById(webSession, projectId);
            DBPDataSourceRegistry dataSourceRegistry = project.getDataSourceRegistry();

            DBNNode srcNode = navigatorModel.getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (srcNode == null) {
                throw new DBException("Node '" + nodePath + "' not found");
            }
            if (!(srcNode instanceof DBNDataSource)) {
                throw new DBException("Node '" + nodePath + "' is not a datasource node");
            }
            DBPDataSourceContainer dataSourceTemplate = ((DBNDataSource) srcNode).getDataSourceContainer();

            DBPDataSourceContainer newDataSource = dataSourceRegistry.createDataSource(dataSourceTemplate);

            ServletApplication app = ServletAppUtils.getServletApplication();
            if (app instanceof WebApplication webApplication) {
                ((DataSourceDescriptor) newDataSource).setNavigatorSettings(
                    webApplication.getAppConfiguration().getDefaultNavigatorSettings());
            }

            // Copy props from config
            if (!CommonUtils.isEmpty(config.getName())) {
                newDataSource.setName(config.getName());
            }
            if (!CommonUtils.isEmpty(config.getDescription())) {
                newDataSource.setDescription(config.getDescription());
            }

            dataSourceRegistry.addDataSource(newDataSource);

            dataSourceRegistry.checkForErrors();
            WebConnectionInfo connectionInfo = project.addConnection(newDataSource);
            WebEventUtils.addDataSourceUpdatedEvent(
                webSession.getProjectById(projectId),
                webSession,
                connectionInfo.getId(),
                WSConstants.EventAction.CREATE,
                WSDataSourceProperty.CONFIGURATION
            );
            return connectionInfo;
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    public WebConnectionInfo testConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig connectionConfig
    ) throws DBWebException {
        DataSourceDescriptor dataSourceDescriptor = WebAppUtils.getWebApplication().getConnectionController()
            .prepareTestConnection(webSession, projectId, connectionConfig);
        return WebAppUtils.getWebApplication().getConnectionController()
            .testConnection(webSession, projectId, connectionConfig, dataSourceDescriptor);
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
        @NotNull WebSession webSession, @Nullable String projectId, @NotNull String connectionId
    ) throws DBWebException {
        return closeAndDeleteConnection(webSession, projectId, connectionId, false);
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

    // Projects
    @Override
    public List<WebProjectInfo> getProjects(@NotNull WebSession session) {
        var customConnectionsEnabled =
            ServletAppUtils.getServletApplication().getAppConfiguration().isSupportsCustomConnections()
                || SMUtils.isRMAdmin(session);
        return session.getAccessibleProjects().stream()
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
        WebConnectionFolderInfo parentNode = null;
        try {
            if (parentPath != null) {
                parentNode = WebConnectionFolderUtils.getFolderInfo(session, projectId, parentPath);
            }
            WebProjectImpl project = getProjectById(session, projectId);
            DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();
            DBPDataSourceFolder newFolder = WebConnectionFolderUtils.createFolder(parentNode,
                folderName,
                sessionRegistry);
            WebConnectionFolderInfo folderInfo = new WebConnectionFolderInfo(session, newFolder);
            WebServiceUtils.updateConfigAndRefreshDatabases(session, projectId);
            WebEventUtils.addNavigatorNodeUpdatedEvent(
                session.getProjectById(projectId),
                session,
                DBNLocalFolder.makeLocalFolderItemPath(newFolder),
                WSConstants.EventAction.CREATE
            );
            return folderInfo;
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public WebConnectionFolderInfo renameConnectionFolder(
        @NotNull WebSession session,
        @Nullable String projectId,
        @NotNull String folderPath,
        @NotNull String newName
    ) throws DBWebException {
        WebConnectionFolderUtils.validateConnectionFolder(newName);
        WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, projectId, folderPath);
        var oldFolderNode = DBNLocalFolder.makeLocalFolderItemPath(folderInfo.getDataSourceFolder());
        folderInfo.getDataSourceFolder().setName(newName);
        var newFolderNode = DBNLocalFolder.makeLocalFolderItemPath(folderInfo.getDataSourceFolder());
        WebServiceUtils.updateConfigAndRefreshDatabases(session, projectId);
        WebEventUtils.addNavigatorNodeUpdatedEvent(
            session.getProjectById(projectId),
            session,
            oldFolderNode,
            WSConstants.EventAction.DELETE
        );
        WebEventUtils.addNavigatorNodeUpdatedEvent(
            session.getProjectById(projectId),
            session,
            newFolderNode,
            WSConstants.EventAction.CREATE
        );
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
            var folderNode = DBNLocalFolder.makeLocalFolderItemPath(folderInfo.getDataSourceFolder());
            session.addInfoMessage("Delete folder");
            DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();
            sessionRegistry.removeFolder(folderInfo.getDataSourceFolder(), false);
            WebServiceUtils.updateConfigAndRefreshDatabases(session, projectId);
            WebEventUtils.addNavigatorNodeUpdatedEvent(
                session.getProjectById(projectId),
                session,
                folderNode,
                WSConstants.EventAction.DELETE
            );
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
        WebEventUtils.addDataSourceUpdatedEvent(
            webSession.getProjectById(projectId),
            webSession,
            id,
            WSConstants.EventAction.UPDATE,
            WSDataSourceProperty.CONFIGURATION);
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
    public WebProductSettings getProductSettings(@NotNull WebSession webSession) {
        return new WebProductSettings(webSession, ProductSettingsRegistry.getInstance().getSettings());
    }

    private WebSessionProjectImpl getProjectById(WebSession webSession, String projectId) throws DBWebException {
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

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
package io.cloudbeaver.service.core.impl;


import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.*;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.core.DBWServiceCore;
import io.cloudbeaver.utils.WebDataSourceUtils;
import io.cloudbeaver.utils.WebConnectionFolderUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWNetworkHandler;
import org.jkiss.dbeaver.model.net.DBWTunnel;
import org.jkiss.dbeaver.model.net.ssh.SSHImplementation;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.jobs.ConnectionTestJob;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceCore implements DBWServiceCore {

    private static final Log log = Log.getLog(WebServiceCore.class);

    @Override
    public WebServerConfig getServerConfig() {
        return new WebServerConfig(CBApplication.getInstance());
    }

    @Override
    public List<WebDatabaseDriverConfig> getDriverList(@NotNull WebSession webSession, String driverId) {
        List<WebDatabaseDriverConfig> result = new ArrayList<>();
        for (DBPDriver driver : CBPlatform.getInstance().getApplicableDrivers()) {
            if (driverId == null || driverId.equals(driver.getFullId())) {
                result.add(new WebDatabaseDriverConfig(webSession, driver));
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
            .map(d -> new WebNetworkHandlerDescriptor(webSession, d)).collect(Collectors.toList());
    }

    @Override
    public List<WebConnectionInfo> getUserConnections(@NotNull WebSession webSession, @Nullable String id) throws DBWebException {
        if (id != null) {
            WebConnectionInfo connectionInfo = getConnectionState(webSession, id);
            if (connectionInfo != null) {
                return Collections.singletonList(connectionInfo);
            }
        }
        return webSession.getConnections();
    }

    @Deprecated
    @Override
    public List<WebDataSourceConfig> getTemplateDataSources() throws DBWebException {

        List<WebDataSourceConfig> result = new ArrayList<>();
        DBPDataSourceRegistry dsRegistry = WebServiceUtils.getGlobalDataSourceRegistry();

        for (DBPDataSourceContainer ds : dsRegistry.getDataSources()) {
            if (ds.isTemplate()) {
                if (CBPlatform.getInstance().getApplicableDrivers().contains(ds.getDriver())) {
                    result.add(new WebDataSourceConfig(ds));
                } else {
                    log.debug("Template datasource '" + ds.getName() + "' ignored - driver is not applicable");
                }
            }
        }

        return result;
    }

    @Override
    public List<WebConnectionInfo> getTemplateConnections(@NotNull WebSession webSession) throws DBWebException {
        List<WebConnectionInfo> result = new ArrayList<>();
        for (DBPDataSourceContainer ds : WebServiceUtils.getGlobalDataSourceRegistry().getDataSources()) {
            if (ds.isTemplate() &&
                CBPlatform.getInstance().getApplicableDrivers().contains(ds.getDriver()))
            {
                result.add(new WebConnectionInfo(webSession, ds));
            }
        }
        webSession.filterAccessibleConnections(result);

        return result;
    }

    @Override
    public List<WebConnectionFolderInfo> getConnectionFolders(@NotNull WebSession webSession, @Nullable String id) throws DBWebException {
        if (id != null) {
            WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(webSession, id);
            return Collections.singletonList(folderInfo);
        }
        return webSession.getSingletonProject().getDataSourceRegistry().getAllFolders().stream()
            .map(f -> new WebConnectionFolderInfo(webSession, f)).collect(Collectors.toList());
    }

    @Override
    public String[] getSessionPermissions(@NotNull WebSession webSession) throws DBWebException {
        if (CBApplication.getInstance().isConfigurationMode()) {
            return new String[] {
                DBWConstants.PERMISSION_PUBLIC,
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
        @NotNull HttpServletResponse servletResponse) throws DBWebException
    {
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

    @Override
    public WebSession getSessionState(@NotNull WebSession webSession) {
        return webSession;
    }

    @Override
    public List<WebServerMessage> readSessionLog(@NotNull WebSession webSession, Integer maxEntries, Boolean clearEntries) {
        return webSession.readLog(maxEntries, clearEntries);
    }

    @Override
    public boolean closeSession(HttpServletRequest request) {
        WebSession webSession = CBPlatform.getInstance().getSessionManager().closeSession(request);
        if (webSession != null) {
            for (WebSessionHandlerDescriptor hd : WebHandlerRegistry.getInstance().getSessionHandlers()) {
                try {
                    hd.getInstance().handleSessionClose(webSession);
                } catch (Exception e) {
                    log.error("Error calling session handler '" + hd.getId() + "'", e);
                    webSession.addSessionError(e);
                }
            }
            return true;
        }

        return false;
    }

    @Override
    public boolean touchSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().touchSession(request, response);
    }

    @Override
    public boolean refreshSessionConnections(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException {
        WebSession session = CBPlatform.getInstance().getSessionManager().getWebSession(request, response);
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
    public WebConnectionInfo getConnectionState(WebSession webSession, String connectionId) throws DBWebException {
        return webSession.getWebConnectionInfo(connectionId);
    }


    @Override
    public WebConnectionInfo initConnection(
        @NotNull WebSession webSession,
        @NotNull String connectionId,
        @NotNull Map<String, Object> authProperties,
        @Nullable List<WebNetworkHandlerConfigInput> networkCredentials,
        @Nullable Boolean saveCredentials) throws DBWebException
    {
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(connectionId);
        connectionInfo.setSavedCredentials(authProperties, networkCredentials);

        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        if (dataSourceContainer.isConnected()) {
            throw new DBWebException("Datasource '" + dataSourceContainer.getName() + "' is already connected");
        }

        boolean oldSavePassword = dataSourceContainer.isSavePassword();
        try {
            dataSourceContainer.connect(webSession.getProgressMonitor(), true, false);
        } catch (Exception e) {
            throw new DBWebException("Error connecting to database", e);
        } finally {
            dataSourceContainer.setSavePassword(oldSavePassword);
            connectionInfo.clearSavedCredentials();
        }
        // Mark all specified network configs as saved
        if (networkCredentials != null) {
            networkCredentials.forEach(c -> {
                if (CommonUtils.toBoolean(c.isSavePassword()) && !CommonUtils.isEmpty(c.getUserName())) {
                    DBWHandlerConfiguration handlerCfg = dataSourceContainer.getConnectionConfiguration().getHandler(c.getId());
                    if (handlerCfg != null) {
                        handlerCfg.setUserName(c.getUserName());
                        handlerCfg.setPassword(c.getPassword());
                        handlerCfg.setSavePassword(true);
                        dataSourceContainer.persistConfiguration();
                    }
                }
            });
        }
        if (saveCredentials != null && saveCredentials) {
            // Save all passed credentials in the datasource container
            WebServiceUtils.saveAuthProperties(
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration(),
                authProperties,
                true);

            WebDataSourceUtils.saveCredentialsInDataSource(connectionInfo, dataSourceContainer, dataSourceContainer.getConnectionConfiguration());
            dataSourceContainer.persistConfiguration();
        }

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo createConnection(
        @NotNull WebSession webSession,
        @NotNull WebConnectionConfig connectionConfig,
        @Nullable String projectId
    ) throws DBWebException {
        if (!CBApplication.getInstance().getAppConfiguration().isSupportsCustomConnections()) {
            throw new DBWebException("New connection create is restricted by server configuration");
        }
        webSession.addInfoMessage("Create new connection");
        DBPDataSourceRegistry sessionRegistry = webSession.getProjectFromId(projectId).getDataSourceRegistry();

        DBPDataSourceContainer newDataSource = WebServiceUtils.createConnectionFromConfig(connectionConfig, sessionRegistry);
        if (CommonUtils.isEmpty(newDataSource.getName())) {
            newDataSource.setName(CommonUtils.notNull(connectionConfig.getName(), "NewConnection"));
        }

        sessionRegistry.addDataSource(newDataSource);

        WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
        webSession.addConnection(connectionInfo);

        webSession.addInfoMessage("New connection was created - " + WebServiceUtils.getConnectionContainerInfo(newDataSource));
        return connectionInfo;
    }

    @Override
    public WebConnectionInfo updateConnection(@NotNull WebSession webSession, @NotNull WebConnectionConfig config, @Nullable String projectId) throws DBWebException {
        // Do not check for custom connection option. Already created connections can be edited.
        // Also template connections can be edited
//        if (!CBApplication.getInstance().getAppConfiguration().isSupportsCustomConnections()) {
//            throw new DBWebException("Connection edit is restricted by server configuration");
//        }
        DBPDataSourceRegistry sessionRegistry = webSession.getProjectFromId(projectId).getDataSourceRegistry();

        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(config.getConnectionId());
        DBPDataSourceContainer dataSource = connectionInfo.getDataSourceContainer();
        webSession.addInfoMessage("Update connection - " + WebServiceUtils.getConnectionContainerInfo(dataSource));

        if (!CommonUtils.isEmpty(config.getName())) {
            dataSource.setName(config.getName());
        }
        if (config.getDescription() != null) {
            dataSource.setDescription(config.getDescription());
        }
        if (config.getFolder() != null) {
            dataSource.setFolder(sessionRegistry.getFolder(config.getFolder()));
        }
        WebServiceUtils.setConnectionConfiguration(dataSource.getDriver(), dataSource.getConnectionConfiguration(), config);
        WebServiceUtils.saveAuthProperties(dataSource, dataSource.getConnectionConfiguration(), config.getCredentials(), config.isSaveCredentials());

        sessionRegistry.updateDataSource(dataSource);

        return connectionInfo;
    }

    @Override
    public boolean deleteConnection(@NotNull WebSession webSession, @NotNull String connectionId, @Nullable String projectId) throws DBWebException {
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(connectionId);
        if (connectionInfo.getDataSourceContainer().getProject() != webSession.getProjectFromId(projectId)) {
            throw new DBWebException("Global connection '" + connectionInfo.getName() + "' configuration cannot be deleted");
        }
        webSession.addInfoMessage("Delete connection - " +
            WebServiceUtils.getConnectionContainerInfo(connectionInfo.getDataSourceContainer()));
        closeAndDeleteConnection(webSession, connectionId, true, projectId);
        return true;
    }

    @Override
    public WebConnectionInfo createConnectionFromTemplate(
        @NotNull WebSession webSession,
        @NotNull String templateId,
        @Nullable String connectionName,
        @Nullable String projectId) throws DBWebException
    {
        DBPDataSourceRegistry templateRegistry = WebServiceUtils.getGlobalDataSourceRegistry();
        DBPDataSourceContainer dataSourceTemplate = templateRegistry.getDataSource(templateId);
        if (dataSourceTemplate == null) {
            throw new DBWebException("Template data source '" + templateId + "' not found");
        }

        DBPDataSourceRegistry projectRegistry = webSession.getProjectFromId(projectId).getDataSourceRegistry();
        DBPDataSourceContainer newDataSource = projectRegistry.createDataSource(dataSourceTemplate);

        ((DataSourceDescriptor) newDataSource).setNavigatorSettings(CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());
        if (!CommonUtils.isEmpty(connectionName)) {
            newDataSource.setName(connectionName);
        }
        projectRegistry.addDataSource(newDataSource);

        WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
        webSession.addConnection(connectionInfo);

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo copyConnectionFromNode(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @NotNull WebConnectionConfig config,
        @Nullable String projectId) throws DBWebException {
        try {
            DBNModel navigatorModel = webSession.getNavigatorModel();
            DBPDataSourceRegistry dataSourceRegistry = webSession.getProjectFromId(projectId).getDataSourceRegistry();

            DBNNode srcNode = navigatorModel.getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (srcNode == null) {
                throw new DBException("Node '" + nodePath + "' not found");
            }
            if (!(srcNode instanceof DBNDataSource)) {
                throw new DBException("Node '" + nodePath + "' is not a datasource node");
            }
            DBPDataSourceContainer dataSourceTemplate = ((DBNDataSource)srcNode).getDataSourceContainer();

            DBPDataSourceContainer newDataSource = dataSourceRegistry.createDataSource(dataSourceTemplate);

            ((DataSourceDescriptor) newDataSource).setNavigatorSettings(CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());

            // Copy props from config
            if (!CommonUtils.isEmpty(config.getName())) {
                newDataSource.setName(config.getName());
            }
            if (!CommonUtils.isEmpty(config.getDescription())) {
                newDataSource.setDescription(config.getDescription());
            }

            dataSourceRegistry.addDataSource(newDataSource);

            WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
            webSession.addConnection(connectionInfo);

            return connectionInfo;
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    public WebConnectionInfo testConnection(@NotNull WebSession webSession, @NotNull WebConnectionConfig connectionConfig) throws DBWebException {
        String connectionId = connectionConfig.getConnectionId();

        connectionConfig.setSaveCredentials(true); // It is used in createConnectionFromConfig

        DBPDataSourceContainer dataSource = WebDataSourceUtils.getLocalOrGlobalDataSource(CBApplication.getInstance(), webSession, connectionId);

        DBPDataSourceRegistry sessionRegistry = webSession.getSingletonProject().getDataSourceRegistry();
        DBPDataSourceContainer testDataSource;
        if (dataSource != null) {
            testDataSource = dataSource.createCopy(dataSource.getRegistry());
            WebServiceUtils.setConnectionConfiguration(testDataSource.getDriver(), testDataSource.getConnectionConfiguration(), connectionConfig);
            WebServiceUtils.saveAuthProperties(testDataSource, testDataSource.getConnectionConfiguration(), connectionConfig.getCredentials(), true);
        } else {
            testDataSource = WebServiceUtils.createConnectionFromConfig(connectionConfig, sessionRegistry);
        }
        webSession.provideAuthParameters(webSession.getProgressMonitor(), testDataSource, testDataSource.getConnectionConfiguration());
        testDataSource.setSavePassword(true); // We need for test to avoid password callback
        if (DataSourceDescriptor.class.isAssignableFrom(testDataSource.getClass())) {
            ((DataSourceDescriptor) testDataSource).setAccessCheckRequired(!webSession.hasPermission(DBWConstants.PERMISSION_ADMIN));
        }
        try {
            ConnectionTestJob ct = new ConnectionTestJob(testDataSource, param -> {
            });
            ct.run(webSession.getProgressMonitor());
            if (ct.getConnectError() != null) {
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

    @Override
    public WebNetworkEndpointInfo testNetworkHandler(@NotNull WebSession webSession, @NotNull WebNetworkHandlerConfigInput nhConfig) throws DBWebException {
        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        monitor.beginTask("Instantiate SSH tunnel", 2);

        NetworkHandlerDescriptor handlerDescriptor = NetworkHandlerRegistry.getInstance().getDescriptor(nhConfig.getId());
        if (handlerDescriptor == null) {
            throw new DBWebException("Network handler '" + nhConfig.getId() + "' not found");
        }
        try {
            DBWNetworkHandler handler = handlerDescriptor.createHandler(DBWNetworkHandler.class);
            if (handler instanceof DBWTunnel) {
                DBWTunnel tunnel = (DBWTunnel)handler;
                DBPConnectionConfiguration connectionConfig = new DBPConnectionConfiguration();
                connectionConfig.setHostName(DBConstants.HOST_LOCALHOST);
                connectionConfig.setHostPort(CommonUtils.toString(nhConfig.getProperties().get(DBWHandlerConfiguration.PROP_PORT)));
                try {
                    monitor.subTask("Initialize tunnel");

                    DBWHandlerConfiguration configuration = new DBWHandlerConfiguration(handlerDescriptor, null);
                    WebServiceUtils.updateHandlerConfig(configuration, nhConfig);
                    configuration.setSavePassword(true);
                    configuration.setEnabled(true);
                    tunnel.initializeHandler(monitor, configuration, connectionConfig);
                    monitor.worked(1);
                    // Get info
                    Object implementation = tunnel.getImplementation();
                    if (implementation instanceof SSHImplementation) {
                        return new WebNetworkEndpointInfo(
                            "Connected",
                            ((SSHImplementation) implementation).getClientVersion(),
                            ((SSHImplementation) implementation).getServerVersion());
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
    public WebConnectionInfo closeConnection(@NotNull WebSession webSession, @NotNull String connectionId, @Nullable String projectId) throws DBWebException {
        return closeAndDeleteConnection(webSession, connectionId, false, projectId);
    }

    @NotNull
    private WebConnectionInfo closeAndDeleteConnection(WebSession webSession, String connectionId, boolean forceDelete, String projectId) throws DBWebException {
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(connectionId);

        boolean disconnected = false;
        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        if (connectionInfo.isConnected()) {
            try {
                dataSourceContainer.disconnect(webSession.getProgressMonitor());
                disconnected = true;
            } catch (DBException e) {
                log.error("Error closing connection", e);
            }
            // Disconnect in async mode?
            //new DisconnectJob(connectionInfo.getDataSource()).schedule();
        }
        if (forceDelete) {
            webSession.getProjectFromId(projectId).getDataSourceRegistry().removeDataSource(dataSourceContainer);
            webSession.removeConnection(connectionInfo);
        } else {
            // Just reset saved credentials
            connectionInfo.clearSavedCredentials();
        }

        return connectionInfo;
    }

    // Folders
    @Override
    public WebConnectionFolderInfo createConnectionFolder(
        @NotNull WebSession session,
        @Nullable String parentPath,
        @NotNull String folderName
    ) throws DBWebException {
        DBRProgressMonitor monitor = session.getProgressMonitor();
        WebConnectionFolderUtils.validateConnectionFolder(folderName);
        session.addInfoMessage("Create new folder");
        WebConnectionFolderInfo parentNode = null;
        try {
            if (parentPath != null) {
                parentNode = WebConnectionFolderUtils.getFolderInfo(session, parentPath);
            }
            DBPDataSourceRegistry sessionRegistry = session.getSingletonProject().getDataSourceRegistry();
            DBPDataSourceFolder newFolder = WebServiceUtils.createFolder(parentNode, folderName, sessionRegistry);
            WebConnectionFolderInfo folderInfo = new WebConnectionFolderInfo(session, newFolder);
            WebServiceUtils.updateConfigAndRefreshDatabases(session);

            return folderInfo;
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public WebConnectionFolderInfo renameConnectionFolder(
        @NotNull WebSession session,
        @NotNull String folderPath,
        @NotNull String newName
    ) throws DBWebException {
        WebConnectionFolderUtils.validateConnectionFolder(newName);
        WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, folderPath);
        folderInfo.getDataSourceFolder().setName(newName);
        WebServiceUtils.updateConfigAndRefreshDatabases(session);
        return folderInfo;
    }

    @Override
    public boolean deleteConnectionFolder(@NotNull WebSession session, @NotNull String folderPath) throws DBWebException {
        try {
            WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, folderPath);
            DBPDataSourceFolder folder = folderInfo.getDataSourceFolder();
            if (folder.getDataSourceRegistry().getProject() != session.getSingletonProject()) {
                throw new DBWebException("Global folder '" + folderInfo.getId() + "' cannot be deleted");
            }
            session.addInfoMessage("Delete folder");
            DBPDataSourceRegistry sessionRegistry = session.getSingletonProject().getDataSourceRegistry();
            sessionRegistry.removeFolder(folderInfo.getDataSourceFolder(), false);
            WebServiceUtils.updateConfigAndRefreshDatabases(session);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
        return true;
    }

    @Override
    public WebConnectionInfo setConnectionNavigatorSettings(WebSession webSession, String id, DBNBrowseSettings settings) throws DBWebException {
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(id);
        DataSourceDescriptor dataSourceDescriptor = ((DataSourceDescriptor)connectionInfo.getDataSourceContainer());
        dataSourceDescriptor.setNavigatorSettings(settings);
        dataSourceDescriptor.persistConfiguration();
        return connectionInfo;
    }

    @Override
    public WebAsyncTaskInfo getAsyncTaskInfo(WebSession webSession, String taskId, Boolean removeOnFinish) throws DBWebException {
        return webSession.asyncTaskStatus(taskId, CommonUtils.toBoolean(removeOnFinish));
    }

    @Override
    public boolean cancelAsyncTask(WebSession webSession, String taskId) throws DBWebException {
        return webSession.asyncTaskCancel(taskId);
    }

}

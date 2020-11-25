/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.core.DBWServiceCore;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.runtime.jobs.ConnectionTestJob;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
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
    public List<WebDatabaseDriverConfig> getDriverList(WebSession webSession, String driverId) {
        List<WebDatabaseDriverConfig> result = new ArrayList<>();
        for (DBPDriver driver : CBPlatform.getInstance().getApplicableDrivers()) {
            if (driverId == null || driverId.equals(WebServiceUtils.makeDriverFullId(driver))) {
                result.add(new WebDatabaseDriverConfig(webSession, driver));
            }
        }
        return result;
    }

    @Override
    public List<WebDatabaseAuthModel> getAuthModels(WebSession webSession) {
        return DataSourceProviderRegistry.getInstance().getAllAuthModels().stream()
            .map(am -> new WebDatabaseAuthModel(webSession, am)).collect(Collectors.toList());
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
    public List<WebConnectionInfo> getTemplateConnections(WebSession webSession) throws DBWebException {
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
    public String[] getSessionPermissions(WebSession webSession) throws DBWebException {
        if (CBApplication.getInstance().isConfigurationMode()) {
            return new String[] {
                DBWConstants.PERMISSION_PUBLIC,
                DBWConstants.PERMISSION_ADMIN
            };
        }
        return webSession.getSessionPermissions().toArray(new String[0]);
    }

    @Override
    public WebSession openSession(WebSession webSession) {
        return webSession;
    }

    @Override
    public WebSession getSessionState(WebSession webSession) {
        return webSession;
    }

    @Override
    public List<WebServerMessage> readSessionLog(WebSession webSession, Integer maxEntries, Boolean clearEntries) {
        return webSession.readLog(maxEntries, clearEntries);
    }

    @Override
    public boolean closeSession(HttpServletRequest request) {
        return CBPlatform.getInstance().getSessionManager().closeSession(request);
    }

    @Override
    public boolean touchSession(HttpServletRequest request) throws DBWebException {
        return CBPlatform.getInstance().getSessionManager().touchSession(request);
    }

    @Override
    public boolean refreshSessionConnections(HttpServletRequest request) throws DBWebException {
        WebSession session = CBPlatform.getInstance().getSessionManager().getWebSession(request);
        if (session == null) {
            return false;
        } else {
            // We do full user refresh because we need to get config from global project
            session.forceUserRefresh(session.getUser());
            return true;
        }
    }

    @Override
    public boolean changeSessionLanguage(WebSession webSession, String locale) {
        webSession.setLocale(locale);
        return true;
    }

    @Override
    public WebConnectionInfo getConnectionState(WebSession webSession, String connectionId) throws DBWebException {
        return webSession.getWebConnectionInfo(connectionId);
    }

    @Deprecated
    @Override
    public WebConnectionInfo openConnection(WebSession webSession, WebConnectionConfig config) throws DBWebException {
        String templateId = config.getTemplateId();
        if (CommonUtils.isEmpty(templateId)) {
            throw new DBWebException("Only preconfigured data sources are supported yet");
        }
        DBPDataSourceRegistry templateRegistry = WebServiceUtils.getGlobalDataSourceRegistry();
        DBPDataSourceContainer dataSourceTemplate = templateRegistry.getDataSource(templateId);
        if (dataSourceTemplate == null) {
            throw new DBWebException("Datasource '" + templateId + "' not found");
        }

        DBPDataSourceRegistry sessionRegistry = webSession.getSingletonProject().getDataSourceRegistry();
        DBPDataSourceContainer newDataSource = sessionRegistry.createDataSource(dataSourceTemplate);
        newDataSource.setSavePassword(true);
        ((DataSourceDescriptor)newDataSource).setTemporary(true);

        DBPConnectionConfiguration cfg = newDataSource.getConnectionConfiguration();
        if (AuthModelDatabaseNative.ID.equals(config.getAuthModelId())) {
            cfg.setUserName(JSONUtils.getString(config.getCredentials(), "userName"));
            cfg.setUserPassword(JSONUtils.getString(config.getCredentials(), "userPassword"));
        } else {
            cfg.setUserName(config.getUserName());
            cfg.setUserPassword(config.getUserPassword());
        }
        if (!CommonUtils.isEmpty(config.getName())) {
            newDataSource.setName(config.getName());
        }
        if (!CommonUtils.isEmpty(config.getDescription())) {
            newDataSource.setDescription(config.getDescription());
        }
        ((DataSourceDescriptor) newDataSource).setNavigatorSettings(CBApplication.getInstance().getDefaultNavigatorSettings());
        try {
            newDataSource.connect(webSession.getProgressMonitor(), true, false);
        } catch (DBException e) {
            throw new DBWebException("Error connecting to database", e);
        }
        sessionRegistry.addDataSource(newDataSource);

        WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
        webSession.addConnection(connectionInfo);

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo initConnection(WebSession webSession, String connectionId, Map<String, Object> authProperties, Boolean saveCredentials) throws DBWebException {
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(connectionId);
        connectionInfo.setSavedAuthProperties(authProperties);

        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        if (dataSourceContainer.isConnected()) {
            throw new DBWebException("Datasource '" + dataSourceContainer.getName() + "' is already connected");
        }
//
//        WebServiceUtils.initAuthProperties(dataSourceContainer, authProperties);

        boolean oldSavePassword = dataSourceContainer.isSavePassword();
        try {
            dataSourceContainer.connect(webSession.getProgressMonitor(), true, false);
        } catch (DBException e) {
            throw new DBWebException("Error connecting to database", e);
        } finally {
            dataSourceContainer.setSavePassword(oldSavePassword);
        }
        if (saveCredentials != null && saveCredentials) {
            // Save credentials in the datasource
            if (!CommonUtils.isEmpty(authProperties)) {
                authProperties.forEach((s, o) ->
                    dataSourceContainer.getConnectionConfiguration().setAuthProperty(s, CommonUtils.toString(o)));
            }
            dataSourceContainer.setSavePassword(true);
            dataSourceContainer.persistConfiguration();
        }

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo createConnection(WebSession webSession, WebConnectionConfig connectionConfig) throws DBWebException {
        DBPDataSourceRegistry sessionRegistry = webSession.getSingletonProject().getDataSourceRegistry();

        DBPDataSourceContainer newDataSource = WebServiceUtils.createConnectionFromConfig(connectionConfig, sessionRegistry);
        if (CommonUtils.isEmpty(newDataSource.getName())) {
            newDataSource.setName(CommonUtils.notNull(connectionConfig.getName(), "NewConnection"));
        }
        sessionRegistry.addDataSource(newDataSource);

        WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
        webSession.addConnection(connectionInfo);

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo createConnectionFromTemplate(WebSession webSession, String templateId) throws DBWebException {
        DBPDataSourceRegistry templateRegistry = WebServiceUtils.getGlobalDataSourceRegistry();
        DBPDataSourceContainer dataSourceTemplate = templateRegistry.getDataSource(templateId);
        if (dataSourceTemplate == null) {
            throw new DBWebException("Template data source '" + templateId + "' not found");
        }

        DBPDataSourceRegistry sessionRegistry = webSession.getSingletonProject().getDataSourceRegistry();
        DBPDataSourceContainer newDataSource = sessionRegistry.createDataSource(dataSourceTemplate);

        ((DataSourceDescriptor) newDataSource).setNavigatorSettings(CBApplication.getInstance().getDefaultNavigatorSettings());
        sessionRegistry.addDataSource(newDataSource);

        WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
        webSession.addConnection(connectionInfo);

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo copyConnectionFromNode(@NotNull WebSession webSession, @NotNull String nodePath) throws DBWebException {
        try {
            DBNModel navigatorModel = webSession.getNavigatorModel();
            DBPDataSourceRegistry dataSourceRegistry = webSession.getSingletonProject().getDataSourceRegistry();

            DBNNode srcNode = navigatorModel.getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (srcNode == null) {
                throw new DBException("Node '" + nodePath + "' not found");
            }
            if (!(srcNode instanceof DBNDataSource)) {
                throw new DBException("Node '" + nodePath + "' is not a datasource node");
            }
            DBPDataSourceContainer dataSourceTemplate = ((DBNDataSource)srcNode).getDataSourceContainer();

            DBPDataSourceContainer newDataSource = dataSourceRegistry.createDataSource(dataSourceTemplate);

            ((DataSourceDescriptor) newDataSource).setNavigatorSettings(CBApplication.getInstance().getDefaultNavigatorSettings());
            dataSourceRegistry.addDataSource(newDataSource);

            return new WebConnectionInfo(webSession, newDataSource);
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    public WebConnectionInfo testConnection(WebSession webSession, WebConnectionConfig connectionConfig) throws DBWebException {
        String connectionId = connectionConfig.getConnectionId();

        connectionConfig.setSaveCredentials(true); // It is used in createConnectionFromConfig

        DBPDataSourceContainer dataSource = WebServiceUtils.getLocalOrGlobalDataSource(webSession, connectionId);

        DBPDataSourceRegistry sessionRegistry = webSession.getSingletonProject().getDataSourceRegistry();
        DBPDataSourceContainer testDataSource;
        if (dataSource != null) {
            testDataSource = dataSource.createCopy(dataSource.getRegistry());
            WebServiceUtils.setConnectionConfiguration(testDataSource.getDriver(), testDataSource.getConnectionConfiguration(), connectionConfig);
            WebServiceUtils.saveAuthProperties(testDataSource, testDataSource.getConnectionConfiguration(), connectionConfig.getCredentials(), true);
        } else {
            testDataSource = WebServiceUtils.createConnectionFromConfig(connectionConfig, sessionRegistry);
        }
        webSession.provideAuthParameters(testDataSource, testDataSource.getConnectionConfiguration());
        testDataSource.setSavePassword(true); // We need for test to avoid password callback
        try {
            ConnectionTestJob ct = new ConnectionTestJob(testDataSource, param -> {});
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
    public WebConnectionInfo closeConnection(WebSession webSession, String connectionId) throws DBWebException {
        return closeAndDeleteConnection(webSession, connectionId, false);
    }

    @Override
    public boolean deleteConnection(WebSession webSession, String connectionId) throws DBWebException {
        closeAndDeleteConnection(webSession, connectionId, true);
        return true;
    }

    @NotNull
    private WebConnectionInfo closeAndDeleteConnection(WebSession webSession, String connectionId, boolean forceDelete) throws DBWebException {
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
            webSession.getSingletonProject().getDataSourceRegistry().removeDataSource(dataSourceContainer);
            webSession.removeConnection(connectionInfo);
        }

        return connectionInfo;
    }

    @Override
    public boolean setConnectionNavigatorSettings(WebSession webSession, String id, DBNBrowseSettings settings) throws DBWebException {
        WebConnectionInfo connectionInfo = webSession.getWebConnectionInfo(id);
        ((DataSourceDescriptor)connectionInfo.getDataSourceContainer()).setNavigatorSettings(settings);
        return true;
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

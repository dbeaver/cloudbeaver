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
package io.cloudbeaver;

import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistryCache;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;
import org.jkiss.utils.CommonUtils;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class WebSessionProjectImpl extends WebProjectImpl {
    private static final Log log = Log.getLog(WebSessionProjectImpl.class);
    protected final WebSession webSession;
    private final Map<String, WebConnectionInfo> connections = new HashMap<>();
    private final Map<String, Object> projectSettings = new ConcurrentHashMap<>();
    private boolean registryIsLoaded = false;

    public WebSessionProjectImpl(
        @NotNull WebSession webSession,
        @NotNull RMProject project
    ) {
        super(
            webSession.getWorkspace(),
            webSession.getRmController(),
            webSession.getSessionContext(),
            project,
            webSession.getUserPreferenceStore(),
            RMUtils.getProjectPath(project)
        );
        this.webSession = webSession;
    }

    public WebSessionProjectImpl(
        @NotNull WebSession webSession,
        @NotNull RMProject project,
        @NotNull Path path
    ) {
        super(
            webSession.getWorkspace(),
            webSession.getRmController(),
            webSession.getSessionContext(),
            project,
            webSession.getUserPreferenceStore(),
            path
        );
        this.webSession = webSession;
    }

    @Nullable
    @Override
    public DBNModel getNavigatorModel() {
        return webSession.getNavigatorModel();
    }

    @NotNull
    @Override
    protected DBPDataSourceRegistry createDataSourceRegistry() {
        return createRegistryWithCredentialsProvider();
    }

    @NotNull
    protected DataSourceRegistry<?> createRegistryWithCredentialsProvider() {
        DataSourceRegistry<?> dataSourceRegistry = createRMRegistry();
        dataSourceRegistry.setAuthCredentialsProvider(webSession);
        dataSourceRegistry.addDataSourceListener(webSession.getDataSourceConnectListener());
        return dataSourceRegistry;
    }

    private synchronized void addDataSourcesToCache() {
        if (registryIsLoaded) {
            return;
        }
        getDataSourceRegistry().getDataSources().forEach(this::addConnection);
        Throwable lastError = getDataSourceRegistry().getLastError();
        if (lastError != null) {
            webSession.addSessionError(lastError);
            log.error("Error refreshing connections from project '" + getId() + "'", lastError);
        }
        registryIsLoaded = true;
    }

    @Override
    public void dispose() {
        super.dispose();
        Map<String, WebConnectionInfo> conCopy;
        synchronized (this.connections) {
            conCopy = new HashMap<>(this.connections);
            this.connections.clear();
        }

        for (WebConnectionInfo connectionInfo : conCopy.values()) {
            if (connectionInfo.isConnected()) {
                new DisconnectJob(connectionInfo.getDataSourceContainer()).schedule();
            }
        }
    }


    /**
     * Returns web connection info from cache (if exists).
     */
    @Nullable
    public WebConnectionInfo findWebConnectionInfo(@NotNull String connectionId) {
        synchronized (connections) {
            return connections.get(connectionId);
        }
    }

    /**
     * Returns web connection info from cache, adds it to cache if not present.
     * Throws exception if connection is not found.
     */
    @NotNull
    public WebConnectionInfo getWebConnectionInfo(@NotNull String connectionId) throws DBWebException {
        WebConnectionInfo connectionInfo = findWebConnectionInfo(connectionId);
        if (connectionInfo != null) {
            return connectionInfo;
        }
        DBPDataSourceContainer dataSource = getDataSourceRegistry().getDataSource(connectionId);
        if (dataSource != null) {
            return addConnection(dataSource);
        }
        throw new DBWebException("Connection '%s' not found".formatted(connectionId));
    }

    /**
     * Adds connection to project cache.
     */
    @NotNull
    public synchronized WebConnectionInfo addConnection(@NotNull DBPDataSourceContainer dataSourceContainer) {
        WebConnectionInfo connection = createConnectionInfo(dataSourceContainer);
        synchronized (connections) {
            connections.put(dataSourceContainer.getId(), connection);
        }
        return connection;
    }

    /**
     * Removes connection from project cache.
     */
    public void removeConnection(@NotNull DBPDataSourceContainer dataSourceContainer) {
        WebConnectionInfo webConnectionInfo = connections.get(dataSourceContainer.getId());
        if (webConnectionInfo != null) {
            webConnectionInfo.clearCache();
            synchronized (connections) {
                connections.remove(dataSourceContainer.getId());
            }
        }
    }

    /**
     * Loads connection from registry if they are not loaded.
     *
     * @return connections from cache.
     */
    public List<WebConnectionInfo> getConnections() {
        if (!registryIsLoaded) {
            addDataSourcesToCache();
            registryIsLoaded = true;
        }
        synchronized (connections) {
            return new ArrayList<>(connections.values());
        }
    }

    /**
     * updates data sources based on event in web session
     *
     * @param event data source updated event
     */
    public synchronized boolean updateProjectDataSources(@NotNull WSDataSourceEvent event) {
        var sendDataSourceUpdatedEvent = false;
        DBPDataSourceRegistry registry = getDataSourceRegistry();
        if (WSDataSourceEvent.CREATED.equals(event.getId()) || WSDataSourceEvent.UPDATED.equals(event.getId())) {
            registry.refreshConfig(event.getDataSourceIds());
        }
        for (String dsId : event.getDataSourceIds()) {
            DataSourceDescriptor ds = (DataSourceDescriptor) registry.getDataSource(dsId);
            if (ds == null) {
                continue;
            }
            switch (event.getId()) {
                case WSDataSourceEvent.CREATED -> {
                    addConnection(ds);
                    sendDataSourceUpdatedEvent = true;
                }
                case WSDataSourceEvent.UPDATED ->  {
                    if (event.getProperty() == WSDataSourceProperty.CONFIGURATION) {
                        WebDataSourceUtils.disconnectDataSource(webSession, ds);
                    }
                    if (event.getProperty() != WSDataSourceProperty.INTERNAL) {
                        sendDataSourceUpdatedEvent = true;
                    }
                }
                case WSDataSourceEvent.DELETED -> {
                    WebDataSourceUtils.disconnectDataSource(webSession, ds);
                    if (registry instanceof DBPDataSourceRegistryCache dsrc) {
                        dsrc.removeDataSourceFromList(ds);
                    }
                    removeConnection(ds);
                    sendDataSourceUpdatedEvent = true;
                }
                default -> {
                }
            }
        }
        return sendDataSourceUpdatedEvent;
    }

    public void refreshProjectSettings() throws DBException {
        Map<String, Object> loadedSettings = webSession.getSecurityController().getObjectSettings(
            getId(),
            SMObjectType.project,
            null
        );
        projectSettings.clear();
        projectSettings.putAll(loadedSettings);
    }

    @NotNull
    public WebConnectionInfo createConnectionInfo(@NotNull DBPDataSourceContainer dataSourceDescriptor) {
        return new WebConnectionInfo(webSession, dataSourceDescriptor);
    }

    @NotNull
    public WebConnectionInfo createConnection(@NotNull Map<String, Object> configMap) throws DBWebException {
        if (CommonUtils.isEmpty(configMap)) {
            throw new DBWebException("Connection configuration parameters are missing");
        }
        DBPDataSourceContainer newDataSource = getDataSourceContainerFromInput(configMap);
        return addDataSourceToProject(newDataSource);
    }

    @NotNull
    public WebConnectionInfo addDataSourceToProject(@NotNull DBPDataSourceContainer newDataSource) throws DBWebException {
        DBPDataSourceRegistry registry = getDataSourceRegistry();
        try {
            registry.addDataSource(newDataSource);
            registry.checkForErrors();
        } catch (DBException e) {
            registry.removeDataSource(newDataSource);
            throw new DBWebException("Failed to create connection", e);
        }

        WebConnectionInfo connectionInfo = addConnection(newDataSource);
        webSession.addInfoMessage("New connection was created - " + WebDataSourceUtils.getConnectionContainerInfo(
            newDataSource));
        log.info(String.format(
            "New connection was created: [info=%s, user=%s]",
            WebDataSourceUtils.getConnectionContainerInfo(newDataSource),
            webSession.getUserId()
        ));
        return connectionInfo;
    }

    @NotNull
    public WebConnectionInfo updateConnection(@Nullable Map<String, Object> configMap) throws DBWebException {
        WebConnectionConfig config = getConnectionConfigInput(configMap);
        WebConnectionInfo connectionInfo = getWebConnectionInfo(config.getConnectionId());
        DataSourceDescriptor dataSource = (DataSourceDescriptor) connectionInfo.getDataSourceContainer();
        webSession.addInfoMessage("Update connection - " + WebDataSourceUtils.getConnectionContainerInfo(dataSource));

        DBPDataSourceRegistry registry = getDataSourceRegistry();
        getInputConfigHandler(configMap).updateDataSource(dataSource);
        connectionInfo.setCredentialsSavedInSession(null);
        try {
            registry.updateDataSource(dataSource);
            registry.checkForErrors();
        } catch (DBException e) {
            throw new DBWebException("Failed to update connection", e);
        }
        return connectionInfo;
    }

    public boolean deleteConnection(@NotNull String connectionId) throws DBWebException {
        WebConnectionInfo connectionInfo = getWebConnectionInfo(connectionId);
        webSession.addInfoMessage("Delete connection - " +
            WebDataSourceUtils.getConnectionContainerInfo(connectionInfo.getDataSourceContainer()));
        closeAndDeleteConnection(connectionInfo);

        log.info(String.format(
            "Connection deleted: [info=%s, userId=%s]",
            WebDataSourceUtils.getConnectionContainerInfo(connectionInfo.getDataSourceContainer()),
            webSession.getUserId()
        ));
        return true;
    }

    @NotNull
    private WebConnectionInfo closeAndDeleteConnection(@NotNull WebConnectionInfo connectionInfo) throws DBWebException {
        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        boolean disconnected = WebDataSourceUtils.disconnectDataSource(webSession, dataSourceContainer);
        DBPDataSourceRegistry registry = getDataSourceRegistry();
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
        removeConnection(dataSourceContainer);
        return connectionInfo;
    }

    @NotNull
    public DataSourceDescriptor getDataSourceContainerFromInput(@NotNull Map<String, Object> configMap) throws DBWebException {
        return getInputConfigHandler(configMap).createDataSourceContainer();
    }

    @NotNull
    public WebConnectionConfig getConnectionConfigInput(@Nullable Map<String, Object> configMap) {
        return new WebConnectionConfig(configMap == null ? Map.of() : configMap);
    }

    @NotNull
    protected WebConnectionConfigInputHandler getInputConfigHandler(@NotNull Map<String, Object> configMap) {
        return new WebConnectionConfigInputHandler<>(getDataSourceRegistry(), getConnectionConfigInput(configMap));
    }


}

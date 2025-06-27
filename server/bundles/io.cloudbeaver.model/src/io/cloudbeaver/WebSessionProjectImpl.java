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

import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistryCache;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;

import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

public class WebSessionProjectImpl extends WebProjectImpl {
    private static final Log log = Log.getLog(WebSessionProjectImpl.class);
    protected final WebSession webSession;
    private final Map<String, WebConnectionInfo> connections = new HashMap<>();
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
        WebConnectionInfo connection = new WebConnectionInfo(webSession, dataSourceContainer);
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
     * @param dataSourceIds list of updated connections
     * @param eventId  id of event
     */
    public synchronized boolean updateProjectDataSources(@NotNull List<String> dataSourceIds, @NotNull String eventId) {
        var sendDataSourceUpdatedEvent = false;
        DBPDataSourceRegistry registry = getDataSourceRegistry();
        // save old connections
        var oldDataSources = dataSourceIds.stream()
            .map(registry::getDataSource)
            .filter(Objects::nonNull)
            .collect(Collectors.toMap(
                DBPDataSourceContainer::getId,
                registry::createDataSource)
            );
        if (WSDataSourceEvent.CREATED.equals(eventId) || WSDataSourceEvent.UPDATED.equals(eventId)) {
            registry.refreshConfig(dataSourceIds);
        }
        for (String dsId : dataSourceIds) {
            DataSourceDescriptor ds = (DataSourceDescriptor) registry.getDataSource(dsId);
            if (ds == null) {
                continue;
            }
            switch (eventId) {
                case WSDataSourceEvent.CREATED -> {
                    addConnection(ds);
                    sendDataSourceUpdatedEvent = true;
                }
                case WSDataSourceEvent.UPDATED ->  {
                    boolean connectionUpdated = !ds.equalSettings(oldDataSources.get(dsId));
                    if (connectionUpdated) {
                        sendDataSourceUpdatedEvent = true;
                        WebDataSourceUtils.disconnectDataSource(webSession, ds);
                    }
                    // if settings were changed we need to send event
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
}

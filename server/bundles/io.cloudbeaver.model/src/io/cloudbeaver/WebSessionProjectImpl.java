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
package io.cloudbeaver;

import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WebSessionProjectImpl extends WebProjectImpl {
    private static final Log log = Log.getLog(WebSessionProjectImpl.class);
    private final WebSession webSession;
    private final Map<String, WebConnectionInfo> connections = new HashMap<>();
    private boolean registryIsLoaded = false;

    public WebSessionProjectImpl(
        @NotNull WebSession webSession,
        @NotNull RMProject project,
        @NotNull DataSourceFilter dataSourceFilter
    ) {
        super(
            webSession.getWorkspace(),
            webSession.getRmController(),
            webSession.getSessionContext(),
            project,
            dataSourceFilter,
            webSession.getUserPreferenceStore()
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
        DBPDataSourceRegistry dataSourceRegistry = super.createDataSourceRegistry();
        dataSourceRegistry.setAuthCredentialsProvider(webSession);
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


    @Nullable
    public WebConnectionInfo findWebConnectionInfo(@NotNull String connectionId) {
        synchronized (connections) {
            return connections.get(connectionId);
        }
    }

    public synchronized WebConnectionInfo addConnection(@NotNull DBPDataSourceContainer dataSourceContainer) {
        WebConnectionInfo connection = new WebConnectionInfo(webSession, dataSourceContainer);
        synchronized (connections) {
            connections.put(dataSourceContainer.getId(), connection);
        }
        return connection;
    }

    public void removeConnection(@NotNull DBPDataSourceContainer dataSourceContainer) {
        WebConnectionInfo webConnectionInfo = connections.get(dataSourceContainer.getId());
        if (webConnectionInfo != null) {
            webConnectionInfo.clearCache();
            synchronized (connections) {
                connections.remove(dataSourceContainer.getId());
            }
        }
    }

    public List<WebConnectionInfo> getConnections() {
        if (!registryIsLoaded) {
            addDataSourcesToCache();
            registryIsLoaded = true;
        }
        synchronized (connections) {
            return new ArrayList<>(connections.values());
        }
    }

    public Map<String, WebConnectionInfo> getConnectionMap() {
        return connections;
    }

}

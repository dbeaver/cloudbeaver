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

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPEvent;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.security.user.SMObjectPermissions;

import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Global project.
 * Connections there can be not accessible.
 */
public class WebSessionGlobalProjectImpl extends WebSessionProjectImpl {
    private static final Log log = Log.getLog(WebSessionGlobalProjectImpl.class);

    private final Set<String> accessibleConnectionIds = new CopyOnWriteArraySet<>();

    public WebSessionGlobalProjectImpl(@NotNull WebSession webSession, @NotNull RMProject project) {
        super(webSession, project);
    }

    /**
     * Creates data source registry that can filter data sources that are not accessible for user.
     */
    @NotNull
    @Override
    protected DBPDataSourceRegistry createDataSourceRegistry() {
        return new WebGlobalProjectRegistryProxy(
            createRegistryWithCredentialsProvider(),
            this::isDataSourceAccessible
        );
    }

    /**
     * Update info about accessible connections from a database.
     */
    public void refreshAccessibleConnectionIds() {
        this.accessibleConnectionIds.clear();
        try {
            for (SMObjectPermissions smObjectPermissions : webSession.getSecurityController()
                .getAllAvailableObjectsPermissions(SMObjectType.datasource)) {
                String objectId = smObjectPermissions.getObjectId();
                this.accessibleConnectionIds.add(objectId);
            }
        } catch (DBException e) {
            webSession.addSessionError(e);
            log.error("Error reading connection grants", e);
        }
    }

    /**
     * Checks if connection is accessible for current user.
     */
    public boolean isDataSourceAccessible(@NotNull DBPDataSourceContainer dataSource) {
        return dataSource.isExternallyProvided() ||
            dataSource.isTemporary() ||
            webSession.hasPermission(DBWConstants.PERMISSION_ADMIN) ||
            accessibleConnectionIds.contains(dataSource.getId());
    }

    /**
     * Adds a connection if it became accessible.
     * The method is processed when connection permissions were updated.
     */
    public synchronized void addAccessibleConnectionToCache(@NotNull String dsId) {
        if (!getRMProject().isGlobal()) {
            return;
        }
        this.accessibleConnectionIds.add(dsId);
        var registry = getDataSourceRegistry();
        var dataSource = registry.getDataSource(dsId);
        if (dataSource != null) {
            addConnection(dataSource);
            // reflect changes is navigator model
            registry.notifyDataSourceListeners(new DBPEvent(DBPEvent.Action.OBJECT_ADD, dataSource, true));
        }
    }

    /**
     * Removes a connection if it became not accessible.
     * The method is processed when connection permissions were updated.
     */
    public synchronized void removeAccessibleConnectionFromCache(@NotNull String dsId) {
        if (!getRMProject().isGlobal()) {
            return;
        }
        var registry = getDataSourceRegistry();
        var dataSource = registry.getDataSource(dsId);
        if (dataSource != null) {
            this.accessibleConnectionIds.remove(dsId);
            removeConnection(dataSource);
            // reflect changes is navigator model
            registry.notifyDataSourceListeners(new DBPEvent(DBPEvent.Action.OBJECT_REMOVE, dataSource));
            dataSource.dispose();
        }
    }
}

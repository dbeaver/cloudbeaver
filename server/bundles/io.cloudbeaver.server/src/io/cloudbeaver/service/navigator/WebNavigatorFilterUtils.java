/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.DBWebException;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPObjectSettingsProvider;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.auth.SMObjectType;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.FilterSerializer;
import org.jkiss.dbeaver.registry.UserDBSObjectFilterUtils;

import java.io.IOException;

/**
 * Personal filter API backed by the existing Team Edition datasource filter mechanism.
 */
public final class WebNavigatorFilterUtils {
    private WebNavigatorFilterUtils() {
    }

    @Nullable
    public static DBSObjectFilter getUserFilter(
        @NotNull DBNDatabaseNode node,
        @Nullable DBXTreeItem itemsMeta,
        boolean firstMatch
    ) {
        DBSObjectFilter filter = node.getNodeFilter(itemsMeta, firstMatch);
        return filter != null && filter.isUserFilter() ? filter : null;
    }

    public static void setUserFilter(
        @NotNull DBNDatabaseNode node,
        @Nullable DBXTreeItem itemsMeta,
        @Nullable DBSObjectFilter filter
    ) throws DBException {
        if (node.getChildrenOrFolderClass(itemsMeta) == null ||
            !(node.getDataSourceContainer() instanceof DataSourceDescriptor dataSource)
        ) {
            throw new DBWebException("Navigator node '" + node.getNodeUri() + "' does not support object filters");
        }
        DBSObjectFilter previousFilter = node.getNodeFilter(itemsMeta, true);
        if (filter == null && (previousFilter == null || !previousFilter.isUserFilter())) {
            // Removing a personal filter must not remove a connection filter or an inherited filter.
            return;
        }
        DBPObjectSettingsProvider settings = DBUtils.getAdapter(DBPObjectSettingsProvider.class, dataSource.getProject());
        if (settings == null) {
            throw new DBWebException("Personal settings are not available for navigator node '" + node.getNodeUri() + "'");
        }
        // Initialize the cache before writing, including anonymous users' session-only settings.
        settings.getObjectSettings(SMObjectType.datasource, dataSource.getId());
        if (filter != null) {
            filter.setUserFilter(true);
        }
        if (!node.setNodeFilter(itemsMeta, filter, false)) {
            throw new DBWebException("Navigator node '" + node.getNodeUri() + "' does not support object filters");
        }
        try {
            String serialized = new FilterSerializer<DataSourceDescriptor>().serializeCustomUserFilters(dataSource);
            if (serialized.isEmpty() || "[]".equals(serialized)) {
                // Removing the last filter also removes the saved setting. The existing settings callback
                // reloads the connection configuration and restores the original connection filters.
                UserDBSObjectFilterUtils.clearUserObjectFilters(dataSource);
            } else {
                UserDBSObjectFilterUtils.updateUserObjectFilters(dataSource);
            }
        } catch (IOException | DBException e) {
            node.setNodeFilter(itemsMeta, previousFilter, false);
            throw new DBWebException("Error saving personal navigator filters", e);
        }
    }
}

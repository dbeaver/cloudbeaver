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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.access.DBAAuthProfile;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistryCache;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.net.DBWNetworkProfile;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.registry.DataSourceConfigurationManager;
import org.jkiss.dbeaver.registry.DataSourcePersistentRegistry;
import org.jkiss.dbeaver.registry.DataSourceRegistry;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Proxy for a global project data source registry.
 * We need to filter some data sources in case of inaccessibility (not enough permissions).
 */
public class WebGlobalProjectRegistryProxy implements DBPDataSourceRegistry, DataSourcePersistentRegistry, DBPDataSourceRegistryCache {
    @NotNull
    private final DataSourceFilter dataSourceFilter;
    @NotNull
    private final DataSourceRegistry<?> dataSourceRegistry;

    public WebGlobalProjectRegistryProxy(@NotNull DataSourceRegistry<?> dataSourceRegistry, @NotNull DataSourceFilter filter) {
        this.dataSourceRegistry = dataSourceRegistry;
        this.dataSourceFilter = filter;
    }

    @NotNull
    @Override
    public DBPProject getProject() {
        return dataSourceRegistry.getProject();
    }

    @Nullable
    @Override
    public DBPDataSourceContainer getDataSource(@NotNull String id) {
        DBPDataSourceContainer dataSource = dataSourceRegistry.getDataSource(id);
        if (dataSource == null || !dataSourceFilter.filter(dataSource)) {
            return null;
        }
        return dataSource;
    }

    @Nullable
    @Override
    public DBPDataSourceContainer getDataSource(@NotNull DBPDataSource dataSource) {
        if (!dataSourceFilter.filter(dataSource.getContainer())) {
            return null;
        }
        return dataSourceRegistry.getDataSource(dataSource);
    }

    @Nullable
    @Override
    public DBPDataSourceContainer findDataSourceByName(String name) {
        var dataSource = dataSourceRegistry.findDataSourceByName(name);
        if (dataSource != null && dataSourceFilter.filter(dataSource)) {
            return dataSource;
        }
        return null;
    }

    @NotNull
    @Override
    public List<? extends DBPDataSourceContainer> getDataSourcesByProfile(@NotNull DBWNetworkProfile profile) {
        return dataSourceRegistry.getDataSourcesByProfile(profile)
            .stream()
            .filter(dataSourceFilter::filter)
            .collect(Collectors.toList());
    }

    @NotNull
    @Override
    public List<DBPDataSourceContainer> getDataSources() {
        return dataSourceRegistry.getDataSources()
            .stream()
            .filter(dataSourceFilter::filter)
            .collect(Collectors.toList());
    }

    @NotNull
    @Override
    public DBPDataSourceContainer createDataSource(@NotNull DBPDriver driver, @NotNull DBPConnectionConfiguration connConfig) {
        return dataSourceRegistry.createDataSource(driver, connConfig);
    }

    @Override
    public DBPDataSourceContainer createDataSource(
        @NotNull String id,
        @NotNull DBPDriver driver,
        @NotNull DBPConnectionConfiguration connConfig
    ) {
        return dataSourceRegistry.createDataSource(id, driver, connConfig);
    }

    @Override
    public DBPDataSourceContainer createDataSource(
        @NotNull DBPDataSourceConfigurationStorage dataSourceStorage,
        @NotNull DBPDataSourceOrigin origin,
        @NotNull String id,
        @NotNull DBPDriver driver,
        @NotNull DBPConnectionConfiguration configuration
    ) {
        return dataSourceRegistry.createDataSource(dataSourceStorage, origin, id, driver, configuration);
    }

    @NotNull
    @Override
    public DBPDataSourceContainer createDataSource(@NotNull DBPDataSourceContainer source) {
        return dataSourceRegistry.createDataSource(source);
    }

    @Override
    public void addDataSourceListener(@NotNull DBPEventListener listener) {
        dataSourceRegistry.addDataSourceListener(new WebDBPEventListenerProxy(listener));
    }

    @Override
    public boolean removeDataSourceListener(@NotNull DBPEventListener listener) {
        return dataSourceRegistry.removeDataSourceListener(listener);
    }

    @Override
    public void addDataSource(@NotNull DBPDataSourceContainer dataSource) throws DBException {
        dataSourceRegistry.addDataSource(dataSource);
    }

    @Override
    public void removeDataSource(@NotNull DBPDataSourceContainer dataSource) {
        dataSourceRegistry.removeDataSource(dataSource);
    }

    @Override
    public void addDataSourceToList(@NotNull DBPDataSourceContainer dataSource) {
        dataSourceRegistry.addDataSourceToList(dataSource);
    }

    @Override
    public void removeDataSourceFromList(@NotNull DBPDataSourceContainer dataSource) {
        dataSourceRegistry.removeDataSourceFromList(dataSource);
    }

    @Override
    public void updateDataSource(@NotNull DBPDataSourceContainer dataSource) throws DBException {
        dataSourceRegistry.updateDataSource(dataSource);
    }

    @NotNull
    @Override
    public List<? extends DBPDataSourceFolder> getAllFolders() {
        return dataSourceRegistry.getAllFolders();
    }

    @NotNull
    @Override
    public List<? extends DBPDataSourceFolder> getRootFolders() {
        return dataSourceRegistry.getRootFolders();
    }

    @NotNull
    @Override
    public DBPDataSourceFolder getFolder(@NotNull String path) {
        return dataSourceRegistry.getFolder(path);
    }

    @NotNull
    @Override
    public DBPDataSourceFolder addFolder(@Nullable DBPDataSourceFolder parent, @NotNull String name) {
        return dataSourceRegistry.addFolder(parent, name);
    }

    @Override
    public void removeFolder(@NotNull DBPDataSourceFolder folder, boolean dropContents) {
        dataSourceRegistry.removeFolder(folder, dropContents);
    }

    @Override
    public void moveFolder(@NotNull String oldPath, @NotNull String newPath) throws DBException {
        dataSourceRegistry.moveFolder(oldPath, newPath);
    }

    @Nullable
    @Override
    public DBSObjectFilter getSavedFilter(String name) {
        return dataSourceRegistry.getSavedFilter(name);
    }

    @NotNull
    @Override
    public List<DBSObjectFilter> getSavedFilters() {
        return dataSourceRegistry.getSavedFilters();
    }

    @Override
    public void updateSavedFilter(@NotNull DBSObjectFilter filter) {
        dataSourceRegistry.updateSavedFilter(filter);
    }

    @Override
    public void removeSavedFilter(@NotNull String filterName) {
        dataSourceRegistry.removeSavedFilter(filterName);
    }

    @Nullable
    @Override
    public DBWNetworkProfile getNetworkProfile(@Nullable String source, @NotNull String name) {
        return dataSourceRegistry.getNetworkProfile(source, name);
    }

    @NotNull
    @Override
    public List<DBWNetworkProfile> getNetworkProfiles() {
        return dataSourceRegistry.getNetworkProfiles();
    }

    @Override
    public void updateNetworkProfile(@NotNull DBWNetworkProfile profile) {
        dataSourceRegistry.updateNetworkProfile(profile);
    }

    @Override
    public void removeNetworkProfile(@NotNull DBWNetworkProfile profile) {
        dataSourceRegistry.removeNetworkProfile(profile);
    }

    @Nullable
    @Override
    public DBAAuthProfile getAuthProfile(@NotNull String id) {
        return dataSourceRegistry.getAuthProfile(id);
    }

    @NotNull
    @Override
    public List<DBAAuthProfile> getAllAuthProfiles() {
        return dataSourceRegistry.getAllAuthProfiles();
    }

    @NotNull
    @Override
    public List<DBAAuthProfile> getApplicableAuthProfiles(@Nullable DBPDriver driver) {
        return dataSourceRegistry.getApplicableAuthProfiles(driver);
    }

    @Override
    public void updateAuthProfile(@NotNull DBAAuthProfile profile) {
        dataSourceRegistry.updateAuthProfile(profile);
    }

    @Override
    public void setAuthProfiles(@NotNull Collection<DBAAuthProfile> profiles) {
        dataSourceRegistry.setAuthProfiles(profiles);
    }

    @Override
    public void removeAuthProfile(@NotNull DBAAuthProfile profile) {
        dataSourceRegistry.removeAuthProfile(profile);
    }

    @Override
    public void flushConfig() {
        dataSourceRegistry.flushConfig();
    }

    @Override
    public void refreshConfig() {
        dataSourceRegistry.refreshConfig();
    }

    @Override
    public void refreshConfig(@Nullable Collection<String> dataSourceIds) {
        dataSourceRegistry.refreshConfig(dataSourceIds);
    }

    @Nullable
    @Override
    public Throwable getLastError() {
        return dataSourceRegistry.getLastError();
    }

    @Override
    public boolean hasError() {
        return dataSourceRegistry.hasError();
    }

    @Override
    public void checkForErrors() throws DBException {
        dataSourceRegistry.checkForErrors();
    }

    @Override
    public void notifyDataSourceListeners(@NotNull DBPEvent event) {
        dataSourceRegistry.notifyDataSourceListeners(event);
    }

    @Nullable
    @Override
    public DBACredentialsProvider getAuthCredentialsProvider() {
        return dataSourceRegistry.getAuthCredentialsProvider();
    }

    @Override
    public void dispose() {
        dataSourceRegistry.dispose();
    }

    @Override
    public void setAuthCredentialsProvider(DBACredentialsProvider authCredentialsProvider) {
        dataSourceRegistry.setAuthCredentialsProvider(authCredentialsProvider);
    }

    @NotNull
    @Override
    public Set<DBPDataSourceFolder> getTemporaryFolders() {
        return dataSourceRegistry.getTemporaryFolders();
    }

    @NotNull
    @Override
    public DBPPreferenceStore getPreferenceStore() {
        return dataSourceRegistry.getPreferenceStore();
    }

    @Override
    public boolean loadDataSources(
        @NotNull List<DBPDataSourceConfigurationStorage> storages,
        @NotNull DataSourceConfigurationManager manager,
        @Nullable Collection<String> dataSourceIds, boolean refresh,
        boolean purgeUntouched
    ) {
        return dataSourceRegistry.loadDataSources(storages, manager, dataSourceIds, refresh, purgeUntouched);
    }

    @Override
    public void saveDataSources() {
        dataSourceRegistry.saveDataSources();
    }

    @Override
    public DataSourceConfigurationManager getConfigurationManager() {
        return dataSourceRegistry.getConfigurationManager();
    }

    @Override
    public void saveConfigurationToManager(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DataSourceConfigurationManager configurationManager,
        @Nullable Predicate<DBPDataSourceContainer> filter
    ) {
        dataSourceRegistry.saveConfigurationToManager(monitor, configurationManager, filter);
    }

    @Override
    public void persistSecrets(DBSSecretController secretController) throws DBException {
        dataSourceRegistry.persistSecrets(secretController);
    }

    @Override
    public void resolveSecrets(DBSSecretController secretController) throws DBException {
        dataSourceRegistry.resolveSecrets(secretController);
    }

    /**
     * Event listener proxy.
     * For some cases (like creating data source) we should not send event because of accessibility of connection.
     */
    private class WebDBPEventListenerProxy implements DBPEventListener {
        @NotNull
        private final DBPEventListener eventListener;

        public WebDBPEventListenerProxy(@NotNull DBPEventListener eventListener) {
            this.eventListener = eventListener;
        }

        @Override
        public void handleDataSourceEvent(@NotNull DBPEvent event) {
            if (event.getAction() == DBPEvent.Action.OBJECT_ADD &&
                event.getObject() instanceof DBPDataSourceContainer container &&
                !dataSourceFilter.filter(container)
            ) {
                // we cannot send event of creating data source connection because it is not accessible for user
                return;
            }
            eventListener.handleDataSourceEvent(event);
        }
    }
}

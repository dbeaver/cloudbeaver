package io.cloudbeaver;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.access.DBAAuthProfile;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.net.DBWNetworkProfile;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.registry.DataSourceConfigurationManager;
import org.jkiss.dbeaver.registry.DataSourcePersistentRegistry;
import org.jkiss.dbeaver.registry.DataSourceRegistry;

import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class WebDataSourceRegistryProxy implements DBPDataSourceRegistry, DataSourcePersistentRegistry {
    private final DataSourceFilter dataSourceFilter;
    private final DataSourceRegistry dataSourceRegistry;

    public WebDataSourceRegistryProxy(DataSourceRegistry dataSourceRegistry, DataSourceFilter filter) {
        this.dataSourceRegistry = dataSourceRegistry;
        this.dataSourceFilter = filter;
    }

    @Override
    public DBPProject getProject() {
        return dataSourceRegistry.getProject();
    }

    @Nullable
    @Override
    public DBPDataSourceContainer getDataSource(String id) {
        DBPDataSourceContainer dataSource = dataSourceRegistry.getDataSource(id);
        if (dataSourceFilter != null && !dataSourceFilter.filter(dataSource)) {
            return null;
        }
        return dataSource;
    }

    @Nullable
    @Override
    public DBPDataSourceContainer getDataSource(DBPDataSource dataSource) {
        if (dataSourceFilter != null && !dataSourceFilter.filter(dataSource.getContainer())) {
            return null;
        }
        return dataSourceRegistry.getDataSource(dataSource);
    }

    @Nullable
    @Override
    public DBPDataSourceContainer findDataSourceByName(String name) {
        var dataSource = dataSourceRegistry.findDataSourceByName(name);
        if (dataSource != null) {
            if (dataSourceFilter == null || dataSourceFilter.filter(dataSource)) {
                return dataSource;
            }
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
    public DBPDataSourceContainer createDataSource(DBPDriver driver, DBPConnectionConfiguration connConfig) {
        return dataSourceRegistry.createDataSource(driver, connConfig);
    }

    @NotNull
    @Override
    public DBPDataSourceContainer createDataSource(DBPDataSourceContainer source) {
        return dataSourceRegistry.createDataSource(source);
    }

    @Override
    public void addDataSourceListener(@NotNull DBPEventListener listener) {
        dataSourceRegistry.addDataSourceListener(listener);
    }

    @Override
    public boolean removeDataSourceListener(@NotNull DBPEventListener listener) {
        return dataSourceRegistry.removeDataSourceListener(listener);
    }

    @Override
    public void addDataSource(@NotNull DBPDataSourceContainer dataSource) {
        dataSourceRegistry.addDataSource(dataSource);
    }

    @Override
    public void removeDataSource(@NotNull DBPDataSourceContainer dataSource) {
        dataSourceRegistry.removeDataSource(dataSource);
    }

    @Override
    public void updateDataSource(@NotNull DBPDataSourceContainer dataSource) {
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

    @Override
    public DBPDataSourceFolder getFolder(String path) {
        return dataSourceRegistry.getFolder(path);
    }

    @Override
    public DBPDataSourceFolder addFolder(DBPDataSourceFolder parent, String name) {
        return dataSourceRegistry.addFolder(parent, name);
    }

    @Override
    public void removeFolder(DBPDataSourceFolder folder, boolean dropContents) {
        dataSourceRegistry.removeFolder(folder, dropContents);
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
    public void updateSavedFilter(DBSObjectFilter filter) {
        dataSourceRegistry.updateSavedFilter(filter);
    }

    @Override
    public void removeSavedFilter(String filterName) {
        dataSourceRegistry.removeSavedFilter(filterName);
    }

    @Nullable
    @Override
    public DBWNetworkProfile getNetworkProfile(String name) {
        return dataSourceRegistry.getNetworkProfile(name);
    }

    @NotNull
    @Override
    public List<DBWNetworkProfile> getNetworkProfiles() {
        return dataSourceRegistry.getNetworkProfiles();
    }

    @Override
    public void updateNetworkProfile(DBWNetworkProfile profile) {
        dataSourceRegistry.updateNetworkProfile(profile);
    }

    @Override
    public void removeNetworkProfile(DBWNetworkProfile profile) {
        dataSourceRegistry.removeNetworkProfile(profile);
    }

    @Nullable
    @Override
    public DBAAuthProfile getAuthProfile(String id) {
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
    public void updateAuthProfile(DBAAuthProfile profile) {
        dataSourceRegistry.updateAuthProfile(profile);
    }

    @Override
    public void removeAuthProfile(DBAAuthProfile profile) {
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
    public void notifyDataSourceListeners(DBPEvent event) {
        dataSourceRegistry.notifyDataSourceListeners(event);
    }

    @Override
    public DBSSecretController getSecretController() {
        return dataSourceRegistry.getSecretController();
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

    @Override
    public Set<DBPDataSourceFolder> getTemporaryFolders() {
        return dataSourceRegistry.getTemporaryFolders();
    }

    @Override
    public void loadDataSources(
        @NotNull List<DBPDataSourceConfigurationStorage> storages,
        @NotNull DataSourceConfigurationManager manager,
        boolean refresh,
        boolean purgeUntouched
    ) {
        dataSourceRegistry.loadDataSources(storages, manager, refresh, purgeUntouched);
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

}

package io.cloudbeaver;

import org.eclipse.equinox.security.storage.ISecurePreferences;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.access.DBAAuthProfile;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.net.DBWNetworkProfile;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceFolder;
import org.jkiss.dbeaver.registry.DataSourceRegistry;

import java.util.List;
import java.util.stream.Collectors;

public class WebDataSourceRegistryProxy extends DataSourceRegistry {
    private final DataSourceRegistry dataSourceRegistry;
    private final DataSourceFilter dataSourceFilter;

    public WebDataSourceRegistryProxy(DataSourceRegistry dataSourceRegistry, DataSourceFilter filter) {
        super(dataSourceRegistry.getProject());
        this.dataSourceRegistry = dataSourceRegistry;
        this.dataSourceFilter = filter;
    }

    @Override
    public DBPProject getProject() {
        return dataSourceRegistry.getProject();
    }

    @Nullable
    @Override
    public DataSourceDescriptor getDataSource(String id) {
        if (!dataSourceFilter.filter(id)) {
            return null;
        }
        return dataSourceRegistry.getDataSource(id);
    }

    @Nullable
    @Override
    public DataSourceDescriptor getDataSource(DBPDataSource dataSource) {
        if (!dataSourceFilter.filter(dataSource.getContainer().getId())) {
            return null;
        }
        return dataSourceRegistry.getDataSource(dataSource);
    }

    @Nullable
    @Override
    public DataSourceDescriptor findDataSourceByName(String name) {
        var dataSource = findDataSourceByName(name);
        if (dataSource != null) {
            if (dataSourceFilter.filter(dataSource.getId())) {
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
            .filter(dataSource -> dataSourceFilter.filter(dataSource.getId()))
            .collect(Collectors.toList());
    }

    @NotNull
    @Override
    public List<DataSourceDescriptor> getDataSources() {
        return dataSourceRegistry.getDataSources()
            .stream()
            .filter(dataSource -> dataSourceFilter.filter(dataSource.getId()))
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
    public List<DataSourceFolder> getAllFolders() {
        return dataSourceRegistry.getAllFolders();
    }

    @NotNull
    @Override
    public List<DataSourceFolder> getRootFolders() {
        return dataSourceRegistry.getRootFolders();
    }

    @Override
    public DBPDataSourceFolder getFolder(String path) {
        return dataSourceRegistry.getFolder(path);
    }

    @Override
    public DataSourceFolder addFolder(DBPDataSourceFolder parent, String name) {
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

    @NotNull
    @Override
    public ISecurePreferences getSecurePreferences() {
        return dataSourceRegistry.getSecurePreferences();
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
}

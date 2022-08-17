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
    private final DataSourceFilter dataSourceFilter;

    public WebDataSourceRegistryProxy(DataSourceRegistry dataSourceRegistry, DataSourceFilter filter) {
        super(dataSourceRegistry.getProject());
        this.dataSourceFilter = filter;
    }

    @Nullable
    @Override
    public DataSourceDescriptor getDataSource(String id) {
        DataSourceDescriptor dataSource = super.getDataSource(id);
        if (dataSourceFilter != null && !dataSourceFilter.filter(dataSource)) {
            return null;
        }
        return dataSource;
    }

    @Nullable
    @Override
    public DataSourceDescriptor getDataSource(DBPDataSource dataSource) {
        if (dataSourceFilter != null && !dataSourceFilter.filter(dataSource.getContainer())) {
            return null;
        }
        return super.getDataSource(dataSource);
    }

    @Nullable
    @Override
    public DataSourceDescriptor findDataSourceByName(String name) {
        var dataSource = super.findDataSourceByName(name);
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
        return super.getDataSourcesByProfile(profile)
            .stream()
            .filter(dataSourceFilter::filter)
            .collect(Collectors.toList());
    }

    @NotNull
    @Override
    public List<DataSourceDescriptor> getDataSources() {
        return super.getDataSources()
            .stream()
            .filter(dataSourceFilter::filter)
            .collect(Collectors.toList());
    }
}

package io.cloudbeaver.model;

import io.cloudbeaver.server.ConfigurationUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceHandler;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

public class WebDatasourceAccessCheckHandler implements DBPDataSourceHandler {
    @Override
    public void beforeConnect(DBRProgressMonitor monitor, @NotNull DBPDataSourceContainer dataSourceContainer) throws DBException {
        if (!ConfigurationUtils.isDriverEnabled(dataSourceContainer.getDriver())) {
            throw new DBException("Driver disabled");
        }
    }

    @Override
    public void beforeDisconnect(DBRProgressMonitor monitor, @NotNull DBPDataSourceContainer dataSourceContainer) throws DBException {

    }
}

package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceHandler;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

public abstract class BaseDatasourceAccessCheckHandler implements DBPDataSourceHandler {
    @Override
    public void beforeConnect(
        DBRProgressMonitor monitor,
        @NotNull DBPDataSourceContainer dataSourceContainer
    ) throws DBException {
        if (isDriverDisabled(dataSourceContainer.getDriver())) {
            throw new DBException("Driver disabled");
        }
    }

    @Override
    public void beforeDisconnect(
        DBRProgressMonitor monitor,
        @NotNull DBPDataSourceContainer dataSourceContainer
    ) throws DBException {

    }

    protected abstract boolean isDriverDisabled(DBPDriver driver);
}

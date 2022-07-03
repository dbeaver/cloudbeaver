package io.cloudbeaver.model.rm.local;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceConfigurationStorage;
import org.jkiss.dbeaver.registry.DataSourceConfigurationManager;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public class DataSourceConfigurationManagerBuffer implements DataSourceConfigurationManager {

    private byte[] data;

    @Override
    public boolean isReadOnly() {
        return false;
    }

    @Override
    public boolean isSecure() {
        return true;
    }

    @Override
    public List<DBPDataSourceConfigurationStorage> getConfigurationStorages() {
        return null;
    }

    @Override
    public InputStream readConfiguration(@NotNull String name) throws DBException, IOException {
        if (data == null) {
            return null;
        }
        return new ByteArrayInputStream(data);
    }

    @Override
    public void writeConfiguration(@NotNull String name, @NotNull byte[] data) throws DBException, IOException {
        this.data = data;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.registry.DataSourceProviderDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.driver.DriverDescriptor;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.io.InputStream;

/**
 * Various constants
 */
public class WebServiceUtils {

    private static final Log log = Log.getLog(WebServiceUtils.class);

    public static String makeIconId(DBPImage icon) {
        return icon.getLocation();
    }

    public static String makeDriverFullId(DBPDriver driver) {
        return driver.getProviderId() + ":" + driver.getId();
    }

    @NotNull
    public static DBPDriver getDriverById(String id) throws DBWebException {
        int divPos = id.indexOf(':');
        if (divPos < 0) {
            throw new DBWebException("Bad driver id [" + id + "]");
        }
        String dsId = id.substring(0, divPos);
        String driverId = id.substring(divPos + 1);
        DataSourceProviderDescriptor dsProvider = DataSourceProviderRegistry.getInstance().getDataSourceProvider(dsId);
        if (dsProvider == null) {
            throw new DBWebException("Data source provider '" + dsId + "' not found");
        }
        DriverDescriptor driver = dsProvider.getDriver(driverId);
        if (driver == null) {
            throw new DBWebException("Driver '" + driverId + "' not found in provider '" + dsId + "'");
        }
        return driver;
    }

    @NotNull
    public static DBPDataSourceRegistry getDataSourceRegistry() throws DBWebException {
        DBPDataSourceRegistry registry = DBWorkbench.getPlatform().getWorkspace().getDefaultDataSourceRegistry();
        if (registry == null) {
            throw new DBWebException("No activate data source registry");
        }
        return registry;
    }

    public static InputStream openStaticResource(String path) {
        return WebServiceUtils.class.getClassLoader().getResourceAsStream(path);
    }
}

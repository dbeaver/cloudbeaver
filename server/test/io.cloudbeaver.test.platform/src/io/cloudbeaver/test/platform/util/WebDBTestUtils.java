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
package io.cloudbeaver.test.platform.util;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;

public class WebDBTestUtils {

    private static final String DRIVER_ID = DBTestConstants.H2_EMBEDDED_DRIVER_ID;

    @NotNull
    public static DBPDataSourceContainer createH2DataSource(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPProject project
    ) throws DBException {
        return createH2DataSource(monitor, project, DBTestConstants.H2_MEM_DB_URL);
    }

    @NotNull
    public static DBPDataSourceContainer createH2DataSource(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPProject project,
        @NotNull String url
    ) throws DBException {
        final DBPDriver driver = DataSourceProviderRegistry.getInstance().findDriver(DRIVER_ID);
        if (driver == null) {
            throw new DBException("Could not find H2 driver: " + DRIVER_ID);
        }

        DBPConnectionConfiguration configuration = new DBPConnectionConfiguration();
        configuration.setUrl(url);

        DataSourceDescriptor dataSourceDescriptor = project.getDataSourceRegistry().createDataSource(
            DataSourceDescriptor.generateNewId(driver),
            driver,
            configuration
        );
        dataSourceDescriptor.setName("H2 DB" + System.currentTimeMillis());
        dataSourceDescriptor.setSavePassword(true);
        dataSourceDescriptor.setTemporary(true);
        dataSourceDescriptor.connect(monitor, true, true);

        return dataSourceDescriptor;
    }
}

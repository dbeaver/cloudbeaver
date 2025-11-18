/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

public class WebConnectionConfigInputHandler<T extends WebConnectionConfig, C extends DataSourceDescriptor> {
    private static final Log log = Log.getLog(WebConnectionConfigInputHandler.class);
    protected final T input;
    protected final DBPDataSourceRegistry registry;
    protected final WebSession webSession;

    public WebConnectionConfigInputHandler(@NotNull DBPDataSourceRegistry registry, T configInput, WebSession webSession) {
        this.registry = registry;
        this.input = configInput;
        this.webSession = webSession;
    }

    public C createDataSourceContainer() throws DBWebException {
        String driverId = input.getDriverId();
        if (CommonUtils.isEmpty(driverId)) {
            throw new DBWebException("Driver must be specified");
        }
        DBPDriver driver = WebDataSourceUtils.getDriverById(driverId);

        C newDataSource = createDataSourceContainerFromInput(driver);

        presetNavigatorSettings(newDataSource);

        WebDataSourceUtils.saveAuthProperties(
            newDataSource,
            newDataSource.getConnectionConfiguration(),
            input.getCredentials(),
            input.isSaveCredentials(),
            input.isSharedCredentials()
        );
        return newDataSource;
    }

    private <C extends DataSourceDescriptor> void presetNavigatorSettings(C newDataSource) {
//        if (ServletAppUtils.getServletApplication().getAppConfiguration() instanceof WebAppConfiguration webAppConfiguration) {
//            newDataSource.setNavigatorSettings(webAppConfiguration.getDefaultNavigatorSettings());
//        }
        try {
            DBPProject project = newDataSource.getProject();
            String projectId = project.getId();
            Map<String, Object> projectNavigatorSettings = webSession.getUserContext().getSecurityController().getObjectSettings(
                projectId, SMObjectType.project,
                ServletAppUtils.getServletApplication().getAppConfiguration().getDefaultUserTeam(),
                DataSourceNavigatorSettings.getSettingsKeySet()
            );
            if (!CommonUtils.isEmpty(projectNavigatorSettings)) {
                DataSourceNavigatorSettings navigatorSettings = new DataSourceNavigatorSettings();
                navigatorSettings.loadSettings(projectNavigatorSettings);
                newDataSource.setNavigatorSettings(navigatorSettings);
            }
        } catch (Exception e) {
            log.warn("Error loading navigator settings", e);
        }

    }

    public void updateDataSource(@NotNull C dataSource) throws DBWebException {
        dataSource.setId(dataSource.getId());
        if (!CommonUtils.isEmpty(input.getName())) {
            dataSource.setName(input.getName());
        }

        if (input.getDescription() != null) {
            dataSource.setDescription(input.getDescription());
        }

        dataSource.setFolder(input.getFolder() != null ? registry.getFolder(input.getFolder()) : null);
        if (input.isDefaultAutoCommit() != null) {
            dataSource.setDefaultAutoCommit(input.isDefaultAutoCommit());
        }
        WebDataSourceUtils.setConnectionConfiguration(
            dataSource.getDriver(),
            dataSource.getConnectionConfiguration(),
            input
        );
        WebDataSourceUtils.saveAuthProperties(
            dataSource,
            dataSource.getConnectionConfiguration(),
            input.getCredentials(),
            input.isSaveCredentials(),
            input.isSharedCredentials()
        );
        dataSource.setConnectionReadOnly(input.isReadOnly());
    }

    @NotNull
    protected C createDataSourceContainerFromInput(@NotNull DBPDriver driver) {
        DBPConnectionConfiguration dsConfig = new DBPConnectionConfiguration();
        WebDataSourceUtils.setConnectionConfiguration(driver, dsConfig, input);
        C newDataSource = registry.createDataSource(driver, dsConfig);

        newDataSource.setSavePassword(true);
        newDataSource.setName(CommonUtils.notNull(input.getName(), "NewConnection"));
        newDataSource.setDescription(input.getDescription());
        newDataSource.setConnectionReadOnly(input.isReadOnly());
        if (input.getFolder() != null) {
            newDataSource.setFolder(registry.getFolder(input.getFolder()));
        }
        return newDataSource;
    }


}

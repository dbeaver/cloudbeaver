/*
 * CloudBeaver - Universal Database Manager
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
package io.cloudbeaver.model.session;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMObjectType;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.registry.project.BaseProjectSettings;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

class BaseProjectSettingsTest {
    private static final String DATA_SOURCE_ID = "ds1";

    private DBPDataSourceRegistry registry;
    private BaseProjectSettings projectSettings;

    @BeforeEach
    void setUp() {
        DBPProject project = Mockito.mock(DBPProject.class);
        registry = Mockito.mock(DBPDataSourceRegistry.class);
        DBPDataSourceContainer dataSource = Mockito.mock(DBPDataSourceContainer.class);
        Mockito.when(project.getDataSourceRegistry()).thenReturn(registry);
        Mockito.when(registry.getDataSource(DATA_SOURCE_ID)).thenReturn(dataSource);
        Mockito.when(dataSource.getRegistry()).thenReturn(registry);
        Mockito.when(dataSource.getId()).thenReturn(DATA_SOURCE_ID);
        projectSettings = new BaseProjectSettings(project) {
            @NotNull
            @Override
            protected Map<SMObjectType, Map<String, Map<String, String>>> loadAllProjectSettings() {
                return new LinkedHashMap<>();
            }

            @Override
            protected void saveProjectSettings(
                @NotNull SMObjectType objectType,
                @NotNull String objectId,
                @NotNull Map<String, String> settings
            ) {
            }
        };
    }

    @Test
    void invalidatesNavigatorSettingsWhenCacheIsNotInitialized() {
        deleteNavigatorSettings();

        Mockito.verify(registry).refreshConfig(List.of(DATA_SOURCE_ID));
    }

    @Test
    void invalidatesNavigatorSettingsWhenCacheDoesNotContainObject() {
        projectSettings.getObjectSettings(SMObjectType.datasource, DATA_SOURCE_ID);

        deleteNavigatorSettings();

        Mockito.verify(registry).refreshConfig(List.of(DATA_SOURCE_ID));
    }

    private void deleteNavigatorSettings() {
        projectSettings.deleteObjectSettingsCache(
            SMObjectType.datasource,
            DATA_SOURCE_ID,
            DataSourceNavigatorSettings.NAVIGATOR_SETTINGS
        );
    }
}

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
package io.cloudbeaver.model.rm.local;

import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class LocalResourceControllerTest {
    @Test
    public void testFolderChangeIsNavigationChange() {
        DataSourceDescriptor oldDataSource = Mockito.mock(DataSourceDescriptor.class);
        DataSourceDescriptor newDataSource = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(oldDataSource.equalConfiguration(newDataSource)).thenReturn(true);
        Mockito.when(oldDataSource.isLooselyEqualTo(newDataSource)).thenReturn(true);
        Mockito.when(oldDataSource.equalNavigation(newDataSource)).thenReturn(false);

        Assertions.assertEquals(
            WSDataSourceProperty.NAVIGATION,
            LocalResourceController.getChangedDataSourceProperty(oldDataSource, newDataSource)
        );
    }

    @Test
    public void testConfigurationChangeTakesPrecedenceOverNavigationChange() {
        DataSourceDescriptor oldDataSource = Mockito.mock(DataSourceDescriptor.class);
        DataSourceDescriptor newDataSource = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(oldDataSource.equalConfiguration(newDataSource)).thenReturn(false);
        Mockito.when(oldDataSource.equalNavigation(newDataSource)).thenReturn(false);

        Assertions.assertEquals(
            WSDataSourceProperty.CONFIGURATION,
            LocalResourceController.getChangedDataSourceProperty(oldDataSource, newDataSource)
        );
    }
}

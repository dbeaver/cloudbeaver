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
package io.cloudbeaver;

import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class WebConnectionConfigInputHandlerTest {
    @Test
    public void testFailedNewDescriptorSetupDisposesDescriptor() {
        WebSession webSession = Mockito.mock(WebSession.class);
        DBPDataSourceRegistry registry = Mockito.mock(DBPDataSourceRegistry.class);
        WebConnectionConfig input = Mockito.mock(WebConnectionConfig.class);
        DBPDriver driver = Mockito.mock(DBPDriver.class);
        DataSourceDescriptor dataSource = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(registry.createDataSource(Mockito.eq(driver), Mockito.any())).thenReturn(dataSource);
        Mockito.doThrow(new IllegalStateException("setup failed")).when(dataSource).setName(Mockito.anyString());
        TestConnectionConfigInputHandler handler = new TestConnectionConfigInputHandler(webSession, registry, input);

        Assertions.assertThrows(IllegalStateException.class, () -> handler.createDataSource(driver));

        Mockito.verify(dataSource).dispose();
    }

    private static final class TestConnectionConfigInputHandler
        extends WebConnectionConfigInputHandler<WebConnectionConfig, DataSourceDescriptor> {
        private TestConnectionConfigInputHandler(
            @NotNull WebSession webSession,
            @NotNull DBPDataSourceRegistry registry,
            @NotNull WebConnectionConfig input
        ) {
            super(webSession, registry, input);
        }

        @NotNull
        private DataSourceDescriptor createDataSource(@NotNull DBPDriver driver) {
            return createDataSourceContainerFromInput(driver);
        }
    }
}

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
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerDescriptor;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;

public class WebConnectionConfigInputHandlerTest {
    @Test
    public void clearsServerSideSecretReferences() {
        WebConnectionConfig config = new WebConnectionConfig(Map.of(
            "sharedCredentials", true,
            "selectedSecretId", "secret-id"
        ));
        WebConnectionConfigInputHandler<WebConnectionConfig, DataSourceDescriptor> handler =
            new WebConnectionConfigInputHandler<>(
                Mockito.mock(WebSession.class),
                Mockito.mock(DBPDataSourceRegistry.class),
                config
            );

        handler.clearSecretReferences();

        Assertions.assertFalse(config.isSharedCredentials());
        Assertions.assertNull(config.getSelectedSecretId());
    }

    @Test
    public void resetsSavedDataSourceCredentials() {
        WebConnectionConfig config = new WebConnectionConfig(Map.of());
        WebConnectionConfigInputHandler<WebConnectionConfig, DataSourceDescriptor> handler =
            new WebConnectionConfigInputHandler<>(
                Mockito.mock(WebSession.class),
                Mockito.mock(DBPDataSourceRegistry.class),
                config
            );
        DBPConnectionConfiguration connectionConfiguration = new DBPConnectionConfiguration();
        DBWHandlerDescriptor handlerDescriptor = Mockito.mock(DBWHandlerDescriptor.class);
        Mockito.when(handlerDescriptor.getId()).thenReturn("ssh_tunnel");
        DBWHandlerConfiguration networkHandler = new DBWHandlerConfiguration(handlerDescriptor, null);
        networkHandler.setSavePassword(true);
        networkHandler.setPassword("password");
        networkHandler.setSecureProperty("key", "value");
        connectionConfiguration.updateHandler(networkHandler);
        DataSourceDescriptor dataSource = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(dataSource.getConnectionConfiguration()).thenReturn(connectionConfiguration);

        handler.resetDataSourceCredentials(dataSource);

        Mockito.verify(dataSource).setSavePassword(false);
        Mockito.verify(dataSource).setSharedCredentials(false);
        Mockito.verify(dataSource).resetAllSecrets();
        Mockito.verify(dataSource).resetPassword();
        Assertions.assertFalse(networkHandler.isSavePassword());
        Assertions.assertNull(networkHandler.getPassword());
        Assertions.assertTrue(networkHandler.getSecureProperties().isEmpty());
    }
}

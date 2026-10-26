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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.access.DBAAuthModel;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerDescriptor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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

    @Test
    public void resetsOnlySecureAuthModelCredentials() {
        WebSession webSession = Mockito.mock(WebSession.class);
        Mockito.when(webSession.getProgressMonitor()).thenReturn(Mockito.mock(DBRProgressMonitor.class));
        final WebConnectionConfigInputHandler<WebConnectionConfig, DataSourceDescriptor> handler =
            new WebConnectionConfigInputHandler<>(
                webSession,
                Mockito.mock(DBPDataSourceRegistry.class),
                new WebConnectionConfig(Map.of())
            );
        DBAAuthModel<DBAAuthCredentials> authModel = Mockito.mock(DBAAuthModel.class);
        DBPConnectionConfiguration connectionConfiguration = new TestConnectionConfiguration(authModel);
        connectionConfiguration.setAuthProperty("stored-client-id", "client-id");
        connectionConfiguration.setAuthProperty("stored-client-secret", "client-secret");
        DataSourceDescriptor dataSource = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(dataSource.getConnectionConfiguration()).thenReturn(connectionConfiguration);
        Mockito.when(authModel.loadCredentials(dataSource, connectionConfiguration)).thenAnswer(invocation ->
            new TestCredentials(
                connectionConfiguration.getAuthProperty("stored-client-id"),
                connectionConfiguration.getAuthProperty("stored-client-secret")
            )
        );
        Mockito.doAnswer(invocation -> {
            DBPConnectionConfiguration configuration = invocation.getArgument(1);
            TestCredentials credentials = invocation.getArgument(2);
            configuration.setAuthProperty("stored-client-id", credentials.getClientId());
            configuration.setAuthProperty("stored-client-secret", credentials.getClientSecret());
            return null;
        }).when(authModel).saveCredentials(
            Mockito.eq(dataSource),
            Mockito.any(DBPConnectionConfiguration.class),
            Mockito.any(DBAAuthCredentials.class)
        );

        handler.resetDataSourceCredentials(dataSource);

        Assertions.assertEquals("client-id", connectionConfiguration.getAuthProperty("stored-client-id"));
        Assertions.assertNull(connectionConfiguration.getAuthProperty("stored-client-secret"));
        Mockito.verify(authModel).saveCredentials(
            Mockito.eq(dataSource),
            Mockito.argThat(configuration -> configuration != connectionConfiguration),
            Mockito.any(DBAAuthCredentials.class)
        );
    }

    @Test
    public void restoresSavedDataSourceCredentials() {
        WebConnectionConfigInputHandler<WebConnectionConfig, DataSourceDescriptor> handler =
            new WebConnectionConfigInputHandler<>(
                Mockito.mock(WebSession.class),
                Mockito.mock(DBPDataSourceRegistry.class),
                new WebConnectionConfig(Map.of())
            );
        DBPConnectionConfiguration connectionConfiguration = new DBPConnectionConfiguration();
        connectionConfiguration.setUserPassword("password");
        DBSSecretValue selectedSecret = Mockito.mock(DBSSecretValue.class);
        DataSourceDescriptor dataSource = Mockito.mock(DataSourceDescriptor.class);
        Mockito.when(dataSource.getConnectionConfiguration()).thenReturn(connectionConfiguration);
        Mockito.when(dataSource.isSavePassword()).thenReturn(true);
        Mockito.when(dataSource.isSharedCredentials()).thenReturn(true);
        Mockito.when(dataSource.getSelectedSharedCredentials()).thenReturn(selectedSecret);

        var snapshot = handler.createCredentialsSnapshot(dataSource);
        snapshot.restore();

        var configurationCaptor = ArgumentCaptor.forClass(DBPConnectionConfiguration.class);
        Mockito.verify(dataSource).setConnectionInfo(configurationCaptor.capture());
        Assertions.assertEquals("password", configurationCaptor.getValue().getUserPassword());
        Mockito.verify(dataSource).setSavePassword(true);
        Mockito.verify(dataSource).setSharedCredentials(true);
        Mockito.verify(dataSource).setSelectedSharedCredentials(selectedSecret);
    }

    /** Credentials with persistence keys that differ from their property names. */
    public static class TestCredentials implements DBAAuthCredentials {
        @NotNull
        private String clientId;
        @Nullable
        private String clientSecret;

        private TestCredentials(@NotNull String clientId, @Nullable String clientSecret) {
            this.clientId = clientId;
            this.clientSecret = clientSecret;
        }

        @NotNull
        @Property
        public String getClientId() {
            return clientId;
        }

        public void setClientId(@NotNull String clientId) {
            this.clientId = clientId;
        }

        @Nullable
        @Property(password = true)
        public String getClientSecret() {
            return clientSecret;
        }

        public void setClientSecret(@Nullable String clientSecret) {
            this.clientSecret = clientSecret;
        }

        @Override
        public boolean isComplete() {
            return clientId != null && clientSecret != null;
        }
    }

    private static class TestConnectionConfiguration extends DBPConnectionConfiguration {
        @NotNull
        private final DBAAuthModel<DBAAuthCredentials> authModel;

        private TestConnectionConfiguration(@NotNull DBAAuthModel<DBAAuthCredentials> authModel) {
            this.authModel = authModel;
        }

        @NotNull
        @Override
        @SuppressWarnings("unchecked")
        public <T extends DBAAuthCredentials> DBAAuthModel<T> getAuthModel() {
            return (DBAAuthModel<T>) authModel;
        }
    }
}

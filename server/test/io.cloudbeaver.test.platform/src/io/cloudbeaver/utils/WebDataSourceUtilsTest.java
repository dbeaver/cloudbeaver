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
package io.cloudbeaver.utils;

import io.cloudbeaver.model.WebConnectionConfig;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriverConfigurationType;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerDescriptor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;

public class WebDataSourceUtilsTest {
    private static final String HOST = "database.example.com";
    private static final String URL = "jdbc:postgresql://database.example.com:5432/database";

    @Test
    public void detectsChangedHost() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();

        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("host", "another-database.example.com"))
        ));
        Assertions.assertFalse(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("host", HOST))
        ));
    }

    @Test
    public void detectsChangedHostInMainProperties() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();

        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("mainPropertyValues", Map.of(DBConstants.PROP_HOST, "another-database.example.com")))
        ));
    }

    @Test
    public void detectsChangedUrl() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();

        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("url", "jdbc:postgresql://another-database.example.com:5432/database"))
        ));
        Assertions.assertFalse(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("url", URL))
        ));
    }

    @Test
    public void detectsRemovedOrOmittedCustomUrl() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();
        configuration.setConfigurationType(DBPDriverConfigurationType.URL);

        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("url", ""))
        ));
        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of())
        ));
    }

    @Test
    public void allowsPortChangeOnSameHost() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();

        Assertions.assertFalse(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of("host", HOST, "port", "5433"))
        ));
    }

    @Test
    public void detectsChangedNetworkHandlerTarget() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();
        addNetworkHandler(configuration, true);

        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            networkHandlerConfig(true, "another-ssh.example.com", "22", 0)
        ));
        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            networkHandlerConfig(true, "ssh.example.com", "2222", 0)
        ));
    }

    @Test
    public void detectsNetworkHandlerEnablementChange() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();
        addNetworkHandler(configuration, true);

        Assertions.assertTrue(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            networkHandlerConfig(false, "ssh.example.com", "22", 0)
        ));
    }

    @Test
    public void allowsNonRoutingNetworkHandlerChanges() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();
        addNetworkHandler(configuration, true);

        Assertions.assertFalse(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            networkHandlerConfig(true, "ssh.example.com", "22", 30)
        ));
    }

    @Test
    public void allowsPartialNonRoutingNetworkHandlerChanges() {
        DBPConnectionConfiguration configuration = createConnectionConfiguration();
        addNetworkHandler(configuration, true);

        Assertions.assertFalse(WebDataSourceUtils.isConnectionTargetChanged(
            configuration,
            new WebConnectionConfig(Map.of(
                "url", URL,
                "networkHandlersConfig", List.of(Map.of(
                    "id", "ssh_tunnel",
                    "properties", Map.of("aliveInterval", 30)
                ))
            ))
        ));
    }

    private static DBPConnectionConfiguration createConnectionConfiguration() {
        DBPConnectionConfiguration configuration = new DBPConnectionConfiguration();
        configuration.setHostName(HOST);
        configuration.setHostPort("5432");
        configuration.setUrl(URL);
        return configuration;
    }

    private static void addNetworkHandler(DBPConnectionConfiguration configuration, boolean enabled) {
        DBWHandlerDescriptor descriptor = Mockito.mock(DBWHandlerDescriptor.class);
        Mockito.when(descriptor.getId()).thenReturn("ssh_tunnel");
        DBWHandlerConfiguration handler = new DBWHandlerConfiguration(descriptor, null);
        handler.setEnabled(enabled);
        handler.setProperty(DBWHandlerConfiguration.PROP_HOST, "ssh.example.com");
        handler.setProperty(DBWHandlerConfiguration.PROP_PORT, "22");
        configuration.updateHandler(handler);
    }

    private static WebConnectionConfig networkHandlerConfig(
        boolean enabled,
        String host,
        String port,
        int aliveInterval
    ) {
        return new WebConnectionConfig(Map.of(
            "url", URL,
            "networkHandlersConfig",
            List.of(Map.of(
                "id", "ssh_tunnel",
                "enabled", enabled,
                "properties", Map.of(
                    DBWHandlerConfiguration.PROP_HOST, host,
                    DBWHandlerConfiguration.PROP_PORT, port,
                    "aliveInterval", aliveInterval
                )
            ))
        ));
    }
}

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
package io.cloudbeaver.test.platform.admin;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AdminAuthProviderConfigurationTest extends CloudbeaverMockTest {

    private static final String GQL_LIST_AUTH_PROVIDER_CONFIGURATIONS = """
        query listAuthProviderConfigurations($providerId: ID) {
          result: listAuthProviderConfigurations(providerId: $providerId) {
            providerId
            id
            displayName
            disabled
            iconURL
            description
            parameters
          }
        }""";
    private static final String GQL_SAVE_AUTH_PROVIDER_CONFIGURATION = """
        query saveAuthProviderConfiguration(
          $providerId: ID!
          $id: ID!
          $displayName: String
          $disabled: Boolean
          $iconURL: String
          $description: String
          $parameters: Object
        ) {
          result: saveAuthProviderConfiguration(
            providerId: $providerId
            id: $id
            displayName: $displayName
            disabled: $disabled
            iconURL: $iconURL
            description: $description
            parameters: $parameters
          ) {
            providerId
            id
            displayName
            disabled
            iconURL
            description
            parameters
          }
        }""";
    private static final String GQL_DELETE_AUTH_PROVIDER_CONFIGURATION = """
        query deleteAuthProviderConfiguration($id: ID!) {
          result: deleteAuthProviderConfiguration(id: $id)
        }""";

    @Test
    public void testOnlyOneReverseProxyConfigurationCanBeEnabled() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);

        List<Map<String, Object>> initialConfigurations = listReverseProxyConfigurations(client);
        Map<String, Object> originalEnabledConfiguration = initialConfigurations.stream()
            .filter(configuration -> !isDisabled(configuration))
            .findFirst()
            .orElseThrow(() -> new AssertionError("An enabled reverse proxy configuration is required"));
        Assertions.assertEquals(
            1,
            initialConfigurations.stream().filter(configuration -> !isDisabled(configuration)).count()
        );

        String disabledConfigurationId = "disabled-reverse-proxy-api-test";
        String rejectedConfigurationId = "rejected-reverse-proxy-api-test";
        Map<String, Object> disabledConfiguration = newConfiguration(disabledConfigurationId);
        Map<String, Object> rejectedConfiguration = newConfiguration(rejectedConfigurationId);
        try {
            Map<String, Object> savedDisabledConfiguration =
                saveConfiguration(client, disabledConfiguration, true);
            Assertions.assertTrue(isDisabled(savedDisabledConfiguration));

            DBException createError = Assertions.assertThrows(
                DBException.class,
                () -> saveConfiguration(client, rejectedConfiguration, false)
            );
            Assertions.assertTrue(createError.getMessage().contains("Only one reverse proxy"));
            Assertions.assertTrue(listReverseProxyConfigurations(client).stream()
                .noneMatch(configuration -> rejectedConfigurationId.equals(configuration.get("id"))));

            DBException enableError = Assertions.assertThrows(
                DBException.class,
                () -> saveConfiguration(client, disabledConfiguration, false)
            );
            Assertions.assertTrue(enableError.getMessage().contains("Only one reverse proxy"));
            Assertions.assertTrue(isDisabled(findConfiguration(client, disabledConfigurationId)));

            Assertions.assertFalse(isDisabled(saveConfiguration(client, originalEnabledConfiguration, false)));

            Assertions.assertTrue(isDisabled(saveConfiguration(client, originalEnabledConfiguration, true)));
            Assertions.assertFalse(isDisabled(saveConfiguration(client, disabledConfiguration, false)));
        } finally {
            saveConfiguration(client, disabledConfiguration, true);
            saveConfiguration(client, rejectedConfiguration, true);
            saveConfiguration(client, originalEnabledConfiguration, false);
            deleteConfiguration(client, disabledConfigurationId);
            deleteConfiguration(client, rejectedConfigurationId);
        }
    }

    @NotNull
    private static List<Map<String, Object>> listReverseProxyConfigurations(@NotNull WebGQLClient client)
        throws Exception {
        return client.sendQuery(
            GQL_LIST_AUTH_PROVIDER_CONFIGURATIONS,
            Map.of("providerId", RPAuthProvider.AUTH_PROVIDER)
        );
    }

    @NotNull
    private static Map<String, Object> findConfiguration(
        @NotNull WebGQLClient client,
        @NotNull String configurationId
    ) throws Exception {
        return listReverseProxyConfigurations(client).stream()
            .filter(configuration -> configurationId.equals(configuration.get("id")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Configuration '" + configurationId + "' not found"));
    }

    @NotNull
    private static Map<String, Object> saveConfiguration(
        @NotNull WebGQLClient client,
        @NotNull Map<String, Object> configuration,
        boolean disabled
    ) throws Exception {
        Map<String, Object> variables = new HashMap<>();
        variables.put("providerId", RPAuthProvider.AUTH_PROVIDER);
        variables.put("id", configuration.get("id"));
        variables.put("displayName", configuration.get("displayName"));
        variables.put("disabled", disabled);
        variables.put("iconURL", configuration.get("iconURL"));
        variables.put("description", configuration.get("description"));
        variables.put("parameters", configuration.getOrDefault("parameters", Map.of()));
        return client.sendQuery(GQL_SAVE_AUTH_PROVIDER_CONFIGURATION, variables);
    }

    private static void deleteConfiguration(@NotNull WebGQLClient client, @NotNull String configurationId)
        throws Exception {
        client.sendQuery(GQL_DELETE_AUTH_PROVIDER_CONFIGURATION, Map.of("id", configurationId));
    }

    private static boolean isDisabled(@NotNull Map<String, Object> configuration) {
        return Boolean.TRUE.equals(configuration.get("disabled"));
    }

    @NotNull
    private static Map<String, Object> newConfiguration(@NotNull String id) {
        return Map.of(
            "id", id,
            "displayName", id,
            "parameters", Map.of()
        );
    }
}

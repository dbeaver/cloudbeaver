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
package io.cloudbeaver.service.ai;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.test.WebGQLClient;
import io.cloudbeaver.test.platform.util.GraphQLTestConstant;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;
import org.jkiss.dbeaver.model.ai.AIConstants;
import org.jkiss.dbeaver.model.ai.AISettings;
import org.jkiss.dbeaver.model.ai.engine.openai.OpenAIConstants;
import org.jkiss.dbeaver.model.ai.engine.openai.OpenAIProperties;
import org.jkiss.dbeaver.model.ai.registry.AISettingsManager;
import org.jkiss.utils.SecurityUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AIProfileCopyTest extends CloudbeaverMockTest {
    private static final String GQL_CREATE_PROFILE = """
        mutation createAIProfile($config: AIConfigurationProfileInput!) {
          result: aiCreateProfile(config: $config) {
            id
            name
            engineId
            global
          }
        }""";
    private static final String GQL_COPY_PROFILE = """
        mutation copyAIProfile($profileId: ID!) {
          result: aiCopyProfile(profileId: $profileId) {
            id
            name
            engineId
            global
          }
        }""";
    private static final String GQL_DELETE_PROFILE = """
        mutation deleteAIProfile($profileId: ID!) {
          result: aiDeleteProfile(profileId: $profileId)
        }""";
    private static final String GQL_LIST_PROFILES = """
        query listAIProfiles {
          result: aiListProfiles {
            id
            credentialsSaved
          }
        }""";
    private static final String GQL_SAVE_CREDENTIALS = """
        mutation saveAIProfileCredentials($profileId: ID!, $credentials: AIProfileCredentialsInput!) {
          result: aiSaveProfileCredentials(profileId: $profileId, credentials: $credentials)
        }""";

    private static final String MODEL = "gpt-4.1";
    private static final String BASE_URL = "https://copy-test.invalid/v1";

    @Test
    public void copiesGlobalProfileWithSecrets() throws Exception {
        WebGQLClient adminClient = createAdminClient();
        String suffix = Long.toString(System.nanoTime());
        String sourceId = "global-copy-source-" + suffix;
        String profileName = "Global profile " + suffix;
        String token = "global-token-" + suffix;
        String targetId = null;

        try {
            createProfile(adminClient, sourceId, profileName, true, token);
            AISettings settings = AISettingsManager.getInstance().getSettings();
            AIConfigurationProfile source = settings.getConfiguration(sourceId);
            String expectedName = settings.generateProfileName(profileName);
            AIConfigurationProfile defaultProfile = settings.getDefaultConfigurationOrNull();
            String defaultProfileId = defaultProfile == null ? null : defaultProfile.getProfileId();

            Map<String, Object> copied = copyProfile(adminClient, sourceId);
            targetId = (String) copied.get("id");

            Assertions.assertNotEquals(sourceId, targetId);
            Assertions.assertEquals(targetId, UUID.fromString(targetId).toString());
            Assertions.assertEquals(expectedName, copied.get("name"));
            Assertions.assertEquals(OpenAIConstants.OPENAI_ENGINE, copied.get("engineId"));
            Assertions.assertEquals(Boolean.TRUE, copied.get("global"));

            AIConfigurationProfile target = settings.getConfiguration(targetId);
            OpenAIProperties sourceProperties = (OpenAIProperties) source.getConfiguration();
            OpenAIProperties targetProperties = (OpenAIProperties) target.getConfiguration();
            Assertions.assertNotSame(sourceProperties, targetProperties);
            Assertions.assertEquals(token, sourceProperties.getToken());
            Assertions.assertEquals(token, targetProperties.getToken());
            Assertions.assertEquals(BASE_URL, targetProperties.getBaseUrl());
            Assertions.assertEquals(MODEL, targetProperties.getModel());
            Assertions.assertEquals(
                defaultProfileId,
                settings.getDefaultConfigurationOrNull() == null
                    ? null
                    : settings.getDefaultConfigurationOrNull().getProfileId()
            );
        } finally {
            if (targetId != null) {
                deleteProfileIfPresent(adminClient, targetId);
            }
            deleteProfileIfPresent(adminClient, sourceId);
        }
    }

    @Test
    public void copiesNonGlobalProfileWithoutUserCredentials() throws Exception {
        WebGQLClient adminClient = createAdminClient();
        String suffix = Long.toString(System.nanoTime());
        String sourceId = "user-copy-source-" + suffix;
        String profileName = "User profile " + suffix;
        String userToken = "user-token-" + suffix;
        String targetId = null;

        try {
            createProfile(adminClient, sourceId, profileName, false, null);
            adminClient.sendQuery(
                GQL_SAVE_CREDENTIALS,
                Map.of("profileId", sourceId, "credentials", Map.of("properties", Map.of("token", userToken)))
            );
            Assertions.assertTrue(hasCredentials(adminClient, sourceId));

            Map<String, Object> copied = copyProfile(adminClient, sourceId);
            targetId = (String) copied.get("id");

            Assertions.assertEquals(profileName + " (1)", copied.get("name"));
            Assertions.assertEquals(Boolean.FALSE, copied.get("global"));
            Assertions.assertTrue(hasCredentials(adminClient, sourceId));
            Assertions.assertFalse(hasCredentials(adminClient, targetId));

            OpenAIProperties targetProperties = (OpenAIProperties) AISettingsManager.getInstance()
                .getSettings()
                .getConfiguration(targetId)
                .getConfiguration();
            Assertions.assertNull(targetProperties.getToken());
            Assertions.assertEquals(BASE_URL, targetProperties.getBaseUrl());
            Assertions.assertEquals(MODEL, targetProperties.getModel());
        } finally {
            if (targetId != null) {
                deleteProfileIfPresent(adminClient, targetId);
            }
            deleteProfileIfPresent(adminClient, sourceId);
        }
    }

    @Test
    public void rejectsInvalidProfileId() throws Exception {
        WebGQLClient adminClient = createAdminClient();
        String suffix = Long.toString(System.nanoTime());
        String sourceId = "invalid-copy-source-" + suffix;

        try {
            createProfile(adminClient, sourceId, "Invalid copy source " + suffix, true, "token-" + suffix);

            Assertions.assertThrows(
                DBException.class,
                () -> copyProfile(adminClient, "missing-" + suffix)
            );
            Assertions.assertThrows(
                DBException.class,
                () -> copyProfile(adminClient, "")
            );
        } finally {
            deleteProfileIfPresent(adminClient, sourceId);
        }
    }

    @Test
    public void deniesCopyForNonAdminUser() throws Exception {
        WebGQLClient adminClient = createAdminClient();
        String suffix = Long.toString(System.nanoTime());
        String sourceId = "permission-copy-source-" + suffix;
        String userId = "profile-copy-user-" + suffix;
        String passwordDigest = SecurityUtils.makeDigest("profile-copy-password");
        boolean userCreated = false;

        try {
            createProfile(adminClient, sourceId, "Permission copy source " + suffix, true, "token-" + suffix);
            adminClient.sendQuery(
                GraphQLTestConstant.GQL_CREATE_USER,
                Map.of("userId", userId, "enabled", true, "authRole", "user")
            );
            userCreated = true;
            adminClient.sendQuery(
                GraphQLTestConstant.GQL_SET_USER_CREDENTIALS,
                Map.of(
                    "userId", userId,
                    "providerId", LocalAuthProvider.PROVIDER_ID,
                    "credentials", Map.of(LocalAuthProvider.CRED_PASSWORD, passwordDigest)
                )
            );

            WebGQLClient userClient = CEAppStarter.createClient();
            CEAppStarter.authenticateTestUser(
                userClient,
                Map.of(LocalAuthProvider.CRED_USER, userId, LocalAuthProvider.CRED_PASSWORD, passwordDigest)
            );
            int profileCount = AISettingsManager.getInstance().getSettings().getConfigurations().length;

            Assertions.assertThrows(
                DBException.class,
                () -> copyProfile(userClient, sourceId)
            );
            Assertions.assertEquals(
                profileCount,
                AISettingsManager.getInstance().getSettings().getConfigurations().length
            );
        } finally {
            deleteProfileIfPresent(adminClient, sourceId);
            if (userCreated) {
                adminClient.sendQuery(GraphQLTestConstant.GQL_DELETE_USER, Map.of("userId", userId));
            }
        }
    }

    @NotNull
    private static WebGQLClient createAdminClient() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        return client;
    }

    private static void createProfile(
        @NotNull WebGQLClient client,
        @NotNull String profileId,
        @NotNull String profileName,
        boolean global,
        @Nullable String token
    ) throws Exception {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put(AIConstants.AI_GLOBAL_PROPERTY, global);
        properties.put("baseUrl", BASE_URL);
        properties.put(AIConstants.AI_MODEL_PROPERTY, MODEL);
        if (token != null) {
            properties.put("token", token);
        }
        Map<String, Object> config = Map.of(
            "profileId", profileId,
            "profileName", profileName,
            "engineId", OpenAIConstants.OPENAI_ENGINE,
            "configuration", Map.of("properties", properties)
        );

        Map<String, Object> created = client.sendQuery(GQL_CREATE_PROFILE, Map.of("config", config));
        Assertions.assertEquals(profileId, created.get("id"));
        Assertions.assertEquals(profileName, created.get("name"));
    }

    @NotNull
    private static Map<String, Object> copyProfile(
        @NotNull WebGQLClient client,
        @NotNull String profileId
    ) throws Exception {
        return client.sendQuery(
            GQL_COPY_PROFILE,
            Map.of("profileId", profileId)
        );
    }

    private static boolean hasCredentials(@NotNull WebGQLClient client, @NotNull String profileId) throws Exception {
        List<Map<String, Object>> profiles = client.sendQuery(GQL_LIST_PROFILES, Map.of());
        return profiles.stream()
            .filter(profile -> profileId.equals(profile.get("id")))
            .map(profile -> Boolean.TRUE.equals(profile.get("credentialsSaved")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("AI profile not found: " + profileId));
    }

    private static void deleteProfileIfPresent(@NotNull WebGQLClient client, @NotNull String profileId) throws Exception {
        AISettings settings = AISettingsManager.getInstance().getSettings();
        if (settings.getConfigurationOrNull(profileId) != null) {
            client.sendQuery(GQL_DELETE_PROFILE, Map.of("profileId", profileId));
        }
    }
}

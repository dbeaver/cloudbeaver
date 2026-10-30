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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.SecurityUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.*;

public class AuthenticationTest extends CloudbeaverMockTest {
    private static final String TEST_UI_SETTING = "authenticationTest";
    private static final int MAX_UI_SETTINGS_BYTES = 64000;
    private static final String GQL_OPEN_SESSION = """
        mutation openSession($defaultLocale: String) {
          result: openSession(defaultLocale: $defaultLocale) {
            valid
          }
        }""";
    private static final String GQL_ACTIVE_USER = """
        query activeUser {
          result: activeUser {
            userId
          }
        }""";
    private static final String GQL_AUTH_LOGOUT = """
        query authLogoutExtended($provider: ID, $configuration: ID) {
          result: authLogoutExtended(provider: $provider, configuration: $configuration) {
            redirectLinks {
              url
              sameTabRedirect
            }
          }
        }""";
    private static final String GQL_ACTIVE_USER_CONFIGURATION = """
        query activeUserConfiguration {
          result: activeUser {
            userConfiguration
          }
        }""";
    private static final String GQL_UPDATE_USER_CONFIGURATION = """
        mutation updateUserConfiguration($configuration: Object!) {
          result: authSetUserConfiguration(configuration: $configuration)
        }""";
    private static final String GQL_CREATE_USER = """
        query createUser($userId: ID!, $enabled: Boolean!, $authRole: String) {
          result: createUser(userId: $userId, enabled: $enabled, authRole: $authRole) { userId }
        }""";
    private static final String GQL_DELETE_USER = """
        query deleteUser($userId: ID!) {
          result: deleteUser(userId: $userId)
        }""";
    private static final String GQL_SET_USER_CREDENTIALS = """
        query setUserCredentials($userId: ID!, $providerId: ID!, $credentials: Object!) {
          result: setUserCredentials(userId: $userId, providerId: $providerId, credentials: $credentials)
        }""";

    @Test
    public void testLoginUser() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(client);
        Assertions.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }


    @Test
    public void testLoginUserWithCamelCase() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        for (String userId : Set.of("Test", "tESt", "tesT", "TEST")) {
            Map<String, Object> credsWithCamelCase = getUserCredentials(userId);
            // authenticating with user
            Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(client, credsWithCamelCase);
            Assertions.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
            Map<String, Object> activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
            Assertions.assertEquals(userId.toLowerCase(), JSONUtils.getString(activeUser, "userId"));
            // making logout
            client.sendQuery(GQL_AUTH_LOGOUT, Map.of("provider", "local"));

            activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
            Assertions.assertNotEquals(userId.toLowerCase(), JSONUtils.getString(activeUser, "userId"));
        }
    }

    @NotNull
    private Map<String, Object> getUserCredentials(@NotNull String userId) throws Exception {
        return Map.of(
            LocalAuthProvider.CRED_USER, userId,
            LocalAuthProvider.CRED_PASSWORD, SecurityUtils.makeDigest("test")
        );
    }


    @Test
    public void testReverseProxyAnonymousModeLogin() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        String testUserId = "reverseProxyTestUser";
        Map<String, String> headers = new HashMap<>();
        headers.put(RPAuthProvider.X_USER, testUserId);
        headers.put(RPAuthProvider.X_TEAM, "user");
        Map<String, Object> sessionInfo = client.sendQueryWithHeaders(GQL_OPEN_SESSION, null, headers);
        Assertions.assertTrue(JSONUtils.getBoolean(sessionInfo, "valid"));

        Map<String, Object> activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
        Assertions.assertEquals(testUserId, JSONUtils.getString(activeUser, "userId"));
    }

    @Test
    public void testUserUISettingsReplacementAndPersistence() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        try {
            Map<String, Object> initialSettings = Map.of(
                TEST_UI_SETTING, Map.of("panel", Map.of("active", true, "visible", false), "mode", "initial"),
                "removedKey", "initial"
            );
            Assertions.assertEquals(initialSettings, updateUISettings(client, initialSettings));
            Assertions.assertEquals(initialSettings, readUISettings(client));

            Map<String, Object> replacement = Map.of(TEST_UI_SETTING, Map.of("panel", Map.of("visible", true)));
            Assertions.assertEquals(replacement, updateUISettings(client, replacement));
            Assertions.assertEquals(replacement, readUISettings(client));

            WebGQLClient nextClient = CEAppStarter.createClient();
            CEAppStarter.authenticateTestUser(nextClient);
            Assertions.assertNotEquals(client.getSessionIdCookie(), nextClient.getSessionIdCookie());
            Assertions.assertEquals(replacement, readUISettings(nextClient));

            client.sendQuery(GQL_AUTH_LOGOUT, Map.of("provider", LocalAuthProvider.PROVIDER_ID));
            try {
                assertUISettingsAccessDenied(client);
            } finally {
                CEAppStarter.authenticateTestUser(client);
            }
            Assertions.assertEquals(replacement, readUISettings(client));

            Assertions.assertEquals(Map.of(), updateUISettings(client, Map.of()));
            Assertions.assertEquals(Map.of(), readUISettings(client));
            Assertions.assertEquals(Map.of(), readUISettings(nextClient));
            WebGQLClient clearedClient = CEAppStarter.createClient();
            CEAppStarter.authenticateTestUser(clearedClient);
            Assertions.assertEquals(Map.of(), readUISettings(clearedClient));
        } finally {
            updateUISettings(client, Map.of());
        }
    }

    @Test
    public void testAnonymousUISettingsAccessDenied() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        client.sendQuery(GQL_OPEN_SESSION, null);
        assertUISettingsAccessDenied(client);

        WebGQLClient nextClient = CEAppStarter.createClient();
        nextClient.sendQuery(GQL_OPEN_SESSION, null);
        assertUISettingsAccessDenied(nextClient);
    }

    @Test
    public void testAnonymousUISettingsAccessDeniedAfterFailedLogin() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        client.sendQuery(GQL_OPEN_SESSION, null);
        assertUISettingsAccessDenied(client);

        Assertions.assertThrows(DBException.class, () -> CEAppStarter.authenticateTestUser(client, Map.of(
            LocalAuthProvider.CRED_USER, "test",
            LocalAuthProvider.CRED_PASSWORD, SecurityUtils.makeDigest("invalid")
        )));

        assertUISettingsAccessDenied(client);
    }

    @Test
    public void testUserUISettingsPreserveNulls() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        try {
            updateUISettings(client, Map.of(TEST_UI_SETTING, Map.of("panel", Map.of("active", true), "removed", true)));
            Map<String, Object> nullValue = new HashMap<>();
            nullValue.put("value", null);
            Map<String, Object> panel = new HashMap<>();
            panel.put("active", null);
            panel.put("visible", true);
            Map<String, Object> expected = new HashMap<>();
            expected.put("nullValue", null);
            expected.put(TEST_UI_SETTING, Map.of(
                "panel", panel,
                "items", Arrays.asList(null, nullValue, Arrays.asList(null, "value"), 42.0)
            ));

            // Variables preserve JSON nulls without invoking the scalar's inline-array coercion.
            Map<String, Object> result = updateUISettings(client, expected);
            Assertions.assertEquals(expected, result);
            Assertions.assertEquals(expected, readUISettings(client));
            WebGQLClient nextClient = CEAppStarter.createClient();
            CEAppStarter.authenticateTestUser(nextClient);
            Assertions.assertEquals(expected, readUISettings(nextClient));
        } finally {
            updateUISettings(client, Map.of());
        }
    }

    @Test
    public void testUserUISettingsAllowLongKeys() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        try {
            String longKey = "arbitrary.preference-key/".repeat(100);
            Map<String, Object> settings = Map.of(longKey, Map.of(longKey, List.of("value", true)));
            Assertions.assertEquals(settings, updateUISettings(client, settings));
            Assertions.assertEquals(settings, readUISettings(client));
        } finally {
            updateUISettings(client, Map.of());
        }
    }

    @Test
    public void testUserUISettingsCompactUTF8SizeLimit() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        try {
            for (String character : List.of("a", "界", "😀")) {
                Map<String, Object> atLimit = sizedUISettings(MAX_UI_SETTINGS_BYTES, character);
                Assertions.assertEquals(atLimit, updateUISettings(client, atLimit));
                Assertions.assertEquals(atLimit, readUISettings(client));

                Map<String, Object> overLimit = sizedUISettings(MAX_UI_SETTINGS_BYTES + 1, character);
                Assertions.assertThrows(DBException.class, () -> updateUISettings(client, overLimit));
                Assertions.assertEquals(atLimit, readUISettings(client));
                WebGQLClient nextClient = CEAppStarter.createClient();
                CEAppStarter.authenticateTestUser(nextClient);
                Assertions.assertEquals(atLimit, readUISettings(nextClient));
            }
        } finally {
            updateUISettings(client, Map.of());
        }
    }

    @Test
    public void testUserUISettingsRejectNonObjectRoots() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        try {
            Map<String, Object> previousSettings = Map.of(TEST_UI_SETTING, Map.of("preserved", true));
            updateUISettings(client, previousSettings);
            for (Object invalidRoot : Arrays.asList(null, "invalid", List.of(), List.of(Map.of("key", true)), true, 42.0)) {
                Map<String, Object> variables = new HashMap<>();
                variables.put("configuration", invalidRoot);
                Assertions.assertThrows(DBException.class, () -> client.sendQuery(
                    GQL_UPDATE_USER_CONFIGURATION, variables
                ));
                Assertions.assertEquals(previousSettings, readUISettings(client));
            }
            // Keep root-literal validation covered independently of the variable-based requests.
            for (String invalidRoot : List.of("null", "\"invalid\"", "[]", "[{}]", "true", "42")) {
                Assertions.assertThrows(DBException.class, () -> client.sendQuery(
                    "mutation { result: authSetUserConfiguration(configuration: " + invalidRoot + ") }", null
                ));
                Assertions.assertEquals(previousSettings, readUISettings(client));
            }
            WebGQLClient nextClient = CEAppStarter.createClient();
            CEAppStarter.authenticateTestUser(nextClient);
            Assertions.assertEquals(previousSettings, readUISettings(nextClient));
        } finally {
            updateUISettings(client, Map.of());
        }
    }

    @Test
    public void testUserUISettingsAreIsolatedBetweenUsers() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        String userId = "ui-settings-isolation-test";
        try {
            client.sendQuery(GQL_CREATE_USER, Map.of("userId", userId, "enabled", true, "authRole", "user"));
            client.sendQuery(GQL_SET_USER_CREDENTIALS, Map.of(
                "userId", userId,
                "providerId", LocalAuthProvider.PROVIDER_ID,
                "credentials", Map.of(LocalAuthProvider.CRED_PASSWORD, SecurityUtils.makeDigest("test"))
            ));
            WebGQLClient otherClient = CEAppStarter.createClient();
            Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(otherClient, getUserCredentials(userId));
            Assertions.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));

            Map<String, Object> settings = Map.of(TEST_UI_SETTING, "first user");
            Map<String, Object> otherSettings = Map.of(TEST_UI_SETTING, "second user");
            updateUISettings(client, settings);
            Assertions.assertEquals(Map.of(), readUISettings(otherClient));
            Assertions.assertEquals(otherSettings, updateUISettings(otherClient, otherSettings));
            Assertions.assertEquals(settings, readUISettings(client));
            Assertions.assertEquals(otherSettings, readUISettings(otherClient));

            Assertions.assertEquals(Map.of(), updateUISettings(client, Map.of()));
            Assertions.assertEquals(otherSettings, readUISettings(otherClient));
            WebGQLClient nextClient = CEAppStarter.createClient();
            CEAppStarter.authenticateTestUser(nextClient, getUserCredentials(userId));
            Assertions.assertEquals(otherSettings, readUISettings(nextClient));
        } finally {
            try {
                updateUISettings(client, Map.of());
            } finally {
                client.sendQuery(GQL_DELETE_USER, Map.of("userId", userId));
            }
        }
    }

    private static void assertUISettingsAccessDenied(@NotNull WebGQLClient client) {
        DBException readError = Assertions.assertThrows(DBException.class, () -> readUISettings(client));
        Assertions.assertTrue(readError.getMessage().contains("Access denied"), readError.getMessage());
        for (Map<String, Object> settings : List.of(Map.<String, Object>of(TEST_UI_SETTING, true), Map.<String, Object>of())) {
            DBException writeError = Assertions.assertThrows(DBException.class, () -> updateUISettings(client, settings));
            Assertions.assertTrue(writeError.getMessage().contains("Access denied"), writeError.getMessage());
        }
    }

    @NotNull
    private static Map<String, Object> sizedUISettings(int byteSize, @NotNull String character) {
        // No escaping is needed for these characters; count the compact JSON envelope, not the HTTP request.
        int payloadBytes = byteSize - "{\"value\":\"\"}".getBytes(StandardCharsets.UTF_8).length;
        int characterBytes = character.getBytes(StandardCharsets.UTF_8).length;
        String value = character.repeat(payloadBytes / characterBytes) + "a".repeat(payloadBytes % characterBytes);
        Assertions.assertEquals(byteSize, ("{\"value\":\"" + value + "\"}").getBytes(StandardCharsets.UTF_8).length);
        return Map.of("value", value);
    }

    @NotNull
    private static Map<String, Object> readUISettings(@NotNull WebGQLClient client) throws Exception {
        Map<String, Object> activeUser = client.sendQuery(GQL_ACTIVE_USER_CONFIGURATION, null);
        Assertions.assertNotNull(activeUser);
        Assertions.assertInstanceOf(Map.class, activeUser.get("userConfiguration"));
        return JSONUtils.getObject(activeUser, "userConfiguration");
    }

    @NotNull
    private static Map<String, Object> updateUISettings(
        @NotNull WebGQLClient client,
        @NotNull Map<String, Object> settings
    ) throws Exception {
        return client.sendQuery(GQL_UPDATE_USER_CONFIGURATION, Map.of("configuration", settings));
    }
}

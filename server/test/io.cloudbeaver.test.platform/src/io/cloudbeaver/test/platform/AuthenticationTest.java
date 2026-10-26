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

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class AuthenticationTest extends CloudbeaverMockTest {
    private static final String TEST_UI_SETTING = "authenticationTest";
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
    private static final String GQL_ACTIVE_USER_UI_SETTINGS = """
        query activeUserUISettings {
          result: activeUser {
            uiSettings
          }
        }""";
    private static final String GQL_UPDATE_USER_UI_SETTINGS = """
        mutation updateUserUISettings($settings: Object!) {
          result: authSetUserUISettings(settings: $settings)
        }""";
    private static final String GQL_PATCH_USER_UI_SETTINGS = """
        mutation patchUserUISettings {
          result: authSetUserUISettings(settings: {
            authenticationTest: {
              panel: {
                active: null
                visible: true
              }
            }
          })
        }""";
    private static final String GQL_DELETE_USER_UI_SETTINGS = """
        mutation deleteUserUISettings {
          result: authSetUserUISettings(settings: { authenticationTest: null })
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
    public void testUserUISettingsPersistenceAndMerge() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(client);
        WebGQLClient nextClient = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(nextClient);
        try {
            Map<String, Object> initialSettings = updateUISettings(client, Map.of(
                TEST_UI_SETTING,
                Map.of(
                    "panel", Map.of("active", true, "visible", false),
                    "mode", "initial"
                )
            ));
            Assertions.assertTrue(JSONUtils.getBoolean(
                JSONUtils.getObject(JSONUtils.getObject(initialSettings, TEST_UI_SETTING), "panel"),
                "active"
            ));

            Map<String, Object> updatedSettings = client.sendQuery(GQL_PATCH_USER_UI_SETTINGS, null);
            Map<String, Object> updatedTestSettings = JSONUtils.getObject(updatedSettings, TEST_UI_SETTING);
            Map<String, Object> updatedPanel = JSONUtils.getObject(updatedTestSettings, "panel");
            Assertions.assertFalse(updatedPanel.containsKey("active"));
            Assertions.assertTrue(JSONUtils.getBoolean(updatedPanel, "visible"));
            Assertions.assertEquals("initial", JSONUtils.getString(updatedTestSettings, "mode"));

            Map<String, Object> activeUser = nextClient.sendQuery(GQL_ACTIVE_USER_UI_SETTINGS, null);
            Map<String, Object> persistedSettings = JSONUtils.getObject(activeUser, "uiSettings");
            Assertions.assertEquals(updatedTestSettings, JSONUtils.getObject(persistedSettings, TEST_UI_SETTING));
        } finally {
            client.sendQuery(GQL_DELETE_USER_UI_SETTINGS, null);
        }
    }

    @Test
    public void testAnonymousUISettingsAreSessionScoped() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        client.sendQuery(GQL_OPEN_SESSION, null);
        updateUISettings(client, Map.of(TEST_UI_SETTING, Map.of("active", true)));

        Map<String, Object> currentSettings = updateUISettings(client, Map.of());
        Assertions.assertTrue(JSONUtils.getBoolean(JSONUtils.getObject(currentSettings, TEST_UI_SETTING), "active"));

        WebGQLClient nextClient = CEAppStarter.createClient();
        nextClient.sendQuery(GQL_OPEN_SESSION, null);
        Map<String, Object> nextSessionSettings = updateUISettings(nextClient, Map.of());
        Assertions.assertFalse(nextSessionSettings.containsKey(TEST_UI_SETTING));
    }

    @Test
    public void testAnonymousUISettingsSurviveFailedLogin() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        client.sendQuery(GQL_OPEN_SESSION, null);
        updateUISettings(client, Map.of(TEST_UI_SETTING, Map.of("active", true)));

        Assertions.assertThrows(DBException.class, () -> CEAppStarter.authenticateTestUser(client, Map.of(
            LocalAuthProvider.CRED_USER, "test",
            LocalAuthProvider.CRED_PASSWORD, SecurityUtils.makeDigest("invalid")
        )));

        Map<String, Object> currentSettings = updateUISettings(client, Map.of());
        Assertions.assertTrue(JSONUtils.getBoolean(JSONUtils.getObject(currentSettings, TEST_UI_SETTING), "active"));
    }

    @NotNull
    private static Map<String, Object> updateUISettings(
        @NotNull WebGQLClient client,
        @NotNull Map<String, Object> settings
    ) throws Exception {
        return client.sendQuery(GQL_UPDATE_USER_UI_SETTINGS, Map.of("settings", settings));
    }
}

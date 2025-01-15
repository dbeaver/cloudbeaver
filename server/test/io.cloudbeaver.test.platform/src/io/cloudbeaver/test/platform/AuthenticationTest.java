/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.SecurityUtils;
import org.junit.Assert;
import org.junit.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class AuthenticationTest extends CloudbeaverMockTest {
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
            redirectLinks
          }
        }""";

    @Test
    public void testLoginUser() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(client);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }


    @Test
    public void testLoginUserWithCamelCase() throws Exception {
        WebGQLClient client = CEAppStarter.createClient();
        for (String userId : Set.of("Test", "tESt", "tesT", "TEST")) {
            Map<String, Object> credsWithCamelCase = getUserCredentials(userId);
            // authenticating with user
            Map<String, Object> authInfo = CEAppStarter.authenticateTestUser(client, credsWithCamelCase);
            Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
            Map<String, Object> activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
            Assert.assertEquals(userId.toLowerCase(), JSONUtils.getString(activeUser, "userId"));
            // making logout
            client.sendQuery(GQL_AUTH_LOGOUT, Map.of("provider", "local"));

            activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
            Assert.assertNotEquals(userId.toLowerCase(), JSONUtils.getString(activeUser, "userId"));
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
        List<String> headers = List.of(RPAuthProvider.X_USER, testUserId, RPAuthProvider.X_TEAM, "user");
        Map<String, Object> sessionInfo = client.sendQueryWithHeaders(GQL_OPEN_SESSION, null, headers);
        Assert.assertTrue(JSONUtils.getBoolean(sessionInfo, "valid"));

        Map<String, Object> activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
        Assert.assertEquals(testUserId, JSONUtils.getString(activeUser, "userId"));
    }
}

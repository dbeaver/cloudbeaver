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
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.SecurityUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Map;

public class AdminLastLoginTimeTest extends CloudbeaverMockTest {

    private static final String TEST_USER_ID = "last-login-test-user";
    private static final String TEST_USER_PASSWORD = SecurityUtils.makeDigest("12345");

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

    private static final String GQL_ADMIN_USER_INFO = """
        query adminUserInfo($userId: ID!) {
          result: adminUserInfo(userId: $userId) {
            userId
            lastLoginTime
          }
        }""";

    @Test
    public void testLastLoginTimePopulatedAfterAuthentication() throws Exception {

        // GIVEN
        WebGQLClient adminClient = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(adminClient);

        try {
            Map<String, Object> created = adminClient.sendQuery(
                GQL_CREATE_USER,
                Map.of("userId", TEST_USER_ID, "enabled", true, "authRole", "user")
            );
            Assertions.assertNotNull(created);
            Assertions.assertEquals(TEST_USER_ID, JSONUtils.getString(created, "userId"));

            adminClient.sendQuery(
                GQL_SET_USER_CREDENTIALS,
                Map.of(
                    "userId", TEST_USER_ID,
                    "providerId", LocalAuthProvider.PROVIDER_ID,
                    "credentials", Map.of("password", TEST_USER_PASSWORD)
                )
            );

            Map<String, Object> beforeLogin = adminClient.sendQuery(
                GQL_ADMIN_USER_INFO,
                Map.of("userId", TEST_USER_ID)
            );
            Assertions.assertNotNull(beforeLogin);
            Assertions.assertEquals(TEST_USER_ID, JSONUtils.getString(beforeLogin, "userId"));
            Assertions.assertNull(
                JSONUtils.getString(beforeLogin, "lastLoginTime"),
                "lastLoginTime should be null before the first successful authentication"
            );

            WebGQLClient userClient = CEAppStarter.createClient();
            Map<String, Object> authInfo = userClient.sendQuery(
                WebGQLClient.GQL_AUTHENTICATE,
                Map.of(
                    "provider", LocalAuthProvider.PROVIDER_ID,
                    "credentials", Map.of(
                        LocalAuthProvider.CRED_USER, TEST_USER_ID,
                        LocalAuthProvider.CRED_PASSWORD, TEST_USER_PASSWORD
                    )
                )
            );
            Assertions.assertNotNull(authInfo);
            Assertions.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));

            // WHEN
            Map<String, Object> afterLogin = adminClient.sendQuery(
                GQL_ADMIN_USER_INFO,
                Map.of("userId", TEST_USER_ID)
            );

            // THEN
            Assertions.assertNotNull(afterLogin);
            Assertions.assertEquals(TEST_USER_ID, JSONUtils.getString(afterLogin, "userId"));
            String lastLoginTime = JSONUtils.getString(afterLogin, "lastLoginTime");
            Assertions.assertNotNull(
                lastLoginTime,
                "lastLoginTime must be returned for an authenticated user"
            );
            Assertions.assertFalse(
                lastLoginTime.isBlank(),
                "lastLoginTime must not be empty"
            );
        } finally {
            adminClient.sendQuery(GQL_DELETE_USER, Map.of("userId", TEST_USER_ID));
        }
    }
}

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
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Map;

public class AdminCreateUserTest extends CloudbeaverMockTest {

    private static final String GQL_CREATE_USER = """
        query createUser($userId: ID!, $enabled: Boolean!, $authRole: String) {
          result: createUser(userId: $userId, enabled: $enabled, authRole: $authRole) { userId }
        }""";

    private static final String GQL_DELETE_USER = """
        query deleteUser($userId: ID!) {
          result: deleteUser(userId: $userId)
        }""";

    @Test
    public void testCreateUserTrimsUserName() throws Exception {
        WebGQLClient adminClient = CEAppStarter.createClient();
        CEAppStarter.authenticateTestUser(adminClient);

        String expectedUserId = "trim-user-test";
        String paddedUserName = "  " + expectedUserId + "  ";
        try {
            Map<String, Object> created = adminClient.sendQuery(
                GQL_CREATE_USER,
                Map.of("userId", paddedUserName, "enabled", true, "authRole", "user")
            );
            Assertions.assertNotNull(created);
            Assertions.assertEquals(expectedUserId, JSONUtils.getString(created, "userId"));
        } finally {
            adminClient.sendQuery(GQL_DELETE_USER, Map.of("userId", expectedUserId));
        }
    }
}

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

import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.Assert;
import org.junit.Test;

import java.util.List;
import java.util.Map;

public class AuthenticationTest {
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

    @Test
    public void testLoginUser() throws Exception {
        WebGQLClient client = CEServerTestSuite.createClient();
        Map<String, Object> authInfo = CEServerTestSuite.authenticateTestUser(client);
        Assert.assertEquals(SMAuthStatus.SUCCESS.name(), JSONUtils.getString(authInfo, "authStatus"));
    }

    @Test
    public void testReverseProxyAnonymousModeLogin() throws Exception {
        WebGQLClient client = CEServerTestSuite.createClient();
        String testUserId = "reverseProxyTestUser";
        List<String> headers = List.of(RPAuthProvider.X_USER, testUserId, RPAuthProvider.X_TEAM, "user");
        Map<String, Object> sessionInfo = client.sendQueryWithHeaders(GQL_OPEN_SESSION, null, headers);
        Assert.assertTrue(JSONUtils.getBoolean(sessionInfo, "valid"));

        Map<String, Object> activeUser = client.sendQuery(GQL_ACTIVE_USER, null);
        Assert.assertEquals(testUserId, JSONUtils.getString(activeUser, "userId"));
    }
}

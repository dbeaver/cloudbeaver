/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.app;

import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBApplicationCE;
import io.cloudbeaver.test.WebGQLClient;
import io.cloudbeaver.utils.WebTestUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.SecurityUtils;
import org.junit.AfterClass;

import java.net.CookieManager;
import java.net.http.HttpClient;
import java.util.Map;

public class CEAppStarter {
    public static final String SERVER_URL = "http://localhost:18978";
    private static final String GQL_API_URL = SERVER_URL + "/api/gql";
    private static final String SERVER_STATUS_URL = SERVER_URL + "/status";
    private static final Map<String, Object> TEST_CREDENTIALS = Map.of(
        LocalAuthProvider.CRED_USER, "test",
        LocalAuthProvider.CRED_PASSWORD, SecurityUtils.makeDigest("test")
    );

    private static CBApplication<?> testApp;

    public static void startServerIfNotStarted() throws Exception {
        System.out.println("Start CBApplication");
        if (DBWorkbench.isPlatformStarted() && DBWorkbench.getPlatform().getApplication() instanceof CBApplication<?>) {
            testApp = (CBApplication<?>) DBWorkbench.getPlatform().getApplication();
            return;
        }
        testApp = new CBApplicationCE();
        Thread thread = new Thread(() -> testApp.start(null));
        thread.start();
        HttpClient httpClient = HttpClient.newBuilder()
            .cookieHandler(new CookieManager())
            .version(HttpClient.Version.HTTP_2)
            .build();
        long startTime = System.currentTimeMillis();
        long endTime = 0;
        boolean setUpIsDone = false;
        while (!setUpIsDone && endTime < 300000) {
            setUpIsDone = WebTestUtils.getServerStatus(httpClient, SERVER_STATUS_URL);
            endTime = System.currentTimeMillis() - startTime;
        }
        if (!setUpIsDone) {
            throw new Exception("Server is not running");
        }
    }

    @AfterClass
    public static void shutdownServer() {
        testApp.stop();
    }

    public static CBApplication<?> getTestApp() {
        return testApp;
    }

    public static WebGQLClient createClient() {
        HttpClient httpClient = HttpClient.newBuilder()
            .cookieHandler(new CookieManager())
            .version(HttpClient.Version.HTTP_2)
            .build();
        return createClient(httpClient);
    }

    public static WebGQLClient createClient(@NotNull HttpClient httpClient) {
        return new WebGQLClient(httpClient, GQL_API_URL);
    }

    public static Map<String, Object> authenticateTestUser(@NotNull WebGQLClient client) throws Exception {
        return authenticateTestUser(client, TEST_CREDENTIALS);
    }

    public static Map<String, Object> authenticateTestUser(
        @NotNull WebGQLClient client,
        @NotNull Map<String, Object> credentials
    ) throws Exception {
        return client.sendQuery(
            WebGQLClient.GQL_AUTHENTICATE,
            Map.of(
                "provider", LocalAuthProvider.PROVIDER_ID,
                "credentials", credentials
            )
        );
    }

    private CEAppStarter() {
    }
}

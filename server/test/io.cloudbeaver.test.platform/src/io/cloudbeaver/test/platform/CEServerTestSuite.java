/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import io.cloudbeaver.model.rm.RMNIOTest;
import io.cloudbeaver.model.rm.lock.RMLockTest;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBApplicationCE;
import io.cloudbeaver.utils.WebTestUtils;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;

import java.net.CookieManager;
import java.net.http.HttpClient;
import java.nio.file.Path;

@RunWith(Suite.class)
@Suite.SuiteClasses(
    {
        ConnectionsTest.class,
        AuthenticationTest.class,
        ResourceManagerTest.class,
        RMLockTest.class,
        RMNIOTest.class
    }
)
public class CEServerTestSuite {

    public static final String GQL_API_URL = "http://localhost:18978/api/gql";
    public static final String SERVER_STATUS_URL = "http://localhost:18978/status";

    private static boolean setUpIsDone = false;
    private static boolean testFinished = false;

    private static CBApplication testApp;
    private static HttpClient client;
    private static Path scriptsPath;
    private static Thread thread;

    @BeforeClass
    public static void startServer() throws Exception {
        if (setUpIsDone) {
            return;
        } else {
            System.out.println("Start CBApplication");
            testApp = new CBApplicationCE();
            thread = new Thread(() -> {
                testApp.start(null);
            });
            thread.start();
            client = createClient();
            long startTime = System.currentTimeMillis();
            long endTime = 0;
            while (true) {
                setUpIsDone = WebTestUtils.getServerStatus(client, SERVER_STATUS_URL);
                endTime = System.currentTimeMillis() - startTime;
                if (setUpIsDone || endTime > 300000) {
                    break;
                }
            }
            if (!setUpIsDone) {
                throw new Exception("Server is not running");
            }
            scriptsPath = Path.of(testApp.getHomeDirectory().toString(), "/workspace/gql_scripts")
                .toAbsolutePath();
        }
    }

    @AfterClass
    public static void shutdownServer() {
        testApp.stop();
    }

    public static CBApplication getTestApp() {
        return testApp;
    }

    public static HttpClient getClient() {
        return client;
    }

    public static HttpClient createClient() {
        return HttpClient.newBuilder()
            .cookieHandler(new CookieManager())
            .version(HttpClient.Version.HTTP_2)
            .build();
    }

    public static Path getScriptsPath() {
        return scriptsPath;
    }
}

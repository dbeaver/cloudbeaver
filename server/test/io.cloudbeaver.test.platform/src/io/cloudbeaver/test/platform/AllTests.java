/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.server.CBApplication;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;

import java.io.File;
import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RunWith(Suite.class)
@Suite.SuiteClasses({PlatformTest.class, AuthenticationTest.class })
public class AllTests {

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
            testApp = new CBApplication();
            thread = new Thread(() -> testApp.start(null));
            thread.start();
            client = HttpClient.newBuilder()
                .cookieHandler(new CookieManager())
                .version(HttpClient.Version.HTTP_2)
                .build();
            long startTime = System.currentTimeMillis();
            long endTime = 0;
            while (true) {
                setUpIsDone = getServerStatus();
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



    private static boolean getServerStatus() {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(SERVER_STATUS_URL))
            .GET()
            .build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    public static HttpClient getClient() {
        return client;
    }

    public static Map<String, Object> doPost(String input, HttpClient client) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(GQL_API_URL))
            .POST(HttpRequest.BodyPublishers.ofString(input))
            .header("Content-Type", "application/json")
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        return new GsonBuilder().create().fromJson(
            response.body(),
            new TypeToken<Map<String, Object>>() {
            }.getType()
        );
    }

    public static String readScriptTemplate(String templateName, Path scriptsPath) throws Exception {
        Path templatePath = new File(String.valueOf(scriptsPath), templateName).toPath();
        return Files.readString(templatePath);
    }

    public static Path getScriptsPath() {
        return scriptsPath;
    }
}

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
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class PlatformTest {

    public static final String GQL_TEMPLATE_CREATE_CONNECTION = "createConnection.json";
    public static final String GQL_TEMPLATE_DELETE_CONNECTION = "deleteConnection.json";
    public static final String GQL_TEMPLATE_USER_CONNECTIONS = "userConnections.json";
    public static final String GQL_API_URL = "http://localhost:18978/api/gql";
    public static final String SERVER_STATUS_URL = "http://localhost:18978/status";

    private static boolean setUpIsDone = false;
    private static boolean testFinished = false;

    private static CBApplication testApp;
    private static HttpClient client;
    private static Path scriptsPath;
    private static Thread thread;

    @Before
    public void setUp() throws Exception {
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
                setUpIsDone = getServerStatus(client);
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

    @After
    public void tearDown() throws Exception {
        if (testFinished) {
            testApp.stop();
            thread.interrupt();
        }
    }

    @Test
    public void testAPlatformPresence() {
        try {
            System.out.println("APP:: " + GeneralUtils.getProductTitle());
            //CBPlatform.setApplication(testApp);

            Path defaultWorkingFolder = DBWorkbench.getPlatform().getApplication().getDefaultWorkingFolder();
            System.out.println("DBeaver application: " + defaultWorkingFolder);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testBCreateConnection() throws Exception {
        List<Map<String, Object>> connections = getUserConnections(client);
        Map<String, Object> addedConnection = createConnection(client);
        if (!getUserConnections(client).contains(addedConnection)) {
            testFinished = true;
            throw new Exception("The new connection was not added");
        }
        boolean deleteConnection = deleteConnection(client, CommonUtils.toString(addedConnection.get("id")));
        if (!deleteConnection) {
            testFinished = true;
            throw new Exception("The new connection was not deleted");
        }
        testFinished = true;
    }


    private boolean getServerStatus(HttpClient client) throws Exception {
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

    private Map<String, Object> doPost(String input, HttpClient client) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(GQL_API_URL))
            .POST(HttpRequest.BodyPublishers.ofString(input))
            .headers("Content-Type", "application/json")
            .build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        return new GsonBuilder().create().fromJson(
            response.body(),
            new TypeToken<Map<String, Object>>() {
            }.getType()
        );
    }

    private List<Map<String, Object>> getUserConnections(HttpClient client) throws Exception {
        String input = readScriptTemplate(GQL_TEMPLATE_USER_CONNECTIONS);
        Map<String, Object> map = doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getObjectList(data, "userConnections");
        }
        return Collections.emptyList();
    }

    private Map<String, Object> createConnection(HttpClient client) throws Exception {
        String input = readScriptTemplate(GQL_TEMPLATE_CREATE_CONNECTION);
        Map<String, Object> map = doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getObjectOrNull(data, "createConnection");
        }
        return Collections.emptyMap();
    }

    private boolean deleteConnection(HttpClient client, String connectionId) throws Exception {
        String input = readScriptTemplate(GQL_TEMPLATE_DELETE_CONNECTION)
            .replace("${connectionId}", connectionId);
        Map<String, Object> map = doPost(input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getBoolean(data, "deleteConnection");
        }
        return false;
    }

    private String readScriptTemplate(String templateName) throws Exception {
        Path templatePath = new File(String.valueOf(scriptsPath), templateName).toPath();
        return Files.readString(templatePath);
    }
}

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

    private static Thread thread;
    private static CBApplication testApp;
    private static HttpClient client;
    Path scriptsPath;
    String gqlApiUrl = "http://localhost:8978/api/gql";
    String statusUrl = "http://localhost:8978/status";
    private static boolean setUpIsDone = false;
    private static boolean testFinished = false;
    private static final String createConnection = "createConnection.json";
    private static final String deleteConnection = "deleteConnection.json";
    private static final String userConnections = "userConnections.json";

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
                setUpIsDone = getServerStatus(client) == 200;
                endTime = System.currentTimeMillis() - startTime;
                if (setUpIsDone || endTime > 300000) {
                    break;
                }
            }
            if (!setUpIsDone) {
                throw new Exception("Server is not running");
            }
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
        scriptsPath = Path.of(testApp.getHomeDirectory().toString(), "/workspace/gql_scripts").toAbsolutePath();
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


    private int getServerStatus(HttpClient client) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(statusUrl))
            .GET()
            .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode();
        } catch (Exception e) {
            return 404;
        }
    }

    private Map<String, Object> doPost(String input, HttpClient client) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(gqlApiUrl))
            .POST(HttpRequest.BodyPublishers.ofString(input))
            .headers("Content-Type", "application/json")
            .build();


        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        return new GsonBuilder().create().fromJson(
            response.body(),
            new TypeToken<Map<String, Object>>(){}.getType()
        );
    }

    private List<Map<String, Object>> getUserConnections(HttpClient client) throws Exception {
        String input = Files.readString(new File(String.valueOf(scriptsPath), userConnections).toPath());
        Map<String, Object> map = doPost(input, client);
        Map<String, Object> data =  JSONUtils.getObjectOrNull(map,"data");
        if (data != null) {
            return JSONUtils.getObjectList(data,"userConnections");
        }
        return Collections.emptyList();
    }

    private Map<String, Object> createConnection(HttpClient client) throws Exception {
        String input = Files.readString(new File(String.valueOf(scriptsPath), createConnection).toPath());
        Map<String, Object> map = doPost(input, client);
        Map<String, Object> data =  JSONUtils.getObjectOrNull(map,"data");
        if (data != null) {
            return JSONUtils.getObjectOrNull(data,"createConnection");
        }
        return Collections.emptyMap();
    }

    private boolean deleteConnection(HttpClient client, String connectionId) throws Exception {
        String input = Files.readString(new File(String.valueOf(scriptsPath), deleteConnection).toPath())
            .replace("createdConnectionId", connectionId);
        Map<String, Object> map = doPost(input, client);
        Map<String, Object> data =  JSONUtils.getObjectOrNull(map,"data");
        if (data != null) {
            return JSONUtils.getBoolean(data, "deleteConnection");
        }
        return false;
    }
}

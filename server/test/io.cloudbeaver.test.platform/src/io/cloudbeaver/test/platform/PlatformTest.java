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

import io.cloudbeaver.server.CBApplication;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Objects;

public class PlatformTest {

    Thread thread;
    CBApplication testApp;
    String gqlApiUrl = "http://localhost:8978/api/gql";

    @Before
    public void setUp() throws Exception {
    }

    @After
    public void tearDown() throws Exception {
    }

    @Test
    public void testPlatformPresence() {
        try {
            System.out.println("Start CBApplication");
            CBApplication testApp = new CBApplication();
            thread = new Thread() {
                public void run() {
                    testApp.start(null);
                }
            };
            thread.start();
            Thread.sleep(1000);
            System.out.println("APP:: " + GeneralUtils.getProductTitle());
            //CBPlatform.setApplication(testApp);

            Thread.sleep(4000);
            Path defaultWorkingFolder = DBWorkbench.getPlatform().getApplication().getDefaultWorkingFolder();
            System.out.println("DBeaver application: " + defaultWorkingFolder);

            Path scriptsPath = Path.of(testApp.getHomeDirectory().toString(), "/workspace/gql_scripts").toAbsolutePath();
            File file = scriptsPath.toFile();
            System.out.println(file.getAbsolutePath());
            if (file.isDirectory()) {
                System.out.println("and here");
                for (File filename : Objects.requireNonNull(file.listFiles())) {
                    doPost(filename);
                }
            }
            testApp.stop();
            thread.interrupt();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testCreateConnection() throws Exception {


    }

    private String doPost(File filename) throws Exception {
        String input = Files.readString(filename.toPath());
        System.out.println(input);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(gqlApiUrl))
            .POST(HttpRequest.BodyPublishers.ofString(input))
            .headers("Content-Type", "application/json")
            .build();


        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        return response.body();
    }

}

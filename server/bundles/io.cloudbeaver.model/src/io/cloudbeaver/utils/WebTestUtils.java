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

package io.cloudbeaver.utils;

import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class WebTestUtils {

    public static final String GQL_TEMPLATE_AUTH_LOGIN = "authLogin.json";

    public static String readScriptTemplate(String templateName, Path scriptsPath) throws Exception {
        Path templatePath = new File(String.valueOf(scriptsPath), templateName).toPath();
        return Files.readString(templatePath);
    }


    public static Map<String, Object> doPost(String apiUrl, String input, HttpClient client) throws Exception {
        return doPostWithHeaders(apiUrl, input, client, List.of());
    }

    public static Map<String, Object> doPostWithHeaders(
        String apiUrl,
        String input,
        HttpClient client,
        List<String> headers
    ) throws Exception {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .POST(HttpRequest.BodyPublishers.ofString(input))
            .setHeader("TE-Client-Version", GeneralUtils.getMajorVersion())
            .header("Content-Type", "application/json");

        if (!headers.isEmpty()) {
            requestBuilder.headers(headers.toArray(String[]::new));
        }
        HttpRequest request = requestBuilder.build();
        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        return new GsonBuilder().create().fromJson(
            response.body(),
            new TypeToken<Map<String, Object>>() {
            }.getType()
        );
    }

    public static boolean getServerStatus(HttpClient client, String apiUrl) {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .setHeader("TE-Client-Version", GeneralUtils.getMajorVersion())
            .GET()
            .build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    public static Map<String, Object> authenticateUser(HttpClient client, Path scriptsPath, String apiUrl) throws Exception {
        String input = WebTestUtils.readScriptTemplate(GQL_TEMPLATE_AUTH_LOGIN, scriptsPath);
        Map<String, Object> map = WebTestUtils.doPost(apiUrl, input, client);
        Map<String, Object> data = JSONUtils.getObjectOrNull(map, "data");
        if (data != null) {
            return JSONUtils.getObjectOrNull(data, "authInfo");
        }
        return Collections.emptyMap();
    }
}

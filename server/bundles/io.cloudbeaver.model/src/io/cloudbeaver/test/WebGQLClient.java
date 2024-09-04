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
package io.cloudbeaver.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GraphQL client for tests.
 */
public class WebGQLClient {
    private static final Gson gson = new GsonBuilder()
        .setPrettyPrinting()
        .create();
    public static final String GQL_AUTHENTICATE = """
        query authLogin($provider: ID!, $configuration: ID, $credentials: Object, $linkUser: Boolean, $forceSessionsLogout: Boolean) {
          result: authLogin(
            provider: $provider
            configuration: $configuration
            credentials: $credentials
            linkUser: $linkUser
            forceSessionsLogout: $forceSessionsLogout
          ) {
            authId
            authStatus
          }
        }""";

    @NotNull
    private final HttpClient httpClient;
    @NotNull
    private final String apiUrl;

    public WebGQLClient(@NotNull HttpClient httpClient, @NotNull String apiUrl) {
        this.httpClient = httpClient;
        this.apiUrl = apiUrl;
    }

    /**
     * Sends GraphQL request without additional headers
     *
     * @param query     GraphQL query
     * @param variables GraphQL query variables
     * @return GraphQL response
     */
    @NotNull
    public <T> T sendQuery(@NotNull String query, @Nullable Map<String, Object> variables) throws Exception {
        return sendQueryWithHeaders(query, variables, List.of());
    }

    /**
     * Sends GraphQL request without additional headers
     *
     * @param query     GraphQL query
     * @param variables GraphQL query variables
     * @param headers   HTTP request headers
     * @return GraphQL response
     */
    @NotNull
    public <T> T sendQueryWithHeaders(
        @NotNull String query,
        @Nullable Map<String, Object> variables,
        @NotNull List<String> headers
    ) throws Exception {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .POST(HttpRequest.BodyPublishers.ofString(makeGQLRequest(query, variables)))
            .setHeader("TE-Client-Version", GeneralUtils.getMajorVersion())
            .header("Content-Type", "application/json");
        if (!headers.isEmpty()) {
            requestBuilder.headers(headers.toArray(String[]::new));
        }
        HttpRequest request = requestBuilder.build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        Map<String, Object> body = gson.fromJson(
            response.body(),
            JSONUtils.MAP_TYPE_TOKEN
        );
        if (body.containsKey("errors")) {
            String message = JSONUtils.getString(JSONUtils.getObjectList(body, "errors").get(0), "message");
            throw new DBException(message);
        }
        // graphql response will be in "data" key
        return (T) JSONUtils.getObject(body, "data").get("result");
    }

    @NotNull
    private String makeGQLRequest(@NotNull String text, @Nullable Map<String, Object> variables) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("query", text);
        if (variables != null && !variables.isEmpty()) {
            request.put("variables", variables);
        }

        return gson.toJson(request, Map.class);
    }
}

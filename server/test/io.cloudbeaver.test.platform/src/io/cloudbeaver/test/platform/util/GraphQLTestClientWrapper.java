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
package io.cloudbeaver.test.platform.util;

import io.cloudbeaver.WebSessionGlobalProjectImpl;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;
import org.junit.jupiter.api.Assertions;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static io.cloudbeaver.test.platform.util.GraphQLTestConstant.*;


public class GraphQLTestClientWrapper {

    @NotNull
    private final WebGQLClient client;

    public GraphQLTestClientWrapper(@NotNull WebGQLClient client) {
        this.client = client;
    }

    @NotNull
    public String readTaskResultId(@NotNull String taskId) throws Exception {
        return readTaskResultId(
            taskId, (list) -> {
            }
        );
    }

    @NotNull
    public String readTaskResultId(
        @NotNull String taskId,
        @NotNull Consumer<List<Map<String, Object>>> assertHandler
    ) throws Exception {
        Map<String, Object> resultSet = readTaskResultSet(taskId);
        List<Map<String, Object>> rowsWithMetaData = JSONUtils.getObjectList(resultSet, "rowsWithMetaData");
        assertHandler.accept(rowsWithMetaData);
        return String.valueOf(resultSet.get("id"));
    }

    @NotNull
    public Map<String, Object> readTaskResultSet(
        @NotNull String taskId
    ) throws Exception {
        Map<String, Object> resVars = new HashMap<>();
        resVars.put("taskId", taskId);
        Map<String, Object> resResp = client.sendQuery(GQL_ASYNC_SQL_EXECUTE_RESULTS, resVars);
        List<Map<String, Object>> resultsList = JSONUtils.getObjectList(resResp, "results");
        Map<String, Object> firstResult = resultsList.getFirst();
        return JSONUtils.getObject(firstResult, "resultSet");
    }

    public void waitTaskCompleted(@NotNull String taskId) throws Exception {
        Map<String, Object> taskInfoVars = new HashMap<>();
        taskInfoVars.put("id", taskId);
        taskInfoVars.put("removeOnFinish", false);
        String taskStatus = null;
        int attempts = 0;
        int maxAttempts = 20;
        while (attempts++ < maxAttempts) {
            Map<String, Object> taskInfo = client.sendQuery(GQL_ASYNC_TASK_INFO, taskInfoVars);
            if (taskInfo != null) {
                Object st = taskInfo.get("status");
                if (st != null) {
                    taskStatus = String.valueOf(st);
                }
                if (taskStatus != null) {
                    if (taskStatus.equalsIgnoreCase("FINISHED")) {
                        break;
                    }
                    Object error = taskInfo.get("error");
                    if (error != null && CommonUtils.isNotEmpty(error.toString())) {
                        throw new IllegalStateException("Async task failed: " + error);
                    }
                }
            }
            Thread.sleep(200);
        }
    }

    @NotNull
    public String asyncReadDataFromContainer(
        @NotNull WebSessionGlobalProjectImpl globalProject,
        @NotNull WebSQLContextInfo sqlProcessorContext,
        @NotNull String databaseContainerId,
        @NotNull String nodePath,
        @NotNull Map<String, Object> filter
    ) throws Exception {
        Map<String, Object> execVars = new HashMap<>();
        execVars.put("projectId", globalProject.getId());
        execVars.put("contextId", sqlProcessorContext.getId());
        execVars.put("connectionId", databaseContainerId);
        execVars.put("containerNodePath", nodePath);
        execVars.put("filter", filter);
        Map<String, Object> readResp = client.sendQuery(GQL_ASYNC_READ_DATA_FROM_CONTAINER, execVars);
        Assertions.assertNotNull(readResp);
        Object taskIdObj = readResp.get("id");
        Assertions.assertNotNull(taskIdObj, "asyncReadDataFromContainer must return task id");
        return taskIdObj.toString();
    }

    @NotNull
    public String asyncSqlExecute(
        @NotNull WebSessionGlobalProjectImpl globalProject,
        @NotNull WebSQLContextInfo sqlProcessorContext,
        @NotNull String databaseContainerId,
        @NotNull String sql
    ) throws Exception {
        Map<String, Object> execVars = new HashMap<>();
        execVars.put("projectId", globalProject.getId());
        execVars.put("connectionId", databaseContainerId);
        execVars.put("contextId", sqlProcessorContext.getId());
        execVars.put("sql", sql);
        Map<String, Object> readResp = client.sendQuery(GQL_ASYNC_SQL_EXECUTE, execVars);
        Assertions.assertNotNull(readResp);
        Object taskIdObj = readResp.get("id");
        Assertions.assertNotNull(taskIdObj, "asyncSqlExecute must return task id");
        return taskIdObj.toString();
    }

    public String openSession() throws Exception {
        Map<String, Object> openVars = new HashMap<>();
        openVars.put("defaultLocale", "en");
        Map<String, Object> bodyAndHeaders = client.sendQueryAndGetHeaders(GQL_OPEN_SESSION, openVars, Map.of());
        Map<String, Object> headers = JSONUtils.getObject(bodyAndHeaders, "headers");
        String cookie = JSONUtils.getString(headers, "Set-Cookie");
        Map<String, String> cookieMap = parseCookies(cookie);
        return cookieMap.get("cb-session-id");
    }

    private Map<String, String> parseCookies(String cookie) {
        Map<String, String> result = new HashMap<>();
        if (cookie == null) {
            return result;
        }

        String trimmedCookie = cookie.trim();
        // Handle cases when cookie string is wrapped in [ ... ]
        if (trimmedCookie.startsWith("[") && trimmedCookie.endsWith("]") && trimmedCookie.length() >= 2) {
            trimmedCookie = trimmedCookie.substring(1, trimmedCookie.length() - 1).trim();
        }
        if (trimmedCookie.isEmpty()) {
            return result;
        }

        // Example: "cb-session-id=1as6ho3pnnonsmeh02uxevmhu0; Path=/; Expires=...; HttpOnly"
        String[] parts = trimmedCookie.split(";\\s*");
        for (String part : parts) {
            String p = part.trim();
            if (p.isEmpty()) {
                continue;
            }
            int eqPos = p.indexOf('=');
            if (eqPos <= 0) {
                // attributes like HttpOnly, Secure, etc. (no '=')
                continue;
            }
            String name = p.substring(0, eqPos);
            String value = p.substring(eqPos + 1);
            result.put(name, value);
        }
        return result;
    }

}

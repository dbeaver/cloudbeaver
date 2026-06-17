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
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class DataFilterConstraintsTest extends CloudbeaverDBTest {

    private static final String GQL_NAV_STRUCT_CONTAINERS = """
        query navGetStructContainers($projectId: ID, $connectionId: ID!) {
          result: navGetStructContainers(projectId: $projectId, connectionId: $connectionId) {
            parentNode { uri }
          }
        }""";

    private static final String GQL_NAV_NODE_CHILDREN = """
        query navNodeChildren($parentPath: ID!) {
          result: navNodeChildren(parentPath: $parentPath) {
            uri
            name
            folder
            hasChildren
          }
        }""";

    private static WebSQLContextInfo sqlProcessorContext;

    @BeforeEach
    public void prepareTables() throws Exception {
        try (JDBCStatement stmt = databaseSession.createStatement()) {
            Assertions.assertFalse(stmt.execute("CREATE TABLE TEST_TABLE (id IDENTITY NOT NULL PRIMARY KEY, text_column VARCHAR)"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (text_column) VALUES ('value_1')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (text_column) VALUES ('value_2')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (text_column) VALUES ('value_3')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (text_column) VALUES (null)"));
        }
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        sqlProcessorContext = sqlProcessor.createContext(
            null, "PUBLIC", globalProject.getId()
        );
    }

    @Test
    public void shouldApplyEqualsDataFilter() throws Exception {
        // Given
        Map<String, Object> textConstraint = new HashMap<>();
        textConstraint.put("attributeName", "TEXT_COLUMN");
        textConstraint.put("operator", "EQUALS");
        textConstraint.put("value", "value_2");
        Map<String, Object> dataFilter = Map.of(
            "limit", 200,
            "offset", 0,
            "constraints", List.of(textConstraint)
        );
        String taskId = clientWrapper.asyncReadDataFromContainer(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            resolveNodePath(),
            dataFilter
        );
        clientWrapper.waitTaskCompleted(taskId);

        // When
        Map<String, Object> response = clientWrapper.readTaskResultSet(taskId);

        // Then
        List<Map<String, Object>> rows = JSONUtils.getObjectList(response, "rowsWithMetaData");
        Assertions.assertEquals(1, rows.size());
        String responseJson = JSONUtils.GSON.toJson(response);
        Assertions.assertFalse(responseJson.contains("value_1"));
        Assertions.assertTrue(responseJson.contains("value_2"));
        Assertions.assertFalse(responseJson.contains("value_3"));
    }

    @Test
    public void shouldApplyNonEqualsDataFilter() throws Exception {
        // Given
        Map<String, Object> textConstraint = new HashMap<>();
        textConstraint.put("attributeName", "TEXT_COLUMN");
        textConstraint.put("operator", "NOT_EQUALS");
        textConstraint.put("value", "value_3");
        Map<String, Object> dataFilter = Map.of(
            "limit", 200,
            "offset", 0,
            "constraints", List.of(textConstraint)
        );
        String taskId = clientWrapper.asyncReadDataFromContainer(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            resolveNodePath(),
            dataFilter
        );
        clientWrapper.waitTaskCompleted(taskId);

        // When
        Map<String, Object> response = clientWrapper.readTaskResultSet(taskId);

        // Then
        List<Map<String, Object>> rows = JSONUtils.getObjectList(response, "rowsWithMetaData");
        Assertions.assertEquals(2, rows.size());
        String responseJson = JSONUtils.GSON.toJson(response);
        Assertions.assertTrue(responseJson.contains("value_1"));
        Assertions.assertTrue(responseJson.contains("value_2"));
        Assertions.assertFalse(responseJson.contains("value_3"));
    }

    @Test
    public void shouldApplyIsNullsDataFilter() throws Exception {
        // Given
        Map<String, Object> textConstraint = new HashMap<>();
        textConstraint.put("attributeName", "TEXT_COLUMN");
        textConstraint.put("operator", "IS_NULL");
        Map<String, Object> dataFilter = Map.of(
            "limit", 200,
            "offset", 0,
            "constraints", List.of(textConstraint)
        );
        String taskId = clientWrapper.asyncReadDataFromContainer(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            resolveNodePath(),
            dataFilter
        );
        clientWrapper.waitTaskCompleted(taskId);

        // When
        Map<String, Object> response = clientWrapper.readTaskResultSet(taskId);

        // Then
        List<Map<String, Object>> rows = JSONUtils.getObjectList(response, "rowsWithMetaData");
        Assertions.assertEquals(1, rows.size());
        String responseJson = JSONUtils.GSON.toJson(response);
        Assertions.assertFalse(responseJson.contains("value_1"));
        Assertions.assertFalse(responseJson.contains("value_2"));
        Assertions.assertFalse(responseJson.contains("value_3"));
    }

    /**
     * Resolves the real navigator node URI of the table by browsing the tree, instead of guessing
     * the path. Browsing also materializes the node so that {@code asyncReadDataFromContainer} can
     * resolve it on the server side.
     */
    @NotNull
    private String resolveNodePath() throws Exception {
        String connectionNodeUri = findConnectionNodeUri();
        String tableNodeUri = findNodeUriByName(connectionNodeUri, "TEST_TABLE", 5);
        Assertions.assertNotNull(tableNodeUri, "TEST_TABLE navigator node not found");
        return tableNodeUri;
    }

    @NotNull
    private String findConnectionNodeUri() throws Exception {
        Map<String, Object> containers = client.sendQuery(
            GQL_NAV_STRUCT_CONTAINERS,
            Map.of("projectId", globalProject.getId(), "connectionId", databaseContainer.getId())
        );
        Assertions.assertNotNull(containers);
        String uri = JSONUtils.getString(JSONUtils.getObject(containers, "parentNode"), "uri");
        Assertions.assertNotNull(uri, "Connection navigator node not found");
        return uri;
    }

    @Nullable
    private String findNodeUriByName(@NotNull String parentUri, @NotNull String name, int maxDepth) throws Exception {
        List<Map<String, Object>> children = client.sendQuery(GQL_NAV_NODE_CHILDREN, Map.of("parentPath", parentUri));
        if (children == null) {
            return null;
        }
        for (Map<String, Object> child : children) {
            if (name.equals(JSONUtils.getString(child, "name"))) {
                return JSONUtils.getString(child, "uri");
            }
        }
        if (maxDepth > 0) {
            for (Map<String, Object> child : children) {
                if (JSONUtils.getBoolean(child, "folder") || JSONUtils.getBoolean(child, "hasChildren")) {
                    String found = findNodeUriByName(JSONUtils.getString(child, "uri"), name, maxDepth - 1);
                    if (found != null) {
                        return found;
                    }
                }
            }
        }
        return null;
    }

}

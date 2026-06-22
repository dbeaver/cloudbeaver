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

import io.cloudbeaver.WebSessionGlobalProjectImpl;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.cloudbeaver.test.platform.util.GraphQLTestConstant.GQL_SQL_GROUPING_RESULTSET;


public class GroupingEndpointTest extends CloudbeaverDBTest {

    @BeforeEach
    public void prepareTables() throws SQLException {
        try (JDBCStatement stmt = databaseSession.createStatement()) {

            Assertions.assertFalse(stmt.execute(
                "CREATE TABLE GROUP_DATA (id IDENTITY PRIMARY KEY, C VARCHAR(128), USER_NAME VARCHAR(128))"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupA','alice')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupA','bob')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupA','alice')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupA','carol')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupB','dave')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupB','ellen')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupB','dave')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupC','frank')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupC','george')"));
            Assertions.assertFalse(stmt.execute(
                "INSERT INTO GROUP_DATA (C, USER_NAME) VALUES ('groupC','frank')"));
        }
    }

    @Test
    public void sqlGrouping_whenGroupingByOneColumn_thenReturn() throws Exception {

        //GIVEN
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT C, USER_NAME FROM GROUP_DATA"
        );
        clientWrapper.waitTaskCompleted(taskId);
        String resultId = clientWrapper.readTaskResultId(taskId);

        //WHEN
        Map<String, Object> groupResponse = callGroupingSql(globalProject, sqlProcessorContext, resultId, List.of("C"));

        //THEN
        Assertions.assertNotNull(groupResponse);
        String sqlGroupingTaskId = (String) groupResponse.get("id");
        Assertions.assertNotNull(sqlGroupingTaskId);
        clientWrapper.waitTaskCompleted(sqlGroupingTaskId);
        clientWrapper.readTaskResultId(
            sqlGroupingTaskId, rowsWithMetadata -> {
                Assertions.assertNotNull(rowsWithMetadata);
                Assertions.assertFalse(rowsWithMetadata.isEmpty());
                Assertions.assertEquals(3, rowsWithMetadata.size());
                for (Map<String, Object> row : rowsWithMetadata) {
                    List<String> data = JSONUtils.getStringList(row, "data");
                    String groupName = data.get(0);
                    int count = Integer.parseInt(data.get(1));
                    switch (groupName) {
                        case "groupA" -> Assertions.assertEquals(4, count);
                        case "groupB" -> Assertions.assertEquals(3, count);
                        case "groupC" -> Assertions.assertEquals(3, count);
                        default -> throw new IllegalStateException("Unexpected group name: " + groupName);
                    }
                }
            }
        );
    }

    @Test
    public void sqlGrouping_whenGroupingByTwoColumns_thenReturn() throws Exception {

        // GIVEN
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT C, USER_NAME FROM GROUP_DATA"
        );
        clientWrapper.waitTaskCompleted(taskId);
        String resultId = clientWrapper.readTaskResultId(taskId);

        // WHEN
        Map<String, Object> groupResponse = callGroupingSql(globalProject, sqlProcessorContext, resultId, List.of("C", "USER_NAME"));

        // THEN
        Assertions.assertNotNull(groupResponse);
        String sqlGroupingTaskId = (String) groupResponse.get("id");
        Assertions.assertNotNull(sqlGroupingTaskId);
        clientWrapper.waitTaskCompleted(sqlGroupingTaskId);
        clientWrapper.readTaskResultId(
            sqlGroupingTaskId, rowsWithMetadata -> {
                Assertions.assertNotNull(rowsWithMetadata);
                Assertions.assertFalse(rowsWithMetadata.isEmpty());
                Assertions.assertEquals(7, rowsWithMetadata.size());
                for (Map<String, Object> row : rowsWithMetadata) {
                    List<String> data = JSONUtils.getStringList(row, "data");
                    Assertions.assertEquals(3, data.size(), "Unexpected grouping row size");
                    String groupName = data.get(0);
                    String userName = data.get(1);
                    int count = Integer.parseInt(data.get(2));
                    String key = groupName + ":" + userName;
                    switch (key) {
                        case "groupA:alice" -> Assertions.assertEquals(2, count);
                        case "groupA:bob" -> Assertions.assertEquals(1, count);
                        case "groupA:carol" -> Assertions.assertEquals(1, count);
                        case "groupB:dave" -> Assertions.assertEquals(2, count);
                        case "groupB:ellen" -> Assertions.assertEquals(1, count);
                        case "groupC:frank" -> Assertions.assertEquals(2, count);
                        case "groupC:george" -> Assertions.assertEquals(1, count);
                        default -> throw new IllegalStateException("Unexpected group key: " + key);
                    }
                }
            }
        );
    }

    @NotNull
    private Map<String, Object> callGroupingSql(
        @NotNull WebSessionGlobalProjectImpl globalProject,
        @NotNull WebSQLContextInfo sqlProcessorContext,
        @NotNull String resultId,
        @NotNull List<String> columnNames
    ) throws Exception {
        Map<String, Object> groupVars = new HashMap<>();
        groupVars.put("projectId", globalProject.getId());
        groupVars.put("contextId", sqlProcessorContext.getId());
        groupVars.put("connectionId", databaseContainer.getId());
        groupVars.put("resultsId", resultId);
        groupVars.put("columnNames", columnNames);
        groupVars.put("functions", List.of("COUNT(*)"));
        groupVars.put("showDuplicatesOnly", false);
        groupVars.put("filter", null);
        groupVars.put("dataFormat", null);
        groupVars.put("isInteractive", false);

        return client.sendQuery(GQL_SQL_GROUPING_RESULTSET, groupVars);
    }

}

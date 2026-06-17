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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class DataFilterConstraintsTest extends CloudbeaverDBTest {

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

    @NotNull
    private String resolveNodePath() throws Exception {
        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        DBNModel navigatorModel = webSession.getNavigatorModelOrThrow();

        DBNProject projectNode = navigatorModel.getRoot().getProjectNode(globalProject);
        Assertions.assertNotNull(projectNode, "Project navigator node not found");
        projectNode.getDatabases().getChildren(monitor);

        DBSObjectContainer rootContainer = DBUtils.getAdapter(DBSObjectContainer.class, webConnectionInfo.getDataSource());
        Assertions.assertNotNull(rootContainer, "Connection is not a database object container");
        DBSEntity table = findEntity(monitor, rootContainer, "TEST_TABLE", 4);
        Assertions.assertNotNull(table, "TEST_TABLE entity not found");

        DBNDatabaseNode tableNode = navigatorModel.getNodeByObject(monitor, table, true);
        Assertions.assertNotNull(tableNode, "Navigator node for TEST_TABLE not found");
        return tableNode.getNodeUri();
    }

    @Nullable
    private DBSEntity findEntity(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBSObjectContainer container,
        @NotNull String name,
        int depth
    ) throws DBException {
        DBSObject direct = container.getChild(monitor, name);
        if (direct instanceof DBSEntity entity) {
            return entity;
        }
        if (depth <= 0) {
            return null;
        }
        Collection<? extends DBSObject> children = container.getChildren(monitor);
        if (children == null) {
            return null;
        }
        for (DBSObject child : children) {
            if (child instanceof DBSObjectContainer sub) {
                DBSEntity found = findEntity(monitor, sub, name, depth - 1);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }

}

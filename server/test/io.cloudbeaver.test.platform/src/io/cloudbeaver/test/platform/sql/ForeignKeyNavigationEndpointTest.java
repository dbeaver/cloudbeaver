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
import io.cloudbeaver.test.platform.util.GraphQLTestConstant;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.DBCLogicalOperator;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ForeignKeyNavigationEndpointTest extends CloudbeaverDBTest {

    @BeforeEach
    public void prepareTables() throws Exception {
        try (JDBCStatement stmt = databaseSession.createStatement()) {
            Assertions.assertFalse(stmt.execute("DROP TABLE IF EXISTS FK_NAV_ORDER"));
            Assertions.assertFalse(stmt.execute("DROP TABLE IF EXISTS FK_NAV_CUSTOMER"));
            Assertions.assertFalse(stmt.execute("CREATE TABLE FK_NAV_CUSTOMER (ID INT PRIMARY KEY, NAME VARCHAR(128))"));
            Assertions.assertFalse(stmt.execute("""
                CREATE TABLE FK_NAV_ORDER (
                    ID INT PRIMARY KEY,
                    CUSTOMER_ID INT NOT NULL,
                    CONSTRAINT FK_NAV_ORDER_CUSTOMER FOREIGN KEY (CUSTOMER_ID) REFERENCES FK_NAV_CUSTOMER(ID)
                )
                """));
            Assertions.assertFalse(stmt.execute("INSERT INTO FK_NAV_CUSTOMER (ID, NAME) VALUES (1, 'Alice')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO FK_NAV_CUSTOMER (ID, NAME) VALUES (2, 'Bob')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO FK_NAV_ORDER (ID, CUSTOMER_ID) VALUES (10, 1)"));
            Assertions.assertFalse(stmt.execute("INSERT INTO FK_NAV_ORDER (ID, CUSTOMER_ID) VALUES (11, 2)"));
        }
        DBNModel navigatorModel = webSession.getNavigatorModelOrThrow();
        DBNProject projectNode = navigatorModel.getRoot().getProjectNode(globalProject);
        Assertions.assertNotNull(projectNode, "Project navigator node not found");
        projectNode.getDatabases().getChildren(monitor);
    }

    @Test
    public void shouldReadReferencedRowByForeignKeyCell() throws Exception {
        // Given
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT ID, CUSTOMER_ID FROM FK_NAV_ORDER ORDER BY ID"
        );
        clientWrapper.waitTaskCompleted(taskId);

        Map<String, Object> orderResultSet = clientWrapper.readTaskResultSet(taskId);
        Map<String, Object> forwardRef = fetchFirstReference(sqlProcessorContext, orderResultSet, false);
        Assertions.assertNotNull(forwardRef, "Forward FK is missing on FK_NAV_ORDER result set");
        Assertions.assertEquals("FK_NAV_ORDER_CUSTOMER", JSONUtils.getString(forwardRef, "associationName"));
        Assertions.assertEquals("FK_NAV_CUSTOMER", JSONUtils.getString(forwardRef, "targetEntityName"));
        Assertions.assertEquals("PUBLIC", JSONUtils.getString(forwardRef, "targetSchemaName"));
        Assertions.assertNotNull(JSONUtils.getString(forwardRef, "targetNodePath"));

        List<Map<String, Object>> orderRows = JSONUtils.getObjectList(orderResultSet, "rowsWithMetaData");
        Assertions.assertEquals(2, orderRows.size());
        Map<String, Object> orderRow = orderRows.getFirst();

        // When
        Map<String, Object> customerResultSet = navigateByReference(sqlProcessorContext, forwardRef, orderRow);

        // Then
        List<Map<String, Object>> customerRows = JSONUtils.getObjectList(customerResultSet, "rowsWithMetaData");
          
        List<?> customerData = (List<?>) customerRows.getFirst().get("data");
        Assertions.assertEquals("1", String.valueOf(customerData.get(0)));
        Assertions.assertEquals("Alice", customerData.get(1));
    }

    @Test
    public void shouldExposeReverseReferenceOnReferencedColumn() throws Exception {
        // Given
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT ID, NAME FROM FK_NAV_CUSTOMER ORDER BY ID"
        );
        clientWrapper.waitTaskCompleted(taskId);

        Map<String, Object> customerResultSet = clientWrapper.readTaskResultSet(taskId);

        // Then
        List<Map<String, Object>> references = fetchReferences(sqlProcessorContext, customerResultSet, true);
        Assertions.assertFalse(references.isEmpty(), "Reverse reference is missing on FK_NAV_CUSTOMER result set");
        Map<String, Object> reverseRef = references.getFirst();
        Assertions.assertEquals("FK_NAV_ORDER_CUSTOMER", JSONUtils.getString(reverseRef, "associationName"));
        Assertions.assertEquals("FK_NAV_ORDER", JSONUtils.getString(reverseRef, "targetEntityName"));
        Assertions.assertEquals("PUBLIC", JSONUtils.getString(reverseRef, "targetSchemaName"));

        List<Map<String, Object>> mapping = JSONUtils.getObjectList(reverseRef, "columnMapping");
        Assertions.assertEquals(1, mapping.size());
        Assertions.assertEquals(0, ((Number) mapping.getFirst().get("sourceColumnIndex")).intValue());
        Assertions.assertEquals("CUSTOMER_ID", mapping.getFirst().get("targetColumnName"));

        Assertions.assertTrue(
            fetchReferences(sqlProcessorContext, customerResultSet, false).isEmpty(),
            "FK_NAV_CUSTOMER result set should not expose any forward associations"
        );
    }

    @Test
    public void shouldNavigateReverseReferenceFromParentRow() throws Exception {
        // Given
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT ID, NAME FROM FK_NAV_CUSTOMER ORDER BY ID"
        );
        clientWrapper.waitTaskCompleted(taskId);

        Map<String, Object> customerResultSet = clientWrapper.readTaskResultSet(taskId);
        Map<String, Object> reverseRef = fetchFirstReference(sqlProcessorContext, customerResultSet, true);
        Assertions.assertNotNull(reverseRef, "Reverse reference is missing");

        List<Map<String, Object>> customerRows = JSONUtils.getObjectList(customerResultSet, "rowsWithMetaData");
        Assertions.assertEquals(2, customerRows.size());
        Map<String, Object> aliceRow = customerRows.getFirst();

        // When
        Map<String, Object> orderResultSet = navigateByReference(sqlProcessorContext, reverseRef, aliceRow);

        // Then
        List<Map<String, Object>> orderRows = JSONUtils.getObjectList(orderResultSet, "rowsWithMetaData");
        Assertions.assertEquals(1, orderRows.size());
        List<?> orderData = (List<?>) orderRows.getFirst().get("data");
        Assertions.assertEquals("10", String.valueOf(orderData.get(0)));
        Assertions.assertEquals("1", String.valueOf(orderData.get(1)));
    }

    private List<Map<String, Object>> fetchReferences(
        WebSQLContextInfo sqlProcessorContext,
        Map<String, Object> resultSet,
        boolean isReference
    ) throws Exception {
        Map<String, Object> vars = new HashMap<>();
        vars.put("projectId", globalProject.getId());
        vars.put("connectionId", databaseContainer.getId());
        vars.put("contextId", sqlProcessorContext.getId());
        vars.put("resultsId", String.valueOf(resultSet.get("id")));
        vars.put("isReference", isReference);
        List<Map<String, Object>> references = client.sendQuery(GraphQLTestConstant.GQL_SQL_RESULT_ASSOCIATIONS, vars);
        return references == null ? List.of() : references;
    }

    private Map<String, Object> fetchFirstReference(
        WebSQLContextInfo sqlProcessorContext,
        Map<String, Object> resultSet,
        boolean isReference
    ) throws Exception {
        List<Map<String, Object>> refs = fetchReferences(sqlProcessorContext, resultSet, isReference);
        return refs.isEmpty() ? null : refs.getFirst();
    }

    @NotNull
    private Map<String, Object> navigateByReference(
        @NotNull WebSQLContextInfo sqlProcessorContext,
        @NotNull Map<String, Object> reference,
        @NotNull Map<String, Object> sourceRow
    ) throws Exception {
        String containerNodePath = JSONUtils.getString(reference, "targetNodePath");

        String openTaskId = clientWrapper.asyncReadDataFromContainer(
            globalProject, sqlProcessorContext, databaseContainer.getId(), containerNodePath, Map.of());
        clientWrapper.waitTaskCompleted(openTaskId);
        Map<String, Object> openedResultSet = clientWrapper.readTaskResultSet(openTaskId);
        String resultId = String.valueOf(openedResultSet.get("id"));

        List<?> rowData = (List<?>) sourceRow.get("data");
        List<Map<String, Object>> mapping = JSONUtils.getObjectList(reference, "columnMapping");
        List<Map<String, Object>> constraints = new ArrayList<>();
        for (Map<String, Object> pair : mapping) {
            int sourceIdx = ((Number) pair.get("sourceColumnIndex")).intValue();
            String targetCol = (String) pair.get("targetColumnName");
            Map<String, Object> constraint = new HashMap<>();
            constraint.put("attributePosition", findColumnPosition(openedResultSet, targetCol));
            constraint.put("attributeName", targetCol);
            constraint.put("operator", DBCLogicalOperator.EQUALS.getId());
            constraint.put("value", rowData.get(sourceIdx));
            constraints.add(constraint);
        }
        Map<String, Object> filter = new HashMap<>();
        filter.put("constraints", constraints);

        Map<String, Object> vars = new HashMap<>();
        vars.put("projectId", globalProject.getId());
        vars.put("connectionId", databaseContainer.getId());
        vars.put("contextId", sqlProcessorContext.getId());
        vars.put("containerNodePath", containerNodePath);
        vars.put("resultId", resultId);
        vars.put("filter", filter);

        Map<String, Object> response = client.sendQuery(GraphQLTestConstant.GQL_ASYNC_READ_DATA_FROM_CONTAINER, vars);
        Assertions.assertNotNull(response);
        String navTaskId = JSONUtils.getString(response, "id");
        Assertions.assertNotNull(navTaskId);
        clientWrapper.waitTaskCompleted(navTaskId);
        return clientWrapper.readTaskResultSet(navTaskId);
    }

    private static int findColumnPosition(Map<String, Object> resultSet, String columnName) {
        List<Map<String, Object>> columns = JSONUtils.getObjectList(resultSet, "columns");
        for (int i = 0; i < columns.size(); i++) {
            if (columnName.equals(JSONUtils.getString(columns.get(i), "name"))) {
                return i;
            }
        }
        throw new IllegalStateException("Column '" + columnName + "' not found in target result set");
    }
}

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
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ForeignKeyNavigationEndpointTest extends CloudbeaverDBTest {

    @BeforeEach
    public void prepareTables() throws SQLException {
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
    }

    @Test
    public void shouldReadReferencedRowByForeignKeyCell() throws Exception {
        // Given: an order result set exposing a forward FK from CUSTOMER_ID to FK_NAV_CUSTOMER.
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
        List<Map<String, Object>> associations = JSONUtils.getObjectList(orderResultSet, "associations");
        Assertions.assertFalse(associations.isEmpty(), "Forward FK is missing on FK_NAV_ORDER result set");
        Map<String, Object> forwardRef = associations.getFirst();
        Assertions.assertEquals("FK_NAV_ORDER_CUSTOMER", JSONUtils.getString(forwardRef, "associationName"));
        Assertions.assertTrue(
            JSONUtils.getString(forwardRef, "targetEntityName").contains("FK_NAV_CUSTOMER"),
            "Forward target should be FK_NAV_CUSTOMER"
        );

        List<Map<String, Object>> orderRows = JSONUtils.getObjectList(orderResultSet, "rowsWithMetaData");
        Assertions.assertEquals(2, orderRows.size());
        Map<String, Object> orderRow = orderRows.getFirst();

        // When: navigating from the FK cell value to the referenced customer row.
        int columnIndex = asIntegerList(forwardRef.get("columnIndexList")).getFirst();
        Map<String, Object> navigateVars = new HashMap<>();
        navigateVars.put("projectId", globalProject.getId());
        navigateVars.put("connectionId", databaseContainer.getId());
        navigateVars.put("contextId", sqlProcessorContext.getId());
        navigateVars.put("resultsId", String.valueOf(orderResultSet.get("id")));
        navigateVars.put("row", orderRow);
        navigateVars.put("columnIndex", columnIndex);
        navigateVars.put("associationName", JSONUtils.getString(forwardRef, "associationName"));
        navigateVars.put("isReference", false);
        navigateVars.put("dataFormat", null);

        Map<String, Object> navigateResponse = client.sendQuery(GraphQLTestConstant.GQL_ASYNC_SQL_NAVIGATE_FOREIGN_KEY, navigateVars);
        Assertions.assertNotNull(navigateResponse);
        String navigateTaskId = JSONUtils.getString(navigateResponse, "id");
        Assertions.assertNotNull(navigateTaskId);
        clientWrapper.waitTaskCompleted(navigateTaskId);

        // Then: the navigation result contains only the referenced customer.
        Map<String, Object> customerResultSet = clientWrapper.readTaskResultSet(navigateTaskId);
        List<Map<String, Object>> customerRows = JSONUtils.getObjectList(customerResultSet, "rowsWithMetaData");
        Assertions.assertEquals(1, customerRows.size());
        List<?> customerData = (List<?>) customerRows.getFirst().get("data");
        Assertions.assertEquals("1", String.valueOf(customerData.get(0)));
        Assertions.assertEquals("Alice", customerData.get(1));
    }

    @Test
    public void shouldExposeReverseReferenceOnReferencedColumn() throws Exception {
        // Given: a customer result set; FK_NAV_ORDER.CUSTOMER_ID references FK_NAV_CUSTOMER.ID.
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

        // Then: result set carries a reverse reference describing the FK from FK_NAV_ORDER,
        // attached to the PK column (ID at index 0) via columnIndexList.
        List<Map<String, Object>> references = JSONUtils.getObjectList(customerResultSet, "references");
        Assertions.assertFalse(references.isEmpty(), "Reverse reference is missing on FK_NAV_CUSTOMER result set");
        Map<String, Object> reverseRef = references.getFirst();
        Assertions.assertEquals("FK_NAV_ORDER_CUSTOMER", JSONUtils.getString(reverseRef, "associationName"));
        String reverseTarget = JSONUtils.getString(reverseRef, "targetEntityName");
        Assertions.assertNotNull(reverseTarget);
        Assertions.assertTrue(
            reverseTarget.contains("FK_NAV_ORDER"),
            "Reverse reference target should point to the referencing entity FK_NAV_ORDER, got: " + reverseTarget
        );
        // Reverse ref targets the PK column ID at index 0
        Assertions.assertEquals(List.of(0), asIntegerList(reverseRef.get("columnIndexList")));

        Assertions.assertTrue(
            JSONUtils.getObjectList(customerResultSet, "associations").isEmpty(),
            "FK_NAV_CUSTOMER result set should not expose any forward associations"
        );
    }

    @Test
    public void shouldNavigateReverseReferenceFromParentRow() throws Exception {
        // Given: a customer result set positioned on Alice (ID=1).
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
        List<Map<String, Object>> references = JSONUtils.getObjectList(customerResultSet, "references");
        Assertions.assertFalse(references.isEmpty(), "Reverse reference is missing");
        Map<String, Object> reverseRef = references.getFirst();

        List<Map<String, Object>> customerRows = JSONUtils.getObjectList(customerResultSet, "rowsWithMetaData");
        Assertions.assertEquals(2, customerRows.size());
        Map<String, Object> aliceRow = customerRows.getFirst();

        // When: navigating using any one of columnIndexList to identify the source entity.
        int columnIndex = asIntegerList(reverseRef.get("columnIndexList")).getFirst();
        Map<String, Object> navigateVars = new HashMap<>();
        navigateVars.put("projectId", globalProject.getId());
        navigateVars.put("connectionId", databaseContainer.getId());
        navigateVars.put("contextId", sqlProcessorContext.getId());
        navigateVars.put("resultsId", String.valueOf(customerResultSet.get("id")));
        navigateVars.put("row", aliceRow);
        navigateVars.put("columnIndex", columnIndex);
        navigateVars.put("associationName", JSONUtils.getString(reverseRef, "associationName"));
        navigateVars.put("isReference", true);
        navigateVars.put("dataFormat", null);

        Map<String, Object> navigateResponse = client.sendQuery(GraphQLTestConstant.GQL_ASYNC_SQL_NAVIGATE_FOREIGN_KEY, navigateVars);
        Assertions.assertNotNull(navigateResponse);
        String navigateTaskId = JSONUtils.getString(navigateResponse, "id");
        Assertions.assertNotNull(navigateTaskId);
        clientWrapper.waitTaskCompleted(navigateTaskId);

        // Then: navigation returns Alice's single order (ID=10, CUSTOMER_ID=1).
        Map<String, Object> orderResultSet = clientWrapper.readTaskResultSet(navigateTaskId);
        List<Map<String, Object>> orderRows = JSONUtils.getObjectList(orderResultSet, "rowsWithMetaData");
        Assertions.assertEquals(1, orderRows.size());
        List<?> orderData = (List<?>) orderRows.getFirst().get("data");
        Assertions.assertEquals("10", String.valueOf(orderData.get(0)));
        Assertions.assertEquals("1", String.valueOf(orderData.get(1)));
    }

    private static List<Integer> asIntegerList(Object value) {
        List<?> raw = (List<?>) value;
        return raw.stream().map(n -> ((Number) n).intValue()).toList();
    }
}

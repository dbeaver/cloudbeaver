/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
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
import io.cloudbeaver.service.sql.WebSQLExecuteInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLResultsRow;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCResultSet;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WebSQLDataUpdateTest extends CloudbeaverDBTest {

    @Test
    public void webValuesAreConvertedAndPersisted() throws Exception {
        executeStatements(
            "CREATE TABLE SQL_VALUE_UPDATE (" +
                "ID INT PRIMARY KEY, NAME VARCHAR, AMOUNT DECIMAL(10,2), ACTIVE BOOLEAN, NOTE VARCHAR)",
            "INSERT INTO SQL_VALUE_UPDATE VALUES (1, 'before', 1.25, TRUE, 'note')"
        );

        Map<String, Object> updates = new HashMap<>();
        updates.put("1", "after");
        updates.put("2", "42.50");
        updates.put("3", false);
        updates.put("4", null);
        Object[] updatedRow = updateFirstRow(
            "SELECT ID, NAME, AMOUNT, ACTIVE, NOTE FROM SQL_VALUE_UPDATE",
            updates
        );

        Assertions.assertEquals("after", updatedRow[1]);
        Assertions.assertEquals("42.50", updatedRow[2]);
        Assertions.assertEquals(false, updatedRow[3]);
        Assertions.assertNull(updatedRow[4]);
        try (
            JDBCStatement statement = databaseSession.createStatement();
            JDBCResultSet resultSet = statement.executeQuery(
                "SELECT NAME, AMOUNT, ACTIVE, NOTE FROM SQL_VALUE_UPDATE WHERE ID = 1"
            )
        ) {
            Assertions.assertTrue(resultSet.next());
            Assertions.assertEquals("after", resultSet.getString(1));
            Assertions.assertEquals(new BigDecimal("42.50"), resultSet.getBigDecimal(2));
            Assertions.assertFalse(resultSet.getBoolean(3));
            Assertions.assertNull(resultSet.getString(4));
        }
    }

    @Test
    public void compositeKeyUpdateUsesOriginalIdentifierValues() throws Exception {
        executeStatements(
            "CREATE TABLE SQL_COMPOSITE_UPDATE (A INT, B VARCHAR, DATA_VALUE VARCHAR, PRIMARY KEY (A, B))",
            "INSERT INTO SQL_COMPOSITE_UPDATE VALUES (1, 'old-key', 'before')"
        );

        updateFirstRow(
            "SELECT A, B, DATA_VALUE FROM SQL_COMPOSITE_UPDATE",
            Map.of("1", "new-key", "2", "after")
        );

        try (
            JDBCStatement statement = databaseSession.createStatement();
            JDBCResultSet resultSet = statement.executeQuery(
                "SELECT B, DATA_VALUE FROM SQL_COMPOSITE_UPDATE WHERE A = 1"
            )
        ) {
            Assertions.assertTrue(resultSet.next());
            Assertions.assertEquals("new-key", resultSet.getString(1));
            Assertions.assertEquals("after", resultSet.getString(2));
            Assertions.assertFalse(resultSet.next());
        }
    }

    @Test
    public void untouchedArrayIsNotConvertedWhileUpdatingAnotherColumn() throws Exception {
        executeStatements(
            "CREATE TABLE SQL_ARRAY_UPDATE (ID INT PRIMARY KEY, ITEMS INTEGER ARRAY, LABEL VARCHAR)",
            "INSERT INTO SQL_ARRAY_UPDATE VALUES (1, ARRAY[1, 2, 3], 'before')"
        );

        updateFirstRow(
            "SELECT ID, ITEMS, LABEL FROM SQL_ARRAY_UPDATE",
            Map.of("2", "after")
        );

        try (
            JDBCStatement statement = databaseSession.createStatement();
            JDBCResultSet resultSet = statement.executeQuery(
                "SELECT ITEMS, LABEL FROM SQL_ARRAY_UPDATE WHERE ID = 1"
            )
        ) {
            Assertions.assertTrue(resultSet.next());
            Assertions.assertArrayEquals(new Object[] {1, 2, 3}, (Object[]) resultSet.getArray(1).getArray());
            Assertions.assertEquals("after", resultSet.getString(2));
        }
    }

    @Test
    public void insertAndDeleteArePersistedInOneBatch() throws Exception {
        executeStatements(
            "CREATE TABLE SQL_INSERT_DELETE (ID INT PRIMARY KEY, DATA_VALUE VARCHAR)",
            "INSERT INTO SQL_INSERT_DELETE VALUES (1, 'deleted')"
        );
        QueryRow queryRow = queryFirstRow("SELECT ID, DATA_VALUE FROM SQL_INSERT_DELETE");
        Map<String, Object> addedRow = new HashMap<>();
        addedRow.put("data", List.of(2, "inserted"));
        addedRow.put("updateValues", Map.of());

        queryRow.processor().updateResultsDataBatch(
            queryRow.processor().getWebSession().getProgressMonitor(),
            queryRow.context(),
            queryRow.resultId(),
            List.of(),
            List.of(new WebSQLResultsRow(queryRow.row())),
            List.of(new WebSQLResultsRow(addedRow)),
            null
        );

        try (
            JDBCStatement statement = databaseSession.createStatement();
            JDBCResultSet resultSet = statement.executeQuery(
                "SELECT ID, DATA_VALUE FROM SQL_INSERT_DELETE ORDER BY ID"
            )
        ) {
            Assertions.assertTrue(resultSet.next());
            Assertions.assertEquals(2, resultSet.getInt(1));
            Assertions.assertEquals("inserted", resultSet.getString(2));
            Assertions.assertFalse(resultSet.next());
        }
    }

    private void executeStatements(String... queries) throws Exception {
        try (JDBCStatement statement = databaseSession.createStatement()) {
            for (String query : queries) {
                Assertions.assertFalse(statement.execute(query));
            }
        }
    }

    private Object[] updateFirstRow(String query, Map<String, Object> updates) throws Exception {
        QueryRow queryRow = queryFirstRow(query);
        Map<String, Object> row = new HashMap<>(queryRow.row());
        row.put("updateValues", updates);

        WebSQLExecuteInfo result = queryRow.processor().updateResultsDataBatch(
            queryRow.processor().getWebSession().getProgressMonitor(),
            queryRow.context(),
            queryRow.resultId(),
            List.of(new WebSQLResultsRow(row)),
            List.of(),
            List.of(),
            null
        );
        return result.getResults()[0].getResultSet().getRowsWithMetaData().getFirst().getData();
    }

    private QueryRow queryFirstRow(String query) throws Exception {
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo context = sqlProcessor.createContext(null, "PUBLIC", globalProject.getId());
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            context,
            databaseContainer.getId(),
            query
        );
        clientWrapper.waitTaskCompleted(taskId);

        Map<String, Object> resultSet = clientWrapper.readTaskResultSet(taskId);
        List<Map<String, Object>> rows = JSONUtils.getObjectList(resultSet, "rowsWithMetaData");
        Assertions.assertEquals(1, rows.size());
        return new QueryRow(sqlProcessor, context, resultSet.get("id").toString(), rows.getFirst());
    }

    private record QueryRow(
        WebSQLProcessor processor,
        WebSQLContextInfo context,
        String resultId,
        Map<String, Object> row
    ) {
    }
}

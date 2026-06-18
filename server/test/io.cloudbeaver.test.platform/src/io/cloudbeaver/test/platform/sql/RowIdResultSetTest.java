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
import io.cloudbeaver.service.sql.WebSQLResultSetRowIdentifier;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;


public class RowIdResultSetTest extends CloudbeaverDBTest {

    @BeforeEach
    public void prepareTables() throws SQLException {
        try (JDBCStatement stmt = databaseSession.createStatement()) {
            Assertions.assertFalse(stmt.execute("CREATE TABLE PK (id IDENTITY NOT NULL PRIMARY KEY, a VARCHAR)"));
            Assertions.assertFalse(stmt.execute("INSERT INTO PK (a) VALUES ('test_1')"));

            Assertions.assertFalse(stmt.execute("CREATE TABLE NO_PK (a INT, b VARCHAR)"));
            Assertions.assertFalse(stmt.execute("INSERT INTO NO_PK (a, b) VALUES (1, 'test_1')"));

            Assertions.assertFalse(stmt.execute("CREATE TABLE COMPOSITE_PK (a INT, b VARCHAR, PRIMARY KEY (a,b))"));
            Assertions.assertFalse(stmt.execute("INSERT INTO COMPOSITE_PK (a, b) VALUES (1, 'test_1')"));
        }
    }

    @Test
    public void shouldReturnRowIdentifierDetailsWithPK() throws Exception {
        // Given
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(
            null, "PUBLIC", globalProject.getId()
        );
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT * FROM PK"
        );
        clientWrapper.waitTaskCompleted(taskId);

        // When
        Map<String, Object> response = clientWrapper.readTaskResultSet(taskId);

        // Then
        String rowIdentifierState = String.valueOf(response.get("rowIdentifierState"));
        Assertions.assertEquals(
            WebSQLResultSetRowIdentifier.WebSQLResultSetRowIdentifierState.PRIMARY_KEY.name(),
            rowIdentifierState
        );
        Map<String, Object> rowIdentifier = (Map<String, Object>) response.get("rowIdentifier");
        Assertions.assertEquals("PRIMARY KEY", rowIdentifier.get("constraintType"));
        List<Map<String, Object>> attributes = JSONUtils.getObjectList(rowIdentifier, "attributes");
        Assertions.assertEquals(1, attributes.size());
        Map<String, Object> attribute = attributes.getFirst();
        Assertions.assertEquals("ID", attribute.get("name"));
        Assertions.assertEquals(0.0, attribute.get("ordinalPosition"));
    }

    @Test
    public void shouldReturnRowIdentifierDetailsWithCompositePK() throws Exception {
        // Given
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(
            null, "PUBLIC", globalProject.getId()
        );
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT * FROM COMPOSITE_PK"
        );
        clientWrapper.waitTaskCompleted(taskId);

        // When
        Map<String, Object> response = clientWrapper.readTaskResultSet(taskId);

        // Then
        String rowIdentifierState = String.valueOf(response.get("rowIdentifierState"));
        Assertions.assertEquals(
            WebSQLResultSetRowIdentifier.WebSQLResultSetRowIdentifierState.PRIMARY_KEY.name(),
            rowIdentifierState
        );
        Map<String, Object> rowIdentifier = (Map<String, Object>) response.get("rowIdentifier");
        Assertions.assertEquals("PRIMARY KEY", rowIdentifier.get("constraintType"));
        List<Map<String, Object>> attributes = JSONUtils.getObjectList(rowIdentifier, "attributes");
        Assertions.assertEquals(2, attributes.size());
        Map<String, Object> first = attributes.getFirst();
        Assertions.assertEquals("A", first.get("name"));
        Assertions.assertEquals(0.0, first.get("ordinalPosition"));
        Map<String, Object> second = attributes.get(1);
        Assertions.assertEquals("B", second.get("name"));
        Assertions.assertEquals(1.0, second.get("ordinalPosition"));
    }

    @Test
    public void shouldReturnRowIdentifierDetailsWithNoPK() throws Exception {
        // Given
        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo sqlProcessorContext = sqlProcessor.createContext(
            null, "PUBLIC", globalProject.getId()
        );
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT * FROM NO_PK"
        );
        clientWrapper.waitTaskCompleted(taskId);

        // When
        Map<String, Object> response = clientWrapper.readTaskResultSet(taskId);

        // Then
        String rowIdentifierState = String.valueOf(response.get("rowIdentifierState"));
        Assertions.assertEquals(
            WebSQLResultSetRowIdentifier.WebSQLResultSetRowIdentifierState.NONE.name(),
            rowIdentifierState
        );
        Assertions.assertNull(response.get("rowIdentifier"));
    }
}

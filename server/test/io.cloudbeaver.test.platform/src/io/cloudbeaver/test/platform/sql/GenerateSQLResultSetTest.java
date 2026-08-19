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
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.jdbc.JDBCStatement;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class GenerateSQLResultSetTest extends CloudbeaverDBTest {

    private static final String GQL_GENERATE_QUERY_FROM_RESULTSET = """
          query($projectId: ID, $connectionId: ID!, $contextId: ID!, $generatorId: SQLResultSetGeneratorId!,
              $resultsId: ID!, $selectedRows: [SQLResultRow!]!
          ) {
            sqlGenerateResultSetQuery(
              projectId: $projectId
              connectionId: $connectionId
              contextId: $contextId
              generatorId: $generatorId
              resultsId: $resultsId
              selectedRows: $selectedRows
            )
          }
        """;

    private static final String GQL_GENERATE_QUERY_FROM_RESULTSET_BY_KEY = """
          query($projectId: ID, $connectionId: ID!, $contextId: ID!, $generatorKey: String!,
              $resultsId: ID!, $selectedRows: [SQLResultRow!]!
          ) {
            sqlGenerateResultSetQuery(
              projectId: $projectId
              connectionId: $connectionId
              contextId: $contextId
              generatorKey: $generatorKey
              resultsId: $resultsId
              selectedRows: $selectedRows
            )
          }
        """;

    private static final String GQL_RESULT_SET_QUERY_GENERATORS = """
          query($projectId: ID, $connectionId: ID!, $contextId: ID!, $resultsId: ID!) {
            sqlResultSetQueryGenerators(
              projectId: $projectId
              connectionId: $connectionId
              contextId: $contextId
              resultsId: $resultsId
            ) {
              id
              label
              description
              order
              multiObject
            }
          }
        """;

    private static final String GQL_GENERATE_QUERY_WITH_OPTIONAL_GENERATORS = """
          query($projectId: ID, $connectionId: ID!, $contextId: ID!, $generatorId: SQLResultSetGeneratorId,
              $generatorKey: String, $resultsId: ID!, $selectedRows: [SQLResultRow!]!
          ) {
            sqlGenerateResultSetQuery(
              projectId: $projectId
              connectionId: $connectionId
              contextId: $contextId
              generatorId: $generatorId
              generatorKey: $generatorKey
              resultsId: $resultsId
              selectedRows: $selectedRows
            )
          }
        """;

    private List<Map<String, Object>> selectedRows;
    private WebSQLContextInfo sqlProcessorContext;
    private String resultId;

    @BeforeEach
    public void prepareTables() throws Exception {
        try (JDBCStatement stmt = databaseSession.createStatement()) {
            Assertions.assertFalse(stmt.execute("CREATE TABLE TEST_TABLE (id IDENTITY NOT NULL PRIMARY KEY, field VARCHAR)"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (field) VALUES ('value_1')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (field) VALUES ('value_2')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (field) VALUES ('value_3')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO TEST_TABLE (field) VALUES ('value_4')"));
        }

        WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        sqlProcessorContext = sqlProcessor.createContext(
            null, "PUBLIC", globalProject.getId()
        );
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT * FROM TEST_TABLE ORDER BY id LIMIT 3"
        );
        clientWrapper.waitTaskCompleted(taskId);

        Map<String, Object> resultSet = clientWrapper.readTaskResultSet(taskId);
        resultId = resultSet.get("id").toString();
        List<Map<String, Object>> rows = JSONUtils.getObjectList(resultSet, "rowsWithMetaData");
        Assertions.assertNotNull(rows);
        Assertions.assertEquals(3, rows.size());
        selectedRows = rows.subList(0, 2);
    }

    @Test
    public void shouldGenerateSelectQueryFromResultSetWithLegacyGeneratorId() throws Exception {
        // When
        String query = generateQuery("dataSelect", selectedRows);

        // Then
        Assertions.assertEquals("""
            SELECT ID, FIELD
            FROM PUBLIC.TEST_TABLE
            WHERE ID=1;
            SELECT ID, FIELD
            FROM PUBLIC.TEST_TABLE
            WHERE ID=2;""", query
        );
    }

    @Test
    public void shouldDiscoverApplicableResultSetGeneratorsInOrder() throws Exception {
        Map<String, Object> response = client.executeGQLRequest(
            GQL_RESULT_SET_QUERY_GENERATORS,
            getBaseVariables(),
            Map.of(),
            "sqlResultSetQueryGenerators"
        );
        List<Map<String, Object>> generators = (List<Map<String, Object>>) response.get("data");

        List<Object> generatorIds = generators.stream().map(generator -> generator.get("id")).toList();
        Assertions.assertTrue(generatorIds.containsAll(
            List.of("dataSelect", "dataSelectMany", "dataInsert", "dataUpdate", "dataDeleteByUniqueKey")
        ));
        List<Integer> generatorOrders = generators.stream()
            .map(generator -> ((Number) generator.get("order")).intValue())
            .toList();
        Assertions.assertEquals(
            generatorOrders.stream().sorted().toList(),
            generatorOrders
        );
        Assertions.assertFalse(generatorIds.contains("tableDDL"));
    }

    @Test
    public void shouldGenerateQueryByDiscoveredGeneratorKey() throws Exception {
        String query = generateQuery("dataSelectMany", selectedRows, GQL_GENERATE_QUERY_FROM_RESULTSET_BY_KEY, null, "generatorKey");

        Assertions.assertEquals("""
            SELECT ID, FIELD
            FROM PUBLIC.TEST_TABLE
            WHERE ID IN (1,2);""", query);
    }

    @Test
    public void shouldRejectInapplicableGeneratorKey() {
        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> generateQuery("tableDDL", selectedRows, GQL_GENERATE_QUERY_FROM_RESULTSET_BY_KEY, null, "generatorKey")
        );

        Assertions.assertTrue(exception.getMessage().contains("not applicable to this result set"));
    }

    @Test
    public void shouldRejectMissingGeneratorArguments() {
        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> executeGenerationQuery(GQL_GENERATE_QUERY_WITH_OPTIONAL_GENERATORS, Map.of())
        );

        Assertions.assertTrue(exception.getMessage().contains("Exactly one of generatorId or generatorKey must be specified"));
    }

    @Test
    public void shouldRejectConflictingGeneratorArguments() {
        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> executeGenerationQuery(
                GQL_GENERATE_QUERY_WITH_OPTIONAL_GENERATORS,
                Map.of("generatorId", "dataSelect", "generatorKey", "dataSelect")
            )
        );

        Assertions.assertTrue(exception.getMessage().contains("Exactly one of generatorId or generatorKey must be specified"));
    }

    @Test
    public void shouldRejectEmptySelectedRows() {
        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> executeGenerationQuery(
                GQL_GENERATE_QUERY_WITH_OPTIONAL_GENERATORS,
                Map.of("generatorKey", "dataSelect"),
                List.of()
            )
        );

        Assertions.assertTrue(exception.getMessage().contains("At least one row must be selected"));
    }

    @Test
    public void shouldNotDiscoverGeneratorsWithoutSingleSource() throws Exception {
        String taskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT 1 AS VALUE"
        );
        clientWrapper.waitTaskCompleted(taskId);
        resultId = clientWrapper.readTaskResultSet(taskId).get("id").toString();

        Map<String, Object> response = client.executeGQLRequest(
            GQL_RESULT_SET_QUERY_GENERATORS,
            getBaseVariables(),
            Map.of(),
            "sqlResultSetQueryGenerators"
        );

        Assertions.assertEquals(List.of(), response.get("data"));
    }

    @Test
    public void shouldGenerateSelectQueryWithoutFullyQualifiedNames() throws Exception {
        // When
        String gqlQuery = """
          query($projectId: ID, $connectionId: ID!, $contextId: ID!, $generatorId: SQLResultSetGeneratorId!,
              $resultsId: ID!, $selectedRows: [SQLResultRow!]!, $generatorOptions: SQLQueryGeneratorOptions
          ) {
            sqlGenerateResultSetQuery(
              projectId: $projectId
              connectionId: $connectionId
              contextId: $contextId
              generatorId: $generatorId
              resultsId: $resultsId
              selectedRows: $selectedRows
              generatorOptions: $generatorOptions
            )
          }""";
        Map<String, Object> variables = Map.of(
            "generatorOptions",
            Map.of(
                "useFullyQualifiedNames", false,
                "compactSql", false
            )
        );
        String query = generateQuery("dataSelect", selectedRows, gqlQuery, variables);

        // Then
        Assertions.assertEquals("""
            SELECT ID, FIELD
            FROM TEST_TABLE
            WHERE ID=1;
            SELECT ID, FIELD
            FROM TEST_TABLE
            WHERE ID=2;""", query
        );
    }

    @Test
    public void shouldGenerateSelectQueryWithCompactSQL() throws Exception {
        // When
        String gqlQuery = """
          query($projectId: ID, $connectionId: ID!, $contextId: ID!, $generatorId: SQLResultSetGeneratorId!,
              $resultsId: ID!, $selectedRows: [SQLResultRow!]!, $generatorOptions: SQLQueryGeneratorOptions
          ) {
            sqlGenerateResultSetQuery(
              projectId: $projectId
              connectionId: $connectionId
              contextId: $contextId
              generatorId: $generatorId
              resultsId: $resultsId
              selectedRows: $selectedRows
              generatorOptions: $generatorOptions
            )
          }""";
        Map<String, Object> variables = Map.of(
            "generatorOptions",
            Map.of(
                "useFullyQualifiedNames", true,
                "compactSql", true
            )
        );
        String query = generateQuery("dataSelect", selectedRows, gqlQuery, variables);

        // Then
        Assertions.assertEquals("""
            SELECT ID, FIELD FROM PUBLIC.TEST_TABLE WHERE ID=1;
            SELECT ID, FIELD FROM PUBLIC.TEST_TABLE WHERE ID=2;""", query
        );
    }

    @Test
    public void shouldGenerateSelectInQueryFromResultSet() throws Exception {
        // When
        String query = generateQuery("dataSelectMany", selectedRows);

        // Then
        Assertions.assertEquals("""
            SELECT ID, FIELD
            FROM PUBLIC.TEST_TABLE
            WHERE ID IN (1,2);""", query
        );
    }

    @Test
    public void shouldGenerateInsertQueryFromResultSet() throws Exception {
        // When
        String query = generateQuery("dataInsert", selectedRows);

        // Then
        Assertions.assertEquals("""
            INSERT INTO PUBLIC.TEST_TABLE
            (ID, FIELD)
            VALUES(1, 'value_1');
            INSERT INTO PUBLIC.TEST_TABLE
            (ID, FIELD)
            VALUES(2, 'value_2');""", query
        );
    }

    @Test
    public void shouldGenerateUpdateQueryFromResultSet() throws Exception {
        // When
        String query = generateQuery("dataUpdate", selectedRows);

        // Then
        Assertions.assertEquals("""
            UPDATE PUBLIC.TEST_TABLE
            SET FIELD='value_1'
            WHERE ID=1;
            UPDATE PUBLIC.TEST_TABLE
            SET FIELD='value_2'
            WHERE ID=2;""", query
        );
    }

    @Test
    public void shouldGenerateDeleteQueryFromResultSet() throws Exception {
        // When
        String query = generateQuery("dataDeleteByUniqueKey", selectedRows);

        // Then
        Assertions.assertEquals("""
            DELETE FROM PUBLIC.TEST_TABLE
            WHERE ID=1;
            DELETE FROM PUBLIC.TEST_TABLE
            WHERE ID=2;""", query
        );
    }

    @Test
    public void shouldGenerateInsertQueryWithLongtext() throws Exception {
        // Given
        String endOfFile = "End of file";
        // Values over 4096 symbols long are truncated
        String longtext = "longTextDataSample".repeat(300) + endOfFile;
        try (JDBCStatement stmt = databaseSession.createStatement()) {
            Assertions.assertFalse(stmt.execute("CREATE TABLE LONGTEXT_TEST_TABLE (id IDENTITY NOT NULL PRIMARY KEY, longtext VARCHAR)"));
            Assertions.assertFalse(stmt.execute("INSERT INTO LONGTEXT_TEST_TABLE (longtext) VALUES ('" + longtext + "')"));
            Assertions.assertFalse(stmt.execute("INSERT INTO LONGTEXT_TEST_TABLE (longtext) VALUES ('')"));
        }
        String longtextTaskId = clientWrapper.asyncSqlExecute(
            globalProject,
            sqlProcessorContext,
            databaseContainer.getId(),
            "SELECT * FROM LONGTEXT_TEST_TABLE ORDER BY ID LIMIT 1"
        );
        clientWrapper.waitTaskCompleted(longtextTaskId);
        Map<String, Object> resultSet = clientWrapper.readTaskResultSet(longtextTaskId);
        resultId = resultSet.get("id").toString();
        List<Map<String, Object>> rows = JSONUtils.getObjectList(resultSet, "rowsWithMetaData");
        Assertions.assertNotNull(rows);
        Assertions.assertEquals(1, rows.size());
        ArrayList<Object> data = (ArrayList<Object>) rows.getFirst().get("data");
        String truncatedLongtext = ((Map<String, String>) data.get(1)).get("text");
        Assertions.assertFalse(truncatedLongtext.endsWith(endOfFile));
        // Remove 'type' and 'contentLength' data attributes which is done on front-end
        data.remove(1);
        data.add(truncatedLongtext);

        // When
        String query = generateQuery("dataInsert", rows);

        // Then
        String expectedQuery = String.format("""
            INSERT INTO PUBLIC.LONGTEXT_TEST_TABLE
            (ID, LONGTEXT)
            VALUES(1, '%s');""",
            longtext
        );
        Assertions.assertEquals(expectedQuery, query);
    }

    @Nullable
    private String generateQuery(
        @NotNull String generatorId,
        @NotNull List<Map<String, Object>> selectedRows
    ) throws Exception {
        return generateQuery(generatorId, selectedRows, GQL_GENERATE_QUERY_FROM_RESULTSET, null);
    }

    @Nullable
    private String generateQuery(
        @NotNull String generatorId,
        @NotNull List<Map<String, Object>> selectedRows,
        @NotNull String gqlQuery,
        @Nullable Map<String, Object> variables
    ) throws Exception {
        return generateQuery(generatorId, selectedRows, gqlQuery, variables, "generatorId");
    }

    @Nullable
    private String generateQuery(
        @NotNull String generatorId,
        @NotNull List<Map<String, Object>> selectedRows,
        @NotNull String gqlQuery,
        @Nullable Map<String, Object> variables,
        @NotNull String generatorArgument
    ) throws Exception {
        Map<String, Object> queryVariables = getBaseVariables();
        queryVariables.put(generatorArgument, generatorId);
        queryVariables.put("selectedRows", selectedRows);
        if (variables != null && !variables.isEmpty()) {
            queryVariables.putAll(variables);
        }
        Map<String, Object> response = client.executeGQLRequest(
            gqlQuery, queryVariables,
            Map.of(), "sqlGenerateResultSetQuery"
        );
        return response.get("data")
            .toString();
    }

    @NotNull
    private Map<String, Object> getBaseVariables() {
        Map<String, Object> queryVariables = new HashMap<>();
        queryVariables.put("projectId", globalProject.getId());
        queryVariables.put("connectionId", databaseContainer.getId());
        queryVariables.put("contextId", sqlProcessorContext.getId());
        queryVariables.put("resultsId", resultId);
        return queryVariables;
    }

    private void executeGenerationQuery(@NotNull String query, @NotNull Map<String, Object> generatorVariables) throws Exception {
        executeGenerationQuery(query, generatorVariables, selectedRows);
    }

    private void executeGenerationQuery(
        @NotNull String query,
        @NotNull Map<String, Object> generatorVariables,
        @NotNull List<Map<String, Object>> rows
    ) throws Exception {
        Map<String, Object> variables = getBaseVariables();
        variables.put("selectedRows", rows);
        variables.putAll(generatorVariables);
        client.executeGQLRequest(query, variables, Map.of(), "sqlGenerateResultSetQuery");
    }
}

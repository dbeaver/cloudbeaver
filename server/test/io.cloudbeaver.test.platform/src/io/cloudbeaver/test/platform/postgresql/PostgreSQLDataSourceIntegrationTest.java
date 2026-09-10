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
package io.cloudbeaver.test.platform.postgresql;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.service.sql.WebSQLResultSetRowIdentifier;
import io.cloudbeaver.test.WebGQLClient;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class PostgreSQLDataSourceIntegrationTest extends CloudbeaverMockTest {
    private static final Pattern INTEGER_PATTERN = Pattern.compile("-?\\d+");
    private static final DateTimeFormatter TIMESTAMP_FORMATTER =
        DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss.SSS xx");

    private final WebGQLClient client = CEAppStarter.createClient();
    private PostgreSQLDataSourceTestFixture fixture;

    @BeforeEach
    public void setUpPostgreSQL() throws Exception {
        fixture = PostgreSQLDataSourceTestFixture.setUp(client);
    }

    @AfterEach
    public void tearDownPostgreSQL() throws Exception {
        if (fixture != null) {
            fixture.close();
        }
    }

    @Test
    public void metadataIsAvailableThroughNavigatorAndSqlEndpoints() throws Exception {
        Map<String, Object> databasesFolder = findChild(
            fixture.getNavigatorChildren(fixture.getConnectionNodePath()),
            "Databases"
        );
        Map<String, Object> database = findChild(
            fixture.getNavigatorChildren(nodePath(databasesFolder)),
            fixture.getConfig().database()
        );
        Map<String, Object> schemasFolder = findChild(
            fixture.getNavigatorChildren(nodePath(database)),
            "Schemas"
        );
        Map<String, Object> schema = findChild(
            fixture.getNavigatorChildren(nodePath(schemasFolder)),
            fixture.getSchemaName()
        );
        Map<String, Object> tablesFolder = findChild(fixture.getNavigatorChildren(nodePath(schema)), "Tables");
        List<Map<String, Object>> tables = fixture.getNavigatorChildren(nodePath(tablesFolder));
        Assertions.assertTrue(childNames(tables).containsAll(Set.of(
            "parent_table",
            "child_table",
            "edit_rows",
            "type_values"
        )));
        Assertions.assertTrue(childNames(tables).stream()
            .noneMatch(name -> name.chars().anyMatch(Character::isUpperCase)));

        Map<String, Object> parentTable = findChild(tables, "parent_table");
        Map<String, Object> childTable = findChild(tables, "child_table");
        Map<String, Object> columnsFolder = findChild(
            fixture.getNavigatorChildren(nodePath(parentTable)),
            "Columns"
        );
        Assertions.assertEquals(
            Set.of("id", "code", "note"),
            childNames(fixture.getNavigatorChildren(nodePath(columnsFolder)))
        );

        Map<String, Object> constraintsFolder = findChild(
            fixture.getNavigatorChildren(nodePath(parentTable)),
            "Constraints"
        );
        Assertions.assertEquals(
            Set.of("parent_table_pkey", "parent_code_unique"),
            childNames(fixture.getNavigatorChildren(nodePath(constraintsFolder)))
        );
        Map<String, Object> foreignKeysFolder = findChild(
            fixture.getNavigatorChildren(nodePath(childTable)),
            "Foreign Keys"
        );
        Assertions.assertEquals(
            Set.of("child_parent_fk"),
            childNames(fixture.getNavigatorChildren(nodePath(foreignKeysFolder)))
        );

        String contextId = fixture.createSqlContext();
        Map<String, Object> parentResult = fixture.executeQuery(
            contextId,
            "SELECT id, code, note FROM parent_table ORDER BY id"
        );
        Map<String, Map<String, Object>> columns = columnsByName(parentResult);
        Assertions.assertTrue(JSONUtils.getBoolean(columns.get("id"), "autoGenerated"));
        Assertions.assertTrue(JSONUtils.getBoolean(columns.get("id"), "required"));
        Assertions.assertFalse(JSONUtils.getBoolean(columns.get("note"), "required"));
        Assertions.assertEquals(
            WebSQLResultSetRowIdentifier.WebSQLResultSetRowIdentifierState.PRIMARY_KEY.name(),
            JSONUtils.getString(parentResult, "rowIdentifierState")
        );
        Map<String, Object> rowIdentifier = JSONUtils.getObject(parentResult, "rowIdentifier");
        Assertions.assertEquals("PRIMARY KEY", JSONUtils.getString(rowIdentifier, "constraintType"));
        Assertions.assertEquals(
            List.of("id"),
            JSONUtils.getObjectList(rowIdentifier, "attributes").stream()
                .map(attribute -> JSONUtils.getString(attribute, "name"))
                .toList()
        );

        Map<String, Object> childResult = fixture.executeQuery(
            contextId,
            "SELECT id, parent_id, name FROM child_table ORDER BY id"
        );
        List<Map<String, Object>> forward = fixture.getResultAssociations(contextId, resultId(childResult), false);
        Assertions.assertTrue(forward.stream().anyMatch(association ->
            "child_parent_fk".equals(JSONUtils.getString(association, "associationName")) &&
                "parent_table".equals(JSONUtils.getString(association, "targetEntityName"))));

        List<Map<String, Object>> reverse = fixture.getResultAssociations(contextId, resultId(parentResult), true);
        Assertions.assertTrue(reverse.stream().anyMatch(association ->
            "child_parent_fk".equals(JSONUtils.getString(association, "associationName")) &&
                "child_table".equals(JSONUtils.getString(association, "targetEntityName"))));
    }

    @Test
    public void sqlExecutionReturnsFilteredOrderedRowsAndMetadata() throws Exception {
        String contextId = fixture.createSqlContext();
        Map<String, Object> resultSet = fixture.executeQuery(
            contextId,
            "SELECT id, name, note FROM child_table ORDER BY id DESC",
            Map.of("where", "name <> 'excluded'")
        );

        List<Map<String, Object>> columns = JSONUtils.getObjectList(resultSet, "columns");
        Assertions.assertEquals(List.of("id", "\"name\"", "note"), columns.stream()
            .map(column -> JSONUtils.getString(column, "name"))
            .toList());
        Assertions.assertEquals("NUMERIC", JSONUtils.getString(columns.getFirst(), "dataKind"));
        Assertions.assertEquals("child_table", JSONUtils.getString(columns.getFirst(), "entityName"));

        List<Map<String, Object>> rows = rows(resultSet);
        Assertions.assertEquals(2, rows.size());
        Assertions.assertEquals("2", cell(rows.getFirst(), 0).toString());
        Assertions.assertEquals("beta", cell(rows.getFirst(), 1));
        Assertions.assertEquals("present", cell(rows.getFirst(), 2));
        Assertions.assertEquals("1", cell(rows.get(1), 0).toString());
        Assertions.assertEquals("alpha", cell(rows.get(1), 1));
        Assertions.assertNull(cell(rows.get(1), 2));
    }

    @Test
    public void dataEditingUpdatesInsertsAndDeletesRows() throws Exception {
        String contextId = fixture.createSqlContext();
        Map<String, Object> editableResult = fixture.executeQuery(
            contextId,
            "SELECT id, name, note FROM edit_rows ORDER BY id"
        );
        Assertions.assertFalse(JSONUtils.getBoolean(editableResult, "readOnly"));
        List<Map<String, Object>> originalRows = rows(editableResult);
        Assertions.assertEquals(2, originalRows.size());
        String editableResultId = resultId(editableResult);

        Map<String, Object> updatedRow = new LinkedHashMap<>(originalRows.getFirst());
        updatedRow.put("updateValues", Map.of("1", "updated"));
        fixture.updateResults(contextId, editableResultId, List.of(updatedRow), List.of(), List.of());
        fixture.updateResults(contextId, editableResultId, List.of(), List.of(originalRows.get(1)), List.of());

        Map<String, Object> addedRow = new HashMap<>();
        addedRow.put("data", Arrays.asList(null, "inserted", "generated identity"));
        Map<String, Object> insertResult = fixture.updateResults(
            contextId,
            editableResultId,
            List.of(),
            List.of(),
            List.of(addedRow)
        );
        List<Map<String, Object>> insertedRows = rows(insertResult);
        Assertions.assertEquals(1, insertedRows.size());
        long generatedId = Long.parseLong(cell(insertedRows.getFirst(), 0).toString());
        Assertions.assertTrue(generatedId > 2);
        Assertions.assertEquals("inserted", cell(insertedRows.getFirst(), 1));

        Map<String, Object> finalResult = fixture.executeQuery(
            contextId,
            "SELECT id, name, note FROM edit_rows ORDER BY id"
        );
        List<Map<String, Object>> finalRows = rows(finalResult);
        Assertions.assertEquals(2, finalRows.size());
        Assertions.assertEquals(List.of("updated", "inserted"), finalRows.stream()
            .map(row -> cell(row, 1).toString())
            .toList());

        try (Connection connection = fixture.openJdbcConnection(); Statement statement = connection.createStatement();
             ResultSet jdbcResult = statement.executeQuery(
                 "SELECT id, name, note FROM " + fixture.getSchemaName() + ".edit_rows ORDER BY id")) {
            Assertions.assertTrue(jdbcResult.next());
            Assertions.assertEquals(1, jdbcResult.getLong("id"));
            Assertions.assertEquals("updated", jdbcResult.getString("name"));
            Assertions.assertTrue(jdbcResult.next());
            Assertions.assertEquals(generatedId, jdbcResult.getLong("id"));
            Assertions.assertEquals("inserted", jdbcResult.getString("name"));
            Assertions.assertEquals("generated identity", jdbcResult.getString("note"));
            Assertions.assertFalse(jdbcResult.next());
        }
    }

    @Test
    public void postgreSqlTypesPreserveValuesAndTypeMetadata() throws Exception {
        String contextId = fixture.createSqlContext();
        Map<String, Object> resultSet = fixture.executeQuery(
            contextId,
            """
                SELECT uuid_value, json_value, bytes_value, timestamp_value, numeric_value,
                       boolean_value, text_value, array_value, null_value
                FROM type_values
                WHERE id = 1
                """
        );
        Map<String, Map<String, Object>> columns = columnsByName(resultSet);
        assertType(columns, "uuid_value", "uuid", "OBJECT");
        assertType(columns, "\"json_value\"", "jsonb", "CONTENT");
        assertType(columns, "bytes_value", "bytea", "BINARY");
        assertType(columns, "timestamp_value", "timestamptz", "DATETIME");
        assertType(columns, "numeric_value", "numeric", "NUMERIC");
        assertType(columns, "boolean_value", "bool", "BOOLEAN");
        assertType(columns, "text_value", "text", "STRING");
        assertType(columns, "array_value", "_int4", "ARRAY");
        Assertions.assertEquals("text", JSONUtils.getString(columns.get("null_value"), "typeName"));

        Map<String, Object> row = rows(resultSet).getFirst();
        Assertions.assertEquals("123e4567-e89b-12d3-a456-426614174000", cell(row, 0));

        Map<?, ?> actualJson = JSONUtils.GSON.fromJson(contentText(cell(row, 1)), Map.class);
        Map<?, ?> expectedJson = JSONUtils.GSON.fromJson(
            "{\"values\":[1,2,3],\"nested\":{\"enabled\":true}}",
            Map.class
        );
        Assertions.assertEquals(expectedJson, actualJson);

        Object binaryCell = cell(row, 2);
        Assertions.assertInstanceOf(Map.class, binaryCell);
        Object binaryValue = ((Map<?, ?>) binaryCell).get("binary");
        Assertions.assertInstanceOf(String.class, binaryValue);
        Assertions.assertArrayEquals(
            new byte[] {0, 1, 127, -1},
            Base64.getDecoder().decode((String) binaryValue)
        );
        Assertions.assertEquals(
            Instant.parse("2024-02-03T04:05:06Z"),
            OffsetDateTime.parse(cell(row, 3).toString(), TIMESTAMP_FORMATTER).toInstant()
        );
        Assertions.assertEquals(
            0,
            new BigDecimal("12345678901234567890.1234567891").compareTo(new BigDecimal(cell(row, 4).toString()))
        );
        Assertions.assertEquals(Boolean.TRUE, cell(row, 5));
        Assertions.assertEquals("PostgreSQL text", cell(row, 6));
        Assertions.assertEquals(List.of(10, 20, 30), integerElements(cell(row, 7).toString()));
        Assertions.assertNull(cell(row, 8));
    }

    @Test
    public void fullDdlIsGeneratedAsynchronouslyWithCommentsAndPermissions() throws Exception {
        Map<String, Object> parentTable = findTable("parent_table");
        Map<String, Object> tableObject = JSONUtils.getObject(parentTable, "object");
        Assertions.assertTrue(
            JSONUtils.getStringList(tableObject, "features").contains("supportsFullDdl")
        );
        String qualifiedTableName = fixture.getSchemaName() + ".parent_table";

        String regularDdl = fixture.generateEntityDdl(nodePath(parentTable), false);
        Assertions.assertTrue(regularDdl.contains("CREATE TABLE " + qualifiedTableName), regularDdl);
        Assertions.assertFalse(regularDdl.contains("ALTER TABLE " + qualifiedTableName + " OWNER TO "), regularDdl);
        Assertions.assertFalse(regularDdl.contains("GRANT SELECT ON TABLE " + qualifiedTableName), regularDdl);

        String fullDdl = fixture.generateEntityDdl(nodePath(parentTable), true);
        Assertions.assertTrue(fullDdl.contains(
            "COMMENT ON TABLE " + qualifiedTableName + " IS 'PostgreSQL full DDL table'"
        ), fullDdl);
        Assertions.assertTrue(fullDdl.contains(
            "COMMENT ON COLUMN " + qualifiedTableName + ".note IS 'Optional parent note'"
        ), fullDdl);
        Assertions.assertTrue(fullDdl.contains(
            "ALTER TABLE " + qualifiedTableName + " OWNER TO " + fixture.getConfig().user()
        ), fullDdl);
        Assertions.assertTrue(fullDdl.contains("GRANT SELECT ON TABLE " + qualifiedTableName + " TO public"), fullDdl);
    }

    @Test
    public void executionPlanIncludesCostsRowsAndAnalyzeDuration() throws Exception {
        String contextId = fixture.createSqlContext();
        String query = "SELECT * FROM child_table WHERE parent_id = 1";
        Map<String, Object> plan = fixture.explainExecutionPlan(contextId, query, Map.of("ANALYZE", true));

        Assertions.assertEquals(query, JSONUtils.getString(plan, "query"));
        Assertions.assertTrue(JSONUtils.getBoolean(plan, "hasCost"));
        Assertions.assertTrue(JSONUtils.getBoolean(plan, "hasRows"));
        Assertions.assertTrue(JSONUtils.getBoolean(plan, "hasDuration"));
        Assertions.assertEquals("ms", JSONUtils.getString(plan, "durationMeasure"));
        List<Map<String, Object>> nodes = JSONUtils.getObjectList(plan, "nodes");
        Assertions.assertFalse(nodes.isEmpty());
        Assertions.assertTrue(nodes.stream().anyMatch(node -> node.get("cost") instanceof Number));
        Assertions.assertTrue(nodes.stream().anyMatch(node -> node.get("rowCount") instanceof Number));
        Assertions.assertTrue(nodes.stream().anyMatch(node -> node.get("duration") instanceof Number));
    }

    @NotNull
    private Map<String, Object> findTable(@NotNull String tableName) throws Exception {
        Map<String, Object> databasesFolder = findChild(
            fixture.getNavigatorChildren(fixture.getConnectionNodePath()),
            "Databases"
        );
        Map<String, Object> database = findChild(
            fixture.getNavigatorChildren(nodePath(databasesFolder)),
            fixture.getConfig().database()
        );
        Map<String, Object> schemasFolder = findChild(
            fixture.getNavigatorChildren(nodePath(database)),
            "Schemas"
        );
        Map<String, Object> schema = findChild(
            fixture.getNavigatorChildren(nodePath(schemasFolder)),
            fixture.getSchemaName()
        );
        Map<String, Object> tablesFolder = findChild(fixture.getNavigatorChildren(nodePath(schema)), "Tables");
        return findChild(fixture.getNavigatorChildren(nodePath(tablesFolder)), tableName);
    }

    @NotNull
    private static Map<String, Object> findChild(
        @NotNull List<Map<String, Object>> children,
        @NotNull String name
    ) {
        return children.stream()
            .filter(child -> name.equals(JSONUtils.getString(child, "name")))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Navigator child not found: " + name + "; available: " + childNames(children)));
    }

    @NotNull
    private static Set<String> childNames(@NotNull List<Map<String, Object>> children) {
        return children.stream()
            .map(child -> JSONUtils.getString(child, "name"))
            .collect(Collectors.toSet());
    }

    @NotNull
    private static String nodePath(@NotNull Map<String, Object> node) {
        return JSONUtils.getString(node, "uri");
    }

    @NotNull
    private static String resultId(@NotNull Map<String, Object> resultSet) {
        return JSONUtils.getString(resultSet, "id");
    }

    @NotNull
    private static List<Map<String, Object>> rows(@NotNull Map<String, Object> resultSet) {
        return JSONUtils.getObjectList(resultSet, "rowsWithMetaData");
    }

    @Nullable
    private static Object cell(@NotNull Map<String, Object> row, int position) {
        return ((List<?>) row.get("data")).get(position);
    }

    @NotNull
    private static Map<String, Map<String, Object>> columnsByName(@NotNull Map<String, Object> resultSet) {
        return JSONUtils.getObjectList(resultSet, "columns").stream()
            .collect(Collectors.toMap(column -> JSONUtils.getString(column, "name"), column -> column));
    }

    private static void assertType(
        @NotNull Map<String, Map<String, Object>> columns,
        @NotNull String columnName,
        @NotNull String typeName,
        @NotNull String dataKind
    ) {
        Map<String, Object> column = columns.get(columnName);
        Assertions.assertNotNull(column, "Missing result column " + columnName);
        Assertions.assertEquals(typeName, JSONUtils.getString(column, "typeName"));
        Assertions.assertEquals(dataKind, JSONUtils.getString(column, "dataKind"));
    }

    @NotNull
    private static String contentText(@Nullable Object value) {
        if (value instanceof Map<?, ?> content) {
            return String.valueOf(content.get("text"));
        }
        return String.valueOf(value);
    }

    @NotNull
    private static List<Integer> integerElements(@NotNull String value) {
        List<Integer> result = new ArrayList<>();
        Matcher matcher = INTEGER_PATTERN.matcher(value);
        while (matcher.find()) {
            result.add(Integer.parseInt(matcher.group()));
        }
        return result;
    }
}

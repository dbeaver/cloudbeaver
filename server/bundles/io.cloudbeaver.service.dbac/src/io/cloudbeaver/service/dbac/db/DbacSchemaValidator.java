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
package io.cloudbeaver.service.dbac.db;

import io.cloudbeaver.service.dbac.db.DbacSchemaStructure.Column;
import io.cloudbeaver.service.dbac.db.DbacSchemaStructure.Index;
import io.cloudbeaver.service.dbac.db.DbacSchemaStructure.Table;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Structural validator of the DBAC metadata schema.
 * <p>
 * Existence of an object is never accepted as proof that it is the right object. The create script is
 * written with {@code IF NOT EXISTS} so it can be replayed after a half applied migration on H2, and a
 * pre-existing table with the same name but a different shape would silently satisfy it. Therefore every
 * column type, size, nullability, primary key and index is compared against {@link DbacSchemaStructure}
 * after every migration and on every start of an already installed schema.
 * <p>
 * A mismatch is a hard failure. Nothing is dropped or recreated automatically: the tables hold granted
 * permissions and audit history, and silently rebuilding them would destroy the very record the module
 * exists to keep.
 */
public final class DbacSchemaValidator {

    /**
     * Verifies that all DBAC objects exist in the given schema with exactly the expected structure.
     *
     * @throws DBException if anything is missing or does not match; the caller must fail initialization
     */
    public static void validate(@NotNull Connection connection, @NotNull String schema)
        throws DBException, SQLException {
        DbacSchemaReport report = inspect(connection, schema);
        if (!report.isComplete()) {
            throw new DBException(
                "DBAC schema in '" + report.schema() + "' does not match the structure of version "
                    + DbacSchemaConstants.CURRENT_SCHEMA_VERSION + ": " + report.describeProblems());
        }
    }

    /**
     * Inspects the DBAC objects of one schema without deciding what to do about them.
     * <p>
     * Structural mismatches are collected into the returned report; only a genuine database failure is
     * thrown. That separation matters: "the schema is not there" and "the database cannot be read" must
     * lead to different decisions, and conflating them is how a fresh create ends up running over a
     * populated schema.
     *
     * @throws SQLException on a database failure; never for a structural problem
     * @throws DBException  if the schema name itself cannot be used by this module
     */
    @NotNull
    public static DbacSchemaReport inspect(@NotNull Connection connection, @NotNull String schema)
        throws SQLException, DBException {
        DatabaseMetaData metaData = connection.getMetaData();
        String resolvedSchema = DbacIdentifiers.requireUnquotableSchema(metaData, schema);

        List<String> problems = new ArrayList<>();
        Set<String> presentTables = new LinkedHashSet<>();
        Set<String> presentIndexes = new LinkedHashSet<>();

        for (Table table : DbacSchemaStructure.getTables()) {
            if (!tableExists(metaData, resolvedSchema, table.name())) {
                problems.add("table " + table.name() + " is missing");
                continue;
            }
            presentTables.add(table.name());
            checkColumns(metaData, resolvedSchema, table, problems);
            checkPrimaryKey(metaData, resolvedSchema, table, problems);
        }

        Map<String, List<IndexColumn>> indexColumns = new TreeMap<>();
        Map<String, Boolean> indexUnique = new HashMap<>();
        Map<String, String> indexTable = new HashMap<>();
        for (Table table : DbacSchemaStructure.getTables()) {
            if (!presentTables.contains(table.name())) {
                continue;
            }
            readIndexes(metaData, resolvedSchema, table.name(), indexColumns, indexUnique, indexTable);
        }

        for (Index index : DbacSchemaStructure.getIndexes()) {
            String foldedName = DbacIdentifiers.fold(metaData, index.name());
            List<IndexColumn> actualColumns = indexColumns.get(foldedName);
            if (actualColumns == null) {
                problems.add("index " + index.name() + " is missing");
                continue;
            }
            presentIndexes.add(index.name());

            String actualTable = indexTable.get(foldedName);
            String expectedTable = DbacIdentifiers.fold(metaData, index.tableName());
            if (!expectedTable.equals(actualTable)) {
                problems.add("index " + index.name() + " is on table " + actualTable
                    + " but must be on " + index.tableName());
            }
            List<String> expectedColumns = new ArrayList<>();
            for (String column : index.columns()) {
                expectedColumns.add(DbacIdentifiers.fold(metaData, column));
            }
            List<String> orderedActual = new ArrayList<>();
            for (IndexColumn column : actualColumns) {
                orderedActual.add(column.name());
            }
            if (!expectedColumns.equals(orderedActual)) {
                problems.add("index " + index.name() + " covers " + orderedActual
                    + " but must cover " + expectedColumns + " in that order");
            }
            Boolean unique = indexUnique.get(foldedName);
            if (unique != null && unique != index.unique()) {
                problems.add("index " + index.name() + " is " + (unique ? "unique" : "non-unique")
                    + " but must be " + (index.unique() ? "unique" : "non-unique"));
            }
        }

        return new DbacSchemaReport(resolvedSchema, presentTables, presentIndexes, problems);
    }

    // ------------------------------------------------------------------ tables

    private static boolean tableExists(
        @NotNull DatabaseMetaData metaData,
        @NotNull String schema,
        @NotNull String tableName
    ) throws SQLException {
        String folded = DbacIdentifiers.fold(metaData, tableName);
        try (ResultSet dbResult = metaData.getTables(
            null,
            DbacIdentifiers.escapePattern(metaData, schema),
            DbacIdentifiers.escapePattern(metaData, folded),
            new String[]{"TABLE"})
        ) {
            while (dbResult.next()) {
                if (matchesObject(
                    dbResult.getString("TABLE_SCHEM"), schema, dbResult.getString("TABLE_NAME"), folded)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static void checkColumns(
        @NotNull DatabaseMetaData metaData,
        @NotNull String schema,
        @NotNull Table table,
        @NotNull List<String> problems
    ) throws SQLException {
        String foldedTable = DbacIdentifiers.fold(metaData, table.name());
        Map<String, ActualColumn> actual = new LinkedHashMap<>();
        try (ResultSet dbResult = metaData.getColumns(
            null,
            DbacIdentifiers.escapePattern(metaData, schema),
            DbacIdentifiers.escapePattern(metaData, foldedTable),
            null)
        ) {
            while (dbResult.next()) {
                if (!matchesObject(dbResult.getString("TABLE_SCHEM"), schema,
                    dbResult.getString("TABLE_NAME"), foldedTable)) {
                    continue;
                }
                actual.put(
                    dbResult.getString("COLUMN_NAME"),
                    new ActualColumn(
                        dbResult.getInt("DATA_TYPE"),
                        dbResult.getString("TYPE_NAME"),
                        dbResult.getInt("COLUMN_SIZE"),
                        dbResult.getInt("NULLABLE")));
            }
        }

        Set<String> expectedNames = new LinkedHashSet<>();
        for (Column column : table.columns()) {
            String foldedColumn = DbacIdentifiers.fold(metaData, column.name());
            expectedNames.add(foldedColumn);
            ActualColumn found = actual.get(foldedColumn);
            if (found == null) {
                problems.add("column " + table.name() + "." + column.name() + " is missing");
                continue;
            }
            if (found.jdbcType() != column.jdbcType()) {
                problems.add("column " + table.name() + "." + column.name()
                    + " has JDBC type " + found.jdbcType() + " (" + found.typeName() + ")"
                    + " but must have " + column.jdbcType() + " (" + column.canonicalType() + ")");
                continue;
            }
            // An unrecognised spelling is a failure, not a pass. The JDBC type code alone does not
            // separate timestamp from timestamptz on PostgreSQL, nor CHARACTER VARYING from
            // VARCHAR_IGNORECASE on H2 - see DbacSchemaStructure.TYPE_NAME_ALIASES.
            String canonical = DbacSchemaStructure.canonicalTypeName(found.typeName());
            if (canonical == null) {
                problems.add("column " + table.name() + "." + column.name()
                    + " has unrecognised type name " + found.typeName()
                    + "; expected " + column.canonicalType()
                    + " (a metadata database whose spelling is not yet known is not accepted)");
                continue;
            }
            if (!canonical.equals(column.canonicalType())) {
                problems.add("column " + table.name() + "." + column.name()
                    + " has type " + found.typeName() + " but must be " + column.canonicalType());
                continue;
            }
            if (column.size() != DbacSchemaStructure.SIZE_NOT_CHECKED && found.size() != column.size()) {
                problems.add("column " + table.name() + "." + column.name()
                    + " has size " + found.size() + " but must have " + column.size());
                continue;
            }
            // columnNullableUnknown is not accepted: an undecidable nullability is a fail-closed case.
            boolean actualNullable = found.nullable() == DatabaseMetaData.columnNullable;
            if (found.nullable() == DatabaseMetaData.columnNullableUnknown
                || actualNullable != column.nullable()
            ) {
                problems.add("column " + table.name() + "." + column.name()
                    + " nullability is " + describeNullable(found.nullable())
                    + " but must be " + (column.nullable() ? "NULL" : "NOT NULL"));
            }
        }

        for (String actualName : actual.keySet()) {
            if (!expectedNames.contains(actualName)) {
                problems.add("table " + table.name() + " has unexpected column " + actualName);
            }
        }
    }

    private static void checkPrimaryKey(
        @NotNull DatabaseMetaData metaData,
        @NotNull String schema,
        @NotNull Table table,
        @NotNull List<String> problems
    ) throws SQLException {
        String foldedTable = DbacIdentifiers.fold(metaData, table.name());
        Map<Short, String> byPosition = new TreeMap<>();
        try (ResultSet dbResult = metaData.getPrimaryKeys(null, schema, foldedTable)) {
            while (dbResult.next()) {
                if (!matchesObject(dbResult.getString("TABLE_SCHEM"), schema,
                    dbResult.getString("TABLE_NAME"), foldedTable)) {
                    continue;
                }
                byPosition.put(dbResult.getShort("KEY_SEQ"), dbResult.getString("COLUMN_NAME"));
            }
        }
        List<String> actual = new ArrayList<>(byPosition.values());
        List<String> expected = new ArrayList<>();
        for (String column : table.primaryKey()) {
            expected.add(DbacIdentifiers.fold(metaData, column));
        }
        if (!expected.equals(actual)) {
            problems.add("table " + table.name() + " has primary key " + actual
                + " but must have " + expected + " in that order");
        }
    }

    // ------------------------------------------------------------------ indexes

    private static void readIndexes(
        @NotNull DatabaseMetaData metaData,
        @NotNull String schema,
        @NotNull String tableName,
        @NotNull Map<String, List<IndexColumn>> indexColumns,
        @NotNull Map<String, Boolean> indexUnique,
        @NotNull Map<String, String> indexTable
    ) throws SQLException {
        String foldedTable = DbacIdentifiers.fold(metaData, tableName);
        try (ResultSet dbResult = metaData.getIndexInfo(null, schema, foldedTable, false, false)) {
            while (dbResult.next()) {
                if (dbResult.getShort("TYPE") == DatabaseMetaData.tableIndexStatistic) {
                    continue;
                }
                String indexName = dbResult.getString("INDEX_NAME");
                String columnName = dbResult.getString("COLUMN_NAME");
                if (indexName == null || columnName == null) {
                    continue;
                }
                if (!matchesObject(dbResult.getString("TABLE_SCHEM"), schema,
                    dbResult.getString("TABLE_NAME"), foldedTable)) {
                    continue;
                }
                // Keyed by the name exactly as the database reports it. inspect() then looks the entry up
                // by the folded expected name, so the map lookup IS the exact comparison - the same rule
                // matchesObject applies to tables. Folding the reported name here instead would make index
                // identification case-insensitive while tables stayed case-sensitive, and would accept a
                // quoted mixed-case index that this migration could never have created.
                indexColumns
                    .computeIfAbsent(indexName, k -> new ArrayList<>())
                    .add(new IndexColumn(dbResult.getShort("ORDINAL_POSITION"), columnName));
                indexUnique.put(indexName, !dbResult.getBoolean("NON_UNIQUE"));
                indexTable.put(indexName, foldedTable);
            }
        }
        for (List<IndexColumn> columns : indexColumns.values()) {
            columns.sort((a, b) -> Short.compare(a.position(), b.position()));
        }
    }

    // ------------------------------------------------------------------ helpers

    /**
     * Confirms that a metadata row really describes the object that was asked for.
     * <p>
     * This is what keeps a same-named table in a different schema from being accepted, independently of
     * whether the driver honoured the escaped search pattern.
     */
    private static boolean matchesObject(
        @Nullable String actualSchema,
        @NotNull String expectedSchema,
        @Nullable String actualName,
        @NotNull String expectedName
    ) {
        if (!expectedName.equals(actualName)) {
            return false;
        }
        // A driver that does not report schemas cannot be cross-checked; the schema pattern is then the
        // only filter available.
        return actualSchema == null || DbacIdentifiers.sameIdentifier(expectedSchema, actualSchema);
    }

    private static String describeNullable(int nullable) {
        return switch (nullable) {
            case DatabaseMetaData.columnNoNulls -> "NOT NULL";
            case DatabaseMetaData.columnNullable -> "NULL";
            default -> "unknown";
        };
    }

    private record ActualColumn(int jdbcType, String typeName, int size, int nullable) {
    }

    private record IndexColumn(short position, String name) {
    }

    private DbacSchemaValidator() {
        // utility class
    }
}

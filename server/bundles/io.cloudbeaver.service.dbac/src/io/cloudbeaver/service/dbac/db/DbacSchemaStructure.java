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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.sql.Types;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Declarative description of the DBAC metadata schema at {@link DbacSchemaConstants#CURRENT_SCHEMA_VERSION}.
 * <p>
 * This is the single source of truth {@link DbacSchemaValidator} checks the live database against. It must
 * be kept in sync with {@code db/dbac_schema_create.sql} by hand: the create script is the DDL, this is the
 * expectation the DDL has to produce. A mismatch between the two is caught by the schema tests, which run
 * the real migration and then validate the result.
 */
public final class DbacSchemaStructure {

    /**
     * One expected column.
     *
     * @param name          column name, as written (unquoted) in the create script
     * @param jdbcType      required {@code java.sql.Types} value reported by {@code DatabaseMetaData.getColumns}
     * @param canonicalType canonical type family used for the normalized {@code TYPE_NAME} check
     * @param size          required {@code COLUMN_SIZE}, or {@link #SIZE_NOT_CHECKED} when the value is
     *                      database specific and carries no meaning (numeric precision, timestamp precision)
     * @param nullable      whether the column must accept NULL
     */
    public record Column(
        @NotNull String name,
        int jdbcType,
        @NotNull String canonicalType,
        int size,
        boolean nullable
    ) {
    }

    /** One expected table with its exact column set and its exact, ordered primary key. */
    public record Table(
        @NotNull String name,
        @NotNull List<Column> columns,
        @NotNull List<String> primaryKey
    ) {
    }

    /** One expected index with its exact, ordered column list and its uniqueness. */
    public record Index(
        @NotNull String name,
        @NotNull String tableName,
        @NotNull List<String> columns,
        boolean unique
    ) {
    }

    /** {@code COLUMN_SIZE} is not comparable across databases for this type, so it is not checked. */
    public static final int SIZE_NOT_CHECKED = -1;

    public static final String TYPE_VARCHAR = "VARCHAR";
    public static final String TYPE_INTEGER = "INTEGER";
    public static final String TYPE_BIGINT = "BIGINT";
    public static final String TYPE_TIMESTAMP = "TIMESTAMP";

    /**
     * Vendor spellings of {@code TYPE_NAME} that are known to be exactly the declared type, mapped to the
     * canonical family.
     * <p>
     * This is an allowlist, and a name that is not on it is a validation failure. That is deliberate: the
     * JDBC {@code DATA_TYPE} code is not sufficient on either supported database, as measured against
     * H2 2.4.240 and PostgreSQL 16.15:
     * <ul>
     *     <li>PostgreSQL reports {@code DATA_TYPE=93} for both {@code timestamp} and {@code timestamptz}.
     *         {@code COLUMN_SIZE} is not comparable for timestamps, so nothing but the type name
     *         distinguishes a naive-time column from a zoned one - a difference that decides when a
     *         TEMP_WRITE grant expires.</li>
     *     <li>H2 reports {@code DATA_TYPE=12} and the declared {@code COLUMN_SIZE} for both
     *         {@code CHARACTER VARYING} and {@code VARCHAR_IGNORECASE}, so a case-insensitive column would
     *         otherwise pass as an ordinary one.</li>
     *     <li>PostgreSQL reports {@code DATA_TYPE=12} for {@code text} as well as {@code varchar}.</li>
     * </ul>
     * Accepting an unrecognised spelling because the type code matched would therefore let a genuinely
     * different column through while the module documents itself as validating the exact structure. The
     * cost is that adding a third metadata database requires adding its spellings here - which is the
     * right trade for a security control, and is what {@link DbacRecoveryPolicy} already assumes.
     */
    private static final Map<String, String> TYPE_NAME_ALIASES = Map.ofEntries(
        // SQL standard spelling, and what H2 2.x reports.
        Map.entry("CHARACTER VARYING", TYPE_VARCHAR),
        // What PostgreSQL reports, and the spelling used in the create script.
        Map.entry("VARCHAR", TYPE_VARCHAR),
        Map.entry("INTEGER", TYPE_INTEGER),
        Map.entry("INT4", TYPE_INTEGER),
        Map.entry("BIGINT", TYPE_BIGINT),
        Map.entry("INT8", TYPE_BIGINT),
        Map.entry("TIMESTAMP", TYPE_TIMESTAMP),
        // SQL standard spelling of a naive timestamp. Explicitly NOT "timestamptz".
        Map.entry("TIMESTAMP WITHOUT TIME ZONE", TYPE_TIMESTAMP)
    );

    private static final List<Table> TABLES = List.of(
        new Table(
            DbacSchemaConstants.VERSION_TABLE_NAME,
            List.of(
                varchar("MODULE_ID", 64, false),
                integer("VERSION", false),
                timestamp("UPDATE_TIME", false)
            ),
            List.of("MODULE_ID")
        ),
        new Table(
            DbacSchemaConstants.TABLE_TW_CURRENT,
            List.of(
                varchar("USER_ID", 128, false),
                varchar("PROJECT_ID", 255, false),
                varchar("CONNECTION_ID", 255, false),
                varchar("GRANT_ID", 128, false),
                bigint("REVISION", false),
                varchar("GRANTED_BY", 128, false),
                timestamp("GRANTED_AT", false),
                timestamp("EXPIRES_AT", false),
                varchar("REASON", 1000, false),
                timestamp("REVOKED_AT", true),
                varchar("REVOKED_BY", 128, true),
                varchar("REVOKE_REASON", 1000, true),
                varchar("DRIVER_ID", 128, false),
                varchar("HOST_SNAPSHOT", 255, true),
                varchar("DATABASE_SNAPSHOT", 255, true)
            ),
            List.of("USER_ID", "PROJECT_ID", "CONNECTION_ID")
        ),
        new Table(
            DbacSchemaConstants.TABLE_TW_HISTORY,
            List.of(
                varchar("EVENT_ID", 128, false),
                varchar("GRANT_ID", 128, false),
                varchar("CHANGE_TYPE", 16, false),
                timestamp("CHANGE_TIME", false),
                varchar("USER_ID", 128, false),
                varchar("PROJECT_ID", 255, false),
                varchar("CONNECTION_ID", 255, false),
                varchar("ACTOR_ID", 128, false),
                timestamp("EXPIRES_AT", true),
                varchar("REASON", 1000, true),
                bigint("REVISION", false)
            ),
            List.of("EVENT_ID")
        ),
        new Table(
            DbacSchemaConstants.TABLE_AUDIT_EVENT,
            List.of(
                varchar("EVENT_ID", 128, false),
                varchar("EVENT_TYPE", 32, false),
                timestamp("EVENT_TIME", false),
                varchar("USER_ID", 128, true),
                varchar("ACTOR_ID", 128, true),
                varchar("PROJECT_ID", 255, true),
                varchar("CONNECTION_ID", 255, true),
                varchar("GRANT_ID", 128, true),
                varchar("OPERATION_CATEGORY", 32, true),
                varchar("STATEMENT_TYPE", 32, true),
                varchar("DECISION", 16, true),
                varchar("DENIAL_REASON", 64, true),
                timestamp("EXPIRES_AT", true)
            ),
            List.of("EVENT_ID")
        )
    );

    private static final List<Index> INDEXES = List.of(
        new Index("DBAC_TW_CURRENT_CONN_IDX", DbacSchemaConstants.TABLE_TW_CURRENT,
            List.of("PROJECT_ID", "CONNECTION_ID"), false),
        new Index("DBAC_TW_HISTORY_USER_IDX", DbacSchemaConstants.TABLE_TW_HISTORY,
            List.of("USER_ID", "CHANGE_TIME"), false),
        new Index("DBAC_TW_HISTORY_CONN_IDX", DbacSchemaConstants.TABLE_TW_HISTORY,
            List.of("PROJECT_ID", "CONNECTION_ID", "CHANGE_TIME"), false),
        new Index("DBAC_AUDIT_TIME_IDX", DbacSchemaConstants.TABLE_AUDIT_EVENT,
            List.of("EVENT_TIME"), false),
        new Index("DBAC_AUDIT_USER_IDX", DbacSchemaConstants.TABLE_AUDIT_EVENT,
            List.of("USER_ID", "EVENT_TIME"), false),
        new Index("DBAC_AUDIT_CONN_IDX", DbacSchemaConstants.TABLE_AUDIT_EVENT,
            List.of("PROJECT_ID", "CONNECTION_ID", "EVENT_TIME"), false)
    );

    @NotNull
    public static List<Table> getTables() {
        return TABLES;
    }

    @NotNull
    public static List<Index> getIndexes() {
        return INDEXES;
    }

    /** Names of all tables of this schema. */
    @NotNull
    public static Set<String> getTableNames() {
        return Set.of(
            DbacSchemaConstants.VERSION_TABLE_NAME,
            DbacSchemaConstants.TABLE_TW_CURRENT,
            DbacSchemaConstants.TABLE_TW_HISTORY,
            DbacSchemaConstants.TABLE_AUDIT_EVENT);
    }

    /**
     * Maps a vendor type name to its canonical family, or {@code null} when the spelling is not on the
     * allowlist. An unknown spelling is a validation failure, see {@link #TYPE_NAME_ALIASES}.
     */
    @Nullable
    public static String canonicalTypeName(@Nullable String vendorTypeName) {
        if (vendorTypeName == null) {
            return null;
        }
        String normalized = vendorTypeName.trim().toUpperCase(Locale.ROOT);
        int parenthesis = normalized.indexOf('(');
        if (parenthesis > 0) {
            normalized = normalized.substring(0, parenthesis).trim();
        }
        return TYPE_NAME_ALIASES.get(normalized);
    }

    private static Column varchar(String name, int size, boolean nullable) {
        return new Column(name, Types.VARCHAR, TYPE_VARCHAR, size, nullable);
    }

    private static Column integer(String name, boolean nullable) {
        return new Column(name, Types.INTEGER, TYPE_INTEGER, SIZE_NOT_CHECKED, nullable);
    }

    private static Column bigint(String name, boolean nullable) {
        return new Column(name, Types.BIGINT, TYPE_BIGINT, SIZE_NOT_CHECKED, nullable);
    }

    private static Column timestamp(String name, boolean nullable) {
        return new Column(name, Types.TIMESTAMP, TYPE_TIMESTAMP, SIZE_NOT_CHECKED, nullable);
    }

    private DbacSchemaStructure() {
        // constants only
    }
}

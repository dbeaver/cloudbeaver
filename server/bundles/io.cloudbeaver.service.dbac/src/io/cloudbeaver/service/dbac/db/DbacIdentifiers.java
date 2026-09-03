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
import org.jkiss.dbeaver.DBException;

import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Locale;

/**
 * Identifier handling for JDBC metadata lookups of the DBAC schema.
 * <p>
 * Two rules are enforced here, both of which exist to keep the module from reading the metadata of the
 * wrong object:
 * <ul>
 *     <li>An identifier is folded exactly the way the database folds an <b>unquoted</b> identifier, because
 *         that is how {@code dbac_schema_create.sql} writes every name. There is no "try upper, then try
 *         lower" probing: probing accepts an object that the migration could never have created.</li>
 *     <li>Metadata lookups take patterns, in which {@code _} and {@code %} are wildcards. Every DBAC name
 *         contains {@code _}, so the pattern is escaped with the driver escape character <em>and</em> every
 *         returned row is compared against the expected schema and table name exactly. The second check
 *         makes the result correct even on a driver that ignores the escape.</li>
 * </ul>
 */
public final class DbacIdentifiers {

    /**
     * Folds an unquoted identifier the way the database stores it.
     * <p>
     * Returns the identifier unchanged when the database stores unquoted identifiers in mixed case, which
     * is what the create script writes.
     */
    @NotNull
    public static String fold(@NotNull DatabaseMetaData metaData, @NotNull String identifier) throws SQLException {
        if (metaData.storesLowerCaseIdentifiers()) {
            return identifier.toLowerCase(Locale.ROOT);
        }
        if (metaData.storesUpperCaseIdentifiers()) {
            return identifier.toUpperCase(Locale.ROOT);
        }
        return identifier;
    }

    /**
     * Verifies that the configured schema name survives unquoted use, and returns it in the folded form the
     * database actually stores.
     * <p>
     * {@code CommonUtils.normalizeTableNames} substitutes {@code {table_prefix}} as plain text, so the
     * migration always executes {@code CREATE TABLE <schema>.<table>} with the schema name unquoted. On a
     * folding database a mixed case schema name therefore never addresses the schema the administrator
     * configured. Rather than let that surface later as a confusing DDL error - or, worse, resolve to a
     * different existing schema - it is rejected here with an explicit message.
     *
     * @throws DBException if the name would be folded to something else, i.e. it only exists as a quoted
     *                     mixed case identifier
     */
    @NotNull
    public static String requireUnquotableSchema(@NotNull DatabaseMetaData metaData, @NotNull String schema)
        throws SQLException, DBException {
        if (schema.isEmpty()) {
            // An empty schema would be passed to JDBC metadata as "objects with no schema", which matches
            // whatever the driver decides. The module never guesses a schema.
            throw new DBException("The DBAC schema module requires a schema name; none was resolved.");
        }
        String folded = fold(metaData, schema);
        if (!folded.equals(schema)) {
            throw new DBException(
                "Metadata schema name '" + schema + "' cannot be used by the DBAC schema module: "
                    + metaData.getDatabaseProductName() + " folds unquoted identifiers to '" + folded + "', "
                    + "and the migration runner substitutes the schema name without quoting it. "
                    + "Configure a schema whose name needs no quoting (for example '" + folded + "').");
        }
        return folded;
    }

    /**
     * Escapes {@code _} and {@code %} so an identifier can be passed where JDBC expects a pattern.
     * Returns the identifier unchanged when the driver reports no escape character.
     */
    @NotNull
    public static String escapePattern(@NotNull DatabaseMetaData metaData, @NotNull String identifier) {
        String escape;
        try {
            escape = metaData.getSearchStringEscape();
        } catch (SQLException e) {
            return identifier;
        }
        if (escape == null || escape.isEmpty()) {
            return identifier;
        }
        StringBuilder sb = new StringBuilder(identifier.length() + 8);
        for (int i = 0; i < identifier.length(); i++) {
            char c = identifier.charAt(i);
            if (c == '_' || c == '%' || escape.indexOf(c) >= 0) {
                sb.append(escape);
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /**
     * Compares a value returned by JDBC metadata with an expected identifier.
     * A {@code null} expectation matches anything, which is how an absent {@code TABLE_SCHEM} is handled.
     */
    public static boolean sameIdentifier(@Nullable String expected, @Nullable String actual) {
        if (expected == null) {
            return true;
        }
        return expected.equals(actual);
    }

    private DbacIdentifiers() {
        // utility class
    }
}

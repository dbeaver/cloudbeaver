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
package io.cloudbeaver.test.platform.dbac;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Splits a translated migration script the way {@code SQLSchemaManager.executeScript} does.
 * <p>
 * Test scope, and deliberately free of any JUnit dependency so the same code can be exercised both by the
 * JUnit characterization tests and by the offline harness that runs without the product build.
 * <p>
 * {@code executeScript} splits the translated text on {@code ';'} and executes every non-blank piece as
 * one statement. Assertions about the migration are therefore made per statement rather than over the raw
 * text: whether the SQL parser keeps or drops a script's comment block is not part of the contract being
 * tested, and the comments in {@code dbac_schema_create.sql} legitimately contain keywords such as
 * {@code CREATE TABLE} and {@code IF NOT EXISTS}. Counting keyword occurrences in the raw text would
 * measure the prose instead of the SQL.
 */
public final class DbacScriptStatements {

    /**
     * Returns the statements the migration runner would execute, normalized for keyword comparison:
     * upper case, whitespace collapsed to single spaces, leading blank and comment lines removed.
     * Blank pieces are dropped, as {@code executeScript} drops them.
     */
    public static List<String> split(String translatedScript) {
        List<String> statements = new ArrayList<>();
        for (String piece : translatedScript.split(";")) {
            String statement = stripLeading(piece);
            if (!statement.isEmpty()) {
                statements.add(statement);
            }
        }
        return statements;
    }

    /**
     * Removes every leading blank line and every leading {@code --} comment line, in any order and any
     * number, then returns the remainder normalized to upper case with collapsed whitespace.
     * <p>
     * Only the <i>leading</i> run is removed. Everything from the first SQL token onwards is kept exactly
     * as it is, including any trailing comment, because that is what the database receives.
     */
    public static String stripLeading(String piece) {
        String[] lines = piece.split("\n", -1);
        int first = 0;
        while (first < lines.length) {
            String trimmed = lines[first].trim();
            if (trimmed.isEmpty() || trimmed.startsWith("--")) {
                first++;
                continue;
            }
            break;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = first; i < lines.length; i++) {
            sb.append(lines[i]).append(' ');
        }
        return sb.toString().trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    /** Number of statements whose first token sequence is {@code keyword}. */
    public static int countStartingWith(List<String> statements, String keyword) {
        int count = 0;
        for (String statement : statements) {
            if (statement.startsWith(keyword)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Statement families that must never appear in the version 1 update script.
     * <p>
     * The script exists only to route PostgreSQL version-only recovery through the upgrade branch, so it
     * must not change any state of its own. Listing the families explicitly - rather than only excluding
     * DDL - is what makes the statelessness check meaningful.
     */
    public static final String[] FORBIDDEN_STATEMENT_PREFIXES = {
        "INSERT", "UPDATE", "DELETE", "MERGE",
        "CREATE", "ALTER", "DROP", "TRUNCATE",
        "CALL", "EXECUTE", "EXEC", "DO"
    };

    /**
     * Returns the forbidden family a statement belongs to, or {@code null} when it is stateless.
     * Used instead of an assertion so both the JUnit tests and the offline harness can report on it.
     */
    public static String forbiddenFamilyOf(String normalizedStatement) {
        for (String prefix : FORBIDDEN_STATEMENT_PREFIXES) {
            if (normalizedStatement.equals(prefix) || normalizedStatement.startsWith(prefix + " ")
                || normalizedStatement.startsWith(prefix + "(")) {
                return prefix;
            }
        }
        return null;
    }

    private DbacScriptStatements() {
        // utility class
    }
}

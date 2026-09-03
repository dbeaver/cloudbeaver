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

import java.util.List;
import java.util.Set;

/**
 * Result of inspecting the DBAC objects of one schema.
 * <p>
 * The report separates two questions that must not be collapsed into one:
 * <ul>
 *     <li><b>Is anything there at all?</b> - {@link #isAbsent()}. Nothing there means a first installation,
 *         which is normal on every database.</li>
 *     <li><b>Is what is there exactly right?</b> - {@link #isComplete()}. Anything else is a partial or
 *         damaged installation, and how it may be recovered depends on the database.</li>
 * </ul>
 *
 * @param schema         schema that was inspected, in the form the database stores it
 * @param presentTables  DBAC tables found, by their canonical (create script) name
 * @param presentIndexes DBAC indexes found, by their canonical (create script) name
 * @param problems       every structural mismatch found, in a form suitable for an error message
 */
public record DbacSchemaReport(
    @NotNull String schema,
    @NotNull Set<String> presentTables,
    @NotNull Set<String> presentIndexes,
    @NotNull List<String> problems
) {

    /** No DBAC object of any kind exists in this schema. */
    public boolean isAbsent() {
        return presentTables.isEmpty() && presentIndexes.isEmpty();
    }

    /** Every expected object exists with exactly the expected structure. */
    public boolean isComplete() {
        return problems.isEmpty();
    }

    /** The version table exists, so its contents may be queried without aborting the transaction. */
    public boolean hasVersionTable() {
        return presentTables.contains(DbacSchemaConstants.VERSION_TABLE_NAME);
    }

    /** Human readable summary of every problem, for error messages and logs. */
    @NotNull
    public String describeProblems() {
        return String.join("; ", problems);
    }
}

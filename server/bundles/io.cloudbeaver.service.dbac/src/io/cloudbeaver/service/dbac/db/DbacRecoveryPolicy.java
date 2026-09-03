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

import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Locale;

/**
 * How a half installed DBAC schema may be repaired on a given metadata database.
 * <p>
 * The distinction is forced by the migration runner, not by taste. {@code SQLSchemaManager.executeScript}
 * pipes every script through {@code SQLQueryTranslator.translateScript}, and that translator calls
 * {@code CreateTable.setIfNotExists(false)} whenever the target dialect implements
 * {@code SQLDialectDDLExtension.supportsCreateIfExists()} and returns {@code true}
 * (see {@code SQLQueryTranslator} lines 147-153). Consequently:
 * <ul>
 *     <li>{@code H2SQLDialect} extends {@code GenericSQLDialect} and does not implement
 *         {@code SQLDialectDDLExtension}, so {@code IF NOT EXISTS} survives and the create script is
 *         genuinely idempotent on H2. H2 also does not roll back DDL, so a half applied migration is a
 *         state that actually occurs there and replay is the right repair.</li>
 *     <li>{@code PostgreDialect.supportsCreateIfExists()} returns {@code true}, so every
 *         {@code CREATE TABLE IF NOT EXISTS} reaches PostgreSQL as a plain {@code CREATE TABLE}. Replaying
 *         the create script over existing tables cannot work there and must not be attempted. PostgreSQL
 *         has transactional DDL, so a failed migration leaves nothing behind and the only state that needs
 *         repairing is a complete structure whose version row was lost.</li>
 * </ul>
 * Any other metadata database is treated as unsupported for automatic repair: a first installation still
 * works, but a damaged installation fails closed instead of being guessed at.
 */
public enum DbacRecoveryPolicy {

    /** Re-run the idempotent create script over whatever is already there. */
    REPLAY_CREATE_SCRIPT,

    /** Never re-run the create script; only a complete structure missing its version row may be repaired. */
    VERSION_ROW_ONLY,

    /** Automatic repair is not supported; a damaged installation must fail closed. */
    UNSUPPORTED;

    private static final String PRODUCT_H2 = "H2";
    private static final String PRODUCT_POSTGRESQL = "PostgreSQL";

    /**
     * Determines the policy from the product name reported by the driver.
     * The product name is used rather than the dialect because the version manager is invoked by the
     * platform without one, and because it is the value that actually identifies the running server.
     */
    @NotNull
    public static DbacRecoveryPolicy forDatabase(@NotNull DatabaseMetaData metaData) throws SQLException {
        String product = metaData.getDatabaseProductName();
        if (product == null) {
            return UNSUPPORTED;
        }
        String normalized = product.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals(PRODUCT_H2.toUpperCase(Locale.ROOT))) {
            return REPLAY_CREATE_SCRIPT;
        }
        if (normalized.equals(PRODUCT_POSTGRESQL.toUpperCase(Locale.ROOT))) {
            return VERSION_ROW_ONLY;
        }
        return UNSUPPORTED;
    }
}

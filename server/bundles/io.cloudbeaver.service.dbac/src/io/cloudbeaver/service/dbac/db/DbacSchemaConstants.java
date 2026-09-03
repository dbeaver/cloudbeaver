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

/**
 * Constants of the fork-owned DBAC (DB access control) metadata schema.
 * <p>
 * This schema is versioned independently from the CloudBeaver CE schema: it has its own
 * module id, its own version table and its own migration script namespace. Nothing here
 * may reference {@code CB_SCHEMA_INFO}.
 */
public final class DbacSchemaConstants {

    /** Module id of this schema. Deliberately different from the CE module id {@code CB_CE}. */
    public static final String SCHEMA_ID = "CB_DBAC";

    /** Version of the schema shipped with this build. */
    public static final int CURRENT_SCHEMA_VERSION = 1;

    /**
     * No version is considered obsolete: drop+recreate of this schema is never allowed.
     * <p>
     * This must stay 0. {@code SQLSchemaManager.updateSchema} only enters its {@code dropSchema} branch
     * when {@code schemaVersionObsolete > 0}, and that branch executes {@code DROP ALL OBJECTS}. Raising
     * this value would additionally make {@link #RECOVERY_PENDING_VERSION} drop the whole database.
     */
    public static final int OBSOLETE_SCHEMA_VERSION = 0;

    public static final String CREATE_SCRIPT_PATH = "db/dbac_schema_create";
    public static final String UPDATE_SCRIPT_PREFIX = "db/dbac_schema_update_";

    /** Version table of this module. It is NOT {@code CB_SCHEMA_INFO}. */
    public static final String VERSION_TABLE_NAME = "DBAC_SCHEMA_INFO";

    public static final String TABLE_TW_CURRENT = "DBAC_TW_CURRENT";
    public static final String TABLE_TW_HISTORY = "DBAC_TW_HISTORY";
    public static final String TABLE_AUDIT_EVENT = "DBAC_AUDIT_EVENT";

    /**
     * Value {@link org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager} must return so that
     * {@code SQLSchemaManager} runs the create script instead of an upgrade.
     */
    public static final int SCHEMA_NOT_PRESENT = -1;

    /**
     * Logical version reported when the structure is complete but the version row was lost.
     * <p>
     * It is never stored in {@link #VERSION_TABLE_NAME}; a stored 0 is rejected as unsupported. It exists
     * only to route {@code SQLSchemaManager} into its upgrade branch, which runs
     * {@code dbac_schema_update_1.sql} and then records the version in a transaction it commits itself.
     * Writing the row directly from {@code getCurrentSchemaVersion} would not work: the platform rolls that
     * transaction back immediately afterwards.
     */
    public static final int RECOVERY_PENDING_VERSION = 0;

    /**
     * Lowest version that may ever be written to {@link #VERSION_TABLE_NAME}.
     * <p>
     * {@link #RECOVERY_PENDING_VERSION} sits below it on purpose: it is an in-memory signal to
     * {@code SQLSchemaManager} and must never reach the table, because a stored 0 is rejected as
     * unsupported on the next start.
     */
    public static final int MINIMUM_STORED_VERSION = 1;

    private DbacSchemaConstants() {
        // constants only
    }
}

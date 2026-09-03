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
import org.jkiss.dbeaver.model.sql.schema.ClassLoaderScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaConfig;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaScriptSource;

import java.util.List;

/**
 * Schema configuration of the fork-owned DBAC metadata module.
 * <p>
 * The configuration is passed to {@code CBDatabase} as an additional {@link SQLSchemaConfig}, so the
 * platform applies it as a separate schema module after the CloudBeaver CE schema. It has its own
 * schema id, its own version table and its own script namespace, and therefore never changes the CE
 * schema version.
 */
public final class DbacSchema {

    /**
     * Resolves this module's migration scripts exactly as the platform does.
     * <p>
     * {@code InternalDB.updateSchema} builds its own {@code ClassLoaderScriptSource} from the same class
     * loader and the same two paths. Constructing an equivalent one here - the same class, not a
     * reimplementation of its lookup rule - lets the version manager predict which scripts the runner will
     * find, which is what the update-chain tripwire needs.
     */
    private static final SQLSchemaScriptSource SCRIPT_SOURCE = new ClassLoaderScriptSource(
        DbacSchema.class.getClassLoader(),
        DbacSchemaConstants.CREATE_SCRIPT_PATH,
        DbacSchemaConstants.UPDATE_SCRIPT_PREFIX
    );

    private static final SQLSchemaConfig SCHEMA_CONFIG = new SQLSchemaConfig(
        DbacSchemaConstants.SCHEMA_ID,
        DbacSchemaConstants.CREATE_SCRIPT_PATH,
        DbacSchemaConstants.UPDATE_SCRIPT_PREFIX,
        DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
        DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
        new DbacSchemaVersionManager(
            DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
            DbacSchemaConstants.SCHEMA_ID,
            SCRIPT_SOURCE),
        DbacSchema.class.getClassLoader()
    );

    /** The script source this module's migrations are read from. */
    @NotNull
    public static SQLSchemaScriptSource getScriptSource() {
        return SCRIPT_SOURCE;
    }

    @NotNull
    public static SQLSchemaConfig getSchemaConfig() {
        return SCHEMA_CONFIG;
    }

    @NotNull
    public static List<SQLSchemaConfig> getSchemaConfigs() {
        return List.of(SCHEMA_CONFIG);
    }

    private DbacSchema() {
        // utility class
    }
}

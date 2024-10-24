/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.service.security.db;

import io.cloudbeaver.model.config.WebDatabaseConfig;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.utils.CommonUtils;

import java.sql.Connection;
import java.sql.SQLException;

public class BaseCBSchemaManager implements SQLSchemaVersionManager {
    @NotNull
    protected final WebDatabaseConfig databaseConfig;

    public BaseCBSchemaManager(@NotNull WebDatabaseConfig databaseConfig) {
        this.databaseConfig = databaseConfig;
    }

    @Override
    public int getCurrentSchemaVersion(DBRProgressMonitor monitor, Connection connection, String schemaName)
        throws DBException, SQLException {
        // Check and update schema
        try {
            int version = CommonUtils.toInt(JDBCUtils.executeQuery(connection,
                CommonUtils.normalizeTableNames(
                    "SELECT VERSION FROM {table_prefix}CB_SCHEMA_INFO",
                    databaseConfig.getSchema()
                )
            ));
            return version == 0 ? 1 : version;
        } catch (SQLException e) {
            try {
                Object legacyVersion = CommonUtils.toInt(JDBCUtils.executeQuery(connection,
                    CommonUtils.normalizeTableNames(
                        "SELECT SCHEMA_VERSION FROM {table_prefix}CB_SERVER",
                        databaseConfig.getSchema())
                ));
                // Table CB_SERVER exist - this is a legacy schema
                return CBDatabase.LEGACY_SCHEMA_VERSION;
            } catch (SQLException ex) {
                // Empty schema. Create it from scratch
                return -1;
            }
        }
    }

    @Override
    public int getLatestSchemaVersion() {
        return CBDatabase.CURRENT_SCHEMA_VERSION;
    }

    @Override
    public void updateCurrentSchemaVersion(
        DBRProgressMonitor monitor,
        @NotNull Connection connection,
        @NotNull String schemaName,
        int version
    ) throws DBException, SQLException {
        var updateCount = JDBCUtils.executeUpdate(
            connection,
            CommonUtils.normalizeTableNames(
                "UPDATE {table_prefix}CB_SCHEMA_INFO SET VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP",
                databaseConfig.getSchema()
            ),
            version
        );
        if (updateCount <= 0) {
            JDBCUtils.executeSQL(
                connection,
                CommonUtils.normalizeTableNames(
                    "INSERT INTO {table_prefix}CB_SCHEMA_INFO (VERSION,UPDATE_TIME) VALUES(?,CURRENT_TIMESTAMP)",
                    databaseConfig.getSchema()
                ),
                version
            );
        }
    }

}

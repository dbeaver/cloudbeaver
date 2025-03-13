package io.cloudbeaver.service.security.db;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.utils.CommonUtils;

import java.sql.Connection;
import java.sql.SQLException;

public class CBSchemaVersionManager implements SQLSchemaVersionManager {

    private static final int LEGACY_SCHEMA_VERSION = 1;
    private final int currentSchemaVersion;
    private final String schemaId;

    public CBSchemaVersionManager(int currentSchemaVersion, String schemaId) {
        this.currentSchemaVersion = currentSchemaVersion;
        this.schemaId = schemaId;
    }

    @Override
    public int getCurrentSchemaVersion(DBRProgressMonitor monitor, Connection connection, String schemaName)
    throws DBException, SQLException {
        // Check and update schema
        try {
            Object result = JDBCUtils.executeQuery(
                connection,
                CommonUtils.normalizeTableNames("SELECT VERSION FROM {table_prefix}CB_SCHEMA_INFO WHERE ID = ?", schemaName),
                getId()
            );
            if (result == null) {
                return -1;
            }
            int version = CommonUtils.toInt(result);
            return version == 0 ? 1 : version;
        } catch (SQLException e) {
            try {
                Object legacyVersion = CommonUtils.toInt(JDBCUtils.executeQuery(
                    connection,
                    CommonUtils.normalizeTableNames("SELECT SCHEMA_VERSION FROM {table_prefix}CB_SERVER", schemaName)
                ));
                // Table CB_SERVER exist - this is a legacy schema
                return LEGACY_SCHEMA_VERSION;
            } catch (SQLException ex) {
                // Empty schema. Create it from scratch
                return -1;
            }
        }
    }

    @Override
    public int getLatestSchemaVersion() {
        return currentSchemaVersion;
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
                "UPDATE {table_prefix}CB_SCHEMA_INFO SET VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP WHERE ID = ?",
                schemaName
            ),
            version,
            getId()
        );
        if (updateCount <= 0) {
            JDBCUtils.executeSQL(
                connection,
                CommonUtils.normalizeTableNames(
                    "INSERT INTO {table_prefix}CB_SCHEMA_INFO (VERSION,UPDATE_TIME, ID) VALUES(?,CURRENT_TIMESTAMP, ?)", schemaName),
                version,
                getId()
            );
        }
    }

    @NotNull
    protected String getId(){
        return schemaId;
    }
}


package io.cloudbeaver.service.security.db;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.utils.CommonUtils;

import java.sql.Connection;
import java.sql.SQLException;

public class CBSchemaVersionManager implements SQLSchemaVersionManager {

    private static final Log log = Log.getLog(CBSchemaVersionManager.class);
    private static final int LEGACY_SCHEMA_VERSION = 1;
    private final int currentSchemaVersion;
    private final String schemaId;

    public CBSchemaVersionManager(int currentSchemaVersion, String schemaId) {
        this.currentSchemaVersion = currentSchemaVersion;
        this.schemaId = schemaId;
    }

    @Override
    public int getCurrentSchemaVersion(
        DBRProgressMonitor monitor,
        Connection connection,
        String schemaName
    ) throws DBException, SQLException {

        Integer version = tryGetVersion(
            connection,
            CommonUtils.normalizeTableNames("SELECT VERSION FROM {table_prefix}CB_SCHEMA_INFO WHERE MODULE_ID = ?", schemaName),
            getSchemaId()
        );
        if (version != null) {
            return version;
        }
        version = tryGetVersion(
            connection,
            CommonUtils.normalizeTableNames("SELECT VERSION FROM {table_prefix}CB_SCHEMA_INFO", schemaName)
        );
        if (version != null) {
            return version;
        }
        version = tryGetVersion(
            connection,
            CommonUtils.normalizeTableNames("SELECT SCHEMA_VERSION FROM {table_prefix}CB_SERVER", schemaName)
        );
        if (version != null) {
            return LEGACY_SCHEMA_VERSION;
        }
        // Empty schema. Create it from scratch
        return -1;
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
        var selectCount = CommonUtils.toInt(JDBCUtils.executeQuery(
            connection,
            CommonUtils.normalizeTableNames(
                "SELECT count(1) FROM {table_prefix}CB_SCHEMA_INFO",
                schemaName
            )
        ));
        if (selectCount <= 0) {
            log.debug("Didn't find any records in " +
                CommonUtils.normalizeTableNames("{table_prefix}CB_SCHEMA_INFO", schemaName));
            JDBCUtils.executeSQL(
                connection,
                CommonUtils.normalizeTableNames(
                    "INSERT INTO {table_prefix}CB_SCHEMA_INFO (MODULE_ID, VERSION,UPDATE_TIME) VALUES(?, ?, CURRENT_TIMESTAMP)",
                    schemaName
                ),
                getSchemaId(),
                version
            );
            return;
        }
        if (selectCount == 1) {
            log.debug("Found only one record in " +
                CommonUtils.normalizeTableNames("{table_prefix}CB_SCHEMA_INFO", schemaName));
            JDBCUtils.executeUpdate(
                connection,
                CommonUtils.normalizeTableNames(
                    "UPDATE {table_prefix}CB_SCHEMA_INFO SET VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP",
                    schemaName
                ),
                version
            );
            return;
        }
        JDBCUtils.executeUpdate(
            connection,
            CommonUtils.normalizeTableNames(
                "UPDATE {table_prefix}CB_SCHEMA_INFO SET VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP WHERE MODULE_ID = ?",
                schemaName
            ),
            version,
            getSchemaId()
        );

    }

    protected Integer tryGetVersion(Connection connection, String sql, Object... params) {
        return tryGetVersion(connection, sql, 1, params);
    }

    protected Integer tryGetVersion(Connection connection, String sql, Integer defaultVersion, Object... params) {
        try {
            Object result = JDBCUtils.executeQuery(connection, sql, params);
            return result == null ? defaultVersion : CommonUtils.toInt(result);
        } catch (Exception e) {
            try {
                connection.rollback();
            } catch (SQLException ex) {
                log.error("Can't rollback after unsuccessful try to get version of current schema", ex);
            }
            return null;
        }
    }


    protected String getSchemaId() {
        return schemaId;
    }
}


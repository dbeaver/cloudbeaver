package io.cloudbeaver.service.security.internal;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMSubjectType;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;

public class CBAuthSubjectRepo {
    private static final Log log = Log.getLog(CBAuthSubjectRepo.class);
    private static final CBAuthSubjectRepo INSTANCE = new CBAuthSubjectRepo();

    private CBAuthSubjectRepo() {
    }

    public static CBAuthSubjectRepo getInstance() {
        return INSTANCE;
    }

    public SMSubjectType getSubjectType(@NotNull Connection dbCon, @NotNull String subjectId) {
        try {
            String sqlBuilder = "SELECT SUBJECT_TYPE FROM {table_prefix}CB_AUTH_SUBJECT U WHERE SUBJECT_ID = ?";
            try (var dbStat = dbCon.prepareStatement(sqlBuilder)) {
                dbStat.setString(1, subjectId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        return SMSubjectType.fromCode(dbResult.getString(1));
                    }
                }
            }
            return null;
        } catch (SQLException e) {
            log.error("Error getting all subject ids from database", e);
            return null;
        }
    }

}

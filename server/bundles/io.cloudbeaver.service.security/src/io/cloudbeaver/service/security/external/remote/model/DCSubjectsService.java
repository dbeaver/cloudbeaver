package io.cloudbeaver.service.security.external.remote.model;

import io.cloudbeaver.service.security.external.remote.model.subjects.DCDataSourceSubjectAccessUpdateRequest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;

import java.util.Set;

public interface DCSubjectsService {
    @NotNull
    Set<String> getSubjectPermissions(String subjectId) throws DBException;

    @NotNull
    SMDataSourceGrant[] getSubjectDataSourceAccess(@NotNull String[] subjectId) throws DBException;


    @NotNull
    SMDataSourceGrant[] getDataSourceSubjectAccess(String dataSourceId) throws DBException;

    void setDataSourceSubjectAccess(@NotNull String dataSourceId, DCDataSourceSubjectAccessUpdateRequest request) throws DBException;
}

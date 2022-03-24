package io.cloudbeaver.service.security.external.remote.model;

import io.cloudbeaver.service.security.external.remote.model.subjects.DCSubjectUpdateDataSourceAccessRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCSubjectUpdatePermissionsRequest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;

public interface DCAdminSubjectsService {
    void setSubjectPermissions(String subjectId, DCSubjectUpdatePermissionsRequest request) throws DBException;

    void setSubjectDataSourceAccess(@NotNull String subjectId, DCSubjectUpdateDataSourceAccessRequest request) throws DBException;
}

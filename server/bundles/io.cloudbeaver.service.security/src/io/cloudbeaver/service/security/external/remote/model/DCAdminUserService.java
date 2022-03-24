package io.cloudbeaver.service.security.external.remote.model;

import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserRolesUpdateRequest;
import org.jkiss.dbeaver.DBException;

import java.util.Map;

public interface DCAdminUserService {
    WebUser[] findUsers(String userNameMask) throws DBException;

    void createUser(DCUserCreateRequest userCreateRequest) throws DBException;

    void deleteUser(String userId) throws DBException;

    void updateUserRoles(String userId, DCUserRolesUpdateRequest rolesUpdateRequest) throws DBException;

    WebUser getUserById(String userId) throws DBException;

    void updateUserMeta(String userId, Map<String, Object> metaParameters) throws DBException;
}

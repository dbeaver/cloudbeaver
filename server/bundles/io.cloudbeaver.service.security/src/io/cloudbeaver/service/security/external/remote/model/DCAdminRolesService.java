package io.cloudbeaver.service.security.external.remote.model;

import io.cloudbeaver.service.security.external.remote.model.role.DCRole;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleUpdateRequest;
import org.jkiss.dbeaver.DBException;

import java.util.List;

public interface DCAdminRolesService {
    List<DCRole> getAllRoles() throws DBException;

    void createRole(DCRoleCreateRequest roleCreateRequest) throws DBException;

    void updateRole(String roleId, DCRoleUpdateRequest roleUpdateRequest) throws DBException;

    String[] getRoleSubjects(String roleId) throws DBException;

    DCRole findRole(String roleId) throws DBException;

    void deleteRole(String roleId) throws DBException;
}

package io.cloudbeaver.service.security.internal.remote;

import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.security.external.remote.model.role.DCRole;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.session.DCSessionCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.session.DCSessionUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCDataSourceSubjectAccessUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCSubjectUpdateDataSourceAccessRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCSubjectUpdatePermissionsRequest;
import io.cloudbeaver.service.security.external.remote.model.user.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;


public class CBRemoteSecurityController implements SMAdminController<WebUser, WebRole> {
    private final DCServerClient dcClient = new DCServerClient("http://localhost:8081");

    @Nullable
    @Override
    public String getUserByCredentials(String authProviderId, Map<String, Object> authParameters) throws DBCException {
        return dcClient.getUserByCredentials(new DCUserByCredentialsSearchRequest(authProviderId, authParameters));
    }

    @Override
    public Map<String, Object> getUserCredentials(String userId, String authProviderId) throws DBCException {
        return dcClient.getUserCredentials(userId, authProviderId);
    }

    @Override
    public void createUser(WebUser user) throws DBCException {
        dcClient.createUser(new DCUserCreateRequest(user.getUserId(), user.getMetaParameters()));
    }

    @Override
    public void deleteUser(String userId) throws DBCException {
        dcClient.deleteUser(userId);
    }

    @Override
    public void setUserRoles(String userId, String[] roleIds, String grantorId) throws DBCException {
        dcClient.updateUserRoles(userId, new DCUserRolesUpdateRequest(Arrays.asList(roleIds)));
    }

    @NotNull
    @Override
    public WebRole[] getUserRoles(String userId) throws DBCException {
        return dcClient.getUserRoles(userId).stream().map(DCRole::toWebRole).toArray(WebRole[]::new);
    }

    @Override
    public WebUser getUserById(String userId) throws DBCException {
        return dcClient.getUserById(userId);
    }

    @Override
    public Map<String, Object> getUserParameters(String userId) throws DBCException {
        return dcClient.getUserParameters(userId);
    }

    @Override
    public void setUserParameter(String userId, String name, Object value) throws DBCException {
        dcClient.setUserParameter(userId, new DCUserUpdateParameterRequest(name, value));
    }

    @Override
    public void setUserCredentials(String userId, String authProviderId, Map<String, Object> credentials) throws DBCException {
        dcClient.setUserCredentials(userId, new DCUserUpdateCredentialsRequest(authProviderId, credentials));
    }

    @Override
    public String[] getUserLinkedProviders(String userId) throws DBCException {
        return dcClient.getUserLinkedProviders(userId);
    }

    @NotNull
    @Override
    public Set<String> getUserPermissions(String userId) throws DBCException {
        return dcClient.getUserPermissions(userId);
    }

    @Override
    public boolean isSessionPersisted(String id) throws DBCException {
        return dcClient.isSessionPersisted(id);
    }

    @Override
    public void createSession(@NotNull String appSessionId, @Nullable String userId, @NotNull Map<String, Object> parameters) throws DBCException {
        dcClient.createSession(new DCSessionCreateRequest(appSessionId, userId, parameters));
    }

    @Override
    public void updateSession(@NotNull String sessionId, @Nullable String userId, Map<String, Object> parameters) throws DBCException {
        dcClient.updateSession(sessionId, new DCSessionUpdateRequest(userId, parameters));
    }


    @Override
    public void setSubjectPermissions(String subjectId, List<String> permissionIds, String grantorId) throws DBCException {
        dcClient.setSubjectPermissions(subjectId, new DCSubjectUpdatePermissionsRequest(permissionIds));
    }

    @Override
    public void setSubjectConnectionAccess(@NotNull String subjectId, @NotNull List<String> connectionIds, String grantor) throws DBCException {
        dcClient.setSubjectDataSourceAccess(subjectId, new DCSubjectUpdateDataSourceAccessRequest(connectionIds));
    }

    @NotNull
    @Override
    public Set<String> getSubjectPermissions(String subjectId) throws DBCException {
        return dcClient.getSubjectPermissions(subjectId);
    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull String[] subjectId) throws DBCException {
        return dcClient.getSubjectDataSourceAccess(subjectId);
    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getConnectionSubjectAccess(String connectionId) throws DBCException {
        return dcClient.getDataSourceSubjectAccess(connectionId);
    }

    @Override
    public void setConnectionSubjectAccess(@NotNull String connectionId, @Nullable String[] subjects, @Nullable String grantorId) throws DBCException {
        dcClient.setDataSourceSubjectAccess(connectionId, new DCDataSourceSubjectAccessUpdateRequest(Arrays.asList(subjects)));
    }

    @NotNull
    @Override
    public WebUser[] findUsers(String userNameMask) throws DBCException {
        return dcClient.findUsers(userNameMask);
    }

    @Override
    public void setUserMeta(String userId, Map<String, Object> metaParameters) throws DBCException {
        dcClient.updateUserMeta(userId, metaParameters);
    }

    @NotNull
    @Override
    public WebRole[] readAllRoles() throws DBCException {
        return dcClient.getAllRoles().stream().map(DCRole::toWebRole).toArray(WebRole[]::new);
    }

    @Override
    public WebRole findRole(String roleId) throws DBCException {
        return DCRole.toWebRole(dcClient.findRole(roleId));
    }

    @NotNull
    @Override
    public String[] getRoleSubjects(String roleId) throws DBCException {
        return dcClient.getRoleSubjects(roleId);
    }

    @Override
    public void createRole(WebRole role, String grantor) throws DBCException {
        dcClient.createRole(new DCRoleCreateRequest(DCRole.fromWebRole(role), grantor));
    }

    @Override
    public void updateRole(WebRole role) throws DBCException {
        dcClient.updateRole(role.getRoleId(), new DCRoleUpdateRequest(role.getName(), role.getDescription(), role.getPermissions()));
    }

    @Override
    public void deleteRole(String roleId) throws DBCException {
        dcClient.deleteRole(roleId);
    }
}

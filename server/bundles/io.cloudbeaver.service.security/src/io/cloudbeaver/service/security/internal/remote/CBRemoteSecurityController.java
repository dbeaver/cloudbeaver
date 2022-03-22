package io.cloudbeaver.service.security.internal.remote;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.security.external.remote.model.role.DCRole;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserRolesUpdateRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.auth.SMAuthProviderDescriptor;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;

import java.util.Arrays;
import java.util.Map;
import java.util.Set;

public class CBRemoteSecurityController implements SMAdminController<WebUser, WebRole, WebSession> {
    private final DCServerClient dcClient = new DCServerClient("http://localhost:8080");

    @Nullable
    @Override
    public String getUserByCredentials(SMAuthProviderDescriptor authProvider, Map<String, Object> authParameters) throws DBCException {
        return null;
    }

    @Override
    public Map<String, Object> getUserCredentials(String userId, SMAuthProviderDescriptor authProvider) throws DBCException {
        return null;
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
        dcClient.updateUserRoles(userId, new DCUserRolesUpdateRequest(Arrays.asList(roleIds), grantorId));
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
        return null;
    }

    @Override
    public void setUserParameter(String userId, String name, Object value) throws DBCException {

    }

    @Override
    public void setUserCredentials(String userId, SMAuthProviderDescriptor authProvider, Map<String, Object> credentials) throws DBCException {

    }

    @Override
    public String[] getUserLinkedProviders(String userId) throws DBCException {
        return new String[0];
    }

    @Override
    public void setSubjectPermissions(String subjectId, String[] permissionIds, String grantorId) throws DBCException {

    }

    @NotNull
    @Override
    public Set<String> getSubjectPermissions(String subjectId) throws DBCException {
        return null;
    }

    @NotNull
    @Override
    public Set<String> getUserPermissions(String userId) throws DBCException {
        return null;
    }

    @Override
    public boolean isSessionPersisted(String id) throws DBCException {
        return false;
    }

    @Override
    public void createSession(WebSession session) throws DBCException {

    }

    @Override
    public void updateSession(WebSession session) throws DBCException {

    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull String[] subjectId) throws DBCException {
        return new SMDataSourceGrant[0];
    }

    @Override
    public void setSubjectConnectionAccess(@NotNull String subjectId, @NotNull String[] connectionIds, String grantor) throws DBCException {

    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getConnectionSubjectAccess(String connectionId) throws DBCException {
        return new SMDataSourceGrant[0];
    }

    @Override
    public void setConnectionSubjectAccess(@NotNull String connectionId, @Nullable String[] subjects, @Nullable String grantorId) throws DBCException {

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
        return dcClient.findAllRoles();
    }

    @Override
    public WebRole findRole(String roleId) throws DBCException {
        return dcClient.findRole(roleId);
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

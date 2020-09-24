/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.DBWConnectionGrant;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebPermissionDescriptor;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.admin.*;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceAdmin implements DBWServiceAdmin {

    private static final Log log = Log.getLog(WebServiceAdmin.class);

    @NotNull
    @Override
    public List<AdminUserInfo> listUsers(@NotNull WebSession webSession, String userName) throws DBWebException {
        try {
            List<AdminUserInfo> webUsers = new ArrayList<>();
            for (WebUser user : CBPlatform.getInstance().getApplication().getSecurityController().findUsers(userName)) {
                webUsers.add(new AdminUserInfo(user));
            }
            return webUsers;
        } catch (Exception e) {
            throw new DBWebException("Error reading users", e);
        }
    }

    @NotNull
    @Override
    public List<AdminRoleInfo> listRoles(@NotNull WebSession webSession, String roleName) throws DBWebException {
        try {
            List<AdminRoleInfo> webUsers = new ArrayList<>();
            for (WebRole role : CBPlatform.getInstance().getApplication().getSecurityController().findRoles(roleName)) {
                webUsers.add(new AdminRoleInfo(role));
            }
            return webUsers;
        } catch (Exception e) {
            throw new DBWebException("Error reading users", e);
        }
    }

    @NotNull
    @Override
    public List<AdminPermissionInfo> listPermissions(@NotNull WebSession webSession) throws DBWebException {
        try {
            List<AdminPermissionInfo> permissionInfos = new ArrayList<>();
            for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
                for (WebPermissionDescriptor pd : wsd.getPermissions()) {
                    permissionInfos.add(new AdminPermissionInfo(pd));
                }
            }
            return permissionInfos;
        } catch (Exception e) {
            throw new DBWebException("Error reading users", e);
        }
    }

    @NotNull
    @Override
    public AdminUserInfo createUser(@NotNull WebSession webSession, String userName) throws DBWebException {
        if (userName.isEmpty()) {
            throw new DBWebException("Empty user name");
        }
        try {
            WebUser newUser = new WebUser(userName);
            CBPlatform.getInstance().getApplication().getSecurityController().createUser(newUser);
            return new AdminUserInfo(newUser);
        } catch (Exception e) {
            throw new DBWebException("Error creating new user", e);
        }
    }

    @Override
    public boolean deleteUser(@NotNull WebSession webSession, String userName) throws DBWebException {
        if (CommonUtils.equalObjects(userName, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot delete yourself");
        }
        try {
            CBPlatform.getInstance().getApplication().getSecurityController().deleteUser(userName);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting user", e);
        }
    }

    @NotNull
    @Override
    public AdminRoleInfo createRole(@NotNull WebSession webSession, String roleId) throws DBWebException {
        if (roleId.isEmpty()) {
            throw new DBWebException("Empty role ID");
        }
        try {
            WebRole newRole = new WebRole(roleId);
            CBPlatform.getInstance().getApplication().getSecurityController().createRole(newRole);
            return new AdminRoleInfo(newRole);
        } catch (Exception e) {
            throw new DBWebException("Error creating new role", e);
        }
    }

    @Override
    public boolean deleteRole(@NotNull WebSession webSession, String roleId) throws DBWebException {
        try {
            WebRole[] userRoles = CBPlatform.getInstance().getApplication().getSecurityController().getUserRoles(webSession.getUser().getUserId());
            if (Arrays.stream(userRoles).anyMatch(webRole -> webRole.getRoleId().equals(roleId))) {
                throw new DBWebException("You can not delete your own role");
            }
            CBPlatform.getInstance().getApplication().getSecurityController().deleteRole(roleId);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting role", e);
        }
    }

    @Override
    public boolean grantUserRole(@NotNull WebSession webSession, String user, String role) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant role in anonymous mode");
        }
        try {
            WebRole[] userRoles = CBPlatform.getInstance().getApplication().getSecurityController().getUserRoles(user);
            List<String> roleIds = Arrays.stream(userRoles).map(WebRole::getRoleId).collect(Collectors.toList());
            if (!roleIds.contains(role)) {
                roleIds.add(role);
                CBPlatform.getInstance().getApplication().getSecurityController().setUserRoles(user, roleIds.toArray(new String[0]), grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' already has role '" + role + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting role", e);
        }
    }

    @Override
    public boolean revokeUserRole(@NotNull WebSession webSession, String user, String role) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant role in anonymous mode");
        }
        try {
            WebRole[] userRoles = CBPlatform.getInstance().getApplication().getSecurityController().getUserRoles(user);
            List<String> roleIds = Arrays.stream(userRoles).map(WebRole::getRoleId).collect(Collectors.toList());
            if (roleIds.contains(role)) {
                roleIds.remove(role);
                CBPlatform.getInstance().getApplication().getSecurityController().setUserRoles(user, roleIds.toArray(new String[0]), grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' doesn't have role '" + role + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error revoking role", e);
        }
    }

    @Override
    public boolean setSubjectPermissions(@NotNull WebSession webSession, String roleID, List<String> permissions) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot change permissions in anonymous mode");
        }
        try {
            CBPlatform.getInstance().getApplication().getSecurityController().setSubjectPermissions(roleID, permissions.toArray(new String[0]), grantor.getUserId());
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error setting role permissions", e);
        }
    }

    @Override
    public boolean setUserCredentials(@NotNull WebSession webSession, @NotNull String userID, @NotNull String providerId, @NotNull Map<String, Object> credentials) throws DBWebException {
        WebAuthProviderDescriptor authProvider = WebServiceRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        // Check userId credential.
        // FIXME: It is actually a hack. All crdentials must be passed from client
        if (LocalAuthProvider.PROVIDER_ID.equals(providerId)) {
            credentials.put(LocalAuthProvider.CRED_USER, userID);
        }
        try {
            CBPlatform.getInstance().getApplication().getSecurityController().setUserCredentials(userID, authProvider, credentials);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error setting user credentials", e);
        }
    }

    ////////////////////////////////////////////////////////////////////
    // Connection management

    @Override
    public List<WebConnectionInfo> getAllConnections(@NotNull WebSession webSession) throws DBWebException {
        // Get all connections from global configuration
        List<WebConnectionInfo> result = new ArrayList<>();
        for (DBPDataSourceContainer ds : WebServiceUtils.getDataSourceRegistry().getDataSources()) {
            if (CBPlatform.getInstance().getApplicableDrivers().contains(ds.getDriver())) {
                result.add(new WebConnectionInfo(webSession, ds));
            }
        }

        return result;
    }

    @Override
    public List<AdminConnectionSearchInfo> searchConnections(@NotNull WebSession webSession, @NotNull List<String> hostNames) throws DBWebException {
        ConnectionSearcher searcher = new ConnectionSearcher(webSession, hostNames.toArray(new String[0]));
        try {
            searcher.run(webSession.getProgressMonitor());
        } catch (InvocationTargetException e) {
            throw new DBWebException("Error searching connections", e.getTargetException());
        }
        return searcher.getFoundConnections();
    }

    @Override
    public WebConnectionInfo createConnectionConfiguration(@NotNull WebSession webSession, @NotNull WebConnectionConfig config) throws DBWebException {
        DBPDataSourceRegistry registry = WebServiceUtils.getDataSourceRegistry();
        DBPDataSourceContainer dataSource = WebServiceUtils.createConnectionFromConfig(config, registry);
        registry.addDataSource(dataSource);
        registry.flushConfig();

        return new WebConnectionInfo(webSession, dataSource);
    }

    @Override
    public WebConnectionInfo updateConnectionConfiguration(@NotNull WebSession webSession, @NotNull String id, @NotNull WebConnectionConfig config) throws DBWebException {
        DBPDataSourceContainer dataSource = WebServiceUtils.getDataSourceRegistry().getDataSource(id);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + id + "' not found");
        }
        WebServiceUtils.updateConnectionFromConfig(dataSource, config);
        dataSource.persistConfiguration();
        return new WebConnectionInfo(webSession, dataSource);
    }

    @Override
    public boolean deleteConnectionConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException {
        DBPDataSourceContainer dataSource = WebServiceUtils.getDataSourceRegistry().getDataSource(id);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + id + "' not found");
        }
        WebServiceUtils.getDataSourceRegistry().removeDataSource(dataSource);
        WebServiceUtils.getDataSourceRegistry().flushConfig();

        try {
            CBApplication.getInstance().getSecurityController().setConnectionSubjectAccess(id, null, null);
        } catch (DBCException e) {
            log.error(e);
        }
        return true;
    }

    @Override
    public boolean configureServer(WebSession webSession, AdminServerConfig config) throws DBWebException {
        try {
            CBAppConfig appConfig = new CBAppConfig();
            appConfig.setAnonymousAccessEnabled(config.isAnonymousAccessEnabled());
            appConfig.setAuthenticationEnabled(config.isAuthenticationEnabled());
            appConfig.setSupportsCustomConnections(config.isCustomConnectionsEnabled());
            CBApplication.getInstance().finishConfiguration(
                config.getServerName(),
                config.getAdminName(),
                config.getAdminPassword(),
                appConfig);
            // Refresh active session
            webSession.forceUserRefresh(null);
        } catch (Throwable e) {
            throw new DBWebException("Error configuring server", e);
        }
        return true;
    }

    @Override
    public boolean setDefaultNavigatorSettings(WebSession webSession, DBNBrowseSettings settings) {
        CBApplication.getInstance().setDefaultNavigatorSettings(settings);
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // Access management

    @Override
    public DBWConnectionGrant[] getConnectionSubjectAccess(WebSession webSession, String connectionId) throws DBWebException {
        try {
            return CBApplication.getInstance().getSecurityController().getConnectionSubjectAccess(connectionId);
        } catch (DBCException e) {
            throw new DBWebException("Error getting connection access info", e);
        }
    }

    @Override
    public boolean setConnectionSubjectAccess(@NotNull WebSession webSession, @NotNull String connectionId, @NotNull List<String> subjects) throws DBWebException {
        DBPDataSourceContainer dataSource = WebServiceUtils.getDataSourceRegistry().getDataSource(connectionId);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + connectionId + "' not found");
        }
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant role in anonymous mode");
        }
        try {
            CBApplication.getInstance().getSecurityController().setConnectionSubjectAccess(connectionId, subjects.toArray(new String[0]), grantor.getUserId());
        } catch (DBCException e) {
            throw new DBWebException("Error setting connection subject access", e);
        }
        return true;
    }

    @Override
    public DBWConnectionGrant[] getSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId) throws DBWebException {
        try {
            return CBApplication.getInstance().getSecurityController().getSubjectConnectionAccess(new String[] { subjectId } );
        } catch (DBCException e) {
            throw new DBWebException("Error getting connection access info", e);
        }
    }

    @Override
    public boolean setSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId, @NotNull List<String> connections) throws DBWebException {
        for (String connectionId : connections) {
            if (WebServiceUtils.getDataSourceRegistry().getDataSource(connectionId) == null) {
                throw new DBWebException("Connection '" + connectionId + "' not found");
            }
        }
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant access in anonymous mode");
        }
        try {
            CBApplication.getInstance().getSecurityController().setSubjectConnectionAccess(subjectId, connections.toArray(new String[0]), grantor.getUserId());
        } catch (DBCException e) {
            throw new DBWebException("Error setting subject connection access", e);
        }
        return true;
    }

}

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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebPermissionDescriptor;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import io.cloudbeaver.service.admin.AdminRoleInfo;
import io.cloudbeaver.service.admin.AdminUserInfo;
import io.cloudbeaver.service.admin.DBWServiceAdmin;
import org.jkiss.code.NotNull;
import org.jkiss.utils.ArrayUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Web service implementation
 */
public class WebServiceAdmin implements DBWServiceAdmin {


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
            String[] roleIds = Arrays.stream(userRoles).map(WebRole::getRoleId).toArray(String[]::new);
            if (!ArrayUtils.contains(roleIds, role)) {
                roleIds = ArrayUtils.add(String.class, roleIds, role);
                CBPlatform.getInstance().getApplication().getSecurityController().setUserRoles(user, roleIds, grantor.getUserId());
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
            String[] roleIds = Arrays.stream(userRoles).map(WebRole::getRoleId).toArray(String[]::new);
            if (ArrayUtils.contains(roleIds, role)) {
                roleIds = ArrayUtils.remove(String.class, roleIds, role);
                CBPlatform.getInstance().getApplication().getSecurityController().setUserRoles(user, roleIds, grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' doesn't have role '" + role + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error revoking role", e);
        }
    }

    @Override
    public boolean setRolePermissions(@NotNull WebSession webSession, String roleID, String[] permissions) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot change permissions in anonymous mode");
        }
        try {
            CBPlatform.getInstance().getApplication().getSecurityController().setSubjectPermissions(roleID, permissions, grantor.getUserId());
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error setting role permissions", e);
        }
    }
}

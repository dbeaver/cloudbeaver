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
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import io.cloudbeaver.service.admin.AdminRoleInfo;
import io.cloudbeaver.service.admin.AdminUserInfo;
import io.cloudbeaver.service.admin.DBWServiceAdmin;

import java.util.List;

/**
 * Web service implementation
 */
public class WebServiceAdmin implements DBWServiceAdmin {


    @Override
    public List<AdminUserInfo> listUsers(String userName) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public List<AdminRoleInfo> listRoles(String roleName) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public List<AdminPermissionInfo> listPermissions(String permissionId) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public AdminUserInfo createUser(String userName) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public boolean deleteUser(String userName) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public AdminRoleInfo createRole(String roleName) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public boolean deleteRole(String roleName) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public boolean grantUserRole(String user, String role) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public boolean revokeUserRole(String user, String role) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }

    @Override
    public boolean setRolePermissions(String roleID, String[] permissions) throws DBWebException {
        throw new DBWebException("Feature not supported");
    }
}

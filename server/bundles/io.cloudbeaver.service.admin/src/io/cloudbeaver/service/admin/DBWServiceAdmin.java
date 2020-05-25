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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWService;
import io.cloudbeaver.DBWebException;

import java.util.List;

/**
 * Web service API
 */
public interface DBWServiceAdmin extends DBWService {

    List<AdminUserInfo> listUsers(String userName) throws DBWebException;
    List<AdminRoleInfo> listRoles(String roleName) throws DBWebException;
    List<AdminPermissionInfo> listPermissions(String permissionId) throws DBWebException;

    AdminUserInfo createUser(String userName) throws DBWebException;
    boolean deleteUser(String userName) throws DBWebException;

    AdminRoleInfo createRole(String roleName) throws DBWebException;
    boolean deleteRole(String roleName) throws DBWebException;

    boolean grantUserRole(String user, String role) throws DBWebException;
    boolean revokeUserRole(String user, String role) throws DBWebException;

    boolean setRolePermissions(String roleID, String[] permissions) throws DBWebException;

}

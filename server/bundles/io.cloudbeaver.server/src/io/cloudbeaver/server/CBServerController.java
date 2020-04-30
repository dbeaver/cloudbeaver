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
package io.cloudbeaver.server;

import io.cloudbeaver.DBWServerController;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCFeatureNotSupportedException;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Map;

/**
 * Server controller
 */
class CBServerController implements DBWServerController {

    private final CBDatabase database;

    public CBServerController(CBDatabase database) {
        this.database = database;
    }

    @Override
    public void createUser(WebUser user) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void deleteUser(String userId) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void setUserRoles(String userId, String[] roleIds, String grantorId) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void setUserCredentials(String userId, String authProviderId, Map<String, Object> credentials) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public WebRole[] readAllRoles() throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void createRole(WebRole role) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void deleteRole(String roleId) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }

    @Override
    public void setRolePermissions(String roleId, String[] permissionIds, String grantorId) throws DBCException {
        throw new DBCFeatureNotSupportedException();
    }
}

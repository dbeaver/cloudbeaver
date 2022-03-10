/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import org.jkiss.dbeaver.model.security.DBSecurityConnectionGrant;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.meta.Property;
import io.cloudbeaver.model.user.WebRole;

import java.util.List;

/**
 * Web role info
 */
public class AdminRoleInfo {

    private final WebRole role;
    private List<String> rolePermissions;

    public AdminRoleInfo(WebRole role) {
        this.role = role;
    }

    public String getRoleId() {
        return role.getRoleId();
    }

    public String getRoleName() {
        return role.getName();
    }

    public String getDescription() {
        return role.getDescription();
    }

    public List<String> getRolePermissions() {
        return rolePermissions;
    }

    public void setRolePermissions(List<String> rolePermissions) {
        this.rolePermissions = rolePermissions;
    }

    @Property
    public DBSecurityConnectionGrant[] getGrantedConnections() throws DBCException {
        return CBPlatform.getInstance().getApplication().getSecurityController().getSubjectConnectionAccess(new String[] { getRoleId()} );
    }

    @Property
    public String[] getGrantedUsers() throws DBCException {
        return CBPlatform.getInstance().getApplication().getAdminSecurityController().getRoleSubjects(getRoleId());
    }

}

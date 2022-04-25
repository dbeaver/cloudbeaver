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
package io.cloudbeaver.service.security.internal.db;

import org.jkiss.dbeaver.model.security.user.SMRole;

import java.util.List;

class CBDatabaseInitialData {
    private String adminName = "cbadmin";
    private String adminPassword = "cbadmin20";
    private List<SMRole> roles;

    public String getAdminName() {
        return adminName;
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public List<SMRole> getRoles() {
        return roles;
    }

    public void setRoles(List<SMRole> roles) {
        this.roles = roles;
    }
}

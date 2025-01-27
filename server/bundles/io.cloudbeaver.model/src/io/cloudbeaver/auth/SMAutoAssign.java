/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

package io.cloudbeaver.auth;

import org.jkiss.code.Nullable;

import java.util.ArrayList;
import java.util.List;

public class SMAutoAssign {
    private String authRole;
    private String authRoleAssignReason;
    private List<String> externalTeamIds = new ArrayList<>();

    public SMAutoAssign() {
    }

    public SMAutoAssign(String authRole, List<String> externalRolesIds) {
        this.authRole = authRole;
        this.externalTeamIds = externalRolesIds;
    }

    public String getAuthRole() {
        return authRole;
    }

    public void setAuthRole(String authRole) {
        this.authRole = authRole;
    }

    public List<String> getExternalTeamIds() {
        return externalTeamIds;
    }

    public void addExternalTeamId(String externalRoleId) {
        this.externalTeamIds.add(externalRoleId);
    }

    @Nullable
    public String getAuthRoleAssignReason() {
        return authRoleAssignReason;
    }

    public void setAuthRoleAssignReason(@Nullable String authRoleChangedReason) {
        this.authRoleAssignReason = authRoleChangedReason;
    }
}

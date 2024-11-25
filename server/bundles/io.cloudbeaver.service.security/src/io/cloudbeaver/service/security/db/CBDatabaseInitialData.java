/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.service.security.db;

import org.jkiss.dbeaver.model.security.user.SMTeam;
import org.jkiss.utils.CommonUtils;

import java.util.List;

class CBDatabaseInitialData {
    private String adminName;
    private String adminPassword;
    private List<SMTeam> teams;

    public String getAdminName() {
        return CommonUtils.isEmpty(adminName) ? null : adminName.toLowerCase();
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public List<SMTeam> getTeams() {
        return teams;
    }

    public void setTeams(List<SMTeam> teams) {
        this.teams = teams;
    }
}

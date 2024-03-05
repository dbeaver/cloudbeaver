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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.security.user.SMTeam;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Web team info
 */
public class AdminTeamInfo {

    private final WebSession session;
    private final SMTeam team;
    private List<String> teamPermissions;

    public AdminTeamInfo(WebSession session, SMTeam team) {
        this.team = team;
        this.session = session;
        this.teamPermissions = new ArrayList<>(team.getPermissions());
    }

    public String getTeamId() {
        return team.getTeamId();
    }

    @Property
    public String getTeamName() {
        return team.getName();
    }

    @Property
    public String getDescription() {
        return team.getDescription();
    }

    @Property
    public Map<String, String> getMetaParameters() {
        return team.getMetaParameters();
    }

    @Property
    public List<String> getTeamPermissions() {
        return teamPermissions;
    }

    public void setTeamPermissions(List<String> teamPermissions) {
        this.teamPermissions = teamPermissions;
    }

    @Property
    public SMDataSourceGrant[] getGrantedConnections() throws DBException {
        return session.getAdminSecurityController()
            .getSubjectObjectPermissionGrants(getTeamId(), SMObjectType.datasource)
            .stream()
            .map(objectPermission -> new SMDataSourceGrant(
                objectPermission.getObjectPermissions().getObjectId(),
                getTeamId(),
                objectPermission.getSubjectType()
            ))
            .toArray(SMDataSourceGrant[]::new);
    }

    @Property
    public String[] getGrantedUsers() throws DBException {
        return session.getAdminSecurityController().getTeamMembers(getTeamId());
    }

}

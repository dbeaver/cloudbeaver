package io.cloudbeaver.auth;

import java.util.ArrayList;
import java.util.List;

public class SMAutoAssign {
    private String authRole;
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
}

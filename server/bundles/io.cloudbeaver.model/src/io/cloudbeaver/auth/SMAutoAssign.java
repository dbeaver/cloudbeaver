package io.cloudbeaver.auth;

import org.jkiss.dbeaver.model.security.user.SMTeam;

public class SMAutoAssign {
    private String authRole;
    private SMTeam[] teams;

    public SMAutoAssign() {
    }

    public SMAutoAssign(String authRole, SMTeam[] teams) {
        this.authRole = authRole;
        this.teams = teams;
    }

    public String getAuthRole() {
        return authRole;
    }

    public void setAuthRole(String authRole) {
        this.authRole = authRole;
    }

    public SMTeam[] getTeams() {
        return teams;
    }

    public void setTeams(SMTeam[] teams) {
        this.teams = teams;
    }
}

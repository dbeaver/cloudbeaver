package io.cloudbeaver.service.security.external.remote.model.role;

import io.cloudbeaver.model.user.WebRole;

import java.util.Set;

public class DCRole {
    private final String roleId;
    private final String name;
    private final String description;
    private final Set<String> permissions;

    public DCRole(String roleId, String name, String description, Set<String> permissions) {
        this.roleId = roleId;
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }

    public String getRoleId() {
        return roleId;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    @Override
    public String toString() {
        return roleId;
    }

    public static DCRole fromWebRole(WebRole webRole) {
        return new DCRole(
            webRole.getRoleId(),
            webRole.getName(),
            webRole.getDescription(),
            webRole.getPermissions()
        );
    }

    public static WebRole toWebRole(DCRole dcRole) {
        WebRole webRole = new WebRole(dcRole.getRoleId());
        webRole.setDescription(dcRole.getDescription());
        webRole.setName(dcRole.getName());
        webRole.setPermissions(dcRole.getPermissions());
        return webRole;
    }
}

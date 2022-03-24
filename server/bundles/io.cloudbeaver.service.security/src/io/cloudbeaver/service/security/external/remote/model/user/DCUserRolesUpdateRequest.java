package io.cloudbeaver.service.security.external.remote.model.user;

import java.util.List;

public class DCUserRolesUpdateRequest {
    private final List<String> roleIds;

    public DCUserRolesUpdateRequest(List<String> roleIds) {
        this.roleIds = roleIds;
    }

    public List<String> getRoleIds() {
        return roleIds;
    }
}

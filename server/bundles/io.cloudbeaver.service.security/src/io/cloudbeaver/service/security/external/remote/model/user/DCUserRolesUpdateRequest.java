package io.cloudbeaver.service.security.external.remote.model.user;

import java.util.List;

public class DCUserRolesUpdateRequest {
    private final List<String> roleIds;
    private final String grantorId;

    public DCUserRolesUpdateRequest(List<String> roleIds, String grantorId) {
        this.roleIds = roleIds;
        this.grantorId = grantorId;
    }

    public List<String> getRoleIds() {
        return roleIds;
    }

    public String getGrantorId() {
        return grantorId;
    }
}

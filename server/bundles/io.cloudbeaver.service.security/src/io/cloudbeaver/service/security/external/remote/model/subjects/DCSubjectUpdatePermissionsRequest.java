package io.cloudbeaver.service.security.external.remote.model.subjects;

import org.jkiss.code.NotNull;

import java.util.List;

public class DCSubjectUpdatePermissionsRequest {
    @NotNull
    private final List<String> permissionIds;

    public DCSubjectUpdatePermissionsRequest(@NotNull List<String>permissionIds) {
        this.permissionIds = permissionIds;
    }

    @NotNull
    public List<String> getPermissionIds() {
        return permissionIds;
    }
}

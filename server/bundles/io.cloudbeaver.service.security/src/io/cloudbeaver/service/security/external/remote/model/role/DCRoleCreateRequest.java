package io.cloudbeaver.service.security.external.remote.model.role;

public class DCRoleCreateRequest {
    private final DCRole role;
    //TODO remove
    private final String grantor;

    public DCRoleCreateRequest(DCRole role, String grantor) {
        this.role = role;
        this.grantor = grantor;
    }

    public DCRole getRole() {
        return role;
    }

    public String getGrantor() {
        return grantor;
    }
}

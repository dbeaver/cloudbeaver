package io.cloudbeaver.service.security.external.remote.model.user;

import org.jkiss.code.NotNull;

import java.util.Map;

public class DCUserUpdateCredentialsRequest {
    @NotNull
    private final String authProviderId;
    @NotNull
    private final Map<String, Object> credentials;

    public DCUserUpdateCredentialsRequest(@NotNull String authProviderId, @NotNull Map<String, Object> credentials) {
        this.authProviderId = authProviderId;
        this.credentials = credentials;
    }

    @NotNull
    public String getAuthProviderId() {
        return authProviderId;
    }

    @NotNull
    public Map<String, Object> getCredentials() {
        return credentials;
    }
}

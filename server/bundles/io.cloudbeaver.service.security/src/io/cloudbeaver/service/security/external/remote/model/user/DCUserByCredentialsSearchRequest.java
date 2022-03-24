package io.cloudbeaver.service.security.external.remote.model.user;

import java.util.Map;

public class DCUserByCredentialsSearchRequest {
    private final String authProviderId;
    private final Map<String, Object> authParameters;

    public DCUserByCredentialsSearchRequest(String authProviderId, Map<String, Object> authParameters) {
        this.authProviderId = authProviderId;
        this.authParameters = authParameters;
    }

    public String getAuthProviderId() {
        return authProviderId;
    }

    public Map<String, Object> getAuthParameters() {
        return authParameters;
    }
}

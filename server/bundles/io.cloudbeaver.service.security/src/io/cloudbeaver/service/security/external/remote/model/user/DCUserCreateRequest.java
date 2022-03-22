package io.cloudbeaver.service.security.external.remote.model.user;

import java.util.Map;

public class DCUserCreateRequest {
    private final String userId;
    private final Map<String, String> meta;

    public DCUserCreateRequest(String userId, Map<String, String> meta) {
        this.userId = userId;
        this.meta = meta;
    }

    public String getUserId() {
        return userId;
    }

    public Map<String, String> getMeta() {
        return meta;
    }
}

package io.cloudbeaver.service.security.external.remote.model.session;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.Map;

public class DCSessionUpdateRequest {
    @Nullable
    private final String userId;
    @NotNull
    private final Map<String, Object> parameters;

    public DCSessionUpdateRequest(@Nullable String userId, @NotNull Map<String, Object> parameters) {
        this.userId = userId;
        this.parameters = parameters;
    }

    @Nullable
    public String getUserId() {
        return userId;
    }

    @NotNull
    public Map<String, Object> getParameters() {
        return parameters;
    }
}

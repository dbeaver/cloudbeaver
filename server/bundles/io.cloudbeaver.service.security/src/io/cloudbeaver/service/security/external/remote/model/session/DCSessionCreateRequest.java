package io.cloudbeaver.service.security.external.remote.model.session;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.Map;

public class DCSessionCreateRequest {
    @NotNull
    private final String appSessionId;
    @Nullable
    private final String userId;
    @NotNull
    private final Map<String, Object> parameters;

    public DCSessionCreateRequest(@NotNull String appSessionId,
                                  @Nullable String userId, @NotNull Map<String, Object> parameters){
        this.appSessionId = appSessionId;
        this.userId = userId;
        this.parameters = parameters;
    }

    @NotNull
    public String getAppSessionId() {
        return appSessionId;
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

package io.cloudbeaver.service.security.external.remote.model.session;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

public class DCSession {
    @NotNull
    private final String sessionId;
    @Nullable
    private final String userId;

    public DCSession(@NotNull String sessionId,
                     @Nullable String userId) {
        this.sessionId = sessionId;
        this.userId = userId;
    }

    @NotNull
    public String getSessionId() {
        return sessionId;
    }

    @Nullable
    public String getUserId() {
        return userId;
    }
}

package io.cloudbeaver.model.apilog;

import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Interceptor for API call events.
 * This interface allows to intercept and log API call events in a web application.
 */
public interface ApiCallInterceptor {

    /**
     * Intercept API call event.
     *
     */
    void onApiCallEvent(
        @NotNull HttpServletRequest request,
        @Nullable Map<String, Object> variables,
        @NotNull String apiCall,
        @NotNull LocalDateTime startTime,
        @Nullable String errorMessage,
        @NotNull String apiProtocol
    );
}

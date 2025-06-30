package io.cloudbeaver.model.apilog;

import graphql.ExecutionResult;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.Map;

public interface ApiCallInterceptor {

    /**
     * Intercept API call event.
     *
     */
    void onApiCallEvent(
        HttpServletRequest request,
        Map<String, Object> variables,
        String apiCall,
        LocalDateTime startTime,
        ExecutionResult executionResult
    );
}

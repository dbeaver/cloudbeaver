/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.server.graphql;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.WebParameterSecure;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.StringJoiner;

public class GraphQLLoggerUtil {

    public static final String LOG_API_GRAPHQL_DEBUG_PARAMETER = "log.api.graphql.debug";
    public static final Gson GSON = new GsonBuilder().create();
    public static final String MASK_STRING = "****";

    @Nullable
    public static String getUserId(@NotNull HttpServletRequest request) {
        WebSession session = getWebSession(request);
        if (session == null) {
            return null;
        }
        String userId = session.getUserContext().getUserId();
        if (userId == null && session.getUserContext().isAuthorizedInSecurityManager()) {
            return "anonymous";
        }
        return userId;
    }

    @Nullable
    public static String getSmSessionId(@NotNull HttpServletRequest request) {
        WebSession session = getWebSession(request);
        if (session == null) {
            return null;
        }
        return session.getUserContext().getSmSessionId();
    }

    @Nullable
    public static WebSession getWebSession(@NotNull HttpServletRequest request) {
        if (request.getSession() == null) {
            return null;
        }
        WebApplication webApplication = WebAppUtils.getWebApplication();

        return webApplication.getSessionManager()
            .findWebSession(request);
    }

    @NotNull
    public static String buildLoggerMessage(
        @NotNull String sessionId,
        @NotNull String userId,
        @NotNull Method method,
        @NotNull Object[] args
    ) {
        StringBuilder sb = new StringBuilder(64)
            .append(" [").append(userId)
            .append(", session: ").append(sessionId)
            .append("]");

        if (WebAppUtils.getWebPlatform().getPreferenceStore().getBoolean(LOG_API_GRAPHQL_DEBUG_PARAMETER)) {
            sb.append('(');
            String text = maskArgsToString(method, args);
            if (CommonUtils.isNotEmpty(text)) {
                sb.append(text);
            }
            sb.append(')');
        }
        return sb.toString();
    }

    @NotNull
    public static String maskArgsToString(@NotNull Method method, @Nullable Object[] args) {
        Parameter[] params = method.getParameters();
        if (params.length == 0 || args == null || args.length == 0) {
            return "";
        }

        int limit = Math.min(args.length, params.length);
        StringJoiner joiner = new StringJoiner(", ");

        for (int i = 0; i < limit; i++) {
            Object value = args[i];
            if (value instanceof WebSession || value instanceof ServletRequest || value instanceof ServletResponse) {
                //we already log sessionId
                continue;
            }
            if (params[i].isAnnotationPresent(WebParameterSecure.class)) {
                joiner.add(MASK_STRING);
                continue;
            }
            if (value instanceof String sv && CommonUtils.isEmpty(sv)) {
                continue;
            }

            if (value != null && !isSimple(value.getClass())) {
                String stringValue;
                try {
                    stringValue = GSON.toJson(value);
                } catch (Exception e) {
                    stringValue = value.toString();
                }
                joiner.add(stringValue);
            } else {
                joiner.add(String.valueOf(value));
            }
        }
        return joiner.toString();
    }

    private static boolean isSimple(Class<?> cls) {
        return cls.isPrimitive()
            || Number.class.isAssignableFrom(cls)
            || CharSequence.class.isAssignableFrom(cls)
            || Boolean.class.equals(cls)
            || Enum.class.isAssignableFrom(cls);
    }

}

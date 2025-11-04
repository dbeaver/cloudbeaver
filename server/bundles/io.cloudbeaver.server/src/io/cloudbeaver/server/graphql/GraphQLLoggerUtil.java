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

import io.cloudbeaver.model.log.Sensitive;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.Nullable;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Set;

public class GraphQLLoggerUtil {

    public static final String LOG_API_GRAPHQL_DEBUG_PARAMETER = "log.api.graphql.debug";
    private static final Set<String> PROHIBITED_VARIABLES =
        Set.of("password", "config", "parameters", "settings", "licenseText", "credentials", "username");

    public static String getUserId(HttpServletRequest request) {
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

    public static String getSmSessionId(HttpServletRequest request) {
        WebSession session = getWebSession(request);
        if (session == null) {
            return null;
        }
        return session.getUserContext().getSmSessionId();
    }

    @Nullable
    public static WebSession getWebSession(HttpServletRequest request) {
        if (request.getSession() == null) {
            return null;
        }
        WebApplication webApplication = WebAppUtils.getWebApplication();

        return webApplication.getSessionManager()
            .findWebSession(request);
    }

    public static String buildLoggerMessage(String sessionId, String userId, Method method, Object[] args) {
        StringBuilder loggerMessage = new StringBuilder(" [user: ").append(userId)
            .append(", sessionId: ").append(sessionId).append("]");

//        if (WebAppUtils.getWebPlatform().getPreferenceStore().getBoolean(LOG_API_GRAPHQL_DEBUG_PARAMETER)
        if (true
        ) {
            loggerMessage.append(" [variables] ");
            String parsedVariables = maskArgsToString(method, args);
            if (CommonUtils.isNotEmpty(parsedVariables)) {
                loggerMessage.append(parsedVariables);
            }
        }
        return loggerMessage.toString();
    }

    public static String maskArgsToString(Method method, Object[] args) {
        StringBuilder sb = new StringBuilder();
        Parameter[] params = method.getParameters();

        for (int i = 0; i < params.length; i++) {
            //fixme can't get real parameter names without -parameters compiler option
            String name = params[i].getName();
            Object value = (args != null && i < args.length) ? args[i] : null;

            sb.append(name).append(": ");

            if (params[i].isAnnotationPresent(Sensitive.class)) {
                sb.append("**** ");
            } else if (value != null && !isSimple(value.getClass())) {
                sb.append("{ ");
                for (Field field : value.getClass().getDeclaredFields()) {
                    field.setAccessible(true);
                    sb.append(field.getName()).append(": ");
                    try {
                        if (field.isAnnotationPresent(Sensitive.class)) {
                            sb.append("**** ");
                        } else {
                            sb.append(field.get(value)).append(" ");
                        }
                    } catch (IllegalAccessException e) {
                        sb.append("<err> ");
                    }
                }
                sb.append("} ");
            } else {
                sb.append(value).append(" ");
            }
        }
        return sb.toString().trim();
    }

    private static boolean isSimple(Class<?> cls) {
        return cls.isPrimitive()
            || Number.class.isAssignableFrom(cls)
            || CharSequence.class.isAssignableFrom(cls)
            || Boolean.class.equals(cls)
            || Enum.class.isAssignableFrom(cls);
    }
}

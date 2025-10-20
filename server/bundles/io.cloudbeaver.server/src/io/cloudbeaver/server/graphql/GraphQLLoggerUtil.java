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

import io.cloudbeaver.WebParameterSensitive;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.Nullable;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class GraphQLLoggerUtil {

    public static final String LOG_API_GRAPHQL_DEBUG_PARAMETER = "log.api.graphql.debug";

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

        if (WebAppUtils.getWebPlatform().getPreferenceStore().getBoolean(LOG_API_GRAPHQL_DEBUG_PARAMETER)) {
            loggerMessage.append("(");
            String parsedVariables = maskArgsToString(method, args);
            if (CommonUtils.isNotEmpty(parsedVariables)) {
                loggerMessage.append(parsedVariables);
            }
            loggerMessage.append(")");
        }
        return loggerMessage.toString();
    }

    public static String maskArgsToString(Method method, Object[] args) {
        StringBuilder sb = new StringBuilder();
        Parameter[] params = method.getParameters();
        if (params == null || params.length == 0 || args == null || args.length == 0) {
            return "";
        }

        boolean isFirst = true;
        for (int i = 0; i < args.length; i++) {
            //fixme can't get real parameter names without -parameters compiler option
            if (i >= params.length) {
                break;
            }
            Object value = args[i];
            if (value instanceof WebSession) {
                //we already logged sessionId
                continue;
            }
            if (!isFirst) {
                sb.append(", ");
            }

            if (params[i].isAnnotationPresent(WebParameterSensitive.class)) {
                sb.append("****");
            } else if (value != null && !isSimple(value.getClass())) {
                sb.append("{");
                //todo handle nested objects (?)
                boolean isNestedFirst = true;
                for (Field field : getAllInstanceFields(value.getClass())) {
                    boolean accessible = field.canAccess(value) || field.trySetAccessible();
                    if (!accessible) {
                        continue;
                    }

                    field.setAccessible(true);
                    if (isNestedFirst) {
                        isNestedFirst = false;
                    } else {
                        sb.append(", ");
                    }
                    try {
                        if (field.isAnnotationPresent(WebParameterSensitive.class)) {
                            sb.append("****");
                        } else {
                            sb.append(field.get(value));
                        }
                    } catch (IllegalAccessException e) {
                        sb.append("<err>");
                    }
                }
                sb.append("}");
            } else {
                if(value instanceof String stringValue && CommonUtils.isEmpty(stringValue)){
                    continue;
                }
                sb.append(value);
            }
            isFirst = false;
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

    private static List<Field> getAllInstanceFields(Class<?> type) {
        List<Field> out = new ArrayList<>();
        Set<String> seen = new HashSet<>(); // чтобы не дублировать скрытые/переопределённые имена

        for (Class<?> c = type; c != null && c != Object.class; c = c.getSuperclass()) {
            for (Field f : c.getDeclaredFields()) {
                int m = f.getModifiers();
                if (Modifier.isStatic(m) || f.isSynthetic()) continue; // пропускаем static и синтетические
                if (seen.add(f.getName())) {
                    out.add(f); // сначала добавим поля подкласса, затем родителя
                }
            }
        }
        return out;
    }

}

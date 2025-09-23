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
import graphql.schema.*;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.GsonUtils;

import java.util.*;
import java.util.stream.Collectors;

public class GraphQLLoggerUtil {

    private static final Log log = Log.getLog(GraphQLLoggerUtil.class);
    private static final String SENSITIVE = "sensitive";
    private static final Gson gson = GsonUtils.gsonBuilder().create();

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

    public static String buildLoggerMessage(String sessionId, String userId, GraphQLSchema schema, String operationName,
                                            Map<String, Object> variables
    ) {
        StringBuilder loggerMessage = new StringBuilder(" [user: ").append(userId)
            .append(", sessionId: ").append(sessionId).append("]");

//        if (!WebAppUtils.getWebPlatform().getPreferenceStore().getBoolean(LOG_API_GRAPHQL_DEBUG_PARAMETER)) {
//            return loggerMessage.toString();
//        }
        loggerMessage.append(" [variables] ");
        String parsedVariables = parseVariables(schema, operationName, variables);
        if (CommonUtils.isNotEmpty(parsedVariables)) {
            loggerMessage.append(parsedVariables);
        }
        return loggerMessage.toString();
    }

    public static String parseVariables(GraphQLSchema schema, String operationName, Map<String, Object> variables) {
        StringBuilder result = new StringBuilder();

        GraphQLFieldDefinition field = null;
        GraphQLObjectType queryType = schema.getQueryType();
        if (queryType != null) {
            field = queryType.getFieldDefinition(operationName);
        }
        if (field == null) {
            GraphQLObjectType mutationType = schema.getMutationType();
            if (mutationType != null) {
                field = mutationType.getFieldDefinition(operationName);
            }
        }
        if (field == null) {
            log.warn("GraphQL field not found: " + operationName);
            return "";
        }

        for (GraphQLArgument argument : field.getArguments()) {
            String argName = argument.getName();

            Object varValue = variables != null ? variables.get(argName) : null;

            if (hasSensitive(argument)) {
                result.append(argName).append(": ").append("******** ");
                continue;
            }

            GraphQLInputType inputType = argument.getType();
            String masked = maskValue(inputType, varValue);
            result.append(argName).append(": ").append(masked).append(" ");
        }

        return result.toString().trim();
    }

    private static String maskValue(GraphQLInputType type, Object value) {
        GraphQLType unwrapped = (type instanceof GraphQLNonNull nn) ? nn.getWrappedType() : type;;

        if (unwrapped instanceof GraphQLList listType) {
            if (value == null) return "null";
            if (!(value instanceof Collection<?> col)) {
                return serializeValue(value);
            }
            GraphQLInputType elemType = (GraphQLInputType) listType.getWrappedType();
            List<String> items = new ArrayList<>(col.size());
            for (Object v : col) {
                items.add(maskValue(elemType, v));
            }
            return "[" + String.join(", ", items) + "]";
        }

        if (unwrapped instanceof GraphQLInputObjectType objType) {

            if (hasSensitive(objType)) {
                return "********";
            }
            if (value == null) return "null";
            if (!(value instanceof Map<?, ?> map)) {
                return serializeValue(value);
            }

            Map<String, String> pieces = new LinkedHashMap<>();
            for (GraphQLInputObjectField f : objType.getFieldDefinitions()) {
                String name = f.getName();
                Object fieldVal = map.get(name);

                if (hasSensitive(f)) {
                    pieces.put(name, "********");
                } else {
                    pieces.put(name, maskValue(f.getType(), fieldVal));
                }
            }

            return "{" + pieces.entrySet().stream()
                .map(e -> e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining(", ")) + "}";
        }

        return serializeValue(value);
    }

    private static boolean hasSensitive(GraphQLDirectiveContainer container) {
        return container.getAppliedDirectives().stream().anyMatch(d -> SENSITIVE.equals(d.getName()));
    }

    private static String serializeValue(Object v) {
        if (v == null) {
            return "null";
        }
        if (v instanceof String s) {
            return "\"" + s + "\"";
        }
        if (v instanceof Number || v instanceof Boolean) {
            return String.valueOf(v);
        }
        return gson.toJson(v);
    }
}

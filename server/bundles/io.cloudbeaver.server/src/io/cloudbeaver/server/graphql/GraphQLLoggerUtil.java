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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.utils.CommonUtils;

import java.util.Map;
import java.util.Set;

public class GraphQLLoggerUtil {

    private static final Set<String> PROHIBITED_VARIABLES = GraphQLProhibitedVariables.getAllProhibitedVariables();

    public static String getUserId(HttpServletRequest request) {
        String userId = null;
        WebSession session = (WebSession) CBApplication.getInstance().getSessionManager().getSession(request.getSession().getId());
        if (session != null) {
            userId = session.getUserContext().getUserId();
            if (userId == null && session.getUserContext().isAuthorizedInSecurityManager()) {
                userId = "anonymous";
            }
        }
        return userId;
    }

    public static String buildLoggerMessage(String sessionId, String userId, Map<String, Object> variables) {
        StringBuilder loggerMessage = new StringBuilder(" [user: ").append(userId)
            .append(", sessionId: ").append(sessionId).append("]");

        if (CBPlatform.getInstance().getPreferenceStore().getBoolean("log.debug") && variables != null) {
            loggerMessage.append(" [variables] ");
            String parsedVariables = parseVarialbes(variables);
            if (CommonUtils.isNotEmpty(parsedVariables)) {
                loggerMessage.append(parseVarialbes(variables));
            }
        }
        return loggerMessage.toString();
    }

    private static String parseVarialbes(Map<String, Object> map) {
        StringBuilder result = new StringBuilder();

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (PROHIBITED_VARIABLES.contains(key)) {
                continue;
            }

            if (value instanceof Map) {
                result.append(parseVarialbes((Map<String, Object>) value));
            } else {
                result.append(key).append(": ").append(value).append(" ");
            }
        }
        return result.toString().trim();
    }
}

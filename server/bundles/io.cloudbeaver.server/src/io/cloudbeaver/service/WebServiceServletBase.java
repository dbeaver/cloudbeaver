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
package io.cloudbeaver.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.graphql.GraphQLLoggerUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.qm.QMConstants;
import org.jkiss.dbeaver.model.qm.QMUtils;
import org.jkiss.dbeaver.model.qm.meta.QMApiCallLogInfo;
import org.jkiss.dbeaver.model.qm.meta.QMApiCallType;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public abstract class WebServiceServletBase extends HttpServlet {

    private static final Log log = Log.getLog(WebServiceServletBase.class);
    private static final Type MAP_STRING_OBJECT_TYPE = JSONUtils.MAP_TYPE_TOKEN;
    private static final String REQUEST_PARAM_VARIABLES = "variables";
    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    private final ServletApplication application;

    public WebServiceServletBase(ServletApplication application) {
        this.application = application;
    }

    public ServletApplication getApplication() {
        return application;
    }

    @Override
    protected final void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        WebSession webSession = WebAppUtils.getWebApplication().getSessionManager().findWebSession(request);
        if (webSession == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Web session not found");
            return;
        }
        try {
            processServiceRequest(webSession, request, response);
        } catch (Exception e) {
            log.error(e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error processing request: " + e.getMessage());
        } finally {
            sendApiCallLog(request, response, getVariables(request), LocalDateTime.now());
        }
    }

    protected abstract void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException;

    protected Map<String, Object> getVariables(HttpServletRequest request) {
        return gson.fromJson(request.getParameter(REQUEST_PARAM_VARIABLES), MAP_STRING_OBJECT_TYPE);
    }

    private void sendApiCallLog(HttpServletRequest request,
                                       HttpServletResponse response,
                                       Map<String, Object> variables,
                                       LocalDateTime startTime
    ){

        WebSession webSession = GraphQLLoggerUtil.getWebSession(request);

        String qmSessionId = null;
        if (webSession != null) {
            qmSessionId = webSession.getAttribute(QMConstants.QM_SESSION_ID_ATTR);
        }
        //from body
        Map<String, Object> params = new HashMap<>();
        if (variables != null) {
            params.putAll(variables);
        }
        //from query params
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length == 1) {
                params.put(key, values[0]);
            } else if (values != null) {
                params.put(key, values);
            }
        });
        String sessionId = GraphQLLoggerUtil.getSmSessionId(request);
        String userId = GraphQLLoggerUtil.getUserId(request);
        params.put("sessionId", sessionId);
        QMApiCallLogInfo qmApiCallLogInfo = QMApiCallLogInfo.builder()
            .qmSessionId(qmSessionId)
            .userName(userId)
            .httpMethod(request.getMethod())
            //todo to think
            .isSuccessful(response.getStatus() >= 200 && response.getStatus() < 300)
            .requestType(QMApiCallType.REST)
            .endpoint(request.getRequestURI())
            .requestTime(startTime)
            .parameters(params)
            .build();
        QMUtils.getDefaultHandler().handleActivityLog(qmApiCallLogInfo);
    }
}
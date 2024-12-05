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
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.io.IOException;
import java.lang.reflect.Type;
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
        }
    }

    protected abstract void processServiceRequest(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException;

    protected Map<String, Object> getVariables(HttpServletRequest request) {
        return gson.fromJson(request.getParameter(REQUEST_PARAM_VARIABLES), MAP_STRING_OBJECT_TYPE);
    }
}
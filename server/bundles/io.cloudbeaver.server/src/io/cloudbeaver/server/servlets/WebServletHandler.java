/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.server.servlets;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBServerAction;
import io.cloudbeaver.service.DBWServletHandler;
import org.jkiss.dbeaver.DBException;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class WebServletHandler implements DBWServletHandler {

    public static final String ACTION_CONSOLE = "console";


    @Override
    public boolean handleRequest(Servlet servlet, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        return false;
    }

    protected void createActionFromParams(WebSession session, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        Map<String, Object> parameters = new HashMap<>();
        for (Enumeration<String> ne = request.getParameterNames(); ne.hasMoreElements(); ) {
            String paramName = ne.nextElement();
            parameters.put(paramName, request.getParameter(paramName));
        }
        CBServerAction action = new CBServerAction(ACTION_CONSOLE, parameters);
        action.saveInSession(session);

        // Redirect to home
        response.sendRedirect("/");
    }
}

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
package io.cloudbeaver.service.auth.local;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.actions.AbstractActionServletHandler;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class LocalServletHandler extends AbstractActionServletHandler {

    public static final String URI_PREFIX = "open";
    public static final String PARAM_CONNECTION_ID = "id";
    public static final String PARAM_CONNECTION_NAME = "name";
    public static final String PARAM_CONNECTION_URL = "url";

    private static final Log log = Log.getLog(LocalServletHandler.class);

    @Override
    public boolean handleRequest(Servlet servlet, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        if (URI_PREFIX.equals(WebServiceUtils.removeSideSlashes(request.getPathInfo()))) {
            try {
                WebSession webSession = CBPlatform.getInstance().getSessionManager().getWebSession(request, response, true);
                createActionFromParams(webSession, request, response);
                return true;
            } catch (Exception e) {
                log.error("Error saving open DB action in session", e);
            }
        }
        return false;
    }

    @Override
    protected String getActionConsole() {
        return LocalSessionHandler.ACTION_LOCAL_CONSOLE;
    }
}

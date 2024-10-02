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
package io.cloudbeaver.service.auth.local;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.actions.AbstractActionSessionHandler;
import io.cloudbeaver.server.actions.CBServerAction;
import org.jkiss.dbeaver.DBException;

import java.io.IOException;
import java.util.stream.Stream;

/**
 * LocalSessionHandler
 */
public class LocalSessionHandler extends AbstractActionSessionHandler {

    public static final String ACTION_LOCAL_CONSOLE = "local-console";

    @Override
    public boolean handleSessionAuth(WebSession webSession) throws DBException, IOException {
        if (webSession.getUser() == null && !CBApplication.getInstance().getAppConfiguration().isAnonymousAccessEnabled()) {
            return false;
        }
        executeAction(webSession);
        return false;
    }

    @Override
    protected String getActionConsole() {
        return ACTION_LOCAL_CONSOLE;
    }

    @Override
    protected void openDatabaseConsole(WebSession webSession, CBServerAction action) throws DBException {
        String projectId = action.getParameter(LocalServletHandler.PARAM_PROJECT_ID);
        String connectionId = action.getParameter(LocalServletHandler.PARAM_CONNECTION_ID);
        String connectionName = action.getParameter(LocalServletHandler.PARAM_CONNECTION_NAME);
        String connectionURL = action.getParameter(LocalServletHandler.PARAM_CONNECTION_URL);
        Stream<WebConnectionInfo> stream = webSession.getAccessibleProjects().stream()
            .filter(c -> projectId == null || c.getId().equals(projectId))
            .flatMap(p -> p.getConnections().stream());
        if (connectionId != null) {
            stream = stream.filter(c -> c.getId().equals(connectionId));
        } else if (connectionName != null) {
            stream = stream.filter(t -> t.getName().equals(connectionName));
        } else if (connectionURL != null) {
            stream = stream.filter(t -> t.getUrl().equals(connectionURL));
        }
        WebConnectionInfo connectionInfo = stream.findFirst().orElseThrow(() -> new DBException("Connection is not found in the session"));
        WebServiceUtils.fireActionParametersOpenEditor(webSession, connectionInfo.getDataSourceContainer(), false);
    }
}

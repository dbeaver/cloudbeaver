/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
import io.cloudbeaver.server.CBApplicationBase;
import io.cloudbeaver.server.actions.CBServerAction;
import io.cloudbeaver.server.actions.AbstractActionSessionHandler;
import org.jkiss.dbeaver.DBException;

import java.io.IOException;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * LocalSessionHandler
 */
public class LocalSessionHandler extends AbstractActionSessionHandler {

    public static final String ACTION_LOCAL_CONSOLE = "local-console";

    @Override
    public boolean handleSessionAuth(WebSession webSession) throws DBException, IOException {
        if (webSession.getUser() == null && !CBApplicationBase.getInstance().getAppConfiguration().isAnonymousAccessEnabled()) {
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
        String connectionId = action.getParameter(LocalServletHandler.PARAM_CONNECTION_ID);
        String connectionName = action.getParameter(LocalServletHandler.PARAM_CONNECTION_NAME);
        String connectionURL = action.getParameter(LocalServletHandler.PARAM_CONNECTION_URL);
        WebConnectionInfo connectionInfo = null;
        if (connectionId != null) {
            connectionInfo = webSession.findWebConnectionInfo(connectionId);
        } else if (connectionName != null) {
            connectionInfo = findConnection(webSession, t -> t.getName().equals(connectionName));
        } else if (connectionURL != null) {
            connectionInfo = findConnection(webSession, t -> t.getUrl().equals(connectionURL));
        }
        if (connectionInfo == null) {
            throw new DBException("Connection is not found in the session");
        }
        WebServiceUtils.fireActionParametersOpenEditor(webSession, connectionInfo.getDataSourceContainer(), false);
    }

    private WebConnectionInfo findConnection(WebSession webSession, Predicate<WebConnectionInfo> filter) {
        List<WebConnectionInfo> filteredConnections = webSession.getConnections().stream().filter(filter).collect(Collectors.toList());
        if (filteredConnections.size() != 1) {
            return null;
        }
        return filteredConnections.get(0);

    }
}

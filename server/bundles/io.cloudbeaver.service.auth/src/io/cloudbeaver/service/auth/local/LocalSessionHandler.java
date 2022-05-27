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
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.actions.CBServerAction;
import io.cloudbeaver.server.actions.AbstractActionSessionHandler;
import org.jkiss.dbeaver.DBException;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

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
        String connectionId = action.getParameter(LocalServletHandler.PARAM_CONNECTION_ID);
        String connectionName = action.getParameter(LocalServletHandler.PARAM_CONNECTION_NAME);
        String connectionURL = action.getParameter(LocalServletHandler.PARAM_CONNECTION_URL);
        List<WebConnectionInfo> connectionInfoList = webSession.getConnections();
        WebConnectionInfo connectionInfo = null;
        if (connectionId != null) {
            connectionInfo = webSession.getWebConnectionInfo(connectionId);
        } else if (connectionName != null) {
            List<WebConnectionInfo> filteredConnections = connectionInfoList.stream().filter(t -> t.getName().equals(connectionName)).collect(Collectors.toList());
            if (filteredConnections.size() == 1) {
                connectionInfo = webSession.getWebConnectionInfo(filteredConnections.get(0).getId());
            }
        } else if (connectionURL != null) {
            List<WebConnectionInfo> filteredConnections = connectionInfoList.stream().filter(t -> t.getUrl().equals(connectionURL)).collect(Collectors.toList());
            if (filteredConnections.size() == 1) {
                connectionInfo = webSession.getWebConnectionInfo(filteredConnections.get(0).getId());
            }
        }
        if (connectionInfo == null) {
            throw new DBException("Connection info is null");
        }
        WebServiceUtils.fireActionParametersOpenEditor(webSession, connectionInfo.getDataSourceContainer(), false);
    }
}

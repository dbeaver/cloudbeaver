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
package io.cloudbeaver.server.actions;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWSessionHandler;
import org.jkiss.dbeaver.DBException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public abstract class AbstractActionSessionHandler implements DBWSessionHandler {

    @Override
    public boolean handleSessionOpen(WebSession webSession, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        return handleSessionAuth(webSession);
    }

    @Override
    public abstract boolean handleSessionAuth(WebSession webSession) throws DBException, IOException;

    public void executeAction(WebSession webSession) throws DBException {
        CBServerAction action = CBServerAction.fromSession(webSession, false);
        if (action != null) {
            if (getActionConsole().equals(action.getActionId())) {
                openDatabaseConsole(webSession, action);
                CBServerAction.removeAction(webSession);
            }
        }
    }

    protected abstract String getActionConsole();

    @Override
    public boolean handleSessionClose(WebSession webSession) throws DBException, IOException {
        return false;
    }

    protected abstract void openDatabaseConsole(WebSession webSession, CBServerAction action) throws DBException;
}

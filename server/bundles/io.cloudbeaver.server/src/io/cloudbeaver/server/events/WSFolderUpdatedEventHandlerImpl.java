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
package io.cloudbeaver.server.events;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDatasourceFolderEvent;
import org.jkiss.utils.CommonUtils;

/**
 * Notify all active user session that datasource has been updated
 */
public class WSFolderUpdatedEventHandlerImpl extends WSAbstractProjectEventHandler<WSDatasourceFolderEvent> {

    private static final Log log = Log.getLog(WSFolderUpdatedEventHandlerImpl.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSDatasourceFolderEvent event) {
        if (activeUserSession instanceof WebSession webSession) {
            var project = webSession.getProjectById(event.getProjectId());
            if (project == null) {
                log.debug("Project " + event.getProjectId() + " is not found in session " + webSession.getSessionId());
                return;
            }
            project.getDataSourceRegistry().refreshConfig();
            DBNModel navigatorModel = webSession.getNavigatorModel();
            if (navigatorModel == null) {
                log.debug("Navigator model is not found in session " + webSession.getSessionId());
                return;
            }
            navigatorModel.getRoot().getProjectNode(project).getDatabases().refreshChildren();
        }
        activeUserSession.addSessionEvent(event);
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSDatasourceFolderEvent event) {
        return !CommonUtils.isEmpty(event.getNodePaths()) && super.isAcceptableInSession(activeUserSession, event);
    }
}


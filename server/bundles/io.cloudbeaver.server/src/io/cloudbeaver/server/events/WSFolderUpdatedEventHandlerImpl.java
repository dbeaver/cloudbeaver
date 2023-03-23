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
package io.cloudbeaver.server.events;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDatasourceFolderEvent;
import org.jkiss.utils.CommonUtils;

/**
 * Notify all active user session that datasource has been updated
 */
public class WSFolderUpdatedEventHandlerImpl extends WSAbstractProjectEventHandler<WSDatasourceFolderEvent> {

    private static final Log log = Log.getLog(WSFolderUpdatedEventHandlerImpl.class);

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.DATASOURCE_FOLDER.getTopicId();
    }

    @NotNull
    @Override
    protected Log getLog() {
        return log;
    }

    @NotNull
    @Override
    protected Class<WSDatasourceFolderEvent> getEventClass() {
        return WSDatasourceFolderEvent.class;
    }

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSDatasourceFolderEvent event) {
        if (activeUserSession instanceof WebSession) {
            var webSession = (WebSession) activeUserSession;
            var project = webSession.getProjectById(event.getProjectId());
            project.getDataSourceRegistry().refreshConfig();
            webSession.getNavigatorModel().getRoot().getProjectNode(project).getDatabases().refreshChildren();
        }
        activeUserSession.addSessionEvent(event);
    }

    @Override
    protected boolean validateEvent(@NotNull BaseWebSession activeUserSession, @NotNull WSDatasourceFolderEvent event) {
        return !CommonUtils.isEmpty(event.getNodePaths()) && super.validateEvent(activeUserSession, event);
    }
}


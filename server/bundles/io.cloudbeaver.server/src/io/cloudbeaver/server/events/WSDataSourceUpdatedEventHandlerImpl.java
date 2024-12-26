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

import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;

/**
 * Notify all active user session that datasource has been updated
 */
public class WSDataSourceUpdatedEventHandlerImpl extends WSAbstractProjectEventHandler<WSDataSourceEvent> {

    public static final Log log = Log.getLog(WSDataSourceUpdatedEventHandlerImpl.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSDataSourceEvent event) {
        var sendEvent = true;
        if (activeUserSession instanceof WebSession webSession) {
            WebSessionProjectImpl project = webSession.getProjectById(event.getProjectId());
            if (project == null) {
                log.debug("Project " + event.getProjectId() + " is not found in session " + webSession.getSessionId());
                return;
            }
            sendEvent = project.updateProjectDataSources(
                event.getDataSourceIds(),
                event.getId()
            );
        }
        if (sendEvent) {
            activeUserSession.addSessionEvent(event);
        }
    }
}


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
package io.cloudbeaver.server.events;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.websocket.WSEventType;
import io.cloudbeaver.websocket.event.WSEvent;
import io.cloudbeaver.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.code.NotNull;

/**
 * Notify all active user session that datasource has been updated
 */
public class WSDataSourceUpdatedEventHandlerImpl extends WSProjectUpdatedEventHandler {
    @NotNull
    @Override
    public String getSupportedEventType() {
        return WSEventType.DATASOURCE_UPDATED.getEventId();
    }

    @Override
    protected void updateSessionData(WebSession activeUserSession, WSEvent event) {
        if (!(event instanceof WSDataSourceEvent)) {
            return;
        }
        var dsUpdateEvent = (WSDataSourceEvent) event;
        WebProjectImpl project = activeUserSession.getProjectById(dsUpdateEvent.getProjectId());
        if (project == null) {
            return;
        }
        activeUserSession.updateProjectConnection(
            project,
            dsUpdateEvent.getDatasourceIds(),
            dsUpdateEvent.getEventType()
        );
        activeUserSession.addSessionEvent(event);
    }
}


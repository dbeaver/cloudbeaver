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

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;

/**
 * Notify all active user session that datasource has been updated
 */
public class WSDataSourceUpdatedEventHandlerImpl extends WSProjectUpdatedEventHandler<WSDataSourceEvent> {
    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.DATASOURCE.getTopicId();
    }

    @NotNull
    @Override
    protected Class<WSDataSourceEvent> getEventClass() {
        return WSDataSourceEvent.class;
    }

    @Override
    protected void updateSessionData(BaseWebSession activeUserSession, WSDataSourceEvent event) {
        if (!validateEvent(activeUserSession, event)) {
            return;
        }
        var sendEvent = true;
        if (activeUserSession instanceof WebSession) {
            var webSession = (WebSession) activeUserSession;
            WebProjectImpl project = webSession.getProjectById(event.getProjectId());
            sendEvent = webSession.updateProjectConnection(
                project,
                event.getDataSourceIds(),
                WSEventType.valueById(event.getId())
            );
        }
        if (sendEvent) {
            activeUserSession.addSessionEvent(event);
        }
    }
}


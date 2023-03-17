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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSUserSecretEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;

import java.util.List;

/**
 * Notify all active user session that rm resource has been updated
 */
public class WSUserSecretEventHandlerImpl extends WSProjectUpdatedEventHandler {

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.USER_SECRET.getTopicId();
    }

    @Override
    protected void updateSessionData(BaseWebSession activeUserSession, WSEvent event) {
        if (!(event instanceof WSUserSecretEvent && activeUserSession instanceof WebSession)) {
            return;
        }
        var resourceUpdateEvent = (WSUserSecretEvent) event;
        var connectionInfo = ((WebSession) activeUserSession).findWebConnectionInfo(resourceUpdateEvent.getDataSourceId());
        if (connectionInfo == null) {
            return;
        }
        try {
            connectionInfo.getDataSourceContainer().resolveSecrets(activeUserSession.getUserContext().getSecretController());
        } catch (DBException e) {
            return;
        }
        activeUserSession.addSessionEvent(
            WSDataSourceEvent.update(
                event.getSessionId(),
                event.getUserId(),
                connectionInfo.getProjectId(),
                List.of(resourceUpdateEvent.getDataSourceId()),
                WSDataSourceProperty.CONFIGURATION
            )
        );
    }
}

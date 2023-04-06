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
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSUserSecretEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;

import java.util.Collection;
import java.util.List;

/**
 * Notify all active user session that rm resource has been updated
 */
public class WSUserSecretEventHandlerImpl extends WSDefaultEventHandler<WSUserSecretEvent> {

    private static final Log log = Log.getLog(WSUserSecretEventHandlerImpl.class);

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.USER_SECRET.getTopicId();
    }

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSUserSecretEvent event) {
        if (!(activeUserSession instanceof WebSession)) {
            activeUserSession.addSessionEvent(event);
            return;
        }
        var connectionInfo = ((WebSession) activeUserSession).findWebConnectionInfo(event.getDataSourceId());
        if (connectionInfo == null) {
            log.debug("Connection " + event.getDataSourceId() + " is not found in session " + activeUserSession.getSessionId());
            return;
        }
        try {
            connectionInfo.getDataSourceContainer().resolveSecrets(activeUserSession.getUserContext().getSecretController());
        } catch (DBException e) {
            log.error("Error on resolving secrets in session " + activeUserSession.getSessionId(), e);
            return;
        }
        activeUserSession.addSessionEvent(
            WSDataSourceEvent.update(
                event.getSessionId(),
                event.getUserId(),
                connectionInfo.getProjectId(),
                List.of(event.getDataSourceId()),
                WSDataSourceProperty.CONFIGURATION
            )
        );
    }
}

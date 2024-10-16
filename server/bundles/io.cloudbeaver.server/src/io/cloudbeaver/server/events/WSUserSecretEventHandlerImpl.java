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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSUserSecretEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;

import java.util.List;

/**
 * Notify all active user session that rm resource has been updated
 */
public class WSUserSecretEventHandlerImpl extends WSDefaultEventHandler<WSUserSecretEvent> {

    private static final Log log = Log.getLog(WSUserSecretEventHandlerImpl.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSUserSecretEvent event) {
        if (!(activeUserSession instanceof WebSession webSession)) {
            activeUserSession.addSessionEvent(event);
            return;
        }
        WebSessionProjectImpl project = webSession.getProjectById(event.getProjectId());
        if (project == null) {
            log.debug("Project " + event.getDataSourceId() + " is not found in session " + webSession.getSessionId());
            return;
        }
        var connectionInfo = project.findWebConnectionInfo(event.getDataSourceId());
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

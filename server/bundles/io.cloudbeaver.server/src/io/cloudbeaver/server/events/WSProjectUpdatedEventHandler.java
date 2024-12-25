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

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSProjectUpdateEvent;

public class WSProjectUpdatedEventHandler extends WSAbstractProjectEventHandler<WSProjectUpdateEvent> {

    private static final Log log = Log.getLog(WSProjectUpdatedEventHandler.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSProjectUpdateEvent event) {
        var eventId = event.getId();
        var projectId = event.getProjectId();
        try {
            if (WSProjectUpdateEvent.ADDED.equals(eventId)) {
                activeUserSession.addSessionProject(projectId);
                log.info("Project '" + projectId + "' added to '" + activeUserSession.getSessionId() + "' session");
            } else if (WSProjectUpdateEvent.REMOVED.equals(eventId)) {
                activeUserSession.removeSessionProject(projectId);
                log.info("Project '" + projectId + "' removed from '" + activeUserSession.getSessionId() + "' session");
            }
            activeUserSession.addSessionEvent(event);
        } catch (DBException e) {
            log.warn("Failed to handle project lifecycle event", e);
        }
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSProjectUpdateEvent event) {
        return !WSWebUtils.isSessionIdEquals(activeUserSession, event.getSessionId()) &&
            (event.getId().equals(WSProjectUpdateEvent.REMOVED) ||
            activeUserSession.getUserContext().hasPermission(DBWConstants.PERMISSION_ADMIN));
    }
}

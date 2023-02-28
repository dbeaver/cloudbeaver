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
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.*;

import java.util.Collection;

/**
 * Notify all active user session that project has been updated
 */
public abstract class WSProjectUpdatedEventHandler implements WSEventHandler {
    private static final Log log = Log.getLog(WSProjectUpdatedEventHandler.class);

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.PROJECTS.getTopicId();
    };

    @Override
    public void handleEvent(@NotNull WSEvent event) {
        log.debug(getSupportedTopicId() + " event handled");
        Collection<BaseWebSession> allSessions = CBPlatform.getInstance().getSessionManager().getAllActiveSessions();
        for (var activeUserSession : allSessions) {
            if (WSWebUtils.isSessionIdEquals(activeUserSession, event.getSessionId())) {
                continue;
            }
            updateSessionData(activeUserSession, event);
        }
    }

    protected abstract void updateSessionData(BaseWebSession activeUserSession, WSEvent event);

    protected boolean validateEvent(BaseWebSession activeUserSession, WSAbstractProjectEvent event) {
        if (!activeUserSession.isProjectAccessible(event.getProjectId())) {
            return false;
        }
        return WSEventType.valueById(event.getId()) != null;
    }
}

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
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

import java.util.Collection;

public abstract class WSAbstractEventHandler<EVENT extends WSEvent> implements WSEventHandler<EVENT> {

    private static final Log log = Log.getLog(WSAbstractEventHandler.class);

    @Override
    public void handleEvent(@NotNull EVENT event) {
        Collection<BaseWebSession> allSessions = CBPlatform.getInstance().getSessionManager().getAllActiveSessions();
        for (var activeUserSession : allSessions) {
            if (!validateEvent(activeUserSession, event)) {
                log.debug(getSupportedTopicId() + " event '" + event.getId() + "' is not valid");
                continue;
            }
            log.debug(getSupportedTopicId() + " event '" + event.getId() + "' handled");
            updateSessionData(activeUserSession, event);
        }
    }

    protected abstract void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull EVENT event);

    protected boolean validateEvent(@NotNull BaseWebSession activeUserSession, @NotNull EVENT event) {
        if (WSWebUtils.isSessionIdEquals(activeUserSession, event.getSessionId())) {
            return false; // skip events from current session
        }
        return true;
    }
}

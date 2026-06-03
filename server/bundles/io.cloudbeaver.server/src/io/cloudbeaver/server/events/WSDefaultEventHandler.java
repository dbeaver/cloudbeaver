/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public abstract class WSDefaultEventHandler<EVENT extends WSEvent> implements WSEventHandler<EVENT> {

    private static final Log log = Log.getLog(WSDefaultEventHandler.class);

    @Override
    public void handleEvent(@NotNull EVENT event) {
        if (!WebAppUtils.isWebApplication()) {
            return;
        }
        Consumer<BaseWebSession> consumer = getEventConsumer(event);
        if (consumer == null) {
            return;
        }
        Set<String> sessionIds = WebAppUtils.getWebApplication().getSessionManager().getAllActiveSessions().stream()
            .filter(session -> isAcceptableInSession(session, event))
            .peek(consumer)
            .map(session -> session.getUserContext().getSmSessionId())
            .collect(Collectors.toSet());

        if (!sessionIds.isEmpty()) {
            log.debug(event.getTopicId() + " event '" + event.getId() + "' handled in sessions: " + String.join(", ", sessionIds));
        }
    }

    @Nullable
    protected Consumer<BaseWebSession> getEventConsumer(@NotNull EVENT event) {
        return (session) -> updateSessionData(session, event);
    }

    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull EVENT event) {
        activeUserSession.addSessionEvent(event);
    }

    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull EVENT event) {
        return !WebEventUtils.isSmSessionIdEquals(activeUserSession, event.getSessionId()); // skip events from current session
    }
}

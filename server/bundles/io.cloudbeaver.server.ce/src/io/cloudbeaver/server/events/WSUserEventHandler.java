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

import io.cloudbeaver.server.CBApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.WSAbstractEvent;
import org.jkiss.dbeaver.model.websocket.event.WSUserCloseSessionsEvent;
import org.jkiss.dbeaver.model.websocket.event.WSUserDeletedEvent;

public class WSUserEventHandler<EVENT extends WSAbstractEvent> implements WSEventHandler<EVENT> {
    @Override
    public void handleEvent(@NotNull EVENT event) {
        var sessionManager = CBApplication.getInstance().getSessionManager();
        switch (event.getId()) {
            case WSUserCloseSessionsEvent.ID:
                if (event instanceof WSUserCloseSessionsEvent closeSessionsEvent) {
                    if (closeSessionsEvent.getSessionIds().isEmpty()) {
                        sessionManager.closeAllSessions(closeSessionsEvent.getSessionId());
                    } else {
                        sessionManager.closeSessions(closeSessionsEvent.getSessionIds());
                    }
                }
                break;
            case WSUserDeletedEvent.ID:
                if (event instanceof WSUserDeletedEvent userDeletedEvent) {
                    sessionManager.closeUserSession(userDeletedEvent);
                }
                break;
            default:
                break;
        }

    }
}

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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSProjectEvent;

/**
 * Notify all active user session that project has been updated
 */
public abstract class WSAbstractProjectEventHandler<EVENT extends WSProjectEvent> extends WSDefaultEventHandler<EVENT> {

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.PROJECTS.getTopicId();
    }

    @Override
    protected boolean validateEvent(@NotNull BaseWebSession activeUserSession, @NotNull EVENT event) {
        return activeUserSession.isProjectAccessible(event.getProjectId()) &&
            WSEventType.valueById(event.getId()) != null;
    }
}

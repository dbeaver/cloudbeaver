/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.websocket.event;

import io.cloudbeaver.websocket.WSEventType;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

/**
 * Base websocket event
 */
public abstract class WSEvent {
    @Nullable
    private final String sessionId;
    @NotNull
    private final WSEventType eventType;

    protected WSEvent(@NotNull WSEventType eventType) {
        this(eventType, null);
    }

    protected WSEvent(@NotNull WSEventType eventType, @Nullable String sessionId) {
        this.eventType = eventType;
        this.sessionId = sessionId;
    }

    @NotNull
    public String getId() {
        return eventType.getEventId();
    }

    @Nullable
    public String getSessionId() {
        return sessionId;
    }

    @NotNull
    public String getTopic() {
        return eventType.getTopic().getTopicId();
    }

    @NotNull
    public WSEventType getEventType() {
        return eventType;
    }
}
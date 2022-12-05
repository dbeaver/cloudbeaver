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
package io.cloudbeaver.events;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.Map;

/**
 * CloudBeaver event
 */
public class CBEvent {
    @Nullable
    private final String sessionId;
    @NotNull
    private final String eventType;
    @NotNull
    private final Map<String, Object> eventData;

    public CBEvent(@NotNull String eventType) {
        this(eventType, null, Map.of());
    }

    public CBEvent(@NotNull String eventType, @Nullable String sessionId) {
        this(eventType, sessionId, Map.of());
    }

    public CBEvent(@NotNull String eventType, @Nullable String sessionId, @NotNull Map<String, Object> eventData) {
        this.eventType = eventType;
        this.sessionId = sessionId;
        this.eventData = eventData;
    }

    @NotNull
    public String getEventType() {
        return eventType;
    }

    @Nullable
    public String getSessionId() {
        return sessionId;
    }

    @NotNull
    public Map<String, Object> getEventData() {
        return eventData;
    }
}
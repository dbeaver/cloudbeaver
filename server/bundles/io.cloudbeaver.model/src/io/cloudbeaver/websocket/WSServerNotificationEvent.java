/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.websocket;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSAbstractSessionEvent;

public class WSServerNotificationEvent extends WSAbstractSessionEvent {

    public static final String EVENT_ID = "cb_server_notification";
    private String title;
    private String message;
    private WSServerNotificationEventType notificationType;

    public WSServerNotificationEvent(
        @Nullable String title,
        @Nullable String message,
        @NotNull WSServerNotificationEventType notificationType
    ) {
        super(EVENT_ID, WSConstants.TOPIC_USER_NOTIFICATION);
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public WSServerNotificationEventType getNotificationType() {
        return notificationType;
    }
}

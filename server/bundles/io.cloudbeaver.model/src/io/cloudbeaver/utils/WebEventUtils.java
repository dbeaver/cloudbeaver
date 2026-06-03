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
package io.cloudbeaver.utils;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.websocket.event.task.WSSessionTaskInfoEvent;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSSubjectPermissionEvent;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceProperty;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceUpdatedEvent;

import java.util.Objects;

public class WebEventUtils {

    public static void addRmResourceUpdatedEvent(
        String projectId,
        WebSession session,
        String resourcePath,
        WSConstants.EventAction eventAction,
        WSResourceProperty property
    ) {
        addRmResourceUpdatedEvent(projectId, session, resourcePath, eventAction, property, null);
    }

    public static void addRmResourceUpdatedEvent(
        String projectId,
        WebSession session,
        String resourcePath,
        WSConstants.EventAction eventAction,
        WSResourceProperty property,
        String details
    ) {
        WSEvent event = null;
        switch (eventAction) {
            case CREATE:
                event = WSResourceUpdatedEvent.create(
                    WebEventUtils.getSmSessionId(session),
                    session.getUserId(),
                    projectId,
                    resourcePath,
                    property,
                    details
                );
                break;
            case DELETE:
                event = WSResourceUpdatedEvent.delete(
                    WebEventUtils.getSmSessionId(session),
                    session.getUserId(),
                    projectId,
                    resourcePath,
                    property,
                    details
                );
                break;
            case UPDATE:
                event = WSResourceUpdatedEvent.update(
                    WebEventUtils.getSmSessionId(session),
                    session.getUserId(),
                    projectId,
                    resourcePath,
                    property,
                    details
                );
                break;
        }
        if (event == null) {
            return;
        }
        ServletAppUtils.getServletApplication().getEventController().addEvent(event);
    }

    public static void sendAsyncTaskEvent(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo taskInfo) {
        webSession.addSessionEvent(
            new WSSessionTaskInfoEvent(
                taskInfo.getId(),
                taskInfo.getStatus(),
                taskInfo.isRunning()
            )
        );
    }

    public static void addSubjectPermissionsUpdateEvent(
        @NotNull String subjectId,
        @NotNull SMSubjectType subjectType,
        @Nullable String smSessionId,
        @Nullable String userId
    ) {
        var event = WSSubjectPermissionEvent.update(
            smSessionId,
            userId,
            subjectType,
            subjectId
        );
        ServletAppUtils.getServletApplication().getEventController().addEvent(event);
    }

    @Nullable
    public static String getSmSessionId(@NotNull BaseWebSession webSession) {
        return webSession.getUserContext().getSmSessionId();
    }

    public static boolean isSmSessionIdEquals(@NotNull BaseWebSession webSession, @Nullable String smSessionId) {
        return Objects.equals(getSmSessionId(webSession), smSessionId);
    }
}
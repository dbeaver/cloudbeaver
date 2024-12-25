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
package io.cloudbeaver.utils;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDatasourceFolderEvent;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceProperty;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceUpdatedEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSSessionTaskInfoEvent;

import java.util.List;

public class WebEventUtils {
    /**
     * adds events of updated datasource to event controller
     *
     * @param project      project of updated database
     * @param session      web session
     * @param datasourceId id of datasource
     * @param eventAction  type of event
     */
    public static void addDataSourceUpdatedEvent(
        DBPProject project,
        WebSession session,
        String datasourceId,
        WSConstants.EventAction eventAction,
        WSDataSourceProperty property
    ) {
        if (project == null) {
            return;
        }
        WSEvent event = null;
        switch (eventAction) {
            case CREATE:
                event = WSDataSourceEvent.create(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    project.getId(),
                    List.of(datasourceId),
                    property
                );
                break;
            case DELETE:
                event = WSDataSourceEvent.delete(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    project.getId(),
                    List.of(datasourceId),
                    property
                );
                break;
            case UPDATE:
                event = WSDataSourceEvent.update(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    project.getId(),
                    List.of(datasourceId),
                    property
                );
                break;
        }
        if (event == null) {
            return;
        }
        ServletAppUtils.getServletApplication().getEventController().addEvent(event);
    }

    public static void addNavigatorNodeUpdatedEvent(
        DBPProject project,
        WebSession session,
        String nodePath,
        WSConstants.EventAction eventAction
    ) {
        if (project == null) {
            return;
        }
        WSEvent event = null;
        switch (eventAction) {
            case CREATE:
                event = WSDatasourceFolderEvent.create(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    project.getId(),
                    List.of(nodePath)
                );
                break;
            case DELETE:
                event = WSDatasourceFolderEvent.delete(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    project.getId(),
                    List.of(nodePath)
                );
                break;
            case UPDATE:
                event = WSDatasourceFolderEvent.update(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    project.getId(),
                    List.of(nodePath)
                );
                break;
        }
        if (event == null) {
            return;
        }
        ServletAppUtils.getServletApplication().getEventController().addEvent(event);
    }

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
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    projectId,
                    resourcePath,
                    property,
                    details
                );
                break;
            case DELETE:
                event = WSResourceUpdatedEvent.delete(
                    session.getUserContext().getSmSessionId(),
                    session.getUserId(),
                    projectId,
                    resourcePath,
                    property,
                    details
                );
                break;
            case UPDATE:
                event = WSResourceUpdatedEvent.update(
                    session.getUserContext().getSmSessionId(),
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

}
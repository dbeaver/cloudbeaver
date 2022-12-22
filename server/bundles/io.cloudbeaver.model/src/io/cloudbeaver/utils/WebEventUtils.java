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
package io.cloudbeaver.utils;

import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDatasourceFolderEvent;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceUpdatedEvent;

import java.util.List;

public class WebEventUtils {
    /**
     * adds events of updated datasource to event controller
     *
     * @param project      project of updated database
     * @param sessionId    session id
     * @param datasourceId id of datasource
     * @param eventAction  type of event
     */
    public static void addDataSourceUpdatedEvent(
        DBPProject project,
        String sessionId,
        String datasourceId,
        WSConstants.EventAction eventAction
    ) {
        if (project == null) {
            return;
        }
        WSEvent event = null;
        switch (eventAction) {
            case CREATE:
                event = WSDataSourceEvent.create(
                    sessionId,
                    project.getId(),
                    List.of(datasourceId)
                );
                break;
            case DELETE:
                event = WSDataSourceEvent.delete(
                    sessionId,
                    project.getId(),
                    List.of(datasourceId)
                );
                break;
            case UPDATE:
                event = WSDataSourceEvent.update(
                    sessionId,
                    project.getId(),
                    List.of(datasourceId)
                );
                break;
        }
        if (event == null) {
            return;
        }
        WebAppUtils.getWebApplication().getEventController().addEvent(event);
    }

    public static void addNavigatorNodeUpdatedEvent(
        DBPProject project,
        String sessionId,
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
                    sessionId,
                    project.getId(),
                    List.of(nodePath)
                );
                break;
            case DELETE:
                event = WSDatasourceFolderEvent.delete(
                    sessionId,
                    project.getId(),
                    List.of(nodePath)
                );
                break;
            case UPDATE:
                event = WSDatasourceFolderEvent.update(
                    sessionId,
                    project.getId(),
                    List.of(nodePath)
                );
                break;
        }
        if (event == null) {
            return;
        }
        WebAppUtils.getWebApplication().getEventController().addEvent(event);
    }

    public static void addRmResourceUpdatedEvent(
        String projectId,
        String sessionId,
        String resourcePath,
        RMResource[] resourceParsedPath,
        WSConstants.EventAction eventAction
    ) {
        WSEvent event = null;
        switch (eventAction) {
            case CREATE:
                event = WSResourceUpdatedEvent.create(
                    sessionId,
                    projectId,
                    resourcePath,
                    resourceParsedPath
                );
                break;
            case DELETE:
                event = WSResourceUpdatedEvent.delete(
                    sessionId,
                    projectId,
                    resourcePath,
                    resourceParsedPath
                );
                break;
            case UPDATE:
                event = WSResourceUpdatedEvent.update(
                    sessionId,
                    projectId,
                    resourcePath,
                    resourceParsedPath
                );
                break;
        }
        if (event == null) {
            return;
        }
        WebAppUtils.getWebApplication().getEventController().addEvent(event);
    }

}
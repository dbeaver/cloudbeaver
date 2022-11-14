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

import io.cloudbeaver.events.CBEvent;
import io.cloudbeaver.events.CBEventConstants;
import org.jkiss.dbeaver.model.app.DBPProject;

import java.util.List;
import java.util.Map;

public class WebEventUtils {
    /**
     * adds events of updated datasource to event controller
     *
     * @param project      project of updated database
     * @param sessionId    session id
     * @param datasourceId id of datasource
     * @param eventType    type of event
     */
    public static void addDataSourceUpdatedEvent(
        DBPProject project,
        String sessionId,
        String datasourceId,
        CBEventConstants.EventType eventType) {
        if (project == null) {
            return;
        }
        WebAppUtils.getWebApplication().getEventController().addEvent(
            new CBEvent(
                sessionId,
                CBEventConstants.CLOUDBEAVER_DATASOURCE_UPDATED,
                Map.of("projectId", project.getId(),
                    "dataSourceIds", List.of(datasourceId),
                    "eventType", eventType)
            )
        );
    }

    public static void addRmResourceUpdatedEvent(
        String projectId,
        String sessionId,
        String resourcePath,
        Object resourceParsedPath,
        CBEventConstants.EventType eventType) {
        WebAppUtils.getWebApplication().getEventController().addEvent(
            new CBEvent(
                sessionId,
                CBEventConstants.CLOUDBEAVER_RM_RESOURCE_UPDATED,
                Map.of(
                    "projectId", projectId,
                    "resourcePath", resourcePath,
                    "resourceParsedPath", resourceParsedPath,
                    "eventType", eventType
                )
            )
        );
    }
}
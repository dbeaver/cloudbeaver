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

import io.cloudbeaver.websocket.WSConstants;

import java.util.List;

public class WSDataSourceFolderUpdateEvent extends WSEvent {
    private final String projectId;
    private final List<String> nodePaths;
    private final WSConstants.EventAction action;

    public WSDataSourceFolderUpdateEvent(
        String sessionId,
        String projectId,
        List<String> nodePaths,
        WSConstants.EventAction action
    ) {
        super(WSConstants.Event.DATASOURCE_FOLDER_UPDATED, sessionId);
        this.projectId = projectId;
        this.nodePaths = nodePaths;
        this.action = action;
    }

    public String getProjectId() {
        return projectId;
    }

    public List<String> getNodePaths() {
        return nodePaths;
    }

    public WSConstants.EventAction getAction() {
        return action;
    }
}

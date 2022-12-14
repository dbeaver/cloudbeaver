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
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.List;

public class WSDataSourceUpdateEvent extends WSEvent {
    @NotNull
    private final String projectId;
    @NotNull
    private final List<String> datasourceIds;
    @NotNull
    private final WSConstants.EventAction action;

    public WSDataSourceUpdateEvent(
        @Nullable String sessionId,
        @NotNull String projectId,
        @NotNull List<String> datasourceIds,
        @NotNull WSConstants.EventAction action
    ) {
        super(WSConstants.Event.DATASOURCE_UPDATED, sessionId);
        this.projectId = projectId;
        this.datasourceIds = datasourceIds;
        this.action = action;
    }

    @NotNull
    public String getProjectId() {
        return projectId;
    }

    @NotNull
    public List<String> getDatasourceIds() {
        return datasourceIds;
    }

    @NotNull
    public WSConstants.EventAction getAction() {
        return action;
    }
}

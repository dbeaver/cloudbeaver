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
package io.cloudbeaver.server.events;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.events.CBEvent;
import io.cloudbeaver.events.CBEventConstants;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.rm.RMEvent;
import org.jkiss.dbeaver.model.rm.RMEventManager;
import org.jkiss.dbeaver.model.rm.RMResource;

import java.util.Arrays;
import java.util.List;

/**
 * Notify all active user session that rm resource has been updated
 */
public class CBRmResourceUpdatedEventHandlerImpl extends CBProjectUpdatedEventHandler {

    private static final Gson gson = new GsonBuilder().create();

    @NotNull
    @Override
    public String getSupportedEventType() {
        return CBEventConstants.CLOUDBEAVER_RM_RESOURCE_UPDATED;
    }

    @Override
    protected void updateSessionData(WebSession activeUserSession, CBEvent event) {
        String projectId = JSONUtils.getString(event.getEventData(), "projectId");
        String eventType = JSONUtils.getString(event.getEventData(), "eventType");
        String resourcePath = JSONUtils.getString(event.getEventData(), "resourcePath");
        RMResource[] resourceParsedPath = gson.fromJson(
            gson.toJson(JSONUtils.getObjectList(event.getEventData(), "resourceParsedPath")), RMResource[].class);
        if (projectId == null || eventType == null || resourcePath == null) {
            return;
        }
        WebProjectImpl project = activeUserSession.getProjectById(projectId);
        if (project == null) {
            return;
        }
        List<RMResource> rmResourcePath = Arrays.asList(resourceParsedPath);
        if (eventType.equals("TYPE_CREATE")) {
            RMEventManager.fireEvent(
                new RMEvent(RMEvent.Action.RESOURCE_ADD,
                    project.getRmProject(),
                    rmResourcePath)
            );
        } else if (eventType.equals("TYPE_DELETE")) {
            RMEventManager.fireEvent(
                new RMEvent(RMEvent.Action.RESOURCE_DELETE,
                    project.getRmProject(),
                    rmResourcePath)
            );
        }
        activeUserSession.addSessionEvent(event);
    }
}

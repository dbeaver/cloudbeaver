/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.rm.RMEvent;
import org.jkiss.dbeaver.model.rm.RMEventManager;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceUpdatedEvent;

import java.util.Arrays;
import java.util.List;

/**
 * Notify all active user session that rm resource has been updated
 */
public class WSRmResourceUpdatedEventHandlerImpl extends WSProjectUpdatedEventHandler {

    private static final Gson gson = new GsonBuilder().create();

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.RM_SCRIPTS.getTopicId();
    }

    @Override
    protected void updateSessionData(BaseWebSession activeUserSession, WSEvent event) {
        if (!(event instanceof WSResourceUpdatedEvent)) {
            return;
        }
        var resourceUpdateEvent = (WSResourceUpdatedEvent) event;
        String projectId = resourceUpdateEvent.getProjectId();
        if (!activeUserSession.isProjectAccessible(projectId)) {
            return;
        }
        if (resourceUpdateEvent.getResourcePath() == null) {
            return;
        }
        Object parsedResourcePath = resourceUpdateEvent.getResourceParsedPath();
        RMResource[] resourceParsedPath;
        if (parsedResourcePath instanceof RMResource[]) {
            resourceParsedPath = (RMResource[]) parsedResourcePath;
        } else {
            resourceParsedPath = gson.fromJson(gson.toJson(parsedResourcePath), RMResource[].class);
        }
        var eventType = WSEventType.valueById(resourceUpdateEvent.getId());
        if (eventType == null) {
            return;
        }
        if (activeUserSession instanceof WebSession) {
            var webSession = (WebSession) activeUserSession;
            acceptChangesInNavigatorTree(eventType, resourceParsedPath, webSession.getProjectById(projectId));
        }
        activeUserSession.addSessionEvent(event);
    }

    private void acceptChangesInNavigatorTree(WSEventType eventType,
                                              RMResource[] resourceParsedPath,
                                              WebProjectImpl project) {
        List<RMResource> rmResourcePath = Arrays.asList(resourceParsedPath);
        if (eventType == WSEventType.RM_RESOURCE_CREATED) {
            RMEventManager.fireEvent(
                new RMEvent(RMEvent.Action.RESOURCE_ADD,
                    project.getRmProject(),
                    rmResourcePath)
            );
        } else if (eventType == WSEventType.RM_RESOURCE_DELETED) {
            RMEventManager.fireEvent(
                new RMEvent(RMEvent.Action.RESOURCE_DELETE,
                    project.getRmProject(),
                    rmResourcePath)
            );
        }
    }
}

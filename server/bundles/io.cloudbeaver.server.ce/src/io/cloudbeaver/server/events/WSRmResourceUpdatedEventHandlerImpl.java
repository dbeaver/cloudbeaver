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
package io.cloudbeaver.server.events;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.rm.RMEvent;
import org.jkiss.dbeaver.model.rm.RMEventManager;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceUpdatedEvent;

/**
 * Notify all active user session that rm resource has been updated
 */
public class WSRmResourceUpdatedEventHandlerImpl extends WSAbstractProjectEventHandler<WSResourceUpdatedEvent> {

    private static final Log log = Log.getLog(WSRmResourceUpdatedEventHandlerImpl.class);
    private static final Gson gson = new GsonBuilder().create();

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSResourceUpdatedEvent event) {
        if (activeUserSession instanceof WebSession) {
            var webSession = (WebSession) activeUserSession;
            acceptChangesInNavigatorTree(
                event.getId(),
                event.getResourcePath(),
                webSession.getProjectById(event.getProjectId())
            );
        }
        activeUserSession.addSessionEvent(event);
    }

    private void acceptChangesInNavigatorTree(@NotNull String eventId, String resourcePath, WebProjectImpl project) {
        if (WSResourceUpdatedEvent.CREATED.equals(eventId)) {
            RMEventManager.fireEvent(
                new RMEvent(RMEvent.Action.RESOURCE_ADD,
                    project.getRMProject(),
                    resourcePath)
            );
        } else if (WSResourceUpdatedEvent.DELETED.equals(eventId)) {
            RMEventManager.fireEvent(
                new RMEvent(RMEvent.Action.RESOURCE_DELETE,
                    project.getRMProject(),
                    resourcePath)
            );
        }
    }
}

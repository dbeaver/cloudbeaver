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
package io.cloudbeaver.server.events;

import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSessionWorkspace;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.websocket.event.WSWorkspaceConfigurationChangedEvent;
import org.jkiss.dbeaver.registry.RegistryConstants;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

public class WSEventHandlerWorkspaceConfigUpdateTest {
    @Test
    public void testConnectionTypeEventRefreshesEveryProjectInSourceSession() {
        String sessionId = "session-id";
        BaseWebSession session = Mockito.mock(BaseWebSession.class, Mockito.RETURNS_DEEP_STUBS);
        Mockito.when(session.getUserContext().getSmSessionId()).thenReturn(sessionId);

        WebSessionProjectImpl firstProject = Mockito.mock(WebSessionProjectImpl.class);
        WebSessionProjectImpl secondProject = Mockito.mock(WebSessionProjectImpl.class);
        DBPDataSourceRegistry firstRegistry = Mockito.mock(DBPDataSourceRegistry.class);
        DBPDataSourceRegistry secondRegistry = Mockito.mock(DBPDataSourceRegistry.class);
        Mockito.when(firstProject.getDataSourceRegistry()).thenReturn(firstRegistry);
        Mockito.when(secondProject.getDataSourceRegistry()).thenReturn(secondRegistry);

        WebSessionWorkspace workspace = Mockito.mock(WebSessionWorkspace.class);
        Mockito.when(workspace.getProjects()).thenReturn(List.of(firstProject, secondProject));
        Mockito.when(session.getWorkspace()).thenReturn(workspace);

        WSWorkspaceConfigurationChangedEvent event = new WSWorkspaceConfigurationChangedEvent(
            RegistryConstants.CONNECTION_TYPES_FILE_NAME,
            sessionId,
            "user-id"
        );
        TestEventHandler handler = new TestEventHandler();

        Assertions.assertTrue(handler.accepts(session, event));
        handler.update(session, event);

        Mockito.verify(firstRegistry).refreshConfig();
        Mockito.verify(secondRegistry).refreshConfig();
        Mockito.verify(session).addSessionEvent(event);
    }

    private static final class TestEventHandler extends WSEventHandlerWorkspaceConfigUpdate {
        private boolean accepts(
            @NotNull BaseWebSession session,
            @NotNull WSWorkspaceConfigurationChangedEvent event
        ) {
            return isAcceptableInSession(session, event);
        }

        private void update(
            @NotNull BaseWebSession session,
            @NotNull WSWorkspaceConfigurationChangedEvent event
        ) {
            updateSessionData(session, event);
        }
    }
}

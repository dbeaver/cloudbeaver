/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2026 DBeaver Corp and others
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

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.model.websocket.WSUtils;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSSubjectPermissionEvent;
import org.jkiss.dbeaver.model.websocket.registry.WSEventHandlersRegistry;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public class WSSubjectPermissionUpdatedEventHandlerTest {
    private static final String USER_ID = "sso-user";
    private static final String SOURCE_SESSION = "admin-session";
    private static final Instant USER_CREATE_TIME = Instant.parse("2026-11-24T10:00:01.123Z");

    @Test
    public void ignoresDelayedEventForDeletedUserAfterRecreation() {
        var session = createSession();
        var original = WSSubjectPermissionEvent.update(
            SOURCE_SESSION, "admin", SMSubjectType.user, USER_ID, USER_CREATE_TIME.minusSeconds(1).toEpochMilli()
        );
        // Use the same event deserialization as the TE Kafka consumer.
        var event = (WSSubjectPermissionEvent) WSUtils.gson.fromJson(WSUtils.gson.toJson(original), WSEvent.class);
        Assertions.assertEquals(original.getSubjectCreateTime(), event.getSubjectCreateTime());

        deliver(session, event);

        Mockito.verify(session, Mockito.never()).refreshUserData();
        Mockito.verify(session, Mockito.never()).addSessionEvent(event);
    }

    @Test
    public void refreshesAndNotifiesCurrentUserRecord() {
        var session = createSession();
        var event = WSSubjectPermissionEvent.update(
            SOURCE_SESSION, "admin", SMSubjectType.user, USER_ID, USER_CREATE_TIME.toEpochMilli()
        );

        deliver(session, event);

        Mockito.verify(session).refreshUserData();
        Mockito.verify(session).addSessionEvent(event);
    }

    @Test
    public void acceptsLegacyUserEventWithoutCreationTime() {
        var session = createSession();
        var event = WSSubjectPermissionEvent.update(SOURCE_SESSION, "admin", SMSubjectType.user, USER_ID);
        deliver(session, event);
        Mockito.verify(session).addSessionEvent(event);
    }

    @Test
    public void acceptsEventForUsersTeam() {
        var session = createSession();
        var event = WSSubjectPermissionEvent.update(SOURCE_SESSION, "admin", SMSubjectType.team, "sso-team");
        deliver(session, event);
        Mockito.verify(session).addSessionEvent(event);
    }

    @SuppressWarnings("unchecked")
    private void deliver(BaseWebSession session, WSSubjectPermissionEvent event) {
        var application = Mockito.mock(WebApplication.class, Mockito.RETURNS_DEEP_STUBS);
        Mockito.when(application.getSessionManager().getAllActiveSessions()).thenReturn(List.of(session));
        var descriptors = WSEventHandlersRegistry.getInstance().readDescriptors().stream()
            .filter(descriptor -> descriptor.getSupportedTopics().contains(event.getTopicId()))
            .toList();
        Assertions.assertFalse(descriptors.isEmpty());
        try (var webAppUtils = Mockito.mockStatic(WebAppUtils.class, Mockito.withSettings().mockMaker("mock-maker-inline"))) {
            webAppUtils.when(WebAppUtils::isWebApplication).thenReturn(true);
            webAppUtils.when(WebAppUtils::getWebApplication).thenReturn(application);
            for (var descriptor : descriptors) {
                descriptor.getInstance().handleEvent(event);
            }
        }
    }

    private BaseWebSession createSession() {
        var user = new SMUser(USER_ID, true, null);
        user.setCreateTime(USER_CREATE_TIME);
        user.setUserTeams(new String[]{"sso-team"});

        var session = Mockito.mock(BaseWebSession.class, Mockito.RETURNS_DEEP_STUBS);
        Mockito.when(session.getUserContext().getUser()).thenReturn(new WebUser(user));
        Mockito.when(session.getUserContext().getSmSessionId()).thenReturn("recreated-user-session");
        Mockito.when(session.getUserContext().getUserPermissions()).thenReturn(Set.of());
        return session;
    }
}

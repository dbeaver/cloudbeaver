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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebActionParameters;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.auth.WebAsyncAuthJob;
import io.cloudbeaver.service.auth.WebAuthUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;

public class WebAuthUtilsTest {
    private static final String OWNER_SESSION_ID = "owner-session";
    private static final String AUTH_ID = "test-auth-attempt";

    @Test
    public void authenticationWithoutProviderIsRejectedBeforeAccessingSession() {
        WebSession session = Mockito.mock(WebSession.class);

        Assertions.assertThrows(DBWebException.class, () -> WebAuthUtils.initiateAuthentication(
            session, "", null, Map.of(), false
        ));
        Mockito.verifyNoInteractions(session);
    }

    @Test
    public void cannotAttachForeignAuthAttempt() {
        WebSession session = Mockito.mock(WebSession.class);
        Mockito.when(session.getSessionId()).thenReturn("other-session");

        Assertions.assertThrows(DBWebException.class, () -> WebAuthUtils.createTask(session, pendingAuth(), false));
        Mockito.verify(session, Mockito.never()).createAsyncTask(Mockito.anyString());
        Mockito.verify(session, Mockito.never()).getSecurityController();
    }

    @Test
    public void cannotAttachCompletedAuthAttempt() {
        WebSession session = Mockito.mock(WebSession.class);
        Mockito.when(session.getSessionId()).thenReturn(OWNER_SESSION_ID);

        Assertions.assertThrows(DBWebException.class, () -> WebAuthUtils.createTask(
            session, SMAuthInfo.expired(AUTH_ID, Map.of(), true, OWNER_SESSION_ID), false
        ));
        Mockito.verify(session, Mockito.never()).createAsyncTask(Mockito.anyString());
    }

    @Test
    public void signOnReusesTaskCreatedBeforeRedirect() throws Exception {
        WebSession session = Mockito.mock(WebSession.class);
        Mockito.when(session.getSessionId()).thenReturn(OWNER_SESSION_ID);
        WebAsyncTaskInfo task = new WebAsyncTaskInfo("task-1", "Federated authentication");
        task.setJob(new WebAsyncAuthJob("SSO", AUTH_ID, false));
        task.setRunning(true);
        Mockito.when(session.findTasksByJob(WebAsyncAuthJob.class)).thenReturn(List.of(task));

        Assertions.assertSame(task, WebAuthUtils.createTask(session, pendingAuth(), false));
        Mockito.verify(session, Mockito.never()).createAsyncTask(Mockito.anyString());
    }

    @Test
    public void autoLoginActionContainsOnlySessionTaskId() {
        WebSession session = Mockito.mock(WebSession.class);
        WebAsyncTaskInfo task = new WebAsyncTaskInfo("task-1", "Federated authentication");

        WebAuthUtils.saveAutoLoginAction(session, task);

        ArgumentCaptor<WebActionParameters> action = ArgumentCaptor.forClass(WebActionParameters.class);
        Mockito.verify(session).setAttribute(Mockito.eq("action-parameters"), action.capture());
        Assertions.assertEquals(Map.of("action", "auto-login", "task-id", "task-1"), action.getValue().getParameters());
    }

    @NotNull
    private static SMAuthInfo pendingAuth() {
        return SMAuthInfo.inProgress(AUTH_ID, "https://example.test/sso", null, Map.of(), true, false, OWNER_SESSION_ID);
    }
}

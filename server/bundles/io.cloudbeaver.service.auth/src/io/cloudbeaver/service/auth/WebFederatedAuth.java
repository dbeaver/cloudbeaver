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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebActionParameters;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.auth.impl.WebServiceAuthImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;

import java.util.Map;

public final class WebFederatedAuth {
    public static final String AUTO_LOGIN_ACTION = "auto-login";
    private static final long AUTH_TIMEOUT_MILLISECONDS = 5 * 60 * 1000;

    private WebFederatedAuth() {
    }

    @NotNull
    public static WebAsyncAuthStatus login(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @Nullable String configurationId,
        boolean linkWithActiveUser,
        boolean forceSessionsLogout
    ) throws DBWebException {
        return new WebServiceAuthImpl().federatedLogin(
            request, webSession, providerId, configurationId, linkWithActiveUser, forceSessionsLogout
        );
    }

    @NotNull
    public static WebAsyncTaskInfo createTask(
        @NotNull WebSession webSession,
        @NotNull SMAuthInfo authInfo,
        boolean linkWithActiveUser
    ) throws DBWebException {
        if (!webSession.getSessionId().equals(authInfo.getAppSessionId())) {
            throw new DBWebException("Auth attempt does not belong to the current application session");
        }
        if (authInfo.getAuthStatus() != SMAuthStatus.IN_PROGRESS) {
            throw new DBWebException("Unexpected auth status: " + authInfo.getAuthStatus());
        }
        for (WebAsyncTaskInfo task : webSession.findTasksByJob(WebAsyncAuthJob.class)) {
            if (((WebAsyncAuthJob) task.getJob()).getAuthId().equals(authInfo.getAuthAttemptId())) {
                return task;
            }
        }
        WebAsyncAuthJob job = new WebAsyncAuthJob(
            "Federated authentication", authInfo.getAuthAttemptId(), linkWithActiveUser
        );
        WebAsyncTaskInfo task = webSession.createAsyncTask("Federated authentication");
        task.setRunning(true);
        task.setJob(job);
        new WebAsyncAuthTimeoutJob(webSession, task, job).schedule(AUTH_TIMEOUT_MILLISECONDS);
        return task;
    }

    public static void saveAutoLoginAction(@NotNull WebSession webSession, @NotNull WebAsyncTaskInfo task) {
        WebActionParameters.saveToSession(webSession, Map.of("action", AUTO_LOGIN_ACTION, "task-id", task.getId()));
    }
}

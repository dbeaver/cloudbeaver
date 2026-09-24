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
package io.cloudbeaver.service.ai;

import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;
import org.jkiss.dbeaver.model.ai.engine.openai.AIAccountAuthenticator;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.lang.reflect.InvocationTargetException;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

public final class WebAIDeviceAuthorizationProcessor extends WebAsyncTaskProcessor<Boolean> {
    @NotNull
    private final WebSession webSession;
    @NotNull
    private final AIConfigurationProfile profile;
    @NotNull
    private final AIAccountAuthenticator authenticator;
    @NotNull
    private final AIAccountAuthenticator.DeviceAuthorization authorization;
    @NotNull
    private final String taskId;
    @NotNull
    private final String userId;
    @NotNull
    private final String providerName;

    public WebAIDeviceAuthorizationProcessor(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator authenticator,
        @NotNull AIAccountAuthenticator.DeviceAuthorization authorization,
        @NotNull String taskId,
        @NotNull String providerName
    ) {
        this.webSession = webSession;
        this.profile = profile;
        this.authenticator = authenticator;
        this.authorization = authorization;
        this.taskId = taskId;
        this.userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        this.providerName = providerName;
    }

    @Override
    public void run(@NotNull DBRProgressMonitor monitor) throws InvocationTargetException {
        monitor.beginTask("Authorize " + providerName + " account", 1);
        try {
            validateAttempt(monitor);
            CompletableFuture<Void> cancellation = new CompletableFuture<>() {
                @Override
                public boolean isCancelled() {
                    return monitor.isCanceled() || !isCurrentAttempt() || !isCurrentUser() || super.isCancelled();
                }
            };
            AIAccountAuthenticator.Tokens tokens = authenticator.completeDeviceAuthorization(
                authorization,
                cancellation
            );
            validateAttempt(monitor);
            WebAIProfileUtils.saveAuthorizedAccountCredentials(webSession, profile, tokens, userId, taskId);
            result = Boolean.TRUE;
        } catch (DBException e) {
            throw new InvocationTargetException(e);
        } finally {
            clearAttempt();
            monitor.done();
        }
    }

    @Override
    public void cancel() {
        clearAttempt();
    }

    private void validateAttempt(@NotNull DBRProgressMonitor monitor) throws DBException {
        if (monitor.isCanceled() || !isCurrentAttempt()) {
            throw new DBException(providerName + " device authorization was cancelled");
        }
        if (!isCurrentUser()) {
            throw new DBException(providerName + " device authorization session has changed");
        }
    }

    private boolean isCurrentAttempt() {
        return WebAIProfileUtils.isCurrentDeviceAuthorizationAttempt(
            webSession,
            userId,
            profile.getProfileId(),
            taskId
        );
    }

    private boolean isCurrentUser() {
        return userId.equals(webSession.getUserId());
    }

    private void clearAttempt() {
        WebAIProfileUtils.clearDeviceAuthorizationAttempt(webSession, userId, profile.getProfileId(), taskId);
    }
}

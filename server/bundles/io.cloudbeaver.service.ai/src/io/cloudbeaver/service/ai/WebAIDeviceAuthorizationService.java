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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.model.WebAIDeviceAuthorizationInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;
import org.jkiss.dbeaver.model.ai.engine.AIAccountProperties;
import org.jkiss.dbeaver.model.ai.engine.openai.AIAccountAuthenticator;

public final class WebAIDeviceAuthorizationService {
    private WebAIDeviceAuthorizationService() {
    }

    @NotNull
    public static WebAIDeviceAuthorizationInfo startAuthorization(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        String userId = webSession.getUserId();
        if (userId == null || !webSession.isAuthorizedInSecurityManager()) {
            throw new DBWebException("User authentication is required");
        }
        if (profile.isGlobal()) {
            throw new DBWebException("AI profile does not use user credentials");
        }
        AIAccountProperties properties = WebAIProfileUtils.createAccountAuthenticationProperties(profile);
        AIAccountAuthenticator authenticator = properties.createAccountAuthenticator();
        String providerName = properties.getAccountAuthenticationProviderName();
        String taskName = providerName + " account authorization";
        WebAsyncTaskInfo taskInfo = webSession.createAsyncTask(taskName);
        boolean taskStarted = false;
        try {
            WebAIDeviceAuthorizationManager.registerAttempt(
                webSession,
                profile,
                userId,
                taskInfo.getId(),
                taskName
            );
            AIAccountAuthenticator.DeviceAuthorization authorization = authenticator.startDeviceAuthorization();
            WebAIDeviceAuthorizationManager.validateAttempt(
                webSession,
                profile,
                userId,
                taskInfo.getId()
            );
            webSession.runAsyncTask(
                taskInfo,
                new WebAIDeviceAuthorizationProcessor(
                    webSession,
                    profile,
                    authenticator,
                    authorization,
                    taskInfo.getId(),
                    providerName
                )
            );
            taskStarted = true;
            return new WebAIDeviceAuthorizationInfo(authorization, taskInfo);
        } finally {
            if (!taskStarted) {
                WebAIDeviceAuthorizationManager.discardAttempt(
                    webSession,
                    profile,
                    userId,
                    taskInfo.getId(),
                    taskName
                );
            }
        }
    }
}

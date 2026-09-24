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
package io.cloudbeaver.service.ai.model;

import io.cloudbeaver.model.WebAsyncTaskInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.engine.openai.AIAccountAuthenticator;

public class WebAIDeviceAuthorizationInfo {
    @NotNull
    private final AIAccountAuthenticator.DeviceAuthorization authorization;
    @NotNull
    private final WebAsyncTaskInfo taskInfo;

    public WebAIDeviceAuthorizationInfo(
        @NotNull AIAccountAuthenticator.DeviceAuthorization authorization,
        @NotNull WebAsyncTaskInfo taskInfo
    ) {
        this.authorization = authorization;
        this.taskInfo = taskInfo;
    }

    @NotNull
    public String getUserCode() {
        return authorization.userCode();
    }

    @NotNull
    public String getVerificationUri() {
        return authorization.verificationUri().toString();
    }

    public int getExpiresInSeconds() {
        return Math.toIntExact(authorization.expiresInSeconds());
    }

    @NotNull
    public WebAsyncTaskInfo getTaskInfo() {
        return taskInfo;
    }
}

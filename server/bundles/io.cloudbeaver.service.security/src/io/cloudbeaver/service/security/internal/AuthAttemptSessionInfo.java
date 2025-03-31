/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

package io.cloudbeaver.service.security.internal;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.auth.SMSessionType;

import java.util.Map;

public class AuthAttemptSessionInfo {
    @NotNull
    private final String appSessionId;
    @Nullable
    private final String smSessionId;

    @NotNull
    private final SMSessionType sessionType;
    @NotNull
    private final Map<String, Object> sessionParams;
    private final boolean mainAuth;
    private final boolean serviceAuth;

    public AuthAttemptSessionInfo(
        @NotNull String appSessionId,
        @Nullable String smSessionId,
        @NotNull SMSessionType sessionType,
        @NotNull Map<String, Object> sessionParams,
        boolean mainAuth,
        boolean serviceAuth
    ) {
        this.appSessionId = appSessionId;
        this.smSessionId = smSessionId;
        this.sessionType = sessionType;
        this.sessionParams = sessionParams;
        this.mainAuth = mainAuth;
        this.serviceAuth = serviceAuth;
    }

    @NotNull
    public String getAppSessionId() {
        return appSessionId;
    }

    @NotNull
    public SMSessionType getSessionType() {
        return sessionType;
    }

    @NotNull
    public Map<String, Object> getSessionParams() {
        return sessionParams;
    }

    @Nullable
    public String getSmSessionId() {
        return smSessionId;
    }

    public boolean isMainAuth() {
        return mainAuth;
    }

    public boolean isServiceAuth() {
        return serviceAuth;
    }
}

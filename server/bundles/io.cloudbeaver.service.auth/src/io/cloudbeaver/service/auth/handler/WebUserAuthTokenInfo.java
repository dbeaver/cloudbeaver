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
package io.cloudbeaver.service.auth.handler;

import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebUserAuthToken;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.time.OffsetDateTime;

public class WebUserAuthTokenInfo implements WebUserAuthToken {
    @NotNull
    private final String authProvider;
    @Nullable
    private final String authConfiguration;
    @NotNull
    private final OffsetDateTime loginTime;
    @NotNull
    private final String userId;
    @NotNull
    private final String displayName;
    @Nullable
    private final String message;

    public WebUserAuthTokenInfo(
        @NotNull WebAuthInfo authInfo
    ) {
        this(
            authInfo.getAuthProvider(),
            authInfo.getAuthConfiguration(),
            authInfo.getDisplayName(),
            authInfo.getLoginTime(),
            authInfo.getMessage(),
            authInfo.getUserId()
        );
    }

    public WebUserAuthTokenInfo(
        @NotNull String authProvider,
        @Nullable String authConfiguration,
        @NotNull String displayName,
        @NotNull OffsetDateTime loginTime,
        @Nullable String message,
        @NotNull String userId
    ) {
        this.authConfiguration = authConfiguration;
        this.authProvider = authProvider;
        this.displayName = displayName;
        this.loginTime = loginTime;
        this.message = message;
        this.userId = userId;
    }

    @Override
    @Nullable
    public String getAuthConfiguration() {
        return authConfiguration;
    }

    @Override
    @NotNull
    public String getAuthProvider() {
        return authProvider;
    }

    @Override
    @NotNull
    public String getDisplayName() {
        return displayName;
    }

    @Override
    @NotNull
    public OffsetDateTime getLoginTime() {
        return loginTime;
    }

    @Override
    @Nullable
    public String getMessage() {
        return message;
    }

    @Override
    @NotNull
    public String getUserId() {
        return userId;
    }
}

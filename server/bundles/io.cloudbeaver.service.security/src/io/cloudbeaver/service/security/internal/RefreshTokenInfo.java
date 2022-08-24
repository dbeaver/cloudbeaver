/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

public class RefreshTokenInfo {
    @NotNull
    private final String refreshToken;

    @NotNull
    private final String sessionId;

    @NotNull
    private final String userId;

    public RefreshTokenInfo(@NotNull String refreshToken, @NotNull String sessionId, @NotNull String userId) {
        this.refreshToken = refreshToken;
        this.sessionId = sessionId;
        this.userId = userId;
    }

    @NotNull
    public String getRefreshToken() {
        return refreshToken;
    }

    @NotNull
    public String getSessionId() {
        return sessionId;
    }

    @NotNull
    public String getUserId() {
        return userId;
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

package io.cloudbeaver.service.security;

public class SMControllerConfiguration {
    //in minutes
    public static final int DEFAULT_ACCESS_TOKEN_TTL = 20;
    public static final int DEFAULT_REFRESH_TOKEN_TTL = 4320; //72h

    private int accessTokenTtl = DEFAULT_ACCESS_TOKEN_TTL;
    private int refreshTokenTtl = DEFAULT_REFRESH_TOKEN_TTL;
    private String defaultAuthRole = null;

    public int getAccessTokenTtl() {
        return accessTokenTtl;
    }

    public void setAccessTokenTtl(int accessTokenTtl) {
        this.accessTokenTtl = accessTokenTtl;
    }

    public int getRefreshTokenTtl() {
        return refreshTokenTtl;
    }

    public void setRefreshTokenTtl(int refreshTokenTtl) {
        this.refreshTokenTtl = refreshTokenTtl;
    }

    public String getDefaultAuthRole() {
        return defaultAuthRole;
    }

    public void setDefaultAuthRole(String defaultAuthRole) {
        this.defaultAuthRole = defaultAuthRole;
    }
}

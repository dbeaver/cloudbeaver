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
    public static final int DEFAULT_EXPIRED_AUTH_ATTEMPT_INFO_TTL = 60; //72h

    private int accessTokenTtl = DEFAULT_ACCESS_TOKEN_TTL;
    private int refreshTokenTtl = DEFAULT_REFRESH_TOKEN_TTL;
    private int expiredAuthAttemptInfoTtl = DEFAULT_EXPIRED_AUTH_ATTEMPT_INFO_TTL;
    private boolean checkBruteforce = false;
    private int maxFailed;
    private int minimumTimeout;
    private int blockPeriod;

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

    public int getExpiredAuthAttemptInfoTtl() {
        return expiredAuthAttemptInfoTtl;
    }

    public void setExpiredAuthAttemptInfoTtl(int expiredAuthAttemptInfoTtl) {
        this.expiredAuthAttemptInfoTtl = expiredAuthAttemptInfoTtl;
    }

    public void setCheckBruteforce(boolean checkBruteforce) {
        this.checkBruteforce = checkBruteforce;
    }

    public boolean isCheckBruteforce() {
        return checkBruteforce;
    }

    public int getMaxFailed() {
        return maxFailed;
    }

    public int getMinimumTimeout() {
        return minimumTimeout;
    }

    public int getBlockPeriod() {
        return blockPeriod;
    }

    public void setMaxFailed(int maxFailed) {
        this.maxFailed = maxFailed;
    }

    public void setMinimumTimeout(int minimumTimeout) {
        this.minimumTimeout = minimumTimeout;
    }

    public void setBlockPeriod(int blockPeriod) {
        this.blockPeriod = blockPeriod;
    }
}

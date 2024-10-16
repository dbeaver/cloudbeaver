/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

package io.cloudbeaver.model.config;

public class SMControllerConfiguration {
    //in minutes
    public static final int DEFAULT_ACCESS_TOKEN_TTL = 20;
    public static final int DEFAULT_REFRESH_TOKEN_TTL = 4320; //72h
    public static final int DEFAULT_EXPIRED_AUTH_ATTEMPT_INFO_TTL = 60; //72h

    private int accessTokenTtl = DEFAULT_ACCESS_TOKEN_TTL;
    private int refreshTokenTtl = DEFAULT_REFRESH_TOKEN_TTL;
    private int expiredAuthAttemptInfoTtl = DEFAULT_EXPIRED_AUTH_ATTEMPT_INFO_TTL;

    private boolean enableBruteForceProtection = true;

    //in seconds
    public static final int DEFAULT_MAX_FAILED_LOGIN = 10;
    public static final int DEFAULT_MINIMUM_LOGIN_TIMEOUT = 1; //1sec
    public static final int DEFAULT_BLOCK_LOGIN_PERIOD = 300; //5min
    private int maxFailedLogin = DEFAULT_MAX_FAILED_LOGIN;
    private int minimumLoginTimeout = DEFAULT_MINIMUM_LOGIN_TIMEOUT;
    private int blockLoginPeriod = DEFAULT_BLOCK_LOGIN_PERIOD;
    private final PasswordPolicyConfiguration passwordPolicy = new PasswordPolicyConfiguration();

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
        this.enableBruteForceProtection = checkBruteforce;
    }

    public boolean isCheckBruteforce() {
        return enableBruteForceProtection;
    }

    public int getMaxFailedLogin() {
        return maxFailedLogin;
    }

    public int getMinimumLoginTimeout() {
        return minimumLoginTimeout;
    }

    public int getBlockLoginPeriod() {
        return blockLoginPeriod;
    }

    public void setMaxFailedLogin(int maxFailed) {
        this.maxFailedLogin = maxFailed;
    }

    public void setMinimumLoginTimeout(int minimumTimeout) {
        this.minimumLoginTimeout = minimumTimeout;
    }

    public void setBlockLoginPeriod(int blockPeriod) {
        this.blockLoginPeriod = blockPeriod;
    }

    public PasswordPolicyConfiguration getPasswordPolicyConfiguration() {
        return passwordPolicy;
    }
}

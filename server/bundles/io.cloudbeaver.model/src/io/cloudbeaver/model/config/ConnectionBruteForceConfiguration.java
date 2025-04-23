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
package io.cloudbeaver.model.config;

/**
 * Connection brute force configuration.
 */
public class ConnectionBruteForceConfiguration {
    private static final int DEFAULT_ERROR_ATTEMPTS_CHECK_MINUTES = 24 * 60;
    private static final int DEFAULT_MAX_CONNECT_ATTEMPTS = 5;
    private boolean enabled = false;
    private int maxFailedConnectAttempts = DEFAULT_MAX_CONNECT_ATTEMPTS;
    private int errorAttemptsPeriodInMinutes = DEFAULT_ERROR_ATTEMPTS_CHECK_MINUTES;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxFailedConnectAttempts() {
        return maxFailedConnectAttempts;
    }

    public void setMaxFailedConnectAttempts(int maxFailedConnectAttempts) {
        this.maxFailedConnectAttempts = maxFailedConnectAttempts;
    }

    public int getErrorAttemptsPeriodInMinutes() {
        return errorAttemptsPeriodInMinutes;
    }

    public void setErrorAttemptsPeriodInMinutes(int errorAttemptsPeriodInMinutes) {
        this.errorAttemptsPeriodInMinutes = errorAttemptsPeriodInMinutes;
    }
}

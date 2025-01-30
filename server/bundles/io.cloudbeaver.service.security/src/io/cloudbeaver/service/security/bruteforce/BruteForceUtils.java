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
package io.cloudbeaver.service.security.bruteforce;

import io.cloudbeaver.model.config.SMControllerConfiguration;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.security.exception.SMException;

import java.sql.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

public class BruteForceUtils {

    private static final Log log = Log.getLog(BruteForceUtils.class);

    public static void checkBruteforce(SMControllerConfiguration smConfig, List<UserLoginRecord> latestLoginAttempts)
        throws DBException {
        if (latestLoginAttempts.isEmpty()) {
            return;
        }

        var oldestLoginAttempt = latestLoginAttempts.get(latestLoginAttempts.size() - 1);
        checkLoginInterval(oldestLoginAttempt.time(), smConfig.getMinimumLoginTimeout());

        long errorsCount = latestLoginAttempts.stream()
            .filter(authAttemptSessionInfo -> authAttemptSessionInfo.smAuthStatus() == SMAuthStatus.ERROR).count();

        boolean shouldBlock = errorsCount >= smConfig.getMaxFailedLogin();
        if (shouldBlock) {
            int blockPeriod = smConfig.getBlockLoginPeriod();
            LocalDateTime unblockTime = oldestLoginAttempt.time().plusSeconds(blockPeriod);

            LocalDateTime now = LocalDateTime.now();
            shouldBlock = unblockTime.isAfter(now);

            if (shouldBlock) {
                log.error("User login is blocked due to exceeding the limit of incorrect password entry");
                Duration lockDuration = Duration.ofSeconds(smConfig.getBlockLoginPeriod());

                throw new SMException("Blocked the possibility of login for this user for " +
                    lockDuration.minus(Duration.between(oldestLoginAttempt.time(), now)).getSeconds() + " seconds");
            }
        }
    }

    /**
     * Check user by brute force protection, block user if count more then maximum attempt from configuration
     */
    public static boolean checkBruteforceBlockUser(
        @NotNull SMControllerConfiguration smConfig,
        @NotNull List<UserLoginRecord> latestLoginAttempts
    ) throws DBException, SQLException {
        if (latestLoginAttempts.isEmpty()) {
            return false;
        }

        var oldestLoginAttempt = latestLoginAttempts.get(latestLoginAttempts.size() - 1);
        checkLoginInterval(oldestLoginAttempt.time(), smConfig.getMinimumLoginTimeout());

        long errorsCount = latestLoginAttempts.stream()
            .filter(authAttemptSessionInfo -> authAttemptSessionInfo.smAuthStatus() == SMAuthStatus.ERROR).count();

        return errorsCount > smConfig.getMaxFailedConnectionLogin();
    }

    private static void checkLoginInterval(LocalDateTime createTime, int timeout) throws DBException {
        if (createTime != null && Duration.between(createTime, LocalDateTime.now()).getSeconds() < timeout) {
            throw new DBException("Too frequent authentication requests");
        }
    }
}

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
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

final class WebAIDeviceAuthorizationManager {
    private static final int ACCOUNT_LOCK_COUNT = 64;
    private static final Object[] ACCOUNT_LOCKS = new Object[ACCOUNT_LOCK_COUNT];
    private static final Map<AccountKey, AuthorizationAttempt> AUTHORIZATION_ATTEMPTS = new ConcurrentHashMap<>();
    private static final Set<AIConfigurationProfile> DELETED_ACCOUNT_PROFILES =
        Collections.newSetFromMap(new WeakHashMap<>());

    static {
        for (int i = 0; i < ACCOUNT_LOCKS.length; i++) {
            ACCOUNT_LOCKS[i] = new Object();
        }
    }

    private WebAIDeviceAuthorizationManager() {
    }

    static void registerAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @NotNull String taskId,
        @NotNull String taskName
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        AuthorizationAttempt previousAttempt;
        synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
            validateExpectedUser(webSession, expectedUserId);
            validateCurrentProfile(profile);
            previousAttempt = AUTHORIZATION_ATTEMPTS.put(
                getAccountKey(webSession, expectedUserId, profile.getProfileId()),
                new AuthorizationAttempt(webSession, taskId, taskName)
            );
        }
        cancelTask(previousAttempt);
    }

    static void cancelAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId
    ) throws DBException {
        AuthorizationAttempt attempt;
        synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
            validateExpectedUser(webSession, expectedUserId);
            attempt = removeAttempt(webSession, expectedUserId, profile.getProfileId());
        }
        cancelTask(attempt);
    }

    static void discardAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @NotNull String taskId,
        @NotNull String taskName
    ) throws DBException {
        AuthorizationAttempt attempt = null;
        synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
            AccountKey key = getAccountKey(webSession, expectedUserId, profile.getProfileId());
            AuthorizationAttempt currentAttempt = AUTHORIZATION_ATTEMPTS.get(key);
            if (currentAttempt != null
                && currentAttempt.webSession() == webSession
                && taskId.equals(currentAttempt.taskId())
            ) {
                AUTHORIZATION_ATTEMPTS.remove(key, currentAttempt);
                attempt = currentAttempt;
            }
        }
        cancelTask(attempt == null ? new AuthorizationAttempt(webSession, taskId, taskName) : attempt);
    }

    static void validateAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @NotNull String taskId
    ) throws DBException {
        synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
            validateExpectedUser(webSession, expectedUserId);
            validateCurrentProfile(profile);
            if (!isCurrentAttempt(webSession, expectedUserId, profile.getProfileId(), taskId)) {
                throw new DBWebException("AI device authorization was cancelled");
            }
        }
    }

    static void invalidateProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        synchronized (DELETED_ACCOUNT_PROFILES) {
            DELETED_ACCOUNT_PROFILES.add(profile);
        }
        var attempts = new ArrayList<AuthorizationAttempt>();
        for (Map.Entry<AccountKey, AuthorizationAttempt> entry : AUTHORIZATION_ATTEMPTS.entrySet()) {
            AccountKey key = entry.getKey();
            if (key.application() != webSession.getApplication() || !key.profileId().equals(profile.getProfileId())) {
                continue;
            }
            synchronized (getAccountLock(webSession, key.userId(), key.profileId())) {
                if (AUTHORIZATION_ATTEMPTS.remove(key, entry.getValue())) {
                    attempts.add(entry.getValue());
                }
            }
        }
        for (AuthorizationAttempt attempt : attempts) {
            cancelTask(attempt);
        }
    }

    static void restoreProfile(@NotNull AIConfigurationProfile profile) {
        synchronized (DELETED_ACCOUNT_PROFILES) {
            DELETED_ACCOUNT_PROFILES.remove(profile);
        }
    }

    static void validateCurrentProfile(@NotNull AIConfigurationProfile profile) throws DBException {
        synchronized (DELETED_ACCOUNT_PROFILES) {
            if (DELETED_ACCOUNT_PROFILES.contains(profile)) {
                throw new DBWebException("AI profile is no longer available for account authorization");
            }
        }
    }

    static boolean isCurrentAttempt(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId,
        @NotNull String profileId,
        @NotNull String taskId
    ) {
        AuthorizationAttempt attempt = AUTHORIZATION_ATTEMPTS.get(
            getAccountKey(webSession, expectedUserId, profileId)
        );
        return attempt != null && attempt.webSession() == webSession && taskId.equals(attempt.taskId());
    }

    static void clearAttempt(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId,
        @NotNull String profileId,
        @NotNull String taskId
    ) {
        synchronized (getAccountLock(webSession, expectedUserId, profileId)) {
            AccountKey key = getAccountKey(webSession, expectedUserId, profileId);
            AuthorizationAttempt attempt = AUTHORIZATION_ATTEMPTS.get(key);
            if (attempt != null && attempt.webSession() == webSession && taskId.equals(attempt.taskId())) {
                AUTHORIZATION_ATTEMPTS.remove(key, attempt);
            }
        }
    }

    @Nullable
    static AuthorizationAttempt removeAttempt(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId,
        @NotNull String profileId
    ) {
        return AUTHORIZATION_ATTEMPTS.remove(getAccountKey(webSession, expectedUserId, profileId));
    }

    static void cancelTask(@Nullable AuthorizationAttempt attempt) throws DBWebException {
        if (attempt == null) {
            return;
        }
        var taskInfo = attempt.webSession().getAsyncTask(attempt.taskId(), attempt.taskName(), false);
        if (taskInfo == null) {
            return;
        }
        if (taskInfo.isRunning()) {
            attempt.webSession().asyncTaskCancel(attempt.taskId());
        } else {
            attempt.webSession().asyncTaskStatus(attempt.taskId(), true);
        }
    }

    @NotNull
    static Object getAccountLock(
        @NotNull WebSession webSession,
        @NotNull String userId,
        @NotNull String profileId
    ) {
        int index = Math.floorMod(getAccountKey(webSession, userId, profileId).hashCode(), ACCOUNT_LOCKS.length);
        return ACCOUNT_LOCKS[index];
    }

    private static void validateExpectedUser(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId
    ) throws DBWebException {
        if (!expectedUserId.equals(webSession.getUserId())) {
            throw new DBWebException("AI account authorization session has changed");
        }
    }

    @NotNull
    private static AccountKey getAccountKey(
        @NotNull WebSession webSession,
        @NotNull String userId,
        @NotNull String profileId
    ) {
        return new AccountKey(webSession.getApplication(), userId, profileId);
    }

    private record AccountKey(
        @Nullable Object application,
        @NotNull String userId,
        @NotNull String profileId
    ) {
    }

    record AuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull String taskId,
        @NotNull String taskName
    ) {
    }
}

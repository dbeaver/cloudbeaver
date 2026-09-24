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
import org.jkiss.dbeaver.model.ai.AISettings;
import org.jkiss.dbeaver.model.ai.engine.AIEngineProperties;
import org.jkiss.dbeaver.model.ai.engine.openai.AIAccountAuthenticator;
import org.jkiss.dbeaver.model.ai.engine.openai.OpenAIProperties;
import org.jkiss.dbeaver.model.ai.registry.AISettingsManager;
import org.jkiss.dbeaver.model.auth.AuthProperty;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretObject;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.runtime.properties.ObjectAttributeDescriptor;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertySourceEditable;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.concurrent.ConcurrentHashMap;

public final class WebAIProfileUtils {
    private static final String SECRET_ID_PREFIX = "ai.profile.";
    private static final String SECRET_OBJECT_TYPE = "aiProfile";
    private static final String SESSION_CREDENTIALS_ATTRIBUTE_PREFIX = "ai.profile.credentials.";
    private static final String ACCOUNT_CREDENTIALS_ATTRIBUTE_PREFIX = "ai.profile.accountCredentials.";
    private static final int ACCOUNT_LOCK_COUNT = 64;
    private static final Object[] ACCOUNT_LOCKS = new Object[ACCOUNT_LOCK_COUNT];
    private static final Map<AccountKey, DeviceAuthorizationAttempt> DEVICE_AUTHORIZATION_ATTEMPTS =
        new ConcurrentHashMap<>();
    private static final Set<AIConfigurationProfile> DELETED_ACCOUNT_PROFILES =
        Collections.newSetFromMap(new WeakHashMap<>());

    static {
        for (int i = 0; i < ACCOUNT_LOCKS.length; i++) {
            ACCOUNT_LOCKS[i] = new Object();
        }
    }

    private WebAIProfileUtils() {
    }

    public static boolean areCredentialsSaved(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        String userId = webSession.getUserId();
        if (profile.isGlobal() || userId == null || !webSession.isAuthorizedInSecurityManager()) {
            return false;
        }
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Set<String> credentialProperties = getCredentialPropertyIds(profile.getConfiguration());
        if (isOpenAIAccountProfile(profile)) {
            OpenAIProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
            synchronized (accountCredentials) {
                synchronized (getAccountLock(webSession, userId, profile.getProfileId())) {
                    Map<String, String> storedCredentials = getCredentials(
                        webSession,
                        secretController,
                        profile,
                        credentialProperties,
                        userId
                    );
                    return hasRequiredCredentials(profile.getConfiguration(), storedCredentials);
                }
            }
        }
        Map<String, String> storedCredentials = getCredentials(
            webSession,
            secretController,
            profile,
            credentialProperties,
            userId
        );
        return hasRequiredCredentials(profile.getConfiguration(), storedCredentials);
    }

    public static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> credentials
    ) throws DBException {
        validateUserProfile(webSession, profile);
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        if (isOpenAIAccountProfile(profile)) {
            OpenAIProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
            DeviceAuthorizationAttempt attempt;
            synchronized (accountCredentials) {
                synchronized (getAccountLock(webSession, userId, profile.getProfileId())) {
                    attempt = removeDeviceAuthorizationAttempt(webSession, userId, profile.getProfileId());
                    saveCredentials(webSession, profile, credentials, userId, accountCredentials);
                }
            }
            cancelDeviceAuthorizationTask(attempt);
        } else {
            saveCredentials(webSession, profile, credentials, userId, null);
        }
    }

    private static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> credentials,
        @NotNull String expectedUserId,
        @Nullable OpenAIProperties accountCredentials
    ) throws DBException {
        validateUserProfile(webSession, profile);
        validateExpectedUser(webSession, expectedUserId);
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Set<String> credentialProperties = getCredentialPropertyIds(profile.getConfiguration());
        validateCredentialProperties(credentialProperties, credentials.keySet());
        if (!isPersistentStorageAvailable(webSession, secretController)) {
            if (isPersistentStorageSupported(secretController)) {
                clearPersistentCredentials(secretController, profile, credentialProperties, expectedUserId);
            }
            Map<String, String> sessionCredentials = getSessionCredentials(
                webSession,
                profile,
                expectedUserId,
                true
            );
            updateCredentials(sessionCredentials, credentialProperties, credentials);
            validateExpectedUser(webSession, expectedUserId);
            updateCachedAccountCredentials(accountCredentials, credentials);
            return;
        }
        for (Map.Entry<String, Object> credential : credentials.entrySet()) {
            String value = credential.getValue() == null ? null : credential.getValue().toString();
            String secretId = getSecretId(profile, credential.getKey());
            secretController.setSubjectSecretValue(
                expectedUserId,
                getSecretObject(profile),
                new DBSSecretValue(
                    expectedUserId,
                    secretId,
                    profile.getProfileName() + ": " + credential.getKey(),
                    CommonUtils.isEmpty(value) ? null : value
                )
            );
        }
        webSession.removeAttribute(getSessionCredentialsAttribute(profile, expectedUserId));
        validateExpectedUser(webSession, expectedUserId);
        updateCachedAccountCredentials(accountCredentials, credentials);
    }

    public static void saveAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator.Tokens tokens
    ) throws DBException {
        validateUserProfile(webSession, profile);
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        OpenAIProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
        synchronized (accountCredentials) {
            synchronized (getAccountLock(webSession, userId, profile.getProfileId())) {
                saveAccountCredentials(webSession, profile, tokens, userId, accountCredentials);
            }
        }
    }

    static void saveAuthorizedAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator.Tokens tokens,
        @NotNull String expectedUserId,
        @NotNull String taskId
    ) throws DBException {
        OpenAIProperties accountCredentials = getAccountCredentials(webSession, profile, expectedUserId);
        synchronized (accountCredentials) {
            synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
                validateExpectedUser(webSession, expectedUserId);
                validateCurrentAccountProfile(profile);
                if (!isCurrentDeviceAuthorizationAttempt(
                    webSession,
                    expectedUserId,
                    profile.getProfileId(),
                    taskId
                )) {
                    throw new DBWebException("OpenAI device authorization was cancelled");
                }
                saveAccountCredentials(webSession, profile, tokens, expectedUserId, accountCredentials);
            }
        }
    }

    private static void validateCurrentAccountProfile(@NotNull AIConfigurationProfile profile) throws DBException {
        synchronized (DELETED_ACCOUNT_PROFILES) {
            if (DELETED_ACCOUNT_PROFILES.contains(profile)) {
                throw new DBWebException("AI profile is no longer available for ChatGPT account authorization");
            }
        }
    }

    private static void saveRefreshedAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator.Tokens tokens,
        @NotNull String expectedUserId,
        @Nullable String previousRefreshToken,
        @NotNull OpenAIProperties accountCredentials
    ) throws DBException {
        synchronized (accountCredentials) {
            synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
                validateCurrentAccountProfile(profile);
                validateStoredRefreshToken(
                    webSession,
                    profile,
                    expectedUserId,
                    previousRefreshToken
                );
                saveAccountCredentials(webSession, profile, tokens, expectedUserId, accountCredentials);
            }
        }
    }

    private static void saveAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator.Tokens tokens,
        @NotNull String expectedUserId,
        @NotNull OpenAIProperties accountCredentials
    ) throws DBException {
        OpenAIProperties properties = getOpenAIAccountProperties(profile);
        if (!properties.isAccountAuthentication()) {
            throw new DBWebException("AI profile does not use ChatGPT account authentication");
        }
        Map<String, Object> credentials = new LinkedHashMap<>();
        // Save the rotating refresh token first. If the second write fails, the stored pair can still be recovered.
        credentials.put(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY, tokens.refreshToken());
        credentials.put(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY, tokens.accessToken());
        credentials.put(OpenAIProperties.ACCOUNT_ID_PROPERTY, CommonUtils.notEmpty(tokens.accountId()));
        credentials.put(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY, CommonUtils.notEmpty(tokens.email()));
        credentials.put(
            OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY,
            System.currentTimeMillis() + tokens.expiresInSeconds() * 1000
        );
        saveCredentials(webSession, profile, credentials, expectedUserId, accountCredentials);
    }

    public static void deleteAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        OpenAIProperties properties = getOpenAIAccountProperties(profile);
        if (!properties.isAccountAuthentication()) {
            throw new DBWebException("AI profile does not use ChatGPT account authentication");
        }
        Map<String, Object> credentials = new LinkedHashMap<>();
        credentials.put(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY, "");
        credentials.put(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY, "");
        credentials.put(OpenAIProperties.ACCOUNT_ID_PROPERTY, "");
        credentials.put(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY, "");
        credentials.put(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY, "");
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        OpenAIProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
        DeviceAuthorizationAttempt attempt;
        synchronized (accountCredentials) {
            synchronized (getAccountLock(webSession, userId, profile.getProfileId())) {
                attempt = removeDeviceAuthorizationAttempt(webSession, userId, profile.getProfileId());
                saveCredentials(webSession, profile, credentials, userId, accountCredentials);
            }
        }
        cancelDeviceAuthorizationTask(attempt);
    }

    @NotNull
    public static AIConfigurationProfile getEffectiveProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        return getEffectiveProfile(webSession, profile, AISettingsManager.getStaticSettings());
    }

    @NotNull
    public static AIConfigurationProfile getEffectiveProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AISettings settings
    ) throws DBException {
        AIConfigurationProfile source = settings.getConfigurationOrNull(profile.getProfileId());
        if (source == null) {
            source = settings.getDefaultConfiguration();
        }
        if (source.isGlobal()) {
            return source;
        }

        AIConfigurationProfile sourceProfile = source;
        validateUserProfile(webSession, source);
        AIEngineProperties sourceProperties = source.getConfiguration();
        AIEngineProperties effectiveProperties = AISettingsManager.READ_PROPS_GSON.fromJson(
            AISettingsManager.READ_PROPS_GSON.toJson(sourceProperties),
            sourceProperties.getClass()
        );
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        if (sourceProperties instanceof OpenAIProperties openAIProperties && openAIProperties.isAccountAuthentication()) {
            String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
            OpenAIProperties accountCredentials = getAccountCredentials(webSession, source, userId);
            synchronized (accountCredentials) {
                synchronized (getAccountLock(webSession, userId, source.getProfileId())) {
                    Map<String, String> credentials = getCredentials(
                        webSession,
                        secretController,
                        source,
                        getCredentialPropertyIds(sourceProperties),
                        userId
                    );
                    if (!hasRequiredCredentials(sourceProperties, credentials)) {
                        throw new DBWebException("AI profile credentials are not configured");
                    }
                    accountCredentials.clearAccountTokens();
                    applyCredentials(webSession, accountCredentials, credentials);
                }
                accountCredentials.setAccountTokenValidator(refreshToken -> validateAccountCredentials(
                    webSession,
                    sourceProfile,
                    userId,
                    refreshToken,
                    accountCredentials
                ));
                accountCredentials.setAccountTokenRefreshHandler((authenticator, refreshToken) ->
                    refreshAccountCredentials(
                        webSession,
                        sourceProfile,
                        authenticator,
                        userId,
                        refreshToken,
                        accountCredentials
                    )
                );
                accountCredentials.setAccountTokenPersistence((previousRefreshToken, tokens) ->
                    saveRefreshedAccountCredentials(
                        webSession,
                        sourceProfile,
                        tokens,
                        userId,
                        previousRefreshToken,
                        accountCredentials
                    )
                );
                ((OpenAIProperties) effectiveProperties).useAccountCredentialsFrom(accountCredentials);
            }
        } else {
            String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
            Map<String, String> credentials = getCredentials(
                webSession,
                secretController,
                source,
                getCredentialPropertyIds(sourceProperties),
                userId
            );
            if (!hasRequiredCredentials(sourceProperties, credentials)) {
                throw new DBWebException("AI profile credentials are not configured");
            }
            applyCredentials(webSession, effectiveProperties, credentials);
        }

        AIConfigurationProfile effectiveProfile = new AIConfigurationProfile();
        effectiveProfile.setProfileId(source.getProfileId());
        effectiveProfile.setProfileName(source.getProfileName());
        effectiveProfile.setEngineId(source.getEngineId());
        effectiveProfile.setConfiguration(effectiveProperties);
        effectiveProfile.setGlobal(false);
        return effectiveProfile;
    }

    @NotNull
    private static AIAccountAuthenticator.Tokens refreshAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator authenticator,
        @NotNull String expectedUserId,
        @NotNull String refreshToken,
        @NotNull OpenAIProperties accountCredentials
    ) throws DBException {
        synchronized (accountCredentials) {
            synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
                validateCurrentAccountProfile(profile);
                validateStoredRefreshToken(webSession, profile, expectedUserId, refreshToken);
                String accountId = accountCredentials.getAccountId();
                String accountEmail = accountCredentials.getAccountEmail();
                AIAccountAuthenticator.Tokens tokens = authenticator.refresh(refreshToken);
                validateCurrentAccountProfile(profile);
                validateStoredRefreshToken(webSession, profile, expectedUserId, refreshToken);
                AIAccountAuthenticator.Tokens persistedTokens = new AIAccountAuthenticator.Tokens(
                    tokens.accessToken(),
                    tokens.refreshToken(),
                    tokens.expiresInSeconds(),
                    tokens.accountId() == null ? accountId : tokens.accountId(),
                    tokens.email() == null ? accountEmail : tokens.email()
                );
                saveAccountCredentials(webSession, profile, persistedTokens, expectedUserId, accountCredentials);
                return persistedTokens;
            }
        }
    }

    private static void validateAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @Nullable String refreshToken,
        @NotNull OpenAIProperties accountCredentials
    ) throws DBException {
        synchronized (accountCredentials) {
            synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
                validateCurrentAccountProfile(profile);
                validateStoredRefreshToken(webSession, profile, expectedUserId, refreshToken);
            }
        }
    }

    private static void validateStoredRefreshToken(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @Nullable String refreshToken
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Map<String, String> storedCredentials = getCredentials(
            webSession,
            secretController,
            profile,
            Set.of(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY),
            expectedUserId
        );
        if (!Objects.equals(refreshToken, storedCredentials.get(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY))) {
            throw new DBWebException("AI account credentials have changed");
        }
    }

    public static void prepareGlobalProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        if (profile.isGlobal()) {
            return;
        }
        AIEngineProperties properties = profile.getConfiguration();
        Map<String, String> emptyCredentials = new HashMap<>();
        getAllCredentialPropertyIds(properties).forEach(property -> emptyCredentials.put(property, null));
        applyCredentials(webSession, properties, emptyCredentials);
    }

    public static void validateCredentialsSupport(
        @NotNull WebSession webSession,
        @NotNull AIEngineProperties properties
    ) throws DBException {
        if (getCredentialPropertyIds(properties).isEmpty()) {
            throw new DBWebException("AI engine does not support user credentials");
        }
    }

    public static void deleteCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        if (webSession.getUserId() == null || !webSession.isAuthorizedInSecurityManager()) {
            throw new DBWebException("User authentication is required");
        }
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        if (!profile.isGlobal() && isOpenAIAccountProfile(profile)) {
            OpenAIProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
            DeviceAuthorizationAttempt attempt;
            synchronized (accountCredentials) {
                synchronized (getAccountLock(webSession, userId, profile.getProfileId())) {
                    attempt = removeDeviceAuthorizationAttempt(webSession, userId, profile.getProfileId());
                    webSession.removeAttribute(getSessionCredentialsAttribute(profile, userId));
                    webSession.removeAttribute(getAccountCredentialsAttribute(profile, userId));
                    accountCredentials.clearAccountTokens();
                    if (isPersistentStorageSupported(secretController)) {
                        clearPersistentCredentials(
                            secretController,
                            profile,
                            getAllCredentialPropertyIds(profile.getConfiguration()),
                            userId
                        );
                    }
                    validateExpectedUser(webSession, userId);
                }
            }
            cancelDeviceAuthorizationTask(attempt);
        } else {
            webSession.removeAttribute(getSessionCredentialsAttribute(profile, userId));
            webSession.removeAttribute(getAccountCredentialsAttribute(profile, userId));
            if (isPersistentStorageSupported(secretController)) {
                clearPersistentCredentials(
                    secretController,
                    profile,
                    getAllCredentialPropertyIds(profile.getConfiguration()),
                    userId
                );
            }
            validateExpectedUser(webSession, userId);
        }
    }

    private static void validateUserProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        if (webSession.getUserId() == null || !webSession.isAuthorizedInSecurityManager()) {
            throw new DBWebException("User authentication is required");
        }
        if (profile.isGlobal()) {
            throw new DBWebException("AI profile does not use user credentials");
        }
        if (getCredentialPropertyIds(profile.getConfiguration()).isEmpty()) {
            throw new DBWebException("AI engine does not support user credentials");
        }
    }

    private static void validateExpectedUser(
        @NotNull WebSession webSession,
        @Nullable String expectedUserId
    ) throws DBWebException {
        if (expectedUserId != null && !expectedUserId.equals(webSession.getUserId())) {
            throw new DBWebException("AI account authorization session has changed");
        }
    }

    public static void registerDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @NotNull String taskId
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        DeviceAuthorizationAttempt previousAttempt;
        synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
            validateExpectedUser(webSession, expectedUserId);
            validateCurrentAccountProfile(profile);
            previousAttempt = DEVICE_AUTHORIZATION_ATTEMPTS.put(
                getAccountKey(webSession, expectedUserId, profile.getProfileId()),
                new DeviceAuthorizationAttempt(webSession, taskId)
            );
        }
        cancelDeviceAuthorizationTask(previousAttempt);
    }

    public static void cancelDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId
    ) throws DBException {
        DeviceAuthorizationAttempt attempt;
        synchronized (getAccountLock(webSession, expectedUserId, profile.getProfileId())) {
            validateExpectedUser(webSession, expectedUserId);
            attempt = removeDeviceAuthorizationAttempt(webSession, expectedUserId, profile.getProfileId());
        }
        cancelDeviceAuthorizationTask(attempt);
    }

    public static void invalidateAccountProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        synchronized (DELETED_ACCOUNT_PROFILES) {
            DELETED_ACCOUNT_PROFILES.add(profile);
        }
        var attempts = new ArrayList<DeviceAuthorizationAttempt>();
        for (Map.Entry<AccountKey, DeviceAuthorizationAttempt> entry : DEVICE_AUTHORIZATION_ATTEMPTS.entrySet()) {
            AccountKey key = entry.getKey();
            if (key.application() != webSession.getApplication() || !key.profileId().equals(profile.getProfileId())) {
                continue;
            }
            synchronized (getAccountLock(webSession, key.userId(), key.profileId())) {
                if (DEVICE_AUTHORIZATION_ATTEMPTS.remove(key, entry.getValue())) {
                    attempts.add(entry.getValue());
                }
            }
        }
        for (DeviceAuthorizationAttempt attempt : attempts) {
            cancelDeviceAuthorizationTask(attempt);
        }
    }

    public static void restoreAccountProfile(@NotNull AIConfigurationProfile profile) {
        synchronized (DELETED_ACCOUNT_PROFILES) {
            DELETED_ACCOUNT_PROFILES.remove(profile);
        }
    }

    static boolean isCurrentDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId,
        @NotNull String profileId,
        @NotNull String taskId
    ) {
        DeviceAuthorizationAttempt attempt = DEVICE_AUTHORIZATION_ATTEMPTS.get(
            getAccountKey(webSession, expectedUserId, profileId)
        );
        return attempt != null && attempt.webSession() == webSession && taskId.equals(attempt.taskId());
    }

    static void clearDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId,
        @NotNull String profileId,
        @NotNull String taskId
    ) {
        synchronized (getAccountLock(webSession, expectedUserId, profileId)) {
            AccountKey key = getAccountKey(webSession, expectedUserId, profileId);
            DeviceAuthorizationAttempt attempt = DEVICE_AUTHORIZATION_ATTEMPTS.get(key);
            if (attempt != null && attempt.webSession() == webSession && taskId.equals(attempt.taskId())) {
                DEVICE_AUTHORIZATION_ATTEMPTS.remove(key, attempt);
            }
        }
    }

    @Nullable
    private static DeviceAuthorizationAttempt removeDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId,
        @NotNull String profileId
    ) {
        return DEVICE_AUTHORIZATION_ATTEMPTS.remove(getAccountKey(webSession, expectedUserId, profileId));
    }

    private static void cancelDeviceAuthorizationTask(@Nullable DeviceAuthorizationAttempt attempt) throws DBWebException {
        if (attempt == null) {
            return;
        }
        var taskInfo = attempt.webSession().getAsyncTask(attempt.taskId(), "ChatGPT account authorization", false);
        if (taskInfo != null && taskInfo.isRunning()) {
            attempt.webSession().asyncTaskCancel(attempt.taskId());
        }
    }

    @NotNull
    private static Object getAccountLock(
        @NotNull WebSession webSession,
        @NotNull String userId,
        @NotNull String profileId
    ) {
        int index = Math.floorMod(getAccountKey(webSession, userId, profileId).hashCode(), ACCOUNT_LOCKS.length);
        return ACCOUNT_LOCKS[index];
    }

    @NotNull
    private static AccountKey getAccountKey(
        @NotNull WebSession webSession,
        @NotNull String userId,
        @NotNull String profileId
    ) {
        return new AccountKey(webSession.getApplication(), userId, profileId);
    }

    private static void updateCredentials(
        @NotNull Map<String, String> target,
        @NotNull Set<String> credentialProperties,
        @NotNull Map<String, Object> updates
    ) throws DBWebException {
        validateCredentialProperties(credentialProperties, updates.keySet());
        synchronized (target) {
            for (Map.Entry<String, Object> credential : updates.entrySet()) {
                String value = credential.getValue() == null ? null : credential.getValue().toString();
                if (CommonUtils.isEmpty(value)) {
                    target.remove(credential.getKey());
                } else {
                    target.put(credential.getKey(), value);
                }
            }
        }
    }

    private static void validateCredentialProperties(
        @NotNull Set<String> credentialProperties,
        @NotNull Set<String> updates
    ) throws DBWebException {
        for (String property : updates) {
            if (!credentialProperties.contains(property)) {
                throw new DBWebException("Invalid AI credential property " + property);
            }
        }
    }

    private static boolean isPersistentStorageAvailable(
        @NotNull WebSession webSession,
        @NotNull DBSSecretController secretController
    ) throws DBException {
        if (!isPersistentStorageSupported(secretController)) {
            return false;
        }
        var user = webSession.getUserContext().getUser();
        return user != null && user.isSecretStorage();
    }

    private static boolean isPersistentStorageSupported(@NotNull DBSSecretController secretController) throws DBException {
        long features = secretController.getSupportedFeatures();
        return (features & DBSSecretController.FEATURE_PRIVATE_SECRETS_VIEW) != 0 &&
            (features & DBSSecretController.FEATURE_PRIVATE_SECRETS_EDIT) != 0;
    }

    private static void clearPersistentCredentials(
        @NotNull DBSSecretController secretController,
        @NotNull AIConfigurationProfile profile,
        @NotNull Set<String> credentialProperties,
        @NotNull String subjectId
    ) throws DBException {
        for (String property : credentialProperties) {
            secretController.setSubjectSecretValue(
                subjectId,
                getSecretObject(profile),
                new DBSSecretValue(
                    subjectId,
                    getSecretId(profile, property),
                    profile.getProfileName() + ": " + property,
                    null
                )
            );
        }
    }

    @NotNull
    private static Map<String, String> getSessionCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String userId,
        boolean create
    ) {
        String attribute = getSessionCredentialsAttribute(profile, userId);
        synchronized (webSession) {
            SessionCredentials sessionCredentials = webSession.getAttribute(attribute);
            if (sessionCredentials != null) {
                if (create) {
                    return sessionCredentials.credentials();
                }
                synchronized (sessionCredentials.credentials()) {
                    return Map.copyOf(sessionCredentials.credentials());
                }
            }
            if (!create) {
                return Map.of();
            }
            SessionCredentials newCredentials = new SessionCredentials(new HashMap<>());
            webSession.setAttribute(attribute, newCredentials);
            return newCredentials.credentials();
        }
    }

    @NotNull
    private static String getSessionCredentialsAttribute(
        @NotNull AIConfigurationProfile profile,
        @NotNull String userId
    ) {
        return SESSION_CREDENTIALS_ATTRIBUTE_PREFIX + userId + "." + profile.getProfileId();
    }

    private static void applyCredentials(
        @NotNull WebSession webSession,
        @NotNull AIEngineProperties properties,
        @NotNull Map<String, String> credentials
    ) throws DBException {
        PropertySourceEditable propertySource = createPropertySource(properties);
        Set<String> appliedAccountProperties = new HashSet<>();
        if (properties instanceof OpenAIProperties openAIProperties) {
            if (credentials.containsKey(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY)) {
                openAIProperties.setAccessToken(credentials.get(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY));
                appliedAccountProperties.add(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY);
            }
            if (credentials.containsKey(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY)) {
                openAIProperties.setRefreshToken(credentials.get(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY));
                appliedAccountProperties.add(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY);
            }
            if (credentials.containsKey(OpenAIProperties.ACCOUNT_ID_PROPERTY)) {
                openAIProperties.setStoredAccountId(credentials.get(OpenAIProperties.ACCOUNT_ID_PROPERTY));
                appliedAccountProperties.add(OpenAIProperties.ACCOUNT_ID_PROPERTY);
            }
            if (credentials.containsKey(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY)) {
                openAIProperties.setStoredAccountEmail(credentials.get(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY));
                appliedAccountProperties.add(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY);
            }
            if (credentials.containsKey(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY)) {
                openAIProperties.setStoredExpiresAt(CommonUtils.toLong(
                    credentials.get(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY)
                ));
                appliedAccountProperties.add(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY);
            }
        }
        for (Map.Entry<String, String> credential : credentials.entrySet()) {
            if (appliedAccountProperties.contains(credential.getKey())) {
                continue;
            }
            if (propertySource.getProperty(credential.getKey()) == null) {
                throw new DBWebException("AI engine credential property is not available: " + credential.getKey());
            }
            propertySource.setPropertyValue(
                webSession.getProgressMonitor(),
                credential.getKey(),
                credential.getValue()
            );
        }
    }

    @NotNull
    private static Set<String> getCredentialPropertyIds(@NotNull AIEngineProperties properties) {
        Set<String> credentialProperties = getAllCredentialPropertyIds(properties);
        if (properties instanceof OpenAIProperties openAIProperties) {
            if (openAIProperties.isAccountAuthentication()) {
                credentialProperties.retainAll(Set.of(
                    OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY,
                    OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY,
                    OpenAIProperties.ACCOUNT_ID_PROPERTY,
                    OpenAIProperties.ACCOUNT_EMAIL_PROPERTY,
                    OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY
                ));
            } else {
                credentialProperties.remove(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY);
                credentialProperties.remove(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY);
                credentialProperties.remove(OpenAIProperties.ACCOUNT_ID_PROPERTY);
                credentialProperties.remove(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY);
                credentialProperties.remove(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY);
            }
        }
        return credentialProperties;
    }

    @NotNull
    private static Set<String> getAllCredentialPropertyIds(@NotNull AIEngineProperties properties) {
        Set<String> credentialProperties = new LinkedHashSet<>();
        for (ObjectPropertyDescriptor property : ObjectAttributeDescriptor.extractAnnotations(
            null,
            properties.getClass(),
            null,
            null,
            false
        )) {
            if (property.isPassword() || property.getAnnotation(AuthProperty.class) != null) {
                credentialProperties.add(property.getId());
            }
        }
        return credentialProperties;
    }

    private static boolean hasRequiredCredentials(
        @NotNull AIEngineProperties properties,
        @NotNull Map<String, String> credentials
    ) {
        if (properties instanceof OpenAIProperties openAIProperties && openAIProperties.isAccountAuthentication()) {
            return CommonUtils.isNotEmpty(credentials.get(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY));
        }
        return !credentials.isEmpty();
    }

    private static boolean isOpenAIAccountProfile(@NotNull AIConfigurationProfile profile) throws DBException {
        return profile.getConfiguration() instanceof OpenAIProperties properties && properties.isAccountAuthentication();
    }

    @NotNull
    private static OpenAIProperties getOpenAIAccountProperties(@NotNull AIConfigurationProfile profile) throws DBException {
        if (!(profile.getConfiguration() instanceof OpenAIProperties properties)) {
            throw new DBWebException("AI profile does not support ChatGPT account authentication");
        }
        return properties;
    }

    @NotNull
    private static OpenAIProperties getAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String userId
    ) {
        String attribute = getAccountCredentialsAttribute(profile, userId);
        synchronized (webSession) {
            OpenAIProperties credentials = webSession.getAttribute(attribute);
            if (credentials == null) {
                credentials = new OpenAIProperties();
                credentials.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
                webSession.setAttribute(attribute, credentials);
            }
            return credentials;
        }
    }

    private static void updateCachedAccountCredentials(
        @Nullable OpenAIProperties credentials,
        @NotNull Map<String, Object> updates
    ) {
        if (credentials == null) {
            return;
        }
        synchronized (credentials) {
            if (updates.containsKey(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY)) {
                credentials.setAccessToken(CommonUtils.toString(
                    updates.get(OpenAIProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY)) {
                credentials.setRefreshToken(CommonUtils.toString(
                    updates.get(OpenAIProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(OpenAIProperties.ACCOUNT_ID_PROPERTY)) {
                credentials.setStoredAccountId(CommonUtils.toString(
                    updates.get(OpenAIProperties.ACCOUNT_ID_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY)) {
                credentials.setStoredAccountEmail(CommonUtils.toString(
                    updates.get(OpenAIProperties.ACCOUNT_EMAIL_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY)) {
                credentials.setStoredExpiresAt(CommonUtils.toLong(
                    updates.get(OpenAIProperties.ACCOUNT_EXPIRES_AT_PROPERTY)
                ));
            }
        }
    }

    @NotNull
    private static String getAccountCredentialsAttribute(
        @NotNull AIConfigurationProfile profile,
        @NotNull String userId
    ) {
        return ACCOUNT_CREDENTIALS_ATTRIBUTE_PREFIX + userId + "." + profile.getProfileId();
    }

    @NotNull
    private static PropertySourceEditable createPropertySource(@NotNull AIEngineProperties properties) {
        PropertySourceEditable propertySource = new PropertySourceEditable(properties, properties);
        for (ObjectPropertyDescriptor property : ObjectAttributeDescriptor.extractAnnotations(
            propertySource,
            properties.getClass(),
            null,
            null,
            false
        )) {
            propertySource.addProperty(property);
        }
        return propertySource;
    }

    @NotNull
    private static Map<String, String> getStoredCredentials(
        @NotNull DBSSecretController secretController,
        @NotNull AIConfigurationProfile profile,
        @NotNull Set<String> credentialProperties
    ) throws DBException {
        Map<String, String> credentials = new HashMap<>();
        for (String property : credentialProperties) {
            String value = secretController.getPrivateSecretValue(getSecretId(profile, property));
            if (CommonUtils.isNotEmpty(value)) {
                credentials.put(property, value);
            }
        }
        return credentials;
    }

    @NotNull
    private static Map<String, String> getCredentials(
        @NotNull WebSession webSession,
        @NotNull DBSSecretController secretController,
        @NotNull AIConfigurationProfile profile,
        @NotNull Set<String> credentialProperties,
        @NotNull String expectedUserId
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        Map<String, String> credentials;
        if (isPersistentStorageAvailable(webSession, secretController)) {
            credentials = getStoredCredentials(secretController, profile, credentialProperties);
        } else {
            Map<String, String> sessionCredentials = getSessionCredentials(
                webSession,
                profile,
                expectedUserId,
                false
            );
            credentials = new HashMap<>();
            for (String property : credentialProperties) {
                String value = sessionCredentials.get(property);
                if (CommonUtils.isNotEmpty(value)) {
                    credentials.put(property, value);
                }
            }
        }
        validateExpectedUser(webSession, expectedUserId);
        return credentials;
    }

    @NotNull
    private static String getSecretId(@NotNull AIConfigurationProfile profile, @NotNull String propertyId) {
        return getSecretIdPrefix(profile) + propertyId;
    }

    @NotNull
    private static String getSecretIdPrefix(@NotNull AIConfigurationProfile profile) {
        return SECRET_ID_PREFIX + profile.getProfileId() + ".";
    }

    @NotNull
    private static DBSSecretObject getSecretObject(@NotNull AIConfigurationProfile profile) {
        return new AIProfileSecretObject(profile.getProfileId());
    }

    private static final class AIProfileSecretObject implements DBSSecretObject {
        @NotNull
        private final String projectId = "";
        @NotNull
        private final String secretObjectId;
        @NotNull
        private final String secretObjectType = SECRET_OBJECT_TYPE;

        private AIProfileSecretObject(@NotNull String secretObjectId) {
            this.secretObjectId = secretObjectId;
        }

        @NotNull
        @Override
        public String getProjectId() {
            return projectId;
        }

        @NotNull
        @Override
        public String getSecretObjectId() {
            return secretObjectId;
        }

        @NotNull
        @Override
        public String getSecretObjectType() {
            return secretObjectType;
        }
    }

    private record SessionCredentials(
        @NotNull Map<String, String> credentials
    ) {
    }

    private record AccountKey(
        @Nullable Object application,
        @NotNull String userId,
        @NotNull String profileId
    ) {
    }

    private record DeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull String taskId
    ) {
    }
}

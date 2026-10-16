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
import org.jkiss.dbeaver.model.ai.engine.AIAccountProperties;
import org.jkiss.dbeaver.model.ai.engine.AIEngineProperties;
import org.jkiss.dbeaver.model.ai.engine.openai.AIAccountAuthenticator;
import org.jkiss.dbeaver.model.ai.registry.AISettingsManager;
import org.jkiss.dbeaver.model.auth.AuthProperty;
import org.jkiss.dbeaver.runtime.properties.ObjectAttributeDescriptor;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertySourceEditable;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public final class WebAIProfileUtils {
    private static final String ACCOUNT_AUTHENTICATION_PROPERTY = "accountAuthentication";
    private static final String ACCOUNT_CREDENTIALS_ATTRIBUTE_PREFIX = "ai.profile.accountCredentials.";

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
        if (isAccountProfile(profile)) {
            AIAccountProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
            synchronized (accountCredentials) {
                synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                    webSession,
                    userId,
                    profile.getProfileId()
                )) {
                    boolean accountAuthentication = isAccountAuthentication(
                        webSession,
                        profile,
                        userId
                    );
                    Set<String> credentialProperties = accountAuthentication
                        ? AIAccountProperties.ACCOUNT_CREDENTIAL_PROPERTY_IDS
                        : getTokenCredentialPropertyIds(profile.getConfiguration());
                    Map<String, String> storedCredentials = WebAIProfileCredentialStore.loadCredentials(
                        webSession,
                        profile,
                        credentialProperties,
                        userId
                    );
                    return hasRequiredCredentials(accountAuthentication, storedCredentials);
                }
            }
        }
        Set<String> credentialProperties = getCredentialPropertyIds(profile.getConfiguration());
        Map<String, String> storedCredentials = WebAIProfileCredentialStore.loadCredentials(
            webSession,
            profile,
            credentialProperties,
            userId
        );
        return hasRequiredCredentials(false, storedCredentials);
    }

    public static boolean isAccountAuthentication(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        String userId = webSession.getUserId();
        if (profile.isGlobal()
            || userId == null
            || !webSession.isAuthorizedInSecurityManager()
            || !isAccountProfile(profile)
            || !getAccountProperties(profile).supportsDeviceAuthorization()
        ) {
            return false;
        }
        synchronized (WebAIDeviceAuthorizationManager.getAccountLock(webSession, userId, profile.getProfileId())) {
            return isAccountAuthentication(
                webSession,
                profile,
                userId
            );
        }
    }

    public static boolean isTokenSaved(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        String userId = webSession.getUserId();
        if (profile.isGlobal() || userId == null || !webSession.isAuthorizedInSecurityManager()) {
            return false;
        }
        Set<String> tokenProperties = getTokenCredentialPropertyIds(profile.getConfiguration());
        if (tokenProperties.isEmpty()) {
            return false;
        }
        synchronized (WebAIDeviceAuthorizationManager.getAccountLock(webSession, userId, profile.getProfileId())) {
            return !WebAIProfileCredentialStore.loadCredentials(
                webSession,
                profile,
                tokenProperties,
                userId
            ).isEmpty();
        }
    }

    public static boolean isAccountSaved(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        String userId = webSession.getUserId();
        if (profile.isGlobal()
            || userId == null
            || !webSession.isAuthorizedInSecurityManager()
            || !isAccountProfile(profile)
            || !getAccountProperties(profile).supportsDeviceAuthorization()
        ) {
            return false;
        }
        synchronized (WebAIDeviceAuthorizationManager.getAccountLock(webSession, userId, profile.getProfileId())) {
            return CommonUtils.isNotEmpty(WebAIProfileCredentialStore.loadCredentials(
                webSession,
                profile,
                Set.of(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY),
                userId
            ).get(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY));
        }
    }

    @Nullable
    public static String getAccountEmail(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        synchronized (WebAIDeviceAuthorizationManager.getAccountLock(webSession, userId, profile.getProfileId())) {
            Map<String, String> credentials = WebAIProfileCredentialStore.loadCredentials(
                webSession,
                profile,
                Set.of(
                    AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY,
                    AIAccountProperties.ACCOUNT_EMAIL_PROPERTY
                ),
                userId
            );
            return CommonUtils.isEmpty(credentials.get(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY))
                ? null
                : credentials.get(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY);
        }
    }

    public static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> credentials
    ) throws DBException {
        saveCredentials(webSession, profile, credentials, null);
    }

    public static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> credentials,
        @Nullable Boolean accountAuthentication
    ) throws DBException {
        validateUserProfile(webSession, profile);
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        Map<String, Object> updates = new LinkedHashMap<>(credentials);
        if (isAccountProfile(profile)
            && !Collections.disjoint(credentials.keySet(), AIAccountProperties.ACCOUNT_CREDENTIAL_PROPERTY_IDS)
        ) {
            throw new DBWebException("AI account credentials can only be set by account authorization");
        }
        if (accountAuthentication != null) {
            if (accountAuthentication
                && (!isAccountProfile(profile) || !getAccountProperties(profile).supportsDeviceAuthorization())
            ) {
                throw new DBWebException("AI profile does not support account authentication");
            }
            if (isAccountProfile(profile)) {
                updates.put(ACCOUNT_AUTHENTICATION_PROPERTY, accountAuthentication.toString());
            }
        }
        if (isAccountProfile(profile)) {
            AIAccountProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
            WebAIDeviceAuthorizationManager.AuthorizationAttempt attempt;
            synchronized (accountCredentials) {
                synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                    webSession,
                    userId,
                    profile.getProfileId()
                )) {
                    attempt = WebAIDeviceAuthorizationManager.removeAttempt(webSession, userId, profile.getProfileId());
                    saveCredentials(webSession, profile, updates, userId, accountCredentials);
                }
            }
            WebAIDeviceAuthorizationManager.cancelTask(attempt);
        } else {
            saveCredentials(webSession, profile, updates, userId, null);
        }
    }

    private static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> credentials,
        @NotNull String expectedUserId,
        @Nullable AIAccountProperties accountCredentials
    ) throws DBException {
        validateUserProfile(webSession, profile);
        validateExpectedUser(webSession, expectedUserId);
        Set<String> credentialProperties = getUserPropertyIds(profile.getConfiguration());
        WebAIProfileCredentialStore.saveCredentials(
            webSession,
            profile,
            credentialProperties,
            credentials,
            expectedUserId
        );
        updateCachedAccountCredentials(accountCredentials, credentials);
    }

    public static void saveAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator.Tokens tokens
    ) throws DBException {
        validateUserProfile(webSession, profile);
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        AIAccountProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
        synchronized (accountCredentials) {
            synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                webSession,
                userId,
                profile.getProfileId()
            )) {
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
        AIAccountProperties accountCredentials = getAccountCredentials(webSession, profile, expectedUserId);
        synchronized (accountCredentials) {
            synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                webSession,
                expectedUserId,
                profile.getProfileId()
            )) {
                validateExpectedUser(webSession, expectedUserId);
                WebAIDeviceAuthorizationManager.validateCurrentProfile(profile);
                if (!WebAIDeviceAuthorizationManager.isCurrentAttempt(
                    webSession,
                    expectedUserId,
                    profile.getProfileId(),
                    taskId
                )) {
                    throw new DBWebException("AI device authorization was cancelled");
                }
                saveAccountCredentials(webSession, profile, tokens, expectedUserId, accountCredentials);
            }
        }
    }

    private static void saveRefreshedAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull AIAccountAuthenticator.Tokens tokens,
        @NotNull String expectedUserId,
        @Nullable String previousRefreshToken,
        @NotNull AIAccountProperties accountCredentials
    ) throws DBException {
        synchronized (accountCredentials) {
            synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                webSession,
                expectedUserId,
                profile.getProfileId()
            )) {
                WebAIDeviceAuthorizationManager.validateCurrentProfile(profile);
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
        @NotNull AIAccountProperties accountCredentials
    ) throws DBException {
        getAccountProperties(profile);
        Map<String, Object> credentials = new LinkedHashMap<>();
        // Save the rotating refresh token first. If the second write fails, the stored pair can still be recovered.
        credentials.put(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY, tokens.refreshToken());
        credentials.put(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY, tokens.accessToken());
        credentials.put(AIAccountProperties.ACCOUNT_ID_PROPERTY, CommonUtils.notEmpty(tokens.accountId()));
        credentials.put(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY, CommonUtils.notEmpty(tokens.email()));
        credentials.put(
            AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY,
            System.currentTimeMillis() + tokens.expiresInSeconds() * 1000
        );
        credentials.put(ACCOUNT_AUTHENTICATION_PROPERTY, Boolean.TRUE.toString());
        saveCredentials(webSession, profile, credentials, expectedUserId, accountCredentials);
    }

    public static void deleteAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        getAccountProperties(profile);
        Map<String, Object> credentials = new LinkedHashMap<>();
        credentials.put(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY, "");
        credentials.put(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY, "");
        credentials.put(AIAccountProperties.ACCOUNT_ID_PROPERTY, "");
        credentials.put(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY, "");
        credentials.put(AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY, "");
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        AIAccountProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
        WebAIDeviceAuthorizationManager.AuthorizationAttempt attempt;
        synchronized (accountCredentials) {
            synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                webSession,
                userId,
                profile.getProfileId()
            )) {
                attempt = WebAIDeviceAuthorizationManager.removeAttempt(
                    webSession,
                    userId,
                    profile.getProfileId()
                );
                saveCredentials(webSession, profile, credentials, userId, accountCredentials);
            }
        }
        WebAIDeviceAuthorizationManager.cancelTask(attempt);
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
        String userId = Objects.requireNonNull(webSession.getUserId(), "User authentication is required");
        boolean accountAuthentication = sourceProperties instanceof AIAccountProperties
            && isAccountAuthentication(webSession, source, userId);
        if (effectiveProperties instanceof AIAccountProperties accountProperties) {
            accountProperties.setAccountAuthentication(accountAuthentication);
        }
        if (accountAuthentication) {
            AIAccountProperties accountCredentials = getAccountCredentials(webSession, source, userId);
            synchronized (accountCredentials) {
                synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                    webSession,
                    userId,
                    source.getProfileId()
                )) {
                    Map<String, String> credentials = WebAIProfileCredentialStore.loadCredentials(
                        webSession,
                        source,
                        AIAccountProperties.ACCOUNT_CREDENTIAL_PROPERTY_IDS,
                        userId
                    );
                    if (!hasRequiredCredentials(true, credentials)) {
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
                ((AIAccountProperties) effectiveProperties).useAccountCredentialsFrom(accountCredentials);
            }
        } else {
            Map<String, String> credentials = WebAIProfileCredentialStore.loadCredentials(
                webSession,
                source,
                getTokenCredentialPropertyIds(sourceProperties),
                userId
            );
            if (!hasRequiredCredentials(false, credentials)) {
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
        @NotNull AIAccountProperties accountCredentials
    ) throws DBException {
        synchronized (accountCredentials) {
            synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                webSession,
                expectedUserId,
                profile.getProfileId()
            )) {
                WebAIDeviceAuthorizationManager.validateCurrentProfile(profile);
                validateStoredRefreshToken(webSession, profile, expectedUserId, refreshToken);
                String accountId = accountCredentials.getAccountId();
                String accountEmail = accountCredentials.getAccountEmail();
                AIAccountAuthenticator.Tokens tokens = authenticator.refresh(refreshToken);
                WebAIDeviceAuthorizationManager.validateCurrentProfile(profile);
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
        @NotNull AIAccountProperties accountCredentials
    ) throws DBException {
        synchronized (accountCredentials) {
            synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                webSession,
                expectedUserId,
                profile.getProfileId()
            )) {
                WebAIDeviceAuthorizationManager.validateCurrentProfile(profile);
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
        Map<String, String> storedCredentials = WebAIProfileCredentialStore.loadCredentials(
            webSession,
            profile,
            Set.of(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY),
            expectedUserId
        );
        if (!isAccountAuthentication(
            webSession,
            profile,
            expectedUserId
        )
            || !Objects.equals(refreshToken, storedCredentials.get(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY))
        ) {
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
        if (isAccountProfile(profile)) {
            AIAccountProperties accountCredentials = getAccountCredentials(webSession, profile, userId);
            WebAIDeviceAuthorizationManager.AuthorizationAttempt attempt;
            synchronized (accountCredentials) {
                synchronized (WebAIDeviceAuthorizationManager.getAccountLock(
                    webSession,
                    userId,
                    profile.getProfileId()
                )) {
                    attempt = WebAIDeviceAuthorizationManager.removeAttempt(
                        webSession,
                        userId,
                        profile.getProfileId()
                    );
                    WebAIProfileCredentialStore.removeSessionCredentials(webSession, profile, userId);
                    webSession.removeAttribute(getAccountCredentialsAttribute(profile, userId));
                    accountCredentials.clearAccountTokens();
                    validateExpectedUser(webSession, userId);
                }
            }
            WebAIDeviceAuthorizationManager.cancelTask(attempt);
        } else {
            WebAIProfileCredentialStore.removeSessionCredentials(webSession, profile, userId);
            webSession.removeAttribute(getAccountCredentialsAttribute(profile, userId));
            validateExpectedUser(webSession, userId);
        }
        WebAIProfileCredentialStore.deletePersistentCredentials(webSession, profile, userId);
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
        @NotNull String taskId,
        @NotNull String taskName
    ) throws DBException {
        WebAIDeviceAuthorizationManager.registerAttempt(webSession, profile, expectedUserId, taskId, taskName);
    }

    public static void cancelDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId
    ) throws DBException {
        WebAIDeviceAuthorizationManager.cancelAttempt(webSession, profile, expectedUserId);
    }

    public static void discardDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @NotNull String taskId,
        @NotNull String taskName
    ) throws DBException {
        WebAIDeviceAuthorizationManager.discardAttempt(
            webSession,
            profile,
            expectedUserId,
            taskId,
            taskName
        );
    }

    public static void validateDeviceAuthorizationAttempt(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId,
        @NotNull String taskId
    ) throws DBException {
        WebAIDeviceAuthorizationManager.validateAttempt(webSession, profile, expectedUserId, taskId);
    }

    public static void invalidateAccountProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        WebAIDeviceAuthorizationManager.invalidateProfile(webSession, profile);
    }

    public static void restoreAccountProfile(@NotNull AIConfigurationProfile profile) {
        WebAIDeviceAuthorizationManager.restoreProfile(profile);
    }

    private static void applyCredentials(
        @NotNull WebSession webSession,
        @NotNull AIEngineProperties properties,
        @NotNull Map<String, String> credentials
    ) throws DBException {
        PropertySourceEditable propertySource = createPropertySource(properties);
        Set<String> appliedAccountProperties = new HashSet<>();
        if (properties instanceof AIAccountProperties accountProperties) {
            if (credentials.containsKey(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY)) {
                accountProperties.setAccessToken(credentials.get(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY));
                appliedAccountProperties.add(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY);
            }
            if (credentials.containsKey(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY)) {
                accountProperties.setRefreshToken(credentials.get(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY));
                appliedAccountProperties.add(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY);
            }
            if (credentials.containsKey(AIAccountProperties.ACCOUNT_ID_PROPERTY)) {
                accountProperties.setStoredAccountId(credentials.get(AIAccountProperties.ACCOUNT_ID_PROPERTY));
                appliedAccountProperties.add(AIAccountProperties.ACCOUNT_ID_PROPERTY);
            }
            if (credentials.containsKey(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY)) {
                accountProperties.setStoredAccountEmail(credentials.get(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY));
                appliedAccountProperties.add(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY);
            }
            if (credentials.containsKey(AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY)) {
                accountProperties.setStoredExpiresAt(CommonUtils.toLong(
                    credentials.get(AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY)
                ));
                appliedAccountProperties.add(AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY);
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
        if (properties instanceof AIAccountProperties accountProperties) {
            if (accountProperties.isAccountAuthentication()) {
                credentialProperties.retainAll(AIAccountProperties.ACCOUNT_CREDENTIAL_PROPERTY_IDS);
            } else {
                credentialProperties.removeAll(AIAccountProperties.ACCOUNT_CREDENTIAL_PROPERTY_IDS);
            }
        }
        return credentialProperties;
    }

    @NotNull
    private static Set<String> getTokenCredentialPropertyIds(@NotNull AIEngineProperties properties) {
        Set<String> credentialProperties = getAllCredentialPropertyIds(properties);
        if (properties instanceof AIAccountProperties) {
            credentialProperties.removeAll(AIAccountProperties.ACCOUNT_CREDENTIAL_PROPERTY_IDS);
        }
        return credentialProperties;
    }

    @NotNull
    private static Set<String> getUserPropertyIds(@NotNull AIEngineProperties properties) {
        Set<String> credentialProperties = getAllCredentialPropertyIds(properties);
        if (properties instanceof AIAccountProperties) {
            credentialProperties.add(ACCOUNT_AUTHENTICATION_PROPERTY);
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
        boolean accountAuthentication,
        @NotNull Map<String, String> credentials
    ) {
        if (accountAuthentication) {
            return CommonUtils.isNotEmpty(credentials.get(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY));
        }
        return !credentials.isEmpty();
    }

    private static boolean isAccountProfile(@NotNull AIConfigurationProfile profile) throws DBException {
        return profile.getConfiguration() instanceof AIAccountProperties;
    }

    @NotNull
    public static AIAccountProperties getAccountProperties(@NotNull AIConfigurationProfile profile) throws DBException {
        if (!(profile.getConfiguration() instanceof AIAccountProperties properties)) {
            throw new DBWebException("AI profile does not support account authentication");
        }
        return properties;
    }

    @NotNull
    public static AIAccountProperties createAccountAuthenticationProperties(
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        AIEngineProperties source = profile.getConfiguration();
        AIEngineProperties copy = AISettingsManager.READ_PROPS_GSON.fromJson(
            AISettingsManager.READ_PROPS_GSON.toJson(source),
            source.getClass()
        );
        if (!(copy instanceof AIAccountProperties accountProperties)) {
            throw new DBWebException("AI profile does not support account authentication");
        }
        if (!accountProperties.supportsDeviceAuthorization()) {
            throw new DBWebException("AI profile does not support server-side device authorization");
        }
        accountProperties.clearAccountTokens();
        accountProperties.setAccountAuthentication(true);
        return accountProperties;
    }

    @NotNull
    private static AIAccountProperties getAccountCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String userId
    ) throws DBException {
        String attribute = getAccountCredentialsAttribute(profile, userId);
        synchronized (webSession) {
            AIAccountProperties credentials = webSession.getAttribute(attribute);
            if (credentials == null) {
                AIEngineProperties sourceProperties = profile.getConfiguration();
                AIEngineProperties properties = AISettingsManager.READ_PROPS_GSON.fromJson(
                    AISettingsManager.READ_PROPS_GSON.toJson(sourceProperties),
                    sourceProperties.getClass()
                );
                if (!(properties instanceof AIAccountProperties accountProperties)) {
                    throw new DBWebException("AI profile does not support account authentication");
                }
                accountProperties.clearAccountTokens();
                credentials = accountProperties;
                webSession.setAttribute(attribute, credentials);
            }
            return credentials;
        }
    }

    private static void updateCachedAccountCredentials(
        @Nullable AIAccountProperties credentials,
        @NotNull Map<String, Object> updates
    ) {
        if (credentials == null) {
            return;
        }
        synchronized (credentials) {
            if (updates.containsKey(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY)) {
                credentials.setAccessToken(CommonUtils.toString(
                    updates.get(AIAccountProperties.ACCOUNT_ACCESS_TOKEN_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY)) {
                credentials.setRefreshToken(CommonUtils.toString(
                    updates.get(AIAccountProperties.ACCOUNT_REFRESH_TOKEN_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(AIAccountProperties.ACCOUNT_ID_PROPERTY)) {
                credentials.setStoredAccountId(CommonUtils.toString(
                    updates.get(AIAccountProperties.ACCOUNT_ID_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY)) {
                credentials.setStoredAccountEmail(CommonUtils.toString(
                    updates.get(AIAccountProperties.ACCOUNT_EMAIL_PROPERTY),
                    null
                ));
            }
            if (updates.containsKey(AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY)) {
                credentials.setStoredExpiresAt(CommonUtils.toLong(
                    updates.get(AIAccountProperties.ACCOUNT_EXPIRES_AT_PROPERTY)
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

    private static boolean isAccountAuthentication(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId
    ) throws DBException {
        AIAccountProperties accountProperties = getAccountProperties(profile);
        if (!accountProperties.supportsDeviceAuthorization()) {
            return false;
        }
        String value = WebAIProfileCredentialStore.loadCredentials(
            webSession,
            profile,
            Set.of(ACCOUNT_AUTHENTICATION_PROPERTY),
            expectedUserId
        ).get(ACCOUNT_AUTHENTICATION_PROPERTY);
        return value == null ? accountProperties.isAccountAuthentication() : Boolean.parseBoolean(value);
    }

    record SessionCredentials(@NotNull Map<String, String> credentials) {
    }

}

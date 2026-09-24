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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebUserContext;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;
import org.jkiss.dbeaver.model.ai.AISettings;
import org.jkiss.dbeaver.model.ai.engine.openai.AIAccountAuthenticator;
import org.jkiss.dbeaver.model.ai.engine.openai.OpenAIConstants;
import org.jkiss.dbeaver.model.ai.engine.openai.OpenAIProperties;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretObject;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.InvocationTargetException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public class WebAIProfileUtilsTest {
    private final Map<String, String> secrets = new HashMap<>();
    private final Map<String, Object> sessionAttributes = new HashMap<>();
    private DBSSecretController secretController;
    private WebUser user;
    private WebSession webSession;
    private AIConfigurationProfile profile;
    private OpenAIProperties properties;
    private String credentialPropertyId;

    @BeforeEach
    public void setUp() throws DBException {
        secretController = Mockito.mock(DBSSecretController.class);
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(
            DBSSecretController.FEATURE_PRIVATE_SECRETS_VIEW | DBSSecretController.FEATURE_PRIVATE_SECRETS_EDIT
        );
        Mockito.when(secretController.getPrivateSecretValue(Mockito.anyString()))
            .thenAnswer(invocation -> secrets.get(invocation.getArgument(0, String.class)));
        Mockito.doAnswer(invocation -> {
            String id = invocation.getArgument(0, String.class);
            String value = invocation.getArgument(1, String.class);
            if (value == null) {
                secrets.remove(id);
            } else {
                secrets.put(id, value);
            }
            return null;
        }).when(secretController).setPrivateSecretValue(Mockito.anyString(), Mockito.nullable(String.class));
        Mockito.doAnswer(invocation -> {
            DBSSecretValue secret = invocation.getArgument(1, DBSSecretValue.class);
            secrets.put(secret.getId(), secret.getValue());
            return null;
        }).when(secretController).setPrivateSecretValue(
            Mockito.any(DBSSecretObject.class),
            Mockito.any(DBSSecretValue.class)
        );
        Mockito.doAnswer(invocation -> {
            String subjectId = invocation.getArgument(0, String.class);
            DBSSecretValue secret = invocation.getArgument(2, DBSSecretValue.class);
            Assertions.assertEquals("test-user", subjectId);
            if (secret.getValue() == null) {
                secrets.remove(secret.getId());
            } else {
                secrets.put(secret.getId(), secret.getValue());
            }
            return null;
        }).when(secretController).setSubjectSecretValue(
            Mockito.anyString(),
            Mockito.any(DBSSecretObject.class),
            Mockito.any(DBSSecretValue.class)
        );

        WebUserContext userContext = Mockito.mock(WebUserContext.class);
        Mockito.when(userContext.getSecretController()).thenReturn(secretController);
        user = Mockito.mock(WebUser.class);
        Mockito.when(user.isSecretStorage()).thenReturn(true);
        Mockito.when(userContext.getUser()).thenReturn(user);

        webSession = Mockito.mock(WebSession.class);
        Mockito.when(webSession.getUserId()).thenReturn("test-user");
        Mockito.when(webSession.isAuthorizedInSecurityManager()).thenReturn(true);
        Mockito.when(webSession.getUserContext()).thenReturn(userContext);
        Mockito.when(webSession.getProgressMonitor()).thenReturn(Mockito.mock(DBRProgressMonitor.class));
        Mockito.when(webSession.getAttribute(Mockito.anyString()))
            .thenAnswer(invocation -> sessionAttributes.get(invocation.getArgument(0, String.class)));
        Mockito.doAnswer(invocation -> {
            sessionAttributes.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(webSession).setAttribute(Mockito.anyString(), Mockito.any());
        Mockito.doAnswer(invocation -> {
            sessionAttributes.remove(invocation.getArgument(0, String.class));
            return null;
        }).when(webSession).removeAttribute(Mockito.anyString());

        properties = new OpenAIProperties();
        properties.setGlobal(false);
        credentialPropertyId = "token";

        profile = Mockito.mock(AIConfigurationProfile.class);
        Mockito.when(profile.getProfileId()).thenReturn("test-profile");
        Mockito.when(profile.getProfileName()).thenReturn("Test profile");
        Mockito.when(profile.getEngineId()).thenReturn("openai");
        Mockito.when(profile.getConfiguration()).thenReturn(properties);
        Mockito.when(profile.isGlobal()).thenReturn(false);
    }

    @Test
    public void savesUpdatesAndClearsCredentials() throws DBException {
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "first"));
        Assertions.assertTrue(WebAIProfileUtils.areCredentialsSaved(webSession, profile));

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "updated"));
        Assertions.assertTrue(secrets.containsValue("updated"));
        Assertions.assertFalse(secrets.containsValue("first"));

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, ""));
        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
    }

    @Test
    public void rejectsNonCredentialProperties() {
        Assertions.assertThrows(
            DBException.class,
            () -> WebAIProfileUtils.saveCredentials(webSession, profile, Map.of("model", "invalid"))
        );
    }

    @Test
    public void removesCredentialsFromNonGlobalConfiguration() throws DBException {
        properties.setToken("global-token");

        WebAIProfileUtils.prepareGlobalProfile(webSession, profile);

        Assertions.assertNull(properties.getToken());
    }

    @Test
    public void storesCredentialsInSessionWithoutPrivateSecretStorage() throws DBException {
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(0L);

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "session-token"));

        Assertions.assertTrue(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
        Assertions.assertTrue(secrets.isEmpty());

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, ""));
        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
    }

    @Test
    public void usesSessionCredentialsAcrossProfileInstances() throws DBException {
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(0L);
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "session-token"));
        AIConfigurationProfile sameProfile = Mockito.mock(AIConfigurationProfile.class);
        String profileId = profile.getProfileId();
        Mockito.when(sameProfile.getProfileId()).thenReturn(profileId);
        Mockito.when(sameProfile.getConfiguration()).thenReturn(properties);
        Mockito.when(sameProfile.isGlobal()).thenReturn(false);

        Assertions.assertTrue(WebAIProfileUtils.areCredentialsSaved(webSession, sameProfile));
    }

    @Test
    public void fallsBackToSessionWhenSubjectSecretStorageIsDisabled() throws DBException {
        Mockito.when(user.isSecretStorage()).thenReturn(false);

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "session-token"));

        Assertions.assertTrue(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
        Assertions.assertTrue(secrets.isEmpty());
    }

    @Test
    public void createsEffectiveProfileWithoutMutatingSource() throws DBException {
        AIConfigurationProfile source = new AIConfigurationProfile();
        source.setProfileId("test-effective-profile");
        source.setProfileName("Effective profile test");
        source.setEngineId(OpenAIConstants.OPENAI_ENGINE);
        source.setGlobal(false);
        OpenAIProperties sourceProperties = new OpenAIProperties();
        sourceProperties.setGlobal(false);
        source.setConfiguration(sourceProperties);
        AISettings settings = Mockito.mock(AISettings.class);
        Mockito.when(settings.getConfigurationOrNull(source.getProfileId())).thenReturn(source);

        WebAIProfileUtils.saveCredentials(webSession, source, Map.of(credentialPropertyId, "effective-token"));

        AIConfigurationProfile effective = WebAIProfileUtils.getEffectiveProfile(webSession, source, settings);

        Assertions.assertNotSame(source, effective);
        Assertions.assertNotSame(sourceProperties, effective.getConfiguration());
        Assertions.assertEquals("effective-token", ((OpenAIProperties) effective.getConfiguration()).getToken());
        Assertions.assertNull(sourceProperties.getToken());
    }

    @Test
    public void clearsPersistentCredentialsWhenSwitchingToSessionStorage() throws DBException {
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "persistent-token"));
        Mockito.when(user.isSecretStorage()).thenReturn(false);

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "session-token"));

        Assertions.assertTrue(secrets.isEmpty());
        Assertions.assertTrue(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
    }

    @Test
    public void clearsSessionCredentialsWhenSwitchingToPersistentStorage() throws DBException {
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(0L);
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "session-token"));
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(
            DBSSecretController.FEATURE_PRIVATE_SECRETS_VIEW | DBSSecretController.FEATURE_PRIVATE_SECRETS_EDIT
        );

        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "persistent-token"));
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(0L);

        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
    }

    @Test
    public void deletesCredentialsAfterProfileBecomesGlobal() throws DBException {
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "api-token"));
        Mockito.when(profile.isGlobal()).thenReturn(true);

        WebAIProfileUtils.deleteCredentials(webSession, profile);

        Assertions.assertTrue(secrets.isEmpty());
    }

    @Test
    public void savesAppliesAndRefreshesAccountCredentials() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        String accessToken = tokenWithClaims("{\"exp\":1,\"chatgpt_account_id\":\"account-1\",\"email\":\"user@example.com\"}");
        WebAIProfileUtils.saveAccountCredentials(
            webSession,
            profile,
            new AIAccountAuthenticator.Tokens(accessToken, "refresh-1", -1, "account-1", "user@example.com")
        );

        Assertions.assertTrue(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
        Assertions.assertEquals(accessToken, secrets.get("ai.profile.test-profile.accessToken"));
        Assertions.assertEquals("refresh-1", secrets.get("ai.profile.test-profile.refreshToken"));

        AISettings settings = Mockito.mock(AISettings.class);
        Mockito.when(settings.getConfigurationOrNull(profile.getProfileId())).thenReturn(profile);
        AIConfigurationProfile effectiveProfile = WebAIProfileUtils.getEffectiveProfile(webSession, profile, settings);
        OpenAIProperties effectiveProperties = (OpenAIProperties) effectiveProfile.getConfiguration();
        Assertions.assertTrue(effectiveProperties.isAccountConnected());
        Assertions.assertEquals("account-1", effectiveProperties.getAccountId());
        Assertions.assertEquals("user@example.com", effectiveProperties.getAccountEmail());

        String refreshedAccessToken = tokenWithClaims("{\"exp\":4102444800,\"chatgpt_account_id\":\"account-1\"}");
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Mockito.when(authenticator.refresh("refresh-1")).thenReturn(
            new AIAccountAuthenticator.Tokens(refreshedAccessToken, "refresh-2", 3600, "account-1", null)
        );

        Assertions.assertEquals(refreshedAccessToken, effectiveProperties.getValidAccessToken(authenticator));
        Assertions.assertEquals(refreshedAccessToken, secrets.get("ai.profile.test-profile.accessToken"));
        Assertions.assertEquals("refresh-2", secrets.get("ai.profile.test-profile.refreshToken"));
        Assertions.assertEquals("user@example.com", secrets.get("ai.profile.test-profile.accountEmail"));
    }

    @Test
    public void accountProfileIgnoresSavedApiToken() throws DBException {
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "api-token"));
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);

        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
    }

    @Test
    public void disconnectRemovesOnlyAccountCredentials() throws DBException {
        WebAIProfileUtils.saveCredentials(webSession, profile, Map.of(credentialPropertyId, "api-token"));
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        WebAIProfileUtils.saveAccountCredentials(
            webSession,
            profile,
            new AIAccountAuthenticator.Tokens("access", "refresh", 3600, null, null)
        );

        WebAIProfileUtils.deleteAccountCredentials(webSession, profile);

        Assertions.assertEquals("api-token", secrets.get("ai.profile.test-profile.token"));
        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
    }

    @Test
    public void deviceAuthorizationProcessorStoresReturnedTokens() throws Exception {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        AIAccountAuthenticator.DeviceAuthorization authorization = new AIAccountAuthenticator.DeviceAuthorization(
            "device-code",
            "user-code",
            URI.create("https://auth.openai.com/codex/device"),
            5,
            900
        );
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Mockito.when(authenticator.completeDeviceAuthorization(Mockito.eq(authorization), Mockito.any())).thenReturn(
            new AIAccountAuthenticator.Tokens("access", "refresh", 3600, null, null)
        );
        WebAIDeviceAuthorizationProcessor processor = new WebAIDeviceAuthorizationProcessor(
            webSession,
            profile,
            authenticator,
            authorization,
            "task-id"
        );
        WebAIProfileUtils.registerDeviceAuthorizationAttempt(webSession, profile, "test-user", "task-id");

        processor.run(webSession.getProgressMonitor());

        Assertions.assertTrue(processor.getResult());
        Assertions.assertEquals("access", secrets.get("ai.profile.test-profile.accessToken"));
        Assertions.assertEquals("refresh", secrets.get("ai.profile.test-profile.refreshToken"));
    }

    @Test
    public void deviceAuthorizationProcessorRejectsStaleAttempt() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        AIAccountAuthenticator.DeviceAuthorization authorization = new AIAccountAuthenticator.DeviceAuthorization(
            "device-code",
            "user-code",
            URI.create("https://auth.openai.com/codex/device"),
            5,
            900
        );
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        WebAIDeviceAuthorizationProcessor processor = new WebAIDeviceAuthorizationProcessor(
            webSession,
            profile,
            authenticator,
            authorization,
            "old-task"
        );
        WebAIProfileUtils.registerDeviceAuthorizationAttempt(webSession, profile, "test-user", "new-task");

        Assertions.assertThrows(
            InvocationTargetException.class,
            () -> processor.run(webSession.getProgressMonitor())
        );
        Mockito.verifyNoInteractions(authenticator);
        Assertions.assertTrue(secrets.isEmpty());
        WebAIProfileUtils.cancelDeviceAuthorizationAttempt(webSession, profile, "test-user");
    }

    @Test
    public void deviceAuthorizationProcessorDoesNotWriteAfterUserChanges() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        Mockito.when(secretController.getSupportedFeatures()).thenReturn(0L);
        AtomicReference<String> activeUserId = new AtomicReference<>("test-user");
        Mockito.when(webSession.getUserId()).thenAnswer(invocation -> activeUserId.get());
        AIAccountAuthenticator.DeviceAuthorization authorization = new AIAccountAuthenticator.DeviceAuthorization(
            "device-code",
            "user-code",
            URI.create("https://auth.openai.com/codex/device"),
            5,
            900
        );
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Mockito.when(authenticator.completeDeviceAuthorization(Mockito.eq(authorization), Mockito.any())).thenAnswer(invocation -> {
            activeUserId.set("other-user");
            return new AIAccountAuthenticator.Tokens("access", "refresh", 3600, null, null);
        });
        WebAIDeviceAuthorizationProcessor processor = new WebAIDeviceAuthorizationProcessor(
            webSession,
            profile,
            authenticator,
            authorization,
            "task-id"
        );
        WebAIProfileUtils.registerDeviceAuthorizationAttempt(webSession, profile, "test-user", "task-id");

        Assertions.assertThrows(
            InvocationTargetException.class,
            () -> processor.run(webSession.getProgressMonitor())
        );
        Assertions.assertTrue(secrets.isEmpty());
        Assertions.assertTrue(sessionAttributes.keySet().stream().noneMatch(key -> key.contains("other-user")));
    }

    @Test
    public void deviceAuthorizationProcessorDoesNotRestoreCredentialsAfterDisconnect() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        AIAccountAuthenticator.DeviceAuthorization authorization = new AIAccountAuthenticator.DeviceAuthorization(
            "device-code",
            "user-code",
            URI.create("https://auth.openai.com/codex/device"),
            5,
            900
        );
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Mockito.when(authenticator.completeDeviceAuthorization(Mockito.eq(authorization), Mockito.any())).thenAnswer(invocation -> {
            WebAIProfileUtils.deleteAccountCredentials(webSession, profile);
            return new AIAccountAuthenticator.Tokens("stale-access", "stale-refresh", 3600, null, null);
        });
        WebAIDeviceAuthorizationProcessor processor = new WebAIDeviceAuthorizationProcessor(
            webSession,
            profile,
            authenticator,
            authorization,
            "task-id"
        );
        WebAIProfileUtils.registerDeviceAuthorizationAttempt(webSession, profile, "test-user", "task-id");

        Assertions.assertThrows(
            InvocationTargetException.class,
            () -> processor.run(webSession.getProgressMonitor())
        );
        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
        Assertions.assertFalse(secrets.containsValue("stale-refresh"));
    }

    @Test
    public void staleEffectiveProfileCannotUseReplacedAccountCredentials() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        String firstAccessToken = tokenWithClaims("{\"exp\":4102444800,\"chatgpt_account_id\":\"account-1\"}");
        WebAIProfileUtils.saveAccountCredentials(
            webSession,
            profile,
            new AIAccountAuthenticator.Tokens(firstAccessToken, "refresh-1", 3600, "account-1", null)
        );
        AISettings settings = Mockito.mock(AISettings.class);
        Mockito.when(settings.getConfigurationOrNull(profile.getProfileId())).thenReturn(profile);
        OpenAIProperties staleProperties = (OpenAIProperties) WebAIProfileUtils
            .getEffectiveProfile(webSession, profile, settings)
            .getConfiguration();

        secrets.put("ai.profile.test-profile.refreshToken", "refresh-2");
        secrets.put("ai.profile.test-profile.accessToken", "access-2");

        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Assertions.assertThrows(DBException.class, () -> staleProperties.getValidAccessToken(authenticator));
        Mockito.verifyNoInteractions(authenticator);
    }

    @Test
    public void effectiveProfileCannotUseCredentialsAfterProfileDeletion() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        String accessToken = tokenWithClaims("{\"exp\":4102444800,\"chatgpt_account_id\":\"account-1\"}");
        WebAIProfileUtils.saveAccountCredentials(
            webSession,
            profile,
            new AIAccountAuthenticator.Tokens(accessToken, "refresh-1", 3600, "account-1", null)
        );
        AISettings settings = Mockito.mock(AISettings.class);
        Mockito.when(settings.getConfigurationOrNull(profile.getProfileId())).thenReturn(profile);
        OpenAIProperties effectiveProperties = (OpenAIProperties) WebAIProfileUtils
            .getEffectiveProfile(webSession, profile, settings)
            .getConfiguration();
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);

        WebAIProfileUtils.invalidateAccountProfile(webSession, profile);
        try {
            Assertions.assertThrows(DBException.class, () -> effectiveProperties.getValidAccessToken(authenticator));
            Mockito.verifyNoInteractions(authenticator);
        } finally {
            WebAIProfileUtils.restoreAccountProfile(profile);
        }
    }

    @Test
    public void refreshDoesNotRestoreCredentialsAfterDisconnect() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        WebAIProfileUtils.saveAccountCredentials(
            webSession,
            profile,
            new AIAccountAuthenticator.Tokens("expired-access", "refresh-1", -1, null, null)
        );
        AISettings settings = Mockito.mock(AISettings.class);
        Mockito.when(settings.getConfigurationOrNull(profile.getProfileId())).thenReturn(profile);
        OpenAIProperties effectiveProperties = (OpenAIProperties) WebAIProfileUtils
            .getEffectiveProfile(webSession, profile, settings)
            .getConfiguration();
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Mockito.when(authenticator.refresh("refresh-1")).thenAnswer(invocation -> {
            WebAIProfileUtils.deleteAccountCredentials(webSession, profile);
            return new AIAccountAuthenticator.Tokens("stale-access", "stale-refresh", 3600, null, null);
        });

        Assertions.assertThrows(DBException.class, () -> effectiveProperties.getValidAccessToken(authenticator));
        Assertions.assertFalse(WebAIProfileUtils.areCredentialsSaved(webSession, profile));
        Assertions.assertFalse(secrets.containsValue("stale-refresh"));
    }

    @Test
    public void serializesRefreshAcrossSessions() throws Exception {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        WebAIProfileUtils.saveAccountCredentials(
            webSession,
            profile,
            new AIAccountAuthenticator.Tokens("expired-access", "refresh-1", -1, null, null)
        );
        AISettings settings = Mockito.mock(AISettings.class);
        Mockito.when(settings.getConfigurationOrNull(profile.getProfileId())).thenReturn(profile);
        OpenAIProperties firstProperties = (OpenAIProperties) WebAIProfileUtils
            .getEffectiveProfile(webSession, profile, settings)
            .getConfiguration();

        Map<String, Object> secondSessionAttributes = new HashMap<>();
        WebSession secondSession = Mockito.mock(WebSession.class);
        WebUserContext sharedUserContext = webSession.getUserContext();
        Mockito.when(secondSession.getUserId()).thenReturn("test-user");
        Mockito.when(secondSession.isAuthorizedInSecurityManager()).thenReturn(true);
        Mockito.when(secondSession.getUserContext()).thenReturn(sharedUserContext);
        Mockito.when(secondSession.getProgressMonitor()).thenReturn(Mockito.mock(DBRProgressMonitor.class));
        Mockito.when(secondSession.getAttribute(Mockito.anyString()))
            .thenAnswer(invocation -> secondSessionAttributes.get(invocation.getArgument(0, String.class)));
        Mockito.doAnswer(invocation -> {
            secondSessionAttributes.put(invocation.getArgument(0, String.class), invocation.getArgument(1));
            return null;
        }).when(secondSession).setAttribute(Mockito.anyString(), Mockito.any());
        OpenAIProperties secondProperties = (OpenAIProperties) WebAIProfileUtils
            .getEffectiveProfile(secondSession, profile, settings)
            .getConfiguration();

        CountDownLatch refreshStarted = new CountDownLatch(1);
        CountDownLatch releaseRefresh = new CountDownLatch(1);
        CountDownLatch secondCallStarted = new CountDownLatch(1);
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        Mockito.when(authenticator.refresh("refresh-1")).thenAnswer(invocation -> {
            refreshStarted.countDown();
            Assertions.assertTrue(releaseRefresh.await(5, TimeUnit.SECONDS));
            return new AIAccountAuthenticator.Tokens("access-2", "refresh-2", 3600, null, null);
        });
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<String> firstResult = executor.submit(() -> firstProperties.getValidAccessToken(authenticator));
            Assertions.assertTrue(refreshStarted.await(5, TimeUnit.SECONDS));
            Future<String> secondResult = executor.submit(() -> {
                secondCallStarted.countDown();
                return secondProperties.getValidAccessToken(authenticator);
            });
            Assertions.assertTrue(secondCallStarted.await(5, TimeUnit.SECONDS));
            releaseRefresh.countDown();

            Assertions.assertEquals("access-2", firstResult.get(5, TimeUnit.SECONDS));
            Assertions.assertThrows(ExecutionException.class, () -> secondResult.get(5, TimeUnit.SECONDS));
            Mockito.verify(authenticator).refresh("refresh-1");
        } finally {
            releaseRefresh.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    public void profileInvalidationCancelsAttemptsForAllUsers() throws DBException {
        properties.setAuthentication(OpenAIProperties.AUTHENTICATION_CHATGPT_ACCOUNT);
        WebSession otherSession = Mockito.mock(WebSession.class);
        Mockito.when(otherSession.getUserId()).thenReturn("other-user");
        Mockito.when(otherSession.isAuthorizedInSecurityManager()).thenReturn(true);
        Mockito.when(otherSession.getProgressMonitor()).thenReturn(Mockito.mock(DBRProgressMonitor.class));
        AIAccountAuthenticator.DeviceAuthorization authorization = new AIAccountAuthenticator.DeviceAuthorization(
            "device-code",
            "user-code",
            URI.create("https://auth.openai.com/codex/device"),
            5,
            900
        );
        AIAccountAuthenticator authenticator = Mockito.mock(AIAccountAuthenticator.class);
        WebAIDeviceAuthorizationProcessor processor = new WebAIDeviceAuthorizationProcessor(
            otherSession,
            profile,
            authenticator,
            authorization,
            "other-task"
        );
        WebAIProfileUtils.registerDeviceAuthorizationAttempt(otherSession, profile, "other-user", "other-task");

        WebAIProfileUtils.invalidateAccountProfile(webSession, profile);
        try {
            Assertions.assertThrows(
                InvocationTargetException.class,
                () -> processor.run(otherSession.getProgressMonitor())
            );
            Mockito.verifyNoInteractions(authenticator);
        } finally {
            WebAIProfileUtils.restoreAccountProfile(profile);
        }
    }

    private static String tokenWithClaims(String claims) {
        return "header."
            + Base64.getUrlEncoder().withoutPadding().encodeToString(claims.getBytes(StandardCharsets.UTF_8))
            + ".signature";
    }
}

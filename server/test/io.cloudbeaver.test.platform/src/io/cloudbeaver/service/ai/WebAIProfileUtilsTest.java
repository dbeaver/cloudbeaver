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

import java.util.HashMap;
import java.util.Map;

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
}

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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.ai.AIConfigurationProfile;
import org.jkiss.dbeaver.model.ai.engine.AIEngineProperties;
import org.jkiss.dbeaver.model.ai.registry.AISettingsManager;
import org.jkiss.dbeaver.model.auth.AuthProperty;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretObject;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.runtime.properties.ObjectAttributeDescriptor;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertySourceEditable;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public final class WebAIProfileCredentials {
    private static final String SECRET_ID_PREFIX = "ai.profile.";
    private static final String SECRET_OBJECT_TYPE = "aiProfile";
    private static final String SESSION_CREDENTIALS_ATTRIBUTE_PREFIX = "ai.profile.credentials.";

    private WebAIProfileCredentials() {
    }

    public static boolean areCredentialsSaved(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        if (profile.isGlobal() || webSession.getUserId() == null || !webSession.isAuthorizedInSecurityManager()) {
            return false;
        }
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Set<String> credentialProperties = getCredentialPropertyIds(profile.getConfiguration());
        Map<String, String> storedCredentials = isPersistentStorageAvailable(secretController)
            ? getStoredCredentials(secretController, profile, credentialProperties)
            : getSessionCredentials(webSession, profile, false);
        return !storedCredentials.isEmpty();
    }

    public static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> credentials
    ) throws DBException {
        validateUserProfile(webSession, profile);
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Set<String> credentialProperties = getCredentialPropertyIds(profile.getConfiguration());
        if (!isPersistentStorageAvailable(secretController)) {
            Map<String, String> sessionCredentials = getSessionCredentials(webSession, profile, true);
            updateCredentials(sessionCredentials, credentialProperties, credentials);
            return;
        }
        validateCredentialProperties(credentialProperties, credentials.keySet());
        for (Map.Entry<String, Object> credential : credentials.entrySet()) {
            String value = credential.getValue() == null ? null : credential.getValue().toString();
            String secretId = getSecretId(profile, credential.getKey());
            if (CommonUtils.isEmpty(value)) {
                secretController.setPrivateSecretValue(secretId, null);
            } else {
                secretController.setPrivateSecretValue(
                    getSecretObject(profile),
                    new DBSSecretValue(secretId, profile.getProfileName() + ": " + credential.getKey(), value)
                );
            }
        }
    }

    @NotNull
    public static AIConfigurationProfile getEffectiveProfile(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile
    ) throws DBException {
        AIConfigurationProfile source = AISettingsManager.getStaticSettings()
            .getConfigurationOrNull(profile.getProfileId());
        if (source == null) {
            throw new DBWebException("AI profile does not exist");
        }
        if (source.isGlobal()) {
            return source;
        }

        validateUserProfile(webSession, source);
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Map<String, String> credentials = isPersistentStorageAvailable(secretController)
            ? getStoredCredentials(secretController, source, getCredentialPropertyIds(source.getConfiguration()))
            : getSessionCredentials(webSession, source, false);
        if (credentials.isEmpty()) {
            throw new DBWebException("AI profile credentials are not configured");
        }

        AIEngineProperties sourceProperties = source.getConfiguration();
        AIEngineProperties effectiveProperties = AISettingsManager.READ_PROPS_GSON.fromJson(
            AISettingsManager.READ_PROPS_GSON.toJson(sourceProperties),
            sourceProperties.getClass()
        );
        applyCredentials(webSession, effectiveProperties, credentials);

        AIConfigurationProfile effectiveProfile = new AIConfigurationProfile();
        effectiveProfile.setProfileId(source.getProfileId());
        effectiveProfile.setProfileName(source.getProfileName());
        effectiveProfile.setEngineId(source.getEngineId());
        effectiveProfile.setConfiguration(effectiveProperties);
        effectiveProfile.setGlobal(false);
        return effectiveProfile;
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
        getCredentialPropertyIds(properties).forEach(property -> emptyCredentials.put(property, null));
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
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        if (isPersistentStorageAvailable(secretController)) {
            secretController.deleteObjectSecrets(getSecretObject(profile));
        } else {
            webSession.removeAttribute(getSessionCredentialsAttribute(profile));
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

    private static boolean isPersistentStorageAvailable(@NotNull DBSSecretController secretController) throws DBException {
        long features = secretController.getSupportedFeatures();
        return (features & DBSSecretController.FEATURE_PRIVATE_SECRETS_VIEW) != 0 &&
            (features & DBSSecretController.FEATURE_PRIVATE_SECRETS_EDIT) != 0;
    }

    @NotNull
    private static Map<String, String> getSessionCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        boolean create
    ) {
        String attribute = getSessionCredentialsAttribute(profile);
        synchronized (webSession) {
            SessionCredentials sessionCredentials = webSession.getAttribute(attribute);
            if (sessionCredentials != null && sessionCredentials.profile() == profile) {
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
            SessionCredentials newCredentials = new SessionCredentials(profile, new HashMap<>());
            webSession.setAttribute(attribute, newCredentials);
            return newCredentials.credentials();
        }
    }

    @NotNull
    private static String getSessionCredentialsAttribute(@NotNull AIConfigurationProfile profile) {
        return SESSION_CREDENTIALS_ATTRIBUTE_PREFIX + profile.getProfileId();
    }

    private static void applyCredentials(
        @NotNull WebSession webSession,
        @NotNull AIEngineProperties properties,
        @NotNull Map<String, String> credentials
    ) throws DBException {
        PropertySourceEditable propertySource = createPropertySource(properties);
        for (Map.Entry<String, String> credential : credentials.entrySet()) {
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
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, String> credentials
    ) {
    }
}

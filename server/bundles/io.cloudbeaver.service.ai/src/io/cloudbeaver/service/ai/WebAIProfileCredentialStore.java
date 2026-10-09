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
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretObject;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

final class WebAIProfileCredentialStore {
    private static final String SECRET_ID_PREFIX = "ai.profile.";
    private static final String SECRET_OBJECT_TYPE = "aiProfile";
    private static final String SESSION_CREDENTIALS_ATTRIBUTE_PREFIX = "ai.profile.credentials.";

    private WebAIProfileCredentialStore() {
    }

    @NotNull
    static Map<String, String> loadCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Set<String> credentialProperties,
        @NotNull String expectedUserId
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        Map<String, String> credentials;
        if (isPersistentStorageAvailable(webSession, secretController)) {
            credentials = loadPersistentCredentials(secretController, profile, credentialProperties);
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

    static void saveCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull Set<String> credentialProperties,
        @NotNull Map<String, Object> credentials,
        @NotNull String expectedUserId
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        validateCredentialProperties(credentialProperties, credentials.keySet());
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        if (!isPersistentStorageAvailable(webSession, secretController)) {
            if (isPersistentStorageSupported(secretController)) {
                clearPersistentCredentials(secretController, profile, credentialProperties, expectedUserId);
            }
            updateCredentials(
                getSessionCredentials(webSession, profile, expectedUserId, true),
                credentials
            );
            validateExpectedUser(webSession, expectedUserId);
            return;
        }
        for (Map.Entry<String, Object> credential : credentials.entrySet()) {
            String value = credential.getValue() == null ? null : credential.getValue().toString();
            secretController.setSubjectSecretValue(
                expectedUserId,
                getSecretObject(profile),
                new DBSSecretValue(
                    expectedUserId,
                    getSecretId(profile, credential.getKey()),
                    profile.getProfileName() + ": " + credential.getKey(),
                    CommonUtils.isEmpty(value) ? null : value
                )
            );
        }
        removeSessionCredentials(webSession, profile, expectedUserId);
        validateExpectedUser(webSession, expectedUserId);
    }

    static void removeSessionCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String userId
    ) {
        webSession.removeAttribute(getSessionCredentialsAttribute(profile, userId));
    }

    static void deletePersistentCredentials(
        @NotNull WebSession webSession,
        @NotNull AIConfigurationProfile profile,
        @NotNull String expectedUserId
    ) throws DBException {
        validateExpectedUser(webSession, expectedUserId);
        DBSSecretController secretController = webSession.getUserContext().getSecretController();
        validateExpectedUser(webSession, expectedUserId);
        if (isPersistentStorageSupported(secretController)) {
            secretController.deleteObjectSecrets(getSecretObject(profile));
        }
        validateExpectedUser(webSession, expectedUserId);
    }

    private static void updateCredentials(
        @NotNull Map<String, String> target,
        @NotNull Map<String, Object> updates
    ) {
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

    private static boolean isPersistentStorageSupported(
        @NotNull DBSSecretController secretController
    ) throws DBException {
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
            Object storedCredentials = webSession.getAttribute(attribute);
            if (storedCredentials instanceof WebAIProfileUtils.SessionCredentials sessionCredentials) {
                if (create) {
                    return sessionCredentials.credentials();
                }
                synchronized (sessionCredentials.credentials()) {
                    return Map.copyOf(sessionCredentials.credentials());
                }
            }
            if (storedCredentials != null) {
                webSession.removeAttribute(attribute);
            }
            if (!create) {
                return Map.of();
            }
            WebAIProfileUtils.SessionCredentials newCredentials =
                new WebAIProfileUtils.SessionCredentials(new HashMap<>());
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

    @NotNull
    private static Map<String, String> loadPersistentCredentials(
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

    private static void validateExpectedUser(
        @NotNull WebSession webSession,
        @NotNull String expectedUserId
    ) throws DBWebException {
        if (!expectedUserId.equals(webSession.getUserId())) {
            throw new DBWebException("AI account authorization session has changed");
        }
    }

    @NotNull
    private static String getSecretId(@NotNull AIConfigurationProfile profile, @NotNull String propertyId) {
        return SECRET_ID_PREFIX + profile.getProfileId() + "." + propertyId;
    }

    @NotNull
    private static DBSSecretObject getSecretObject(@NotNull AIConfigurationProfile profile) {
        return new AIProfileSecretObject(profile.getProfileId());
    }

    private record AIProfileSecretObject(@NotNull String secretObjectId) implements DBSSecretObject {
        @NotNull
        @Override
        public String getProjectId() {
            return "";
        }

        @NotNull
        @Override
        public String getSecretObjectId() {
            return secretObjectId;
        }

        @NotNull
        @Override
        public String getSecretObjectType() {
            return SECRET_OBJECT_TYPE;
        }
    }
}

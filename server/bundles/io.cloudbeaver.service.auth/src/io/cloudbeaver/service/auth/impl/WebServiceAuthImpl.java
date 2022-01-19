/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.service.auth.impl;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWSecurityController;
import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.DBAAuthProviderExternal;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebAuthProviderInfo;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebUserProfileRegistry;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.auth.DBWServiceAuth;
import io.cloudbeaver.service.auth.WebUserInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.DBAAuthProvider;
import org.jkiss.dbeaver.model.auth.DBASession;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceAuthImpl implements DBWServiceAuth {

    private static final Log log = Log.getLog(WebServiceAuthImpl.class);

    @Override
    public WebAuthInfo authLogin(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @NotNull Map<String, Object> authParameters,
        boolean linkWithActiveUser) throws DBWebException {
        DBWSecurityController securityController = CBPlatform.getInstance().getApplication().getSecurityController();

        if (CommonUtils.isEmpty(providerId)) {
            throw new DBWebException("Missing auth provider parameter");
        }
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }

        boolean configMode = CBApplication.getInstance().isConfigurationMode();

        // Check enabled auth providers
        boolean providerEnabled = true;
        CBAppConfig appConfiguration = CBApplication.getInstance().getAppConfiguration();
        String[] enabledAuthProviders = appConfiguration.getEnabledAuthProviders();
        if (enabledAuthProviders != null && !ArrayUtils.contains(enabledAuthProviders, providerId)) {
            providerEnabled = false;
        } else {
            if (!ArrayUtils.isEmpty(authProvider.getRequiredFeatures())) {
                for (String rf : authProvider.getRequiredFeatures()) {
                    if (!appConfiguration.isFeatureEnabled(rf)) {
                        providerEnabled = false;
                        break;
                    }
                }
            }
        }
        try {
            Map<String, Object> providerConfig = Collections.emptyMap();
            DBAAuthProvider<?> authProviderInstance = authProvider.getInstance();
            DBAAuthProviderExternal<?> authProviderExternal = authProviderInstance instanceof DBAAuthProviderExternal<?> ?
                (DBAAuthProviderExternal<?>) authProviderInstance : null;
            Map<String, Object> userCredentials;

            if (authProviderExternal != null) {
                userCredentials = authProviderExternal.authExternalUser(webSession.getProgressMonitor(), providerConfig, authParameters);
            } else {
                // User credentials are the same as auth parameters
                userCredentials = authParameters;
            }

            if (configMode || webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
                // 1. Admin can authorize in any providers
                // 2. When it authorizes in non-local provider for the first time we force linkUser flag
                if (!providerEnabled && webSession.getUser() != null) {
                    linkWithActiveUser = true;
                }
            } else if (!providerEnabled) {
                if (!isAdminAuthTry(authProvider, userCredentials)) {
                    throw new DBWebException("Authentication provider '" + providerId + "' is disabled");
                }
            }

            WebUser user = null;
            String userId;
            DBASession authSession;
            if (configMode) {
                if (webSession.getUser() != null) {
                    // Already logged in - remove auth token
                    webSession.removeAuthInfo(providerId);
                }
                if (authProviderExternal != null) {
                    userId = authProviderExternal.validateLocalAuth(
                        webSession.getProgressMonitor(),
                        securityController,
                        providerConfig,
                        userCredentials,
                        webSession.getUser());
                } else {
                    userId = "temp_config_admin";
                }
            } else {
                WebUser curUser = webSession.getUser();
                userId = securityController.getUserByCredentials(authProvider, userCredentials);
                if (userId == null) {
                    // User doesn't exist. We can create new user automatically if auth provider supports this
                    if (authProviderExternal != null) {
                        userId = authProviderExternal.validateLocalAuth(
                            webSession.getProgressMonitor(),
                            securityController,
                            providerConfig,
                            userCredentials,
                            curUser);

                        if (curUser == null || !userId.equals(curUser.getUserId())) {
                            // Create new user
                            curUser = securityController.getUserById(userId);
                            if (curUser == null) {
                                curUser = new WebUser(userId);
                                securityController.createUser(curUser);

                                String defaultRoleName = CBPlatform.getInstance().getApplication().getAppConfiguration().getDefaultUserRole();
                                if (!CommonUtils.isEmpty(defaultRoleName)) {
                                    securityController.setUserRoles(
                                        userId,
                                        new String[]{defaultRoleName},
                                        userId);
                                }
                            }
                        }
                        // We may need to associate new credentials with active user
                        if (linkWithActiveUser) {
                            securityController.setUserCredentials(userId, authProvider, userCredentials);
                        }
                    }

                    if (userId == null) {
                        throw new DBCException("Invalid user credentials");
                    }
                }
                if (linkWithActiveUser && curUser != null && !curUser.getUserId().equals(userId)) {
                    log.debug("Attempt to authorize user '" + userId + "' while user '" + curUser.getUserId() + "' already authorized");
                    throw new DBCException("You cannot authorize with different users credentials");
                }

                user = curUser;
            }
            if (user == null) {
                user = new WebUser(userId);
            }

            DBWUserIdentity userIdentity = null;

            if (authProviderExternal != null) {
                try {
                    userIdentity =
                        authProviderExternal.getUserIdentity(
                            webSession.getProgressMonitor(),
                            providerConfig,
                            userCredentials);
                } catch (DBException e) {
                    log.debug("Error reading auth display name from provider " + providerId, e);
                }
            }
            if (userIdentity == null) {
                userIdentity = new DBWUserIdentity(userId, userId);
            }
            if (CommonUtils.isEmpty(user.getDisplayName())) {
                user.setDisplayName(userIdentity.getDisplayName());
            }

            authSession = authProviderInstance.openSession(
                webSession.getProgressMonitor(),
                webSession,
                providerConfig,
                userCredentials);

            WebAuthInfo authInfo = new WebAuthInfo(
                webSession,
                user,
                authProvider,
                userIdentity,
                authSession,
                OffsetDateTime.now());
            authInfo.setMessage("Authenticated with " + authProvider.getLabel() + " provider");
            if (configMode) {
                authInfo.setUserCredentials(userCredentials);
            }
            webSession.addAuthInfo(authInfo);

            return authInfo;
        } catch (DBException e) {
            throw new DBWebException("User authentication failed", e);
        }
    }

    private boolean isAdminAuthTry(@NotNull AuthProviderDescriptor authProvider, @NotNull Map<String, Object> userCredentials) {
        DBWSecurityController securityController = CBPlatform.getInstance().getApplication().getSecurityController();
        boolean isAdmin = false;

        try {
            Object userId = securityController.getUserByCredentials(authProvider, userCredentials);

            if (userId != null) {
                    isAdmin = securityController
                        .getUserPermissions(CommonUtils.toString(userId))
                            .contains(DBWConstants.PERMISSION_ADMIN);
            }
        } catch (DBCException e) {
            log.error(e);
        }

        return isAdmin;
    }

    @Override
    public void authLogout(@NotNull WebSession webSession, @Nullable String providerId) throws DBWebException {
        if (webSession.getUser() == null) {
            throw new DBWebException("Not logged in");
        }
        webSession.removeAuthInfo(providerId);
    }

    @Override
    public WebAuthInfo tryFederatedLogin(@NotNull WebSession webSession, @NotNull String providerId) throws DBWebException {
        return null;
/*
        try {
            DBASession spaceSession = webSession.getSessionContext().getSpaceSession(webSession.getProgressMonitor(), webSession.getSessionSpace());
            if (spaceSession instanceof DBASessionFederated) {
                throw new DBCException("Federated session discover not implemented yet");
            } else {
                throw new DBCException("Federated session required");
            }
        } catch (DBException e) {
            throw new DBWebException("Error while discovering federated session", e);
        }
*/
    }

    @Override
    public WebUserInfo activeUser(@NotNull WebSession webSession) throws DBWebException {
        if (webSession.getUser() == null) {
            return null;
        }
        try {
            // Read user from security controller. It will also read meta parsameters
            WebUser userWithDetails = CBApplication.getInstance().getSecurityController().getUserById(webSession.getUser().getUserId());
            if (userWithDetails != null) {
                // USer not saved yet. This may happen in easy config mode
                return new WebUserInfo(webSession, userWithDetails);
            } else {
                return new WebUserInfo(webSession, webSession.getUser());
            }
        } catch (DBCException e) {
            throw new DBWebException("Error reading user details", e);
        }
    }

    @Override
    public WebAuthProviderInfo[] getAuthProviders() {
        return AuthProviderRegistry.getInstance().getAuthProviders()
            .stream().map(WebAuthProviderInfo::new)
            .toArray(WebAuthProviderInfo[]::new);
    }

    @Override
    public boolean changeLocalPassword(@NotNull WebSession webSession, @NotNull String oldPassword, @NotNull String newPassword) throws DBWebException {
        if (webSession.getUser() == null) {
            throw new DBWebException("User must be logged in");
        }
        try {
            return LocalAuthProvider.changeUserPassword(webSession, oldPassword, newPassword);
        } catch (DBException e) {
            throw new DBWebException("Error changing user password", e);
        }
    }

    @Override
    public WebPropertyInfo[] listUserProfileProperties(@NotNull WebSession webSession) {
        return WebUserProfileRegistry.getInstance().getProperties().stream()
            .map(p -> new WebPropertyInfo(webSession, p, null))
            .toArray(WebPropertyInfo[]::new);
    }

    @Override
    public boolean setUserConfigurationParameter(@NotNull WebSession webSession, @NotNull String name, @Nullable String value) throws DBWebException {
        try {
            CBApplication.getInstance().getSecurityController().setUserParameter(
                webSession.getUser().getUserId(),
                name,
                value);
            return true;
        } catch (DBCException e) {
            throw new DBWebException("Error setting user parameter", e);
        }
    }

}

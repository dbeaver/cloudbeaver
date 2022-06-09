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
import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebAuthProviderInfo;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebUserProfileRegistry;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.auth.DBWServiceAuth;
import io.cloudbeaver.service.auth.WebUserInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.dbeaver.model.security.user.SMUser;
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
    public static final String CONFIG_TEMP_ADMIN_USER_ID = "temp_config_admin";

    @Override
    public WebAuthInfo authLogin(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @NotNull Map<String, Object> authParameters,
        boolean linkWithActiveUser) throws DBWebException {
        SMController securityController = webSession.getSecurityController();

        if (CommonUtils.isEmpty(providerId)) {
            throw new DBWebException("Missing auth provider parameter");
        }
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }

        boolean configMode = CBApplication.getInstance().isConfigurationMode();

        // Check enabled auth providers
        boolean providerEnabled = isProviderEnabled(providerId, authProvider);
        boolean resetUserStateOnError = webSession.getUser() == null;

        try {
            Map<String, Object> providerConfig = Collections.emptyMap();
            SMAuthProvider<?> authProviderInstance = authProvider.getInstance();
            SMAuthProviderExternal<?> authProviderExternal = authProviderInstance instanceof SMAuthProviderExternal<?> ?
                (SMAuthProviderExternal<?>) authProviderInstance : null;
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
                if (!isAdminAuthTry(webSession, authProvider, userCredentials)) {
                    throw new DBWebException("Authentication provider '" + providerId + "' is disabled");
                }
            }

            WebUser user = null;
            String userId;
            SMSession authSession;
            if (configMode) {
                if (webSession.getUser() != null) {
                    // Already logged in - remove auth token
                    webSession.removeAuthInfo(providerId);
                    webSession.resetAuthToken();
                }
                if (authProviderExternal != null) {
                    userId = authProviderExternal.validateLocalAuth(
                        webSession.getProgressMonitor(),
                        securityController,
                        providerConfig,
                        userCredentials,
                        webSession.getUserId());
                } else {
                    userId = CONFIG_TEMP_ADMIN_USER_ID;
                }
            } else {
                WebUser curUser = webSession.getUser();
                if (curUser == null) {
                    try {
                        SMAuthInfo smAuthInfo = securityController.authenticate(webSession.getSessionId(), webSession.getSessionParameters(), WebSession.CB_SESSION_TYPE, authProvider.getId(), userCredentials);
                        userId = smAuthInfo.getUserInfo().getUserId();
                        if (userId == null) {
                            throw new SMException("Anonymous authentication restricted");
                        }
                        webSession.updateSMAuthInfo(smAuthInfo);
                        curUser = webSession.getUser();
                        securityController = webSession.getSecurityController();
                    } catch (SMException e) {
                        log.debug("Error during user authentication", e);
                        throw e;
                    }
                } else { // user already logged in
                    userId = curUser.getUserId();
                    if (authProviderExternal != null) {
                        // We may need to associate new credentials with active user
                        if (linkWithActiveUser) {
                            securityController.setUserCredentials(userId, authProvider.getId(), userCredentials);
                        }
                    }
                }

                if (linkWithActiveUser && curUser != null && !curUser.getUserId().equals(userId)) {
                    log.debug("Attempt to authorize user '" + userId + "' while user '" + curUser.getUserId() + "' already authorized");
                    throw new DBCException("You cannot authorize with different users credentials");
                }

                user = curUser;
            }
            if (user == null) {
                user = new WebUser(new SMUser(userId));
            }
            if (!configMode && !webSession.isAuthorizedInSecurityManager()) {
                throw new DBCException("No authorization in the security manager");
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

            if (!configMode && securityController.getUserPermissions(userId).isEmpty()) {
                throw new DBWebException("Access denied (no permissions)");
            }
            if (!configMode && !securityController.getUserById(userId).isEnabled()) {
                throw new DBWebException("User account is locked");
            }

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
            if (resetUserStateOnError) {
                webSession.resetUserState();
            }
            throw new DBWebException("User authentication failed", e);
        }
    }

    private boolean isProviderEnabled(@NotNull String providerId, AuthProviderDescriptor authProvider) {
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
        return providerEnabled;
    }

    private boolean isAdminAuthTry(@NotNull WebSession session, @NotNull AuthProviderDescriptor authProvider, @NotNull Map<String, Object> userCredentials) {
        SMController securityController = session.getSecurityController();
        boolean isAdmin = false;

        try {
            SMAuthInfo authInfo = securityController.authenticate(
                session.getSessionId(),
                session.getSessionParameters(),
                WebSession.CB_SESSION_TYPE,
                authProvider.getId(),
                userCredentials);

            isAdmin = authInfo.getUserInfo().getPermissions().contains(DBWConstants.PERMISSION_ADMIN);
        } catch (DBException e) {
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
    public WebUserInfo activeUser(@NotNull WebSession webSession) throws DBWebException {
        if (webSession.getUser() == null) {
            return null;
        }
        try {
            // Read user from security controller. It will also read meta parameters
            SMUser userWithDetails = webSession.getSecurityController().getUserById(webSession.getUser().getUserId());
            if (userWithDetails != null) {
                // USer not saved yet. This may happen in easy config mode
                var webUser = new WebUser(userWithDetails);
                webUser.setDisplayName(webSession.getUser().getDisplayName());
                return new WebUserInfo(webSession, webUser);
            } else {
                return new WebUserInfo(webSession, webSession.getUser());
            }
        } catch (DBException e) {
            throw new DBWebException("Error reading user details", e);
        }
    }

    @Override
    public WebAuthProviderInfo[] getAuthProviders() {
        return AuthProviderRegistry.getInstance().getAuthProviders()
            .stream().filter(f -> !f.isTrusted()).map(WebAuthProviderInfo::new)
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
            webSession.getSecurityController().setUserParameter(
                webSession.getUser().getUserId(),
                name,
                value);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error setting user parameter", e);
        }
    }

}

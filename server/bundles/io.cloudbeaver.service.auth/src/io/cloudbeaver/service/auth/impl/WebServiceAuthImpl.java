/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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

import io.cloudbeaver.*;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebAuthProviderInfo;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.auth.DBWServiceAuth;
import io.cloudbeaver.service.auth.WebUserInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.access.DBASession;
import org.jkiss.dbeaver.model.exec.DBCException;
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
        boolean configMode = CBApplication.getInstance().isConfigurationMode();

        // Check enabled auth providers
        boolean providerEnabled = true;
        String[] enabledAuthProviders = CBApplication.getInstance().getAppConfiguration().getEnabledAuthProviders();
        if (enabledAuthProviders != null && !ArrayUtils.contains(enabledAuthProviders, providerId)) {
            providerEnabled = false;
        }
        if (configMode || webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
            // 1. Admin can authorize in any providers
            // 2. When it authorizes in non-local provider for the first time we force linkUser flag
            if (!providerEnabled && webSession.getUser() != null) {
                linkWithActiveUser = true;
            }
        } else {
            if (!providerEnabled) {
                // Admin can use local provider anytime
                if (!isAdminAuthTry(providerId, authParameters)) {
                    throw new DBWebException("Authentication provider '" + providerId + "' is disabled");
                }
            }
        }
        WebAuthProviderDescriptor authProvider = WebServiceRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        try {
            Map<String, Object> providerConfig = Collections.emptyMap();

            DBWAuthProvider<?> authProviderInstance = authProvider.getInstance();
            DBWAuthProviderExternal<?> authProviderExternal = authProviderInstance instanceof DBWAuthProviderExternal<?> ?
                (DBWAuthProviderExternal<?>) authProviderInstance : null;
            Map<String, Object> userCredentials;
            if (authProviderExternal != null) {
                userCredentials = authProviderExternal.authExternalUser(webSession.getProgressMonitor(), providerConfig, authParameters);
            } else {
                // User credentials are the same as auth parameters
                userCredentials = authParameters;
            }

            WebUser user = null;
            String userId;
            DBASession authSession;
            if (configMode) {
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
                webSession,
                providerConfig,
                userCredentials
            );

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

    private boolean isAdminAuthTry(@NotNull String providerId, @NotNull Map<String, Object> authParameters) {
        boolean isAdmin = false;
        if (LocalAuthProvider.PROVIDER_ID.equals(providerId)) {
            Object userId = authParameters.get(LocalAuthProvider.CRED_USER);
            if (userId != null) {
                try {
                    isAdmin = CBPlatform.getInstance().getApplication().getSecurityController()
                        .getUserPermissions(CommonUtils.toString(userId))
                            .contains(DBWConstants.PERMISSION_ADMIN);
                } catch (DBCException e) {
                    log.error(e);
                }
            }
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
        return new WebUserInfo(webSession, webSession.getUser());
    }

    @Override
    public WebAuthProviderInfo[] getAuthProviders() {
        return WebServiceRegistry.getInstance().getAuthProviders()
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

}

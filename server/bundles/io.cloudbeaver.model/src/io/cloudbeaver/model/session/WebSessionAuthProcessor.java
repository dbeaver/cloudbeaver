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

package io.cloudbeaver.model.session;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.model.app.WebAuthConfiguration;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class WebSessionAuthProcessor {
    private static final Log log = Log.getLog(WebSessionAuthProcessor.class);
    @NotNull
    private final WebSession webSession;
    @NotNull
    private final SMAuthInfo smAuthInfo;

    private boolean linkWithActiveUser;

    public WebSessionAuthProcessor(@NotNull WebSession webSession, @NotNull SMAuthInfo smAuthInfo, boolean linkWithActiveUser) {
        this.webSession = webSession;
        this.smAuthInfo = smAuthInfo;
        this.linkWithActiveUser = linkWithActiveUser;
    }

    public List<WebAuthInfo> authenticateSession() throws DBException {
        boolean resetUserStateOnError = webSession.getUser() == null;
        try {
            var authStatus = smAuthInfo.getAuthStatus();

            switch (authStatus) {
                case SUCCESS:
                    return finishWebSessionAuthorization(smAuthInfo);
                case ERROR:
                    throw new DBException("Authentication failed: " + smAuthInfo.getError());
                case IN_PROGRESS:
                    throw new DBException("Authorization didn't complete");
                default:
                    throw new DBException("Unexpected authorization status: " + authStatus);
            }
        } catch (Exception e) {
            if (resetUserStateOnError) {
                webSession.resetUserState();
            }
            throw new DBException(e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<WebAuthInfo> finishWebSessionAuthorization(SMAuthInfo authInfo) throws DBException {
        boolean configMode = WebAppUtils.getWebApplication().isConfigurationMode();
        boolean resetUserStateOnError = webSession.getUser() == null;

        try {
            webSession.updateSMAuthInfo(authInfo);
            WebUser curUser = webSession.getUser();
            if (curUser == null) {
                //should never happen in theory since we should get the error much earlier
                throw new DBWebException("Missing user after authorization in security controller");
            }
            String userId = curUser.getUserId();

            var securityController = webSession.getSecurityController();
            Map<String, Object> providerConfig = Collections.emptyMap();
            var newAuthInfos = new ArrayList<WebAuthInfo>();
            for (Map.Entry<String, Object> entry : authInfo.getAuthData().entrySet()) {
                String providerId = entry.getKey();
                Map<String, Object> userCredentials = (Map<String, Object>) entry.getValue();

                var authProviderDescriptor = getAuthProvider(providerId);
                SMAuthProvider<?> authProviderInstance = authProviderDescriptor.getInstance();
                SMAuthProviderExternal<?> authProviderExternal = authProviderInstance instanceof SMAuthProviderExternal<?> ?
                    (SMAuthProviderExternal<?>) authProviderInstance : null;

                boolean providerEnabled = isProviderEnabled(providerId);
                if (configMode || webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
                    // 1. Admin can authorize in any providers
                    // 2. When it authorizes in non-local provider for the first time we force linkUser flag
                    if (!providerEnabled && webSession.getUser() != null) {
                        linkWithActiveUser = true;
                    }
                } else if (!providerEnabled && !webSession.hasPermission(DBWConstants.PERMISSION_ADMIN)) {
                    throw new DBWebException("Authentication provider '" + providerId + "' is disabled");
                }

                SMSession authSession;
                if (configMode) {
                    if (webSession.getUser() != null) {
                        // Already logged in - remove auth token
                        webSession.removeAuthInfo(providerId);
                        webSession.resetAuthToken();
                    }
                } else {
                    if (authProviderExternal != null) {
                        // We may need to associate new credentials with active user
                        if (linkWithActiveUser) {
                            securityController.setUserCredentials(userId, authProviderDescriptor.getId(), userCredentials);
                        }
                    }
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
                if (CommonUtils.isEmpty(curUser.getDisplayName())) {
                    curUser.setDisplayName(userIdentity.getDisplayName());
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

                WebAuthInfo webAuthInfo = new WebAuthInfo(
                    webSession,
                    curUser,
                    authProviderDescriptor,
                    userIdentity,
                    authSession,
                    OffsetDateTime.now());
                webAuthInfo.setMessage("Authenticated with " + authProviderDescriptor.getLabel() + " provider");
                if (configMode) {
                    webAuthInfo.setUserCredentials(userCredentials);
                }

                webSession.addAuthInfo(webAuthInfo);
                newAuthInfos.add(webAuthInfo);
            }
            return newAuthInfos;
        } catch (DBException e) {
            if (resetUserStateOnError) {
                webSession.resetUserState();
            }
            throw new DBWebException("User authentication failed", e);
        }
    }

    private AuthProviderDescriptor getAuthProvider(String providerId) throws DBWebException {
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        return authProvider;
    }

    private boolean isProviderEnabled(@NotNull String providerId) {
        WebAuthConfiguration appConfiguration = (WebAuthConfiguration) WebAppUtils.getWebApplication().getAppConfiguration();
        return appConfiguration.isAuthProviderEnabled(providerId);
    }
}

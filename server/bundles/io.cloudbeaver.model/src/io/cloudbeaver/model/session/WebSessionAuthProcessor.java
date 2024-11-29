/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.model.app.ServletAuthConfiguration;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthConfigurationReference;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.utils.CommonUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
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
                    var e = new DBException(smAuthInfo.getError());
                    webSession.addSessionError(e);
                    throw e;
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
        boolean configMode = ServletAppUtils.getServletApplication().isConfigurationMode();
        boolean alreadyLoggedIn = webSession.getUser() != null;
        boolean resetUserStateOnError = !alreadyLoggedIn;

        try {
            if (configMode && alreadyLoggedIn) {
                for (SMAuthConfigurationReference authConfiguration : authInfo.getAuthData().keySet()) {
                    webSession.removeAuthInfo(authConfiguration.getAuthProviderId());
                }
            }
            webSession.updateSMSession(authInfo);
            WebUser curUser = webSession.getUser();
            if (curUser == null) {
                //should never happen in theory since we should get the error much earlier
                throw new DBWebException("Missing user after authorization in security controller");
            }
            String userId = curUser.getUserId();

            var securityController = webSession.getSecurityController();
            var newAuthInfos = new ArrayList<WebAuthInfo>();
            for (Map.Entry<SMAuthConfigurationReference, Object> entry : authInfo.getAuthData().entrySet()) {
                SMAuthConfigurationReference authConfiguration = entry.getKey();
                String providerId = authConfiguration.getAuthProviderId();
                Map<String, Object> authAttrs = (Map<String, Object>) entry.getValue();

                var authProviderDescriptor = getAuthProvider(providerId);
                SMAuthProvider<?> authProviderInstance = authProviderDescriptor.getInstance();
                SMAuthProviderExternal<?> authProviderExternal = authProviderInstance instanceof SMAuthProviderExternal<?> ?
                    (SMAuthProviderExternal<?>) authProviderInstance : null;

                SMSession authSession;

                if (authProviderExternal != null && !configMode && !alreadyLoggedIn) {
                    // We may need to associate new credentials with active user
                    if (linkWithActiveUser) {
                        securityController.setCurrentUserCredentials(authProviderDescriptor.getId(), authAttrs);
                    }
                }

                if (!configMode && !webSession.isAuthorizedInSecurityManager()) {
                    throw new DBCException("No authorization in the security manager");
                }

                DBWUserIdentity userIdentity = null;
                var providerConfigId = authConfiguration.getAuthProviderConfigurationId();
                var providerConfig = ServletAppUtils.getAuthApplication()
                    .getAuthConfiguration()
                    .getAuthProviderConfiguration(providerConfigId);
                if (authProviderExternal != null) {
                    try {
                        userIdentity =
                            authProviderExternal.getUserIdentity(
                                webSession.getProgressMonitor(),
                                providerConfig,
                                authAttrs);
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
                    authAttrs);

                if (!configMode && !securityController.getCurrentUser().isEnabled()) {
                    throw new DBWebException("User account is locked");
                }

                WebAuthInfo webAuthInfo = new WebAuthInfo(
                    webSession,
                    curUser,
                    authProviderDescriptor,
                    userIdentity,
                    authSession,
                    authInfo,
                    OffsetDateTime.now()
                );
                webAuthInfo.setAuthProviderConfigurationId(authConfiguration.getAuthProviderConfigurationId());
                webAuthInfo.setMessage("Authenticated with " + authProviderDescriptor.getLabel() + " provider");
                if (configMode) {
                    webAuthInfo.setUserCredentials(authAttrs);
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

    private WebAuthProviderDescriptor getAuthProvider(String providerId) throws DBWebException {
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        return authProvider;
    }

    private boolean isProviderEnabled(@NotNull String providerId) {
        ServletAuthConfiguration appConfiguration = (ServletAuthConfiguration) ServletAppUtils.getServletApplication()
            .getAppConfiguration();
        return appConfiguration.isAuthProviderEnabled(providerId);
    }
}

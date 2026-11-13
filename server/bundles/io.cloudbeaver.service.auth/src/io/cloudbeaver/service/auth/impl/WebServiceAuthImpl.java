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
package io.cloudbeaver.service.auth.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.DBWebExceptionAccessDenied;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.SMSignOutLinkProvider;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.registry.WebMetaParametersRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.auth.*;
import io.cloudbeaver.service.auth.model.user.WebAuthProviderInfo;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.auth.SMSessionExternal;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.qm.QMConstants;
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.dbeaver.model.security.exception.SMTooManySessionsException;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceAuthImpl implements DBWServiceAuth {

    private static final Log log = Log.getLog(WebServiceAuthImpl.class);

    @Override
    @NotNull
    public WebAuthStatus authLogin(
        @NotNull HttpServletRequest httpRequest,
        @NotNull WebSession inputWebSession,
        @NotNull String providerId,
        @Nullable String providerConfigurationId,
        @Nullable Map<String, Object> authParameters,
        boolean linkWithActiveUser,
        boolean forceSessionsLogout
    ) throws DBWebException {
        try {
            WebAuthProviderDescriptor provider = WebAuthProviderRegistry.getInstance().getAuthProvider(providerId);
            if (provider != null && provider.isFederated()) {
                throw new DBWebException("Use federatedLogin for federated authentication");
            }
            WebSession webSession = inputWebSession;
            if (inputWebSession.getUser() == null) {
                // Rotate anonymous web sessions during login attempts to prevent session fixation attacks.
                webSession = CBApplication.getInstance().getSessionManager()
                    .rotateSession(httpRequest, inputWebSession);
            }

            var smAuthInfo = WebAuthUtils.initiateAuthentication(
                webSession, providerId, providerConfigurationId, authParameters, forceSessionsLogout
            );
            linkWithActiveUser = linkWithActiveUser && CBApplication.getInstance().getAppConfiguration()
                .isLinkExternalCredentialsWithUser();
            if (smAuthInfo.getAuthStatus() == SMAuthStatus.IN_PROGRESS) {
                throw new DBWebException("Use federatedLogin for asynchronous authentication");
            }
            var authProcessor = new WebSessionAuthProcessor(webSession, smAuthInfo, linkWithActiveUser);
            List<WebAuthInfo> authInfos = authProcessor.authenticateSession();
            return new WebAuthStatus(smAuthInfo.getAuthStatus(), authInfos);
        } catch (SMTooManySessionsException e) {
            throw new DBWebException("User authentication failed", e.getErrorType(), e);
        } catch (Exception e) {
            throw new DBWebException("User authentication failed", e);
        }
    }

    @Override
    @NotNull
    public WebAsyncAuthStatus federatedLogin(
        @NotNull HttpServletRequest httpRequest,
        @NotNull WebSession inputWebSession,
        @NotNull String providerId,
        @Nullable String providerConfigurationId,
        boolean linkWithActiveUser,
        boolean forceSessionsLogout
    ) throws DBWebException {
        return WebFederatedAuth.login(
            httpRequest, inputWebSession, providerId, providerConfigurationId, linkWithActiveUser, forceSessionsLogout
        );
    }

    @Override
    public WebAsyncAuthTaskResult federatedAuthTaskResult(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException {
        WebAsyncTaskInfo taskInfo = webSession.asyncTaskStatus(taskId, true);
        if (taskInfo == null) {
            throw new DBWebException("Task '" + taskId + "' not found");
        }
        if (taskInfo.isRunning()) {
            throw new DBWebException("Task '" + taskId + "' is running");
        }
        if (taskInfo.getJob() == null || !WebAsyncAuthJob.class.isAssignableFrom(taskInfo.getJob().getClass())) {
            throw new DBWebException("Task '" + taskId + "' is not async auth task");
        }
        WebAsyncAuthJob job = (WebAsyncAuthJob) taskInfo.getJob();
        List<WebAuthInfo> userTokens = job.getAuthResult();
        if (CommonUtils.isEmpty(userTokens)) {
            userTokens = List.of();
        }
        return new WebAsyncAuthTaskResult(userTokens);
    }

    @Override
    public WebLogoutInfo authLogout(
        @NotNull HttpServletRequest httpRequest,
        @NotNull WebSession webSession,
        @Nullable String providerId,
        @Nullable String configurationId
    ) throws DBWebException {
        if (webSession.getUser() == null) {
            throw new DBWebException("Not logged in");
        }
        try {
            List<WebAuthInfo> removedInfos = providerId != null && configurationId != null ?
                webSession.removeAuthInfo(providerId, configurationId) :
                webSession.removeAuthInfo(providerId);
            var cbApp = CBApplication.getInstance();

            List<WebLogoutLink> redirectLinks = new ArrayList<>();
            String origin = ServletAppUtils.getOriginFromRequest(httpRequest);
            for (WebAuthInfo removedInfo : removedInfos) {
                if (removedInfo.getAuthProviderDescriptor()
                    .getInstance() instanceof SMSignOutLinkProvider provider
                    && removedInfo.getAuthSession() != null
                ) {
                    var providerConfig =
                        cbApp.getAuthConfiguration().getAuthProviderConfiguration(removedInfo.getAuthConfiguration());
                    if (providerConfig == null) {
                        log.warn(removedInfo.getAuthConfiguration() + " provider configuration wasn't found");
                        continue;
                    }
                    String logoutUrl;

                    if (removedInfo.getAuthSession() instanceof SMSessionExternal externalSession) {
                        logoutUrl = provider.getUserSignOutLink(providerConfig,
                            externalSession.getAuthParameters(), origin
                        );
                    } else {
                        logoutUrl = provider.getUserSignOutLink(providerConfig,
                            Map.of(), origin
                        );
                    }
                    if (CommonUtils.isNotEmpty(logoutUrl)) {
                        redirectLinks.add(new WebLogoutLink(
                            logoutUrl,
                            removedInfo.getAuthProviderDescriptor().isSameTabRedirectOnLogout()
                        ));
                    }
                }
            }
            return new WebLogoutInfo(redirectLinks);
        } catch (DBException e) {
            throw new DBWebException("User logout failed", e);
        }
    }

    @Override
    public WebUserInfo activeUser(@NotNull WebSession webSession) throws DBWebException {
        if (webSession.getUser() == null) {
            return getAnonymousUserInfo(webSession);
        }
        try {
            // Read user from security controller. It will also read meta parameters
            SMUser userWithDetails = webSession.getSecurityController().getCurrentUser();
            if (userWithDetails != null) {
                // USer not saved yet. This may happen in easy config mode
                var webUser = new WebUser(userWithDetails);
                webUser.setDisplayName(webSession.getUser().getDisplayName());
                return new WebUserInfo(webSession, webUser);
            } else {
                return new WebUserInfo(webSession, webSession.getUser());
            }
        } catch (DBException e) {
            if (SMUtils.isRefreshTokenExpiredExceptionWasHandled(e)) {
                try {
                    webSession.resetUserState();
                    return null;
                } catch (DBException ex) {
                    throw new DBWebException("Error reading user details", e);
                }
            }
            throw new DBWebException("Error reading user details", e);
        }
    }

    @Override
    public WebAuthProviderInfo[] getAuthProviders(@NotNull HttpServletRequest request) throws DBWebException {
        String origin = ServletAppUtils.getOriginFromRequest(request);
        return WebAuthProviderRegistry.getInstance().getAuthProviders()
            .stream()
            .map(descriptor -> new WebAuthProviderInfo(descriptor, origin))
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
        // First add user profile properties
        List<DBPPropertyDescriptor> props = new ArrayList<>(
            WebMetaParametersRegistry.getInstance().getUserParameters());

        // Add metas from enabled auth providers
        for (WebAuthProviderDescriptor ap : WebServiceUtils.getEnabledAuthProviders()) {
            List<DBPPropertyDescriptor> metaProps = ap.getMetaParameters(SMSubjectType.user);
            if (!CommonUtils.isEmpty(metaProps)) {
                props.addAll(metaProps);
            }
        }

        return props.stream()
            .map(p -> new WebPropertyInfo(webSession, p, null))
            .toArray(WebPropertyInfo[]::new);
    }

    @Override
    public boolean setUserConfigurationParameter(
        @NotNull WebSession webSession,
        @NotNull String name,
        @Nullable String value
    ) throws DBWebException {
        if (webSession.getUser() == null) {
            throw new DBWebException("Preferences cannot be changed for anonymous user");
        }
        return setPreference(webSession, name, value);
    }

    private static boolean setPreference(
        @NotNull WebSession webSession,
        @NotNull String name,
        @Nullable Object value
    ) throws DBWebException {
        webSession.addInfoMessage("Set user parameter - " + name);
        try {
            var params = new HashMap<String, Object>();
            params.put(name, value);
            webSession.getUserContext().getPreferenceStore().updatePreferenceValues(params);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error setting user parameter", e);
        }
    }

    @Override
    public WebUserInfo setUserConfigurationParameters(
        @NotNull WebSession webSession,
        @NotNull Map<String, Object> parameters
    ) throws DBWebException {
        try {
            webSession.getUserContext().getPreferenceStore().updatePreferenceValues(parameters);
            if (webSession.getUser() == null) {
                return getAnonymousUserInfo(webSession);
            }
            return new WebUserInfo(webSession, webSession.getUser());
        } catch (DBException e) {
            throw new DBWebException("Error setting user parameters", e);
        }
    }

    @NotNull
    @Override
    public Map<String, Object> updateUserConfiguration(
        @NotNull WebSession webSession,
        @NotNull Map<String, Object> configuration
    ) throws DBWebException {
        if (!webSession.getUserContext().isNonAnonymousUserAuthorizedInSM()) {
            throw new DBWebExceptionAccessDenied("Access denied: user not authenticated");
        }
        try {
            return webSession.getSecurityController().updateCurrentUserUISettings(configuration);
        } catch (DBException | IllegalArgumentException e) {
            throw new DBWebException("Error updating user configuration", e);
        }
    }

    @Nullable
    private WebUserInfo getAnonymousUserInfo(@NotNull WebSession webSession) {
        ServletApplication application = webSession.getApplication();
        if (!application.getAppConfiguration().isAnonymousAccessEnabled() || !webSession.isAuthorizedInSecurityManager()) {
            return null;
        }
        SMUser anonymous = new SMUser(QMConstants.QM_ANONYMOUS_USER, true, null);
        return new WebUserInfo(webSession, new WebUser(anonymous));
    }
}

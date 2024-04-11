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
package io.cloudbeaver.service.auth.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.SMSignOutLinkProvider;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.model.user.WebAuthProviderInfo;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.registry.WebMetaParametersRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.auth.DBWServiceAuth;
import io.cloudbeaver.service.auth.WebAuthStatus;
import io.cloudbeaver.service.auth.WebLogoutInfo;
import io.cloudbeaver.service.auth.WebUserInfo;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.auth.SMSessionExternal;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.dbeaver.model.security.user.SMAuthPermissions;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceAuthImpl implements DBWServiceAuth {

    private static final Log log = Log.getLog(WebServiceAuthImpl.class);
    public static final String CONFIG_TEMP_ADMIN_USER_ID = "temp_config_admin";

    @Override
    public WebAuthStatus authLogin(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @Nullable String providerConfigurationId,
        @Nullable Map<String, Object> authParameters,
        boolean linkWithActiveUser,
        boolean forceSessionsLogout
    ) throws DBWebException {
        if (CommonUtils.isEmpty(providerId)) {
            throw new DBWebException("Missing auth provider parameter");
        }
        WebAuthProviderDescriptor authProviderDescriptor = WebAuthProviderRegistry.getInstance()
            .getAuthProvider(providerId);
        if (authProviderDescriptor.isTrusted()) {
            throw new DBWebException(authProviderDescriptor.getLabel() + " not allowed for authorization via GQL API");
        }
        if (authParameters == null) {
            authParameters = Map.of();
        }
        SMController securityController = webSession.getSecurityController();
        String currentSmSessionId = (webSession.getUser() == null || CBApplication.getInstance().isConfigurationMode())
            ? null
            : webSession.getUserContext().getSmSessionId();

        try {
            var smAuthInfo = securityController.authenticate(
                webSession.getSessionId(),
                currentSmSessionId,
                webSession.getSessionParameters(),
                WebSession.CB_SESSION_TYPE,
                providerId,
                providerConfigurationId,
                authParameters,
                    forceSessionsLogout
            );

            linkWithActiveUser = linkWithActiveUser && CBApplication.getInstance().getAppConfiguration().isLinkExternalCredentialsWithUser();
            if (smAuthInfo.getAuthStatus() == SMAuthStatus.IN_PROGRESS) {
                //run async auth process
                return new WebAuthStatus(smAuthInfo.getAuthAttemptId(), smAuthInfo.getRedirectUrl(), smAuthInfo.getAuthStatus());
            } else {
                //run it sync
                var authProcessor = new WebSessionAuthProcessor(webSession, smAuthInfo, linkWithActiveUser);
                return new WebAuthStatus(smAuthInfo.getAuthStatus(), authProcessor.authenticateSession());
            }
        } catch (DBWebException e) {
            throw new DBWebException("User authentication failed", e.getWebErrorCode(), e);
        } catch (Exception e) {
            throw new DBWebException("User authentication failed", e);
        }

    }

    @Override
    public WebAuthStatus authUpdateStatus(@NotNull WebSession webSession, @NotNull String authId, boolean linkWithActiveUser) throws DBWebException {
        try {
            linkWithActiveUser = linkWithActiveUser && CBApplication.getInstance().getAppConfiguration().isLinkExternalCredentialsWithUser();
            SMAuthInfo smAuthInfo = webSession.getSecurityController().getAuthStatus(authId);
            switch (smAuthInfo.getAuthStatus()) {
                case SUCCESS:
                    List<WebAuthInfo> newInfos = new WebSessionAuthProcessor(webSession, smAuthInfo, linkWithActiveUser).authenticateSession();
                    return new WebAuthStatus(smAuthInfo.getAuthStatus(), newInfos);
                case IN_PROGRESS:
                    return new WebAuthStatus(smAuthInfo.getAuthAttemptId(), smAuthInfo.getRedirectUrl(), smAuthInfo.getAuthStatus());
                case ERROR:
                    throw new DBWebException(smAuthInfo.getError());
                case EXPIRED:
                    throw new DBException("Authorization has already been processed");
                default:
                    throw new DBWebException("Unknown auth status:" + smAuthInfo.getAuthStatus());
            }
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public WebLogoutInfo authLogout(
        @NotNull WebSession webSession,
        @Nullable String providerId,
        @Nullable String configurationId
    ) throws DBWebException {
        if (webSession.getUser() == null) {
            throw new DBWebException("Not logged in");
        }
        try {
            List<WebAuthInfo> removedInfos = webSession.removeAuthInfo(providerId);
            List<String> logoutUrls = new ArrayList<>();
            var cbApp = CBApplication.getInstance();
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
                            externalSession.getAuthParameters());
                    } else {
                        logoutUrl = provider.getUserSignOutLink(providerConfig,
                            Map.of());
                    }
                    if (CommonUtils.isNotEmpty(logoutUrl)) {
                        logoutUrls.add(logoutUrl);
                    }
                }
            }
            return new WebLogoutInfo(logoutUrls);
        } catch (DBException e) {
            throw new DBWebException("User logout failed", e);
        }
    }

    @Override
    public WebUserInfo activeUser(@NotNull WebSession webSession) throws DBWebException {
        if (webSession.getUser() == null) {
            return null;
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
    public WebAuthProviderInfo[] getAuthProviders() {
        return WebAuthProviderRegistry.getInstance().getAuthProviders()
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
            String serializedValue = value == null ? null : value.toString();
            webSession.getSecurityController().setCurrentUserParameter(name, serializedValue);
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
        if (webSession.getUser() == null) {
            throw new DBWebException("Preferences cannot be changed for anonymous user");
        }
        for (Map.Entry<String, Object> parameter : parameters.entrySet()) {
            setPreference(webSession, parameter.getKey(), parameter.getValue());
        }
        return new WebUserInfo(webSession, webSession.getUser());
    }

}

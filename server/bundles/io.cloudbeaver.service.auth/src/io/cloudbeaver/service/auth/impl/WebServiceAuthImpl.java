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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.model.user.WebAuthProviderInfo;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebUserProfileRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.auth.DBWServiceAuth;
import io.cloudbeaver.service.auth.WebAuthStatus;
import io.cloudbeaver.service.auth.WebUserInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;

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
        boolean linkWithActiveUser
    ) throws DBWebException {
        if (CommonUtils.isEmpty(providerId)) {
            throw new DBWebException("Missing auth provider parameter");
        }
        if (authParameters == null) {
            authParameters = Map.of();
        }
        SMController securityController = webSession.getSecurityController();
        String currentSmSessionId = webSession.getUser() == null ? null : webSession.getUserContext().getSmSessionId();
        try {
            var smAuthInfo = securityController.authenticate(
                webSession.getSessionId(),
                currentSmSessionId,
                webSession.getSessionParameters(),
                WebSession.CB_SESSION_TYPE,
                providerId,
                providerConfigurationId,
                authParameters
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
        webSession.addInfoMessage("Set user parameter - " + name);
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

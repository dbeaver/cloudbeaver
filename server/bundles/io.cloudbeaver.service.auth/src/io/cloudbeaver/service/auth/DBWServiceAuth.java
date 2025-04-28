/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.auth.model.user.WebAuthProviderInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.util.Map;

/**
 * Web service API
 */
public interface DBWServiceAuth extends DBWService {

    @WebAction(authRequired = false)
    WebAuthStatus authLogin(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @Nullable String providerConfigurationId,
        @Nullable Map<String, Object> credentials,
        boolean linkWithActiveUser,
        boolean forceSessionsLogout
    ) throws DBWebException;

    @WebAction(authRequired = false)
    WebAsyncAuthStatus federatedLogin(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @Nullable String providerConfigurationId,
        boolean linkWithActiveUser,
        boolean forceSessionsLogout
    ) throws DBWebException;

    @WebAction(authRequired = false)
    WebAsyncAuthTaskResult federatedAuthTaskResult(
        @NotNull WebSession webSession,
        @NotNull String taskId
    ) throws DBWebException;

    @WebAction(authRequired = false)
    WebAuthStatus authUpdateStatus(@NotNull WebSession webSession, @NotNull String authId, boolean linkWithActiveUser) throws DBWebException;

    @WebAction(authRequired = false)
    WebLogoutInfo authLogout(
        @NotNull WebSession webSession,
        @Nullable String providerId,
        @Nullable String configurationId
    ) throws DBWebException;

    @WebAction(authRequired = false)
    WebUserInfo activeUser(@NotNull WebSession webSession) throws DBWebException;

    @WebAction(authRequired = false)
    WebAuthProviderInfo[] getAuthProviders();

    @WebAction()
    boolean changeLocalPassword(@NotNull WebSession webSession, @NotNull String oldPassword, @NotNull String newPassword) throws DBWebException;

    @WebAction(authRequired = false)
    WebPropertyInfo[] listUserProfileProperties(@NotNull WebSession webSession);

    @WebAction()
    boolean setUserConfigurationParameter(
        @NotNull WebSession webSession,
        @NotNull String name,
        @Nullable String value) throws DBWebException;

    @WebAction()
    WebUserInfo setUserConfigurationParameters(
        @NotNull WebSession webSession,
        @NotNull Map<String, Object> parameters
    ) throws DBWebException;

}

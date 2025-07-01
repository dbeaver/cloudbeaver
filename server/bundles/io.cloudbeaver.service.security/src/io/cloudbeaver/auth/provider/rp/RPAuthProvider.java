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
package io.cloudbeaver.auth.provider.rp;

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.SMSignOutLinkProvider;
import io.cloudbeaver.auth.provider.local.LocalAuthSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMStandardMeta;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.Map;

public class RPAuthProvider implements SMAuthProviderExternal<SMSession>, SMSignOutLinkProvider {

    private static final Log log = Log.getLog(RPAuthProvider.class);

    public static final String X_USER = "X-User";
    @Deprecated // use X-Team
    public static final String X_ROLE = "X-Role";
    public static final String X_TEAM = "X-Team";
    public static final String X_ROLE_TE = "X-Role-TE";
    public static final String X_FIRST_NAME = "X-First-name";
    public static final String X_LAST_NAME = "X-Last-name";
    public static final String X_FULL_NAME = "X-Full-name";
    public static final String AUTH_PROVIDER = "reverseProxy";
    public static final String LOGOUT_URL = "logout-url";

    @NotNull
    @Override
    public String validateLocalAuth(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMController securityController,
        @NotNull SMAuthProviderCustomConfiguration providerConfig,
        @NotNull Map<String, Object> userCredentials,
        @Nullable String activeUserId
    ) throws DBException {
        String userName = (String) userCredentials.get("user");

        if (activeUserId == null) {
            return userName;
        } else {
            return activeUserId;
        }
    }

    @NotNull
    @Override
    public DBWUserIdentity getUserIdentity(
        @NotNull DBRProgressMonitor monitor,
        @Nullable SMAuthProviderCustomConfiguration customConfiguration,
        @NotNull Map<String, Object> authParameters
    ) throws DBException {
        String userName = String.valueOf(authParameters.get("user"));
        StringBuilder nameBuilder = new StringBuilder();
        Map<String, String> userMeta = new HashMap<>();
        String firstName = JSONUtils.getString(authParameters, SMStandardMeta.META_FIRST_NAME);
        String lastName = JSONUtils.getString(authParameters, SMStandardMeta.META_LAST_NAME);
        String fullName = JSONUtils.getString(authParameters, "fullName");
        if (CommonUtils.isNotEmpty(firstName)) {
            nameBuilder.append(firstName);
            userMeta.put(SMStandardMeta.META_FIRST_NAME, firstName);
        }

        if (CommonUtils.isNotEmpty(lastName)) {
            nameBuilder.append(lastName);
            userMeta.put(SMStandardMeta.META_LAST_NAME, lastName);
        }

        if (CommonUtils.isNotEmpty(fullName)) {
            nameBuilder = new StringBuilder(fullName);
        }

        return new DBWUserIdentity(
            userName,
            nameBuilder.length() > 0 ? nameBuilder.toString() : userName,
            userMeta
        );
    }

    @Nullable
    @Override
    public DBPObject getUserDetails(@NotNull DBRProgressMonitor monitor, @NotNull WebSession webSession, @NotNull SMSession session, @NotNull WebUser user, boolean selfIdentity) throws DBException {
        return null;
    }

    @Override
    public SMSession openSession(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMSession mainSession,
        @Nullable SMAuthProviderCustomConfiguration customConfiguration,
        @NotNull Map<String, Object> userCredentials
    ) throws DBException {
        return new LocalAuthSession(mainSession, (String) userCredentials.get("user"));
    }

    @Override
    public void closeSession(@NotNull SMSession mainSession, SMSession session) throws DBException {

    }

    @Override
    public void refreshSession(@NotNull DBRProgressMonitor monitor, @NotNull SMSession mainSession, SMSession session) throws DBException {

    }

    @NotNull
    @Override
    public String getCommonSignOutLink(
        @NotNull String providerId,
        @NotNull Map<String, Object> providerConfig,
        @NotNull String origin
    ) throws DBException {
        return providerConfig.get(LOGOUT_URL) != null ? providerConfig.get(LOGOUT_URL).toString() : "";
    }

    @Override
    public String getUserSignOutLink(
        @NotNull SMAuthProviderCustomConfiguration providerConfig,
        @NotNull Map<String, Object> userCredentials,
        @NotNull String origin
    ) throws DBException {
        return providerConfig.getParameters().get(LOGOUT_URL) != null ?
            providerConfig.getParameters().get(LOGOUT_URL).toString() :
            null;
    }

}

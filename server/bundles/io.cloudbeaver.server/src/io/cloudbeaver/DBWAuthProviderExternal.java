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
package io.cloudbeaver;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.access.DBASession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.util.Map;

/**
 * Auth provider
 */
public interface DBWAuthProviderExternal<AUTH_SESSION extends DBASession> extends DBWAuthProvider<AUTH_SESSION> {

    String META_AUTH_PROVIDER = "$provider";
    String META_AUTH_SPACE_ID = "$space";

    /**
     * Returns new identifying credentials which can be used to find/create user in database
     */
    @NotNull
    Map<String, Object> authExternalUser(
        @NotNull DBRProgressMonitor monitor,
        @NotNull Map<String, Object> providerConfig, // Auth provider configuration (e.g. 3rd party auth server address)
        @NotNull Map<String, Object> authParameters // Passed auth parameters (e.g. user name or password)
    ) throws DBException;

    /**
     * Returns new identifying credentials which can be used to find/create user in database
     */
    @NotNull
    Map<String, Object> authFederatedUser(
        @NotNull DBRProgressMonitor monitor,
        @NotNull Map<String, Object> providerConfig, // Auth provider configuration (e.g. 3rd party auth server address)
        @NotNull String faProvider,
        @NotNull Map<String, Object> faParameters // Passed federated auth parameters (e.g. assertion ID, session token, etc)
    ) throws DBException;

    /**
     * Validates that external user may be associated with local user
     * @param userCredentials credentials from authExternalUser
     * @return new user ID. If activeUser is not null then it must be the same as activeUser ID.
     */
    @NotNull
    String validateLocalAuth(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBWSecurityController securityController,
        @NotNull Map<String, Object> providerConfig,
        @NotNull Map<String, Object> userCredentials,
        @Nullable WebUser activeUser) throws DBException;

    @Nullable
    DBWUserIdentity getUserIdentity(
        @NotNull DBRProgressMonitor monitor,
        @NotNull Map<String, Object> providerConfig,
        @NotNull Map<String, Object> credentials) throws DBException;

    @Nullable
    DBPObject getUserDetails(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSession webSession,
        @NotNull AUTH_SESSION session,
        @NotNull WebUser user) throws DBException;

}

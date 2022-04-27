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
package io.cloudbeaver.auth;

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.util.Map;

/**
 * External auth provider.
 * Authenticates user using external user identity
 */
public interface SMAuthProviderExternal<AUTH_SESSION extends SMSession> extends SMAuthProvider<AUTH_SESSION> {

    /**
     * Returns new identifying credentials which can be used to find/create user in database
     */
    @NotNull
    Map<String, Object> authExternalUser(
        @NotNull DBRProgressMonitor monitor,
        @NotNull Map<String, Object> providerConfig, // Auth provider configuration (e.g. 3rd party auth server address)
        @NotNull Map<String, Object> authParameters // Passed auth parameters (e.g. user name or password)
    ) throws DBException;


    @NotNull
    DBWUserIdentity getUserIdentity(
        @NotNull DBRProgressMonitor monitor,
        @NotNull Map<String, Object> providerConfig,
        @NotNull Map<String, Object> credentials) throws DBException;

    /**
     * Get specified user details.
     * @param user          user
     * @param selfIdentity  true if users tries to get information about itself.
     *                      Otherwise it is information for supervisor.
     */
    @Nullable
    DBPObject getUserDetails(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSession webSession,
        @NotNull AUTH_SESSION session,
        @NotNull WebUser user,
        boolean selfIdentity) throws DBException;

}

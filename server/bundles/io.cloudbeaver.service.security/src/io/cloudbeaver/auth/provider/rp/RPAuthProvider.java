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
package io.cloudbeaver.auth.provider.rp;

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.provider.local.LocalAuthSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.security.SMController;

import java.util.Map;

public class RPAuthProvider implements SMAuthProviderExternal<SMSession> {

    private static final Log log = Log.getLog(RPAuthProvider.class);

    public static final String X_USER = "X-User";
    public static final String X_ROLE = "X-Role";
    public static final String AUTH_PROVIDER = "reverseProxy";


    @NotNull
    @Override
    public Map<String, Object> authExternalUser(@NotNull DBRProgressMonitor monitor, @NotNull Map<String, Object> providerConfig, @NotNull Map<String, Object> authParameters) throws DBException {
        return authParameters;
    }

    @NotNull
    @Override
    public String validateLocalAuth(@NotNull DBRProgressMonitor monitor,
                                    @NotNull SMController securityController,
                                    @NotNull Map<String, Object> providerConfig,
                                    @NotNull Map<String, Object> userCredentials,
                                    @Nullable String activeUserId) throws DBException {
        String userName = (String) userCredentials.get("user");

        if (activeUserId == null) {
            return userName;
        } else {
            return activeUserId;
        }
    }

    @NotNull
    @Override
    public DBWUserIdentity getUserIdentity(@NotNull DBRProgressMonitor monitor, @NotNull Map<String, Object> providerConfig, @NotNull Map<String, Object> credentials) throws DBException {
        String userName = String.valueOf(credentials.get("user"));
        return new DBWUserIdentity(userName, userName);
    }

    @Nullable
    @Override
    public DBPObject getUserDetails(@NotNull DBRProgressMonitor monitor, @NotNull WebSession webSession, @NotNull SMSession session, @NotNull WebUser user, boolean selfIdentity) throws DBException {
        return null;
    }

    @Override
    public SMSession openSession(@NotNull DBRProgressMonitor monitor, @NotNull SMSession mainSession, @NotNull Map<String, Object> providerConfig, @NotNull Map<String, Object> userCredentials) throws DBException {
        return new LocalAuthSession(mainSession, (String) userCredentials.get("user"));
    }

    @Override
    public void closeSession(@NotNull SMSession mainSession, SMSession session) throws DBException {

    }

    @Override
    public void refreshSession(@NotNull DBRProgressMonitor monitor, @NotNull SMSession mainSession, SMSession session) throws DBException {

    }
}

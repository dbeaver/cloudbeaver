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
package io.cloudbeaver.auth.provider.local;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.AuthPropertyEncryption;
import org.jkiss.dbeaver.model.auth.DBAAuthProvider;
import org.jkiss.dbeaver.model.auth.DBASession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.SecurityUtils;

import java.util.Map;

/**
 * Local auth provider
 */
public class LocalAuthProvider implements DBAAuthProvider<LocalAuthSession> {

    public static final String PROVIDER_ID = "local";
    public static final String CRED_USER = "user";
    public static final String CRED_PASSWORD = "password";

    @Override
    public LocalAuthSession openSession(@NotNull DBRProgressMonitor monitor, @NotNull DBASession mainSession, @NotNull Map<String, Object> providerConfig, @NotNull Map<String, Object> userCredentials) throws DBException {
        String userName = CommonUtils.toString(userCredentials.get(CRED_USER), null);

        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(PROVIDER_ID);
        Map<String, Object> storedCredentials = CBApplication.getInstance().getSecurityController().getUserCredentials(userName, authProvider);
        if (storedCredentials == null) {
            throw new DBException("Invalid user name or password");
        }

        String storedPasswordHash = CommonUtils.toString(storedCredentials.get(CRED_PASSWORD), null);
        if (CommonUtils.isEmpty(storedPasswordHash)) {
            throw new DBException("User has no password (login restricted)");
        }
        String clientPassword = CommonUtils.toString(userCredentials.get(CRED_PASSWORD), null);
        if (CommonUtils.isEmpty(clientPassword)) {
            throw new DBException("No user password provided");
        }
        String clientPasswordHash = AuthPropertyEncryption.hash.encrypt(userName, clientPassword);
        if (!storedPasswordHash.equals(clientPasswordHash)) {
            throw new DBException("Invalid user name or password");
        }
        return new LocalAuthSession(mainSession, userName);
    }

    @Override
    public void closeSession(@NotNull DBASession mainSession, LocalAuthSession localAuthSession) throws DBException {

    }

    @Override
    public void refreshSession(@NotNull DBRProgressMonitor monitor, @NotNull DBASession mainSession, LocalAuthSession localAuthSession) throws DBException {

    }

    public static String makeClientPasswordHash(String userName, String password) {
        return SecurityUtils.makeDigest(password);
    }

    public static boolean changeUserPassword(@NotNull WebSession webSession, @NotNull String oldPassword, @NotNull String newPassword) throws DBException {
        String userName = webSession.getUser().getUserId();

        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(PROVIDER_ID);
        Map<String, Object> storedCredentials = CBApplication.getInstance().getSecurityController().getUserCredentials(userName, authProvider);
        if (storedCredentials == null) {
            throw new DBException("Invalid user name or password");
        }
        String storedPasswordHash = CommonUtils.toString(storedCredentials.get(CRED_PASSWORD), null);
        if (CommonUtils.isEmpty(storedPasswordHash)) {
            throw new DBException("User has no saved credentials");
        }
        if (CommonUtils.isEmpty(oldPassword)) {
            throw new DBException("No user password provided");
        }
        String oldPasswordHash = AuthPropertyEncryption.hash.encrypt(userName, oldPassword);
        if (!storedPasswordHash.equals(oldPasswordHash)) {
            throw new DBException("Invalid user name or password");
        }

        //String newPasswordHash = WebAuthProviderPropertyEncryption.hash.encrypt(userName, newPassword);

        storedCredentials.put(CRED_PASSWORD, newPassword);
        CBApplication.getInstance().getSecurityController().setUserCredentials(userName, authProvider, storedCredentials);
        return true;
    }

}

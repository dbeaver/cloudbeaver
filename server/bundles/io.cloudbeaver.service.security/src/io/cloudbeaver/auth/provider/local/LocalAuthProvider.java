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
package io.cloudbeaver.auth.provider.local;

import io.cloudbeaver.auth.SMBruteForceProtected;
import io.cloudbeaver.auth.UserLoginRecord;
import io.cloudbeaver.model.config.SMControllerConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.Argon2IdHasher;
import org.jkiss.dbeaver.model.auth.AuthPropertyEncryption;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.exception.SMInvalidCredentialException;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Local auth provider
 */
public class LocalAuthProvider implements SMAuthProvider<LocalAuthSession>, SMBruteForceProtected {

    public static final String PROVIDER_ID = LocalAuthProviderConstants.PROVIDER_ID;
    public static final String CRED_USER = LocalAuthProviderConstants.CRED_USER;
    public static final String CRED_PASSWORD_MD_5 = LocalAuthProviderConstants.CRED_PASSWORD_MD5;
    public static final String CRED_PASSWORD = LocalAuthProviderConstants.CRED_PASSWORD;
    public static final String AUTH_LOCAL_TYPE = "authLocalType";
    public static final String LEGACY_AUTH_LOCAL_TYPE = "legacy";
    public static final String NEW_AUTH_LOCAL_TYPE = "new";

    @NotNull
    @Override
    public String validateLocalAuth(@NotNull DBRProgressMonitor monitor,
                                    @NotNull SMController securityController,
                                    @NotNull SMAuthProviderCustomConfiguration providerConfig,
                                    @NotNull Map<String, Object> userCredentials,
                                    @Nullable String activeUserId) throws DBException {


        String userName = CommonUtils.toString(userCredentials.get(CRED_USER), null);

        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(PROVIDER_ID);
        Map<String, Object> storedCredentials = securityController.getUserCredentials(userName, authProvider.getId());
        if (storedCredentials == null) {
            throw new DBException("Invalid user name or password");
        }

        String passwordSha = CommonUtils.toString(userCredentials.get(LocalAuthProviderConstants.CRED_PASSWORD), null);
        if (CommonUtils.isNotEmpty(CommonUtils.toString(userCredentials.get(CRED_PASSWORD_MD_5), null))) {
            validatePasswordMd5(userCredentials, storedCredentials);
            if (securityController instanceof SMAdminController adminController) {
                adminController.setUserCredentials(userName, authProvider.getId(), userCredentials);
            } else {
                throw new DBException("User password hash update is not supported in current context");
            }
        } else {
            validatePasswordSha(passwordSha, storedCredentials);
        }

        return activeUserId == null ? userName : activeUserId;
    }

    private void validatePasswordSha(String passwordSha, Map<String, Object> storedCredentials) throws DBException {
        try {
            if (!Argon2IdHasher.verify(CommonUtils.toString(storedCredentials.get(LocalAuthProviderConstants.CRED_PASSWORD)), passwordSha)) {
                throw new SMInvalidCredentialException("Invalid user name or password");
            }
        } catch (Exception e) {
            throw new SMInvalidCredentialException("Invalid user name or password");
        }
    }

    private void validatePasswordMd5(@NotNull Map<String, Object> userCredentials,
                                     Map<String, Object> storedCredentials
    ) throws DBException {
        String storedPasswordHash = CommonUtils.toString(storedCredentials.get(LocalAuthProviderConstants.CRED_PASSWORD), null);
        if (CommonUtils.isEmpty(storedPasswordHash)) {
            throw new SMInvalidCredentialException("User has no password (login restricted)");
        }
        String clientPassword = CommonUtils.toString(userCredentials.get(CRED_PASSWORD_MD_5), null);
        if (CommonUtils.isEmpty(clientPassword)) {
            throw new SMInvalidCredentialException("No user password provided");
        }
        String userName = CommonUtils.toString(userCredentials.get(CRED_USER));
        String clientPasswordHash = AuthPropertyEncryption.hashMd5.encrypt(userName, clientPassword);
        // we also need to check a hash with lower case (CB-5833)
        //fixme(?) there is checking phc string, not only hash
        String clientPasswordHashLowerCase = AuthPropertyEncryption.hashMd5.encrypt(userName.toLowerCase(), clientPassword);
        if (!storedPasswordHash.equals(clientPasswordHash) && !clientPasswordHashLowerCase.equals(storedPasswordHash)) {
            throw new SMInvalidCredentialException("Invalid user name or password");
        }
    }

    @Override
    public LocalAuthSession openSession(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMSession mainSession,
        @Nullable SMAuthProviderCustomConfiguration customConfiguration,
        @NotNull Map<String, Object> userCredentials
    ) throws DBException {
        String userName = CommonUtils.toString(userCredentials.get(CRED_USER));
        if (CommonUtils.isEmpty(userName)) {
            throw new DBException("Invalid user name");
        }
        return new LocalAuthSession(mainSession, userName);
    }

    @Override
    public void closeSession(@NotNull SMSession mainSession, LocalAuthSession localAuthSession) throws DBException {

    }

    @Override
    public void refreshSession(@NotNull DBRProgressMonitor monitor, @NotNull SMSession mainSession, LocalAuthSession localAuthSession) throws DBException {

    }

    public static boolean changeUserPassword(@NotNull WebSession webSession, @NotNull String oldPassword, @NotNull String newPassword) throws DBException {
        String userName = webSession.getUser().getUserId();

        SMController smController = webSession.getSecurityController();
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(PROVIDER_ID);
        Map<String, Object> storedCredentials = smController.getCurrentUserCredentials(authProvider.getId());
        if (CommonUtils.isEmpty(storedCredentials)) {
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
        smController.setCurrentUserCredentials(authProvider.getId(), storedCredentials);
        return true;
    }

    @Override
    public Object getInputUsername(@NotNull Map<String, Object> cred) {
        return cred.get("user");
    }


    @Override
    public Map<String, Object> processUserCredBeforeAuthAttempt(
        @NotNull Map<String, Object> credBefore,
        @NotNull Map<String, Object> credAfter
    ) {
        HashMap<String, Object> result = new HashMap<>(credAfter);
        if (credBefore.get(CRED_PASSWORD_MD_5) != null) {
            result.put(AUTH_LOCAL_TYPE, LEGACY_AUTH_LOCAL_TYPE);
        } else {
            result.put(AUTH_LOCAL_TYPE, NEW_AUTH_LOCAL_TYPE);
        }
        return result;
    }

    @Nullable
    @Override
    public Boolean shouldBeBlocked(SMControllerConfiguration smConfig, List<UserLoginRecord> userLoginRecords) {

        long countNewAuthTypeAttempts = userLoginRecords.stream()
            .filter(userLoginRecord -> NEW_AUTH_LOCAL_TYPE.equals(userLoginRecord.authState().get(AUTH_LOCAL_TYPE)))
            .count();
        long countLegacyAuthTypeAttempts = userLoginRecords.stream()
            .filter(userLoginRecord -> LEGACY_AUTH_LOCAL_TYPE.equals(userLoginRecord.authState().get(AUTH_LOCAL_TYPE)))
            .count();
        int maxFailedLogin = smConfig.getMaxFailedLogin();
        if (countNewAuthTypeAttempts == maxFailedLogin && countLegacyAuthTypeAttempts + 1 == maxFailedLogin) {
            return false;
        }
        return countNewAuthTypeAttempts >= maxFailedLogin || countLegacyAuthTypeAttempts >= maxFailedLogin;
    }
}

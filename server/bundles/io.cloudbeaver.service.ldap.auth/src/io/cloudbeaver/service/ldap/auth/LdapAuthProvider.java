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
package io.cloudbeaver.service.ldap.auth;

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.SMBruteForceProtected;
import io.cloudbeaver.auth.provider.local.LocalAuthProviderConstants;
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
import org.jkiss.utils.CommonUtils;

import javax.naming.Context;
import javax.naming.NamingException;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import javax.naming.directory.SearchControls;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.UUID;

public class LdapAuthProvider implements SMAuthProviderExternal<SMSession>, SMBruteForceProtected {
    private static final Log log = Log.getLog(LdapAuthProvider.class);

    public LdapAuthProvider() {
    }

    @NotNull
    @Override
    public Map<String, Object> authExternalUser(
        @NotNull DBRProgressMonitor monitor,
        @Nullable SMAuthProviderCustomConfiguration providerConfig,
        @NotNull Map<String, Object> authParameters
    ) throws DBException {
        if (providerConfig == null) {
            throw new DBException("LDAP provider config is null");
        }
        String userName = JSONUtils.getString(authParameters, LdapConstants.CRED_USER_DN);
        if (CommonUtils.isEmpty(userName)) {
            throw new DBException("LDAP user dn is empty");
        }
        String password = JSONUtils.getString(authParameters, LdapConstants.CRED_PASSWORD);
        if (CommonUtils.isEmpty(password)) {
            throw new DBException("LDAP password is empty");
        }

        LdapSettings ldapSettings = new LdapSettings(providerConfig);
        Hashtable<String, String> environment = creteAuthEnvironment(ldapSettings);

        String fullUserDN = userName;

        if (!fullUserDN.startsWith(ldapSettings.getUserIdentifierAttr())) {
            fullUserDN = String.join("=", ldapSettings.getUserIdentifierAttr(), userName);
        }
        if (CommonUtils.isNotEmpty(ldapSettings.getBaseDN()) && !fullUserDN.endsWith(ldapSettings.getBaseDN())) {
            fullUserDN = String.join(",", fullUserDN, ldapSettings.getBaseDN());
        }

        validateUserAccess(fullUserDN, ldapSettings);

        environment.put(Context.SECURITY_PRINCIPAL, fullUserDN);
        environment.put(Context.SECURITY_CREDENTIALS, password);
        DirContext context = null;
        try {
            context = new InitialDirContext(environment);
            Map<String, Object> userData = new HashMap<>();
            userData.put(LdapConstants.CRED_USERNAME, findUserNameFromDN(fullUserDN, ldapSettings));
            userData.put(LdapConstants.CRED_SESSION_ID, UUID.randomUUID());
            return userData;
        } catch (Exception e) {
            throw new DBException("LDAP authentication failed: " + e.getMessage(), e);
        } finally {
            try {
                if (context != null) {
                    context.close();
                }
            } catch (NamingException e) {
                log.warn("Error closing LDAP user context", e);
            }
        }
    }

    private void validateUserAccess(@NotNull String fullUserDN, @NotNull LdapSettings ldapSettings) throws DBException {
        if (
            CommonUtils.isEmpty(ldapSettings.getFilter())
                || CommonUtils.isEmpty(ldapSettings.getBindUserDN())
                || CommonUtils.isEmpty(ldapSettings.getBindUserPassword())
        ) {
            return;
        }

        var environment = creteAuthEnvironment(ldapSettings);
        environment.put(Context.SECURITY_PRINCIPAL, ldapSettings.getBindUserDN());
        environment.put(Context.SECURITY_CREDENTIALS, ldapSettings.getBindUserPassword());
        DirContext bindUserContext = null;
        try {
            bindUserContext = new InitialDirContext(environment);

            SearchControls searchControls = new SearchControls();
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);
            searchControls.setTimeLimit(30_000);
            var searchResult = bindUserContext.search(fullUserDN, ldapSettings.getFilter(), searchControls);
            if (!searchResult.hasMore()) {
                throw new DBException("Access denied");
            }
        } catch (DBException e) {
            throw e;
        } catch (Exception e) {
            throw new DBException("LDAP user access validation by filter failed: " + e.getMessage(), e);
        } finally {
            if (bindUserContext != null) {
                try {
                    bindUserContext.close();
                } catch (NamingException e) {
                    log.warn("Error closing LDAP bind user context", e);
                }
            }
        }
    }

    @NotNull
    private static Hashtable<String, String> creteAuthEnvironment(LdapSettings ldapSettings) {
        Hashtable<String, String> environment = new Hashtable<>();
        environment.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");

        environment.put(Context.PROVIDER_URL, ldapSettings.getLdapProviderUrl());
        environment.put(Context.SECURITY_AUTHENTICATION, "simple");
        return environment;
    }

    @NotNull
    private String findUserNameFromDN(@NotNull String fullUserDN, @NotNull LdapSettings ldapSettings)
        throws DBException {
        String userId = null;
        for (String dn : fullUserDN.split(",")) {
            if (dn.startsWith(ldapSettings.getUserIdentifierAttr() + "=")) {
                userId = dn.split("=")[1];
                break;
            }
        }
        if (userId == null) {
            throw new DBException("Failed to determinate userId from user DN: " + fullUserDN);
        }
        return userId;
    }

    @NotNull
    @Override
    public DBWUserIdentity getUserIdentity(
        @NotNull DBRProgressMonitor monitor,
        @Nullable SMAuthProviderCustomConfiguration customConfiguration,
        @NotNull Map<String, Object> authParameters
    ) throws DBException {
        String userName = JSONUtils.getString(authParameters, LocalAuthProviderConstants.CRED_USER);
        if (CommonUtils.isEmpty(userName)) {
            throw new DBException("LDAP user name is empty");
        }
        return new DBWUserIdentity(userName, userName);
    }

    @Nullable
    @Override
    public DBPObject getUserDetails(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSession webSession,
        @NotNull SMSession session,
        @NotNull WebUser user,
        boolean selfIdentity
    ) throws DBException {
        return null;
    }

    @NotNull
    @Override
    public String validateLocalAuth(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMController securityController,
        @NotNull SMAuthProviderCustomConfiguration providerConfig,
        @NotNull Map<String, Object> userCredentials,
        @Nullable String activeUserId
    ) throws DBException {
        String userId = JSONUtils.getString(userCredentials, LdapConstants.CRED_USERNAME);
        if (CommonUtils.isEmpty(userId)) {
            throw new DBException("LDAP user id not found");
        }
        return activeUserId == null ? userId : activeUserId;
    }

    @Override
    public SMSession openSession(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMSession mainSession,
        @Nullable SMAuthProviderCustomConfiguration customConfiguration,
        @NotNull Map<String, Object> userCredentials
    ) throws DBException {
        return new LdapSession(mainSession, mainSession.getSessionSpace(), userCredentials);
    }

    @Override
    public void closeSession(@NotNull SMSession mainSession, SMSession session) throws DBException {

    }

    @Override
    public void refreshSession(
        @NotNull DBRProgressMonitor monitor,
        @NotNull SMSession mainSession,
        SMSession session
    ) throws DBException {

    }

    @Override
    public Object getInputUsername(@NotNull Map<String, Object> cred) {
        return cred.get(LdapConstants.CRED_USERNAME);
    }
}

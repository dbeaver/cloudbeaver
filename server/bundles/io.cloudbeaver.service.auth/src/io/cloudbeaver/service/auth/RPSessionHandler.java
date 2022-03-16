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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.provider.local.LocalAuthSession;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.DBWSessionHandler;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

public class RPSessionHandler implements DBWSessionHandler {

    public static final String X_USER = "X-User";
    public static final String X_ROLE = "X-Role";
    public static final String AUTH_PROVIDER = "local";

    @Override
    public boolean handleSessionOpen(WebSession webSession, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        boolean configMode = CBApplication.getInstance().isConfigurationMode();
        //checks if the app is not in configuration mode and reverse proxy auth is enabled in the config file
        if (!configMode && CBApplication.getInstance().getAppConfiguration().isEnabledReverseProxyAuth()) {
            reverseProxyAuthentication(request, webSession);
        }
        return false;
    }
    public void reverseProxyAuthentication(@NotNull HttpServletRequest request, @NotNull WebSession webSession) throws DBWebException {
        SMController<WebUser, ?, ?> securityController = CBPlatform.getInstance().getApplication().getSecurityController();
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(AUTH_PROVIDER);

        String userName = request.getHeader(X_USER);
        String roles = request.getHeader(X_ROLE);
        String[] userRoles = roles.split("\\|");
        WebUser curUser = webSession.getUser();
        SMSession authSession;
        if (userName != null) {
            try {
                WebUser user = securityController.getUserById(userName);
                Map<String, Object> credentials = new HashMap<>();
                credentials.put("user", userName);
                var adminSecurityController = CBPlatform.getInstance().getApplication().getAdminSecurityController();
                if (user == null) {
                    // User doesn't exist. We can create new user automatically
                    // Create new user
                    curUser = new WebUser(userName);
                    adminSecurityController.createUser(curUser);

                    String defaultRoleName = CBPlatform.getInstance().getApplication().getAppConfiguration().getDefaultUserRole();
                    if (userRoles.length == 0) {
                        userRoles = new String[]{defaultRoleName};
                    }
                    // We need to associate new credentials with active user
                    securityController.setUserCredentials(userName, authProvider, credentials);
                }
                adminSecurityController.setUserRoles(userName, userRoles, userName);
                user = curUser;
                if (user == null) {
                    user = new WebUser(userName);
                }
                DBWUserIdentity userIdentity = new DBWUserIdentity(userName, userName);

                if (CommonUtils.isEmpty(user.getDisplayName())) {
                    user.setDisplayName(userIdentity.getDisplayName());
                }
                authSession = new LocalAuthSession(webSession, userName);

                WebAuthInfo authInfo = new WebAuthInfo(
                        webSession,
                        user,
                        authProvider,
                        userIdentity,
                        authSession,
                        OffsetDateTime.now());
                authInfo.setMessage("Authenticated with " + authProvider.getLabel() + " provider");
                webSession.addAuthInfo(authInfo);
            } catch (Exception e) {
                throw new DBWebException("Error", e);
            }
        }
    }
    @Override
    public boolean handleSessionClose(WebSession webSession) throws DBException, IOException {
        return false;
    }
}

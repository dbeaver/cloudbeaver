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
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWSessionHandler;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RPSessionHandler implements DBWSessionHandler {

    private static final Log log = Log.getLog(RPSessionHandler.class);

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
        SMController securityController = webSession.getSecurityController();
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(RPAuthProvider.AUTH_PROVIDER);
        if (authProvider == null) {
            throw new DBWebException("Auth provider " + RPAuthProvider.AUTH_PROVIDER + " not found");
        }
        SMAuthProviderExternal<?> authProviderExternal = (SMAuthProviderExternal<?>) authProvider.getInstance();
        String userName = request.getHeader(RPAuthProvider.X_USER);
        String roles = request.getHeader(RPAuthProvider.X_ROLE);
        List<String> userRoles = roles == null ? Collections.emptyList() : List.of(roles.split("\\|"));
        SMSession authSession;
        if (userName != null) {
            try {
                Map<String, Object> credentials = new HashMap<>();
                credentials.put("user", userName);
                Map<String, Object> sessionParameters = webSession.getSessionParameters();
                sessionParameters.put(SMConstants.SESSION_PARAM_TRUSTED_USER_ROLES, userRoles);
                Map<String, Object> userCredentials = authProviderExternal.authExternalUser(
                    webSession.getProgressMonitor(), sessionParameters, credentials);
                try {
                    SMAuthInfo smAuthInfo = securityController.authenticate(
                            webSession.getSessionId(), sessionParameters,
                            WebSession.CB_SESSION_TYPE, authProvider.getId(), userCredentials);
                    webSession.updateSMAuthInfo(smAuthInfo);
                } catch (SMException e) {
                    log.debug("Error during user authentication", e);
                    throw e;
                }
                WebUser user = webSession.getUser();
                DBWUserIdentity userIdentity = authProviderExternal.getUserIdentity(
                        webSession.getProgressMonitor(), sessionParameters, credentials);

                if (CommonUtils.isEmpty(user.getDisplayName())) {
                    user.setDisplayName(userIdentity.getDisplayName());
                }
                authSession = authProviderExternal.openSession(
                        webSession.getProgressMonitor(),
                        webSession,
                        sessionParameters,
                        userCredentials);

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

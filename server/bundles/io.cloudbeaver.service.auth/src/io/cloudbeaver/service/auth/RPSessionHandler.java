/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.model.app.WebAuthConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWSessionHandler;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.exception.SMException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
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
        WebAuthConfiguration appConfiguration = (WebAuthConfiguration) WebAppUtils.getWebApplication().getAppConfiguration();
        boolean isReverseProxyAuthEnabled = appConfiguration.isAuthProviderEnabled(RPAuthProvider.AUTH_PROVIDER);
        if (!configMode && isReverseProxyAuthEnabled) {
            reverseProxyAuthentication(request, webSession);
        }
        return false;
    }

    public void reverseProxyAuthentication(@NotNull HttpServletRequest request, @NotNull WebSession webSession) throws DBWebException {
        SMController securityController = webSession.getSecurityController();
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(RPAuthProvider.AUTH_PROVIDER);
        if (authProvider == null) {
            throw new DBWebException("Auth provider " + RPAuthProvider.AUTH_PROVIDER + " not found");
        }
        SMAuthProviderExternal<?> authProviderExternal = (SMAuthProviderExternal<?>) authProvider.getInstance();
        String userName = request.getHeader(RPAuthProvider.X_USER);
        String teams = request.getHeader(RPAuthProvider.X_ROLE);
        List<String> userTeams = teams == null ? Collections.emptyList() : List.of(teams.split("\\|"));
        if (userName != null) {
            try {
                Map<String, Object> credentials = new HashMap<>();
                credentials.put("user", userName);
                Map<String, Object> sessionParameters = webSession.getSessionParameters();
                sessionParameters.put(SMConstants.SESSION_PARAM_TRUSTED_USER_TEAMS, userTeams);
                Map<String, Object> userCredentials = authProviderExternal.authExternalUser(
                    webSession.getProgressMonitor(), sessionParameters, credentials);
                String currentSmSessionId = webSession.getUser() == null ? null : webSession.getUserContext().getSmSessionId();
                try {
                    SMAuthInfo smAuthInfo = securityController.authenticate(
                        webSession.getSessionId(),
                        currentSmSessionId,
                        sessionParameters,
                        WebSession.CB_SESSION_TYPE, authProvider.getId(), null, userCredentials);
                    new WebSessionAuthProcessor(webSession, smAuthInfo, false).authenticateSession();
                } catch (SMException e) {
                    log.debug("Error during user authentication", e);
                    throw e;
                }
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

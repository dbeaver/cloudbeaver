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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.model.app.ServletAuthConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWSessionHandler;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMStandardMeta;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RPSessionHandler implements DBWSessionHandler {

    private static final Log log = Log.getLog(RPSessionHandler.class);
    public static final String DEFAULT_TEAM_DELIMITER = "\\|";

    @Override
    public boolean handleSessionOpen(WebSession webSession, HttpServletRequest request, HttpServletResponse response) throws DBException, IOException {
        boolean configMode = CBApplication.getInstance().isConfigurationMode();
        //checks if the app is not in configuration mode and reverse proxy auth is enabled in the config file
        ServletAuthConfiguration appConfiguration = (ServletAuthConfiguration) ServletAppUtils.getServletApplication()
            .getAppConfiguration();
        boolean isReverseProxyAuthEnabled = appConfiguration.isAuthProviderEnabled(RPAuthProvider.AUTH_PROVIDER);
        if (!configMode && isReverseProxyAuthEnabled) {
            reverseProxyAuthentication(request, webSession);
        }
        return false;
    }

    public void reverseProxyAuthentication(@NotNull HttpServletRequest request, @NotNull WebSession webSession) throws DBException {
        SMController securityController = webSession.getSecurityController();
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(RPAuthProvider.AUTH_PROVIDER);
        if (authProvider == null) {
            throw new DBWebException("Auth provider " + RPAuthProvider.AUTH_PROVIDER + " not found");
        }
        SMAuthProviderExternal<?> authProviderExternal = (SMAuthProviderExternal<?>) authProvider.getInstance();
        SMAuthProviderCustomConfiguration configuration = ServletAppUtils.getAuthApplication()
            .getAuthConfiguration()
            .getAuthCustomConfigurations()
            .stream()
            .filter(p -> p.getProvider().equals(authProvider.toString()))
            .findFirst()
            .orElse(null);
        Map<String, Object> paramConfigMap = new HashMap<>();
        if (configuration != null) {
            authProvider.getConfigurationParameters().forEach(p ->
                paramConfigMap.put(p.getId(), configuration.getParameters().get(p.getId())
                ));
        }
        String userName = request.getHeader(
            resolveParam(paramConfigMap.get(RPConstants.PARAM_USER), RPAuthProvider.X_USER)
        );
        String teams = request.getHeader(resolveParam(paramConfigMap.get(RPConstants.PARAM_TEAM), RPAuthProvider.X_TEAM));
        // backward compatibility
        String deprecatedTeams = request.getHeader(RPAuthProvider.X_ROLE);
        if (teams == null && deprecatedTeams != null) {
            teams = deprecatedTeams;
        }
        String role = request.getHeader(resolveParam(paramConfigMap.get(RPConstants.PARAM_ROLE_NAME), RPAuthProvider.X_ROLE_TE));
        String firstName = request.getHeader(resolveParam(paramConfigMap.get(RPConstants.PARAM_FIRST_NAME), RPAuthProvider.X_FIRST_NAME));
        String lastName = request.getHeader(resolveParam(paramConfigMap.get(RPConstants.PARAM_LAST_NAME), RPAuthProvider.X_LAST_NAME));
        String fullName = request.getHeader(resolveParam(paramConfigMap.get(RPConstants.PARAM_FULL_NAME), RPAuthProvider.X_FULL_NAME));
        String logoutUrl =  null;
        String teamDelimiter = DEFAULT_TEAM_DELIMITER;
        if (configuration != null) {
            logoutUrl = configuration.getParameter(RPConstants.PARAM_LOGOUT_URL);
            teamDelimiter = resolveParam(JSONUtils.getString(configuration.getParameters(),
                RPConstants.PARAM_TEAM_DELIMITER), DEFAULT_TEAM_DELIMITER);
        }
        List<String> userTeams = teams == null ? null : (teams.isEmpty() ? List.of() : List.of(teams.split(teamDelimiter)));
        if (userName != null) {
            try {
                Map<String, Object> credentials = new HashMap<>();
                credentials.put("user", userName);
                if (!CommonUtils.isEmpty(firstName)) {
                    credentials.put(SMStandardMeta.META_FIRST_NAME, firstName);
                }
                if (!CommonUtils.isEmpty(lastName)) {
                    credentials.put(SMStandardMeta.META_LAST_NAME, lastName);
                }
                if (!CommonUtils.isEmpty(fullName)) {
                    credentials.put("fullName", fullName);
                }
                if (CommonUtils.isNotEmpty(logoutUrl)) {
                    credentials.put("logoutUrl", logoutUrl);
                }
                Map<String, Object> sessionParameters = webSession.getSessionParameters();
                sessionParameters.put(SMConstants.SESSION_PARAM_TRUSTED_USER_TEAMS, userTeams);
                sessionParameters.put(SMConstants.SESSION_PARAM_TRUSTED_USER_ROLE, role);
                Map<String, Object> userCredentials = authProviderExternal.authExternalUser(
                    webSession.getProgressMonitor(), null, credentials);
                String currentSmSessionId = webSession.getUser() == null ? null : webSession.getUserContext().getSmSessionId();
                try {
                    log.debug(MessageFormat.format(
                        "Attempting to authenticate user ''{0}'' with teams {1} through reverse proxy", userName, userTeams));
                    SMAuthInfo smAuthInfo = securityController.authenticate(
                        webSession.getSessionId(),
                        currentSmSessionId,
                        sessionParameters,
                        WebSession.CB_SESSION_TYPE, authProvider.getId(), configuration.getId(), userCredentials, false);
                    new WebSessionAuthProcessor(webSession, smAuthInfo, false).authenticateSession();
                    log.debug(MessageFormat.format(
                        "Successful reverse proxy authentication: user ''{0}'' with teams {1}", userName, userTeams));
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

    private String resolveParam(Object value, String defaultValue) {
        if (value != null && !value.toString().isEmpty()) {
            return value.toString();
        }
        return defaultValue;
    }
}

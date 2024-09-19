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
package io.cloudbeaver.server.servlets;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.CBAuthConstants;
import io.cloudbeaver.auth.SMAuthProviderFederated;
import io.cloudbeaver.model.config.CBAppConfig;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.model.session.WebActionParameters;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebServletHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.ee10.servlet.DefaultServlet;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.util.Map;

@WebServlet(urlPatterns = "/")
public class CBStaticServlet extends DefaultServlet {
    private static final String AUTO_LOGIN_ACTION = "auto-login";
    private static final String AUTO_LOGIN_AUTH_ID = "auth-id";
    private static final String ACTION = "action";
    public static final int STATIC_CACHE_SECONDS = 60 * 60 * 24 * 3;

    private static final Log log = Log.getLog(CBStaticServlet.class);

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        for (WebServletHandlerDescriptor handler : WebHandlerRegistry.getInstance().getServletHandlers()) {
            try {
                if (handler.getInstance().handleRequest(this, request, response)) {
                    return;
                }
            } catch (DBException e) {
                log.warn("Servlet handler '" + handler.getId() + "' failed", e);
            }
        }
        String uri = request.getPathInfo();
        try {
            WebSession webSession = CBPlatform.getInstance().getSessionManager().getWebSession(
                request, response, false);
            performAutoLoginIfNeeded(request, webSession);
            WebActionParameters webActionParameters = WebActionParameters.fromSession(webSession, false);
            if (CBApplication.getInstance().getAppConfiguration().isRedirectOnFederatedAuth()
                && (CommonUtils.isEmpty(uri) || uri.equals("/") || uri.equals("/index.html"))
                && request.getParameterMap().isEmpty()
                && (webActionParameters == null || !webActionParameters.getParameters().containsValue(AUTO_LOGIN_ACTION))
            ) {
                if (processSessionStart(request, response, webSession)) {
                    return;
                }
            }
        } catch (DBWebException e) {
            log.error("Error reading websession", e);
        }
        super.doGet(request, response);
    }

    private void performAutoLoginIfNeeded(HttpServletRequest request, WebSession webSession) {
        boolean isAutoLogin = CommonUtils.toBoolean(request.getParameter(CBAuthConstants.CB_AUTO_LOGIN_REQUEST_PARAM));
        if (!isAutoLogin) {
            return;
        }

        if (webSession.getUserContext().isNonAnonymousUserAuthorizedInSM()) {
            log.warn("Auto login failed: user already authorized");
            return;
        }

        String authId = request.getParameter(CBAuthConstants.CB_AUTH_ID_REQUEST_PARAM);
        if (CommonUtils.isEmpty(authId)) {
            log.warn("Auto login failed: authId not found in request");
            return;
        }
        Map<String, Object> authActionParams = Map.of(
            ACTION, AUTO_LOGIN_ACTION,
            AUTO_LOGIN_AUTH_ID, authId
        );
        WebActionParameters.saveToSession(webSession, authActionParams);
    }

    private boolean processSessionStart(HttpServletRequest request, HttpServletResponse response, WebSession webSession) {
        CBApplication application = CBApplication.getInstance();
        if (application.isConfigurationMode()) {
            return false;
        }
        CBAppConfig appConfig = application.getAppConfiguration();
        String[] authProviders = appConfig.getEnabledAuthProviders();
        if (authProviders.length == 1) {
            String authProviderId = authProviders[0];
            WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(authProviderId);
            if (authProvider != null && authProvider.isConfigurable()) {
                SMAuthProviderCustomConfiguration activeAuthConfig = null;
                for (SMAuthProviderCustomConfiguration cfg : appConfig.getAuthCustomConfigurations()) {
                    if (!cfg.isDisabled() && cfg.getProvider().equals(authProviderId)) {
                        if (activeAuthConfig != null) {
                            return false;
                        }
                        activeAuthConfig = cfg;
                    }
                }
                if (activeAuthConfig == null) {
                    return false;
                }

                try {
                    // We have the only provider
                    // Forward to signon URL
                    SMAuthProvider<?> authProviderInstance = authProvider.getInstance();
                    if (authProviderInstance instanceof SMAuthProviderFederated) {
                        if (webSession.getUser() == null) {
                            var securityController = webSession.getSecurityController();
                            SMAuthInfo authInfo = securityController.authenticate(
                                webSession.getSessionId(),
                                null,
                                webSession.getSessionParameters(),
                                WebSession.CB_SESSION_TYPE,
                                authProvider.getId(),
                                activeAuthConfig.getId(),
                                Map.of(),
                                false
                            );
                            String signInLink = authInfo.getRedirectUrl();
                            //ignore current routing if non-root page is open
                            if (!signInLink.endsWith("#")) {
                                signInLink += "#";
                            }
                            if (!CommonUtils.isEmpty(signInLink)) {
                                // Redirect to it
                                Map<String, Object> authActionParams = Map.of(
                                    ACTION, AUTO_LOGIN_ACTION,
                                    AUTO_LOGIN_AUTH_ID, authInfo.getAuthAttemptId()
                                );
                                WebActionParameters.saveToSession(webSession, authActionParams);
                                request.getSession().setAttribute(DBWConstants.STATE_ATTR_SIGN_IN_STATE, DBWConstants.SignInState.GLOBAL);
                                response.sendRedirect(signInLink);
                                return true;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Error reading auth provider configuration", e);
                }
            }
        }

        return false;
    }

}
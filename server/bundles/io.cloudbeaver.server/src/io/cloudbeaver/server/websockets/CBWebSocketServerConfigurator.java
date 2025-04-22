/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebHttpRequestInfo;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.Servlet;
import jakarta.servlet.http.HttpSession;
import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;
import org.eclipse.jetty.ee10.websocket.jakarta.server.internal.JakartaWebSocketCreator;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.exception.SMAccessTokenExpiredException;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.WSClientUtils;

import java.util.List;

public class CBWebSocketServerConfigurator extends ServerEndpointConfig.Configurator {
    private static final Log log = Log.getLog(CBWebSocketServerConfigurator.class);

    public static final String PROP_WEB_SESSION = "cb-session";
    public static final String PROP_TOKEN_EXPIRED = "cb-token-expired";

    @NotNull
    private final WebAppSessionManager webSessionManager;

    public CBWebSocketServerConfigurator(@NotNull WebAppSessionManager sessionManager) {
        this.webSessionManager = sessionManager;
    }

    @Override
    public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response) {
        String sessionId = request.getHttpSession() instanceof HttpSession httpSession ? httpSession.getId() : null;

        String userAgentHeader = request.getHeaders()
            .get(WebHttpRequestInfo.USER_AGENT)
            .stream()
            .findFirst()
            .orElse(null);

        WebHttpRequestInfo requestInfo = new WebHttpRequestInfo(
            sessionId,
            sec.getUserProperties().get(JakartaWebSocketCreator.PROP_LOCALES),
            CommonUtils.toString(sec.getUserProperties().get(JakartaWebSocketCreator.PROP_REMOTE_ADDRESS)),
            userAgentHeader
        );

        var webSession = webSessionManager.getOrRestoreWebSession(requestInfo);

        if (webSession != null) {
            webSession.updateSessionParameters(requestInfo);
            // web client session
            sec.getUserProperties().put(PROP_WEB_SESSION, webSession);
        }
        // possible desktop client session
        try {
            var headlessSession = createHeadlessSession(requestInfo, request);
            if (headlessSession != null) {
                sec.getUserProperties().put(PROP_WEB_SESSION, headlessSession);
            } else  {
                log.trace("Couldn't create headless session");
            }
        } catch (SMAccessTokenExpiredException e) {
            sec.getUserProperties().put(PROP_TOKEN_EXPIRED, true);
        } catch (DBException e) {
            log.error("Error resolve websocket session", e);
            throw new RuntimeException(e.getMessage(), e);
        }
        if (sec.getUserProperties().get(PROP_WEB_SESSION) == null) {
            throw new RuntimeException("No web session found for websocket request");
        }
    }


    @Nullable
    private WebHeadlessSession createHeadlessSession(
        @NotNull WebHttpRequestInfo requestInfo,
        @NotNull HandshakeRequest request
    ) throws DBException {
        if (request.getHeaders() == null) {
            return null;
        }
        List<String> tokenHeaders = WSClientUtils.getHeaders(request.getHeaders(), WSConstants.WS_AUTH_HEADER);
        if (CommonUtils.isEmpty(tokenHeaders)) {
            return null;
        }
        String smAccessToken = tokenHeaders.stream()
            .findFirst()
            .orElse(null);
        return webSessionManager.getHeadlessSession(smAccessToken, requestInfo, true);
    }
}

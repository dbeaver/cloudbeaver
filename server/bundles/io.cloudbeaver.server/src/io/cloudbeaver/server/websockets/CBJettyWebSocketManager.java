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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.server.AppWebSessionManager;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebHttpRequestInfo;
import io.cloudbeaver.server.CBPlatform;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.util.Callback;
import org.eclipse.jetty.websocket.server.ServerUpgradeRequest;
import org.eclipse.jetty.websocket.server.ServerUpgradeResponse;
import org.eclipse.jetty.websocket.server.WebSocketCreator;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.exception.SMAccessTokenExpiredException;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class CBJettyWebSocketManager implements WebSocketCreator {
    private static final Log log = Log.getLog(CBJettyWebSocketManager.class);
    private final Map<String, List<CBEventsWebSocket>> socketBySessionId = new ConcurrentHashMap<>();
    private final AppWebSessionManager webSessionManager;

    public CBJettyWebSocketManager(@NotNull AppWebSessionManager webSessionManager) {
        this.webSessionManager = webSessionManager;

        new WebSocketPingPongJob(CBPlatform.getInstance(), this).scheduleMonitor();
    }

    @Nullable
    @Override
    public Object createWebSocket(@NotNull ServerUpgradeRequest request, ServerUpgradeResponse resp, Callback callback) {
        var webSession = webSessionManager.getOrRestoreSession(request);
        var requestInfo = new WebHttpRequestInfo(
            request.getId(),
            request.getAttribute("locale"),
            Request.getRemoteAddr(request),
            request.getHeaders().get("User-Agent")
        );
        if (webSession != null) {
            webSession.updateSessionParameters(requestInfo);
            // web client session
            return createNewEventsWebSocket(webSession);
        }
        // possible desktop client session
        try {
            var headlessSession = createHeadlessSession(request);
            if (headlessSession == null) {
                log.debug("Couldn't create headless session");
                return null;
            }
            return createNewEventsWebSocket(headlessSession);
        } catch (SMAccessTokenExpiredException e) {
            return new CBExpiredSessionWebSocket();
        } catch (DBException e) {
            log.error("Error resolve websocket session", e);
            return null;
        }
    }

    @NotNull
    private CBEventsWebSocket createNewEventsWebSocket(@NotNull BaseWebSession webSession) {
        var sessionId = webSession.getSessionId();
        var newWebSocket = new CBEventsWebSocket(webSession);
        socketBySessionId.computeIfAbsent(sessionId, key -> new CopyOnWriteArrayList<>())
            .add(newWebSocket);
        log.info("Websocket created for session: " + sessionId);
        return newWebSocket;
    }

    @Nullable
    private WebHeadlessSession createHeadlessSession(@NotNull Request request) throws DBException {
        var requestSession = request.getSession(false);
        if (requestSession == null) {
            log.debug("CloudBeaver web session not exist, try to create headless session");
        } else {
            log.debug("CloudBeaver session not found with id " + requestSession.getId() + ", try to create headless session");
        }
        return webSessionManager.getHeadlessSession(request, requestSession, true);
    }

    public void sendPing() {
        //remove expired sessions
        socketBySessionId.entrySet()
            .removeIf(entry -> {
                entry.getValue().removeIf(ws -> !ws.isOpen());
                    return webSessionManager.getSession(entry.getKey()) == null ||
                        entry.getValue().isEmpty();
                }
            );

        socketBySessionId.entrySet()
            .stream()
            .parallel()
            .forEach(
                entry -> {
                    var sessionId = entry.getKey();
                    var webSockets = entry.getValue();
                    for (CBEventsWebSocket webSocket : webSockets) {
                        try {
                            webSocket.getSession().sendPing(
                                ByteBuffer.wrap("cb-ping".getBytes(StandardCharsets.UTF_8)),
                                webSocket.getCallback()
                            );
                        } catch (Exception e) {
                            log.error("Failed to send ping in web socket: " + sessionId);
                        }
                    }
                }
            );
    }
}

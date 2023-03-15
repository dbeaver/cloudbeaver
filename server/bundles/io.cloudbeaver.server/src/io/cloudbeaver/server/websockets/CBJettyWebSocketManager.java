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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.session.WebSessionManager;
import org.eclipse.jetty.websocket.server.JettyServerUpgradeRequest;
import org.eclipse.jetty.websocket.server.JettyServerUpgradeResponse;
import org.eclipse.jetty.websocket.server.JettyWebSocketCreator;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CBJettyWebSocketManager implements JettyWebSocketCreator {
    private static final Log log = Log.getLog(CBJettyWebSocketManager.class);
    private final Map<String, CBEventsWebSocket> socketBySessionId = new ConcurrentHashMap<>();

    private final WebSessionManager webSessionManager;

    public CBJettyWebSocketManager(@NotNull WebSessionManager webSessionManager) {
        this.webSessionManager = webSessionManager;

        new WebSocketPingPongJob(CBPlatform.getInstance(), this).scheduleMonitor();
    }

    @Override
    public Object createWebSocket(JettyServerUpgradeRequest request, JettyServerUpgradeResponse resp) {
        BaseWebSession webSession;
        try {
            webSession = resolveWebSession(request);
        } catch (DBException e) {
            log.error("Error resolve websocket session", e);
            return null;
        }
        if (webSession == null) {
            return null;
        }
        var webSessionId = webSession.getSessionId();
        var oldWebSocket = socketBySessionId.get(webSessionId);
        if (oldWebSocket != null) {
            oldWebSocket.close();
        }
        var newWebSocket = new CBEventsWebSocket(webSession);
        socketBySessionId.put(webSessionId, newWebSocket);
        log.info("Websocket created for session: " + webSessionId);
        return newWebSocket;
    }

    @Nullable
    private BaseWebSession resolveWebSession(JettyServerUpgradeRequest request) throws DBException {
        if (request.getHttpServletRequest().getSession() == null) {
            log.debug("CloudBeaver web session not exist, try to create headless session");
            return webSessionManager.getHeadlessSession(request.getHttpServletRequest(), true);
        }
        var webSessionId = request.getHttpServletRequest().getSession().getId();
        var webSession = webSessionManager.getSession(webSessionId);
        if (webSession != null) {
            return webSession;
        }
        log.error("CloudBeaver session not found with id " + webSessionId + ", try to create headless session");

        return webSessionManager.getHeadlessSession(request.getHttpServletRequest(), true);
    }

    public void sendPing() {
        //remove expired sessions
        socketBySessionId.entrySet()
            .removeIf(entry ->
                entry.getValue().isNotConnected() || webSessionManager.getSession(entry.getKey()) == null
            );

        socketBySessionId.entrySet()
            .stream()
            .parallel()
            .forEach(
                entry -> {
                    var sessionId = entry.getKey();
                    var webSocket = entry.getValue();
                    try {
                        webSocket.getRemote().sendPing(
                            ByteBuffer.wrap("cb-ping".getBytes(StandardCharsets.UTF_8)),
                            webSocket.getCallback()
                        );
                    } catch (Exception e) {
                        log.error("Failed to send ping in web socket: " + sessionId);
                    }
                }
            );
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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

import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class CBJettyWebSocketManager {
    private static final Log log = Log.getLog(CBJettyWebSocketManager.class);
    private static final Map<String, List<CBEventsWebSocket>> socketBySessionId = new ConcurrentHashMap<>();

    private CBJettyWebSocketManager() {
    }

    public static void registerWebSocket(@NotNull String webSessionId, @NotNull CBEventsWebSocket webSocket) {
        socketBySessionId.computeIfAbsent(webSessionId, key -> new CopyOnWriteArrayList<>()).add(webSocket);
    }

    /**
     * Re-keys a live web socket from the old session id to the new one after a session rotation,
     * so that keep-alive pings keep being delivered to it.
     */
    public static void migrateWebSocket(
        @NotNull String oldSessionId,
        @NotNull String newSessionId,
        @NotNull CBEventsWebSocket webSocket
    ) {
        List<CBEventsWebSocket> oldSockets = socketBySessionId.get(oldSessionId);
        if (oldSockets != null) {
            oldSockets.remove(webSocket);
            if (oldSockets.isEmpty()) {
                socketBySessionId.remove(oldSessionId);
            }
        }
        registerWebSocket(newSessionId, webSocket);
    }

    public static void sendPing() {
        //remove expired sessions
        WebAppSessionManager webSessionManager = WebAppUtils.getWebApplication().getSessionManager();
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
                            webSocket.getSession().getBasicRemote().sendPing(
                                ByteBuffer.wrap("cb-ping".getBytes(StandardCharsets.UTF_8))
                            );
                        } catch (Exception e) {
                            log.error("Failed to send ping in web socket: " + sessionId);
                        }
                    }
                }
            );
    }
}

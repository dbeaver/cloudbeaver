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
package io.cloudbeaver.server.websockets;

import com.google.gson.Gson;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.events.CBEvent;
import io.cloudbeaver.events.CBEventConstants;
import io.cloudbeaver.events.CBWebSessionEventHandler;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.websockets.model.WebSocketClientEvent;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;
import org.jkiss.dbeaver.Log;

import java.io.IOException;

public class CBEventsWebSocket extends WebSocketAdapter implements CBWebSessionEventHandler {
    private static final Gson gson = new Gson();
    private static final Log log = Log.getLog(CBEventsWebSocket.class);

    private WebSession webSession;

    @Override
    public void onWebSocketConnect(Session session) {
        var request = session.getUpgradeRequest();
        var cbSessionIdCookie = request.getCookies().stream()
                .filter(httpCookie -> httpCookie.getName().equals(CBConstants.CB_SESSION_COOKIE_NAME))
                .findFirst();
        if (cbSessionIdCookie.isEmpty()) {
            log.error("CloudBeaver session id is not present in create websocket request cookies");
            throw new RuntimeException("Failed associate websocket session with cb session");
        }
        var cbSessionId = cbSessionIdCookie.get().getValue();
        this.webSession = CBPlatform.getInstance().getSessionManager()
                .getWebSession(cbSessionId);
        super.onWebSocketConnect(session);
        this.webSession.addEventHandler(this);
        log.debug("EventWebSocket connected to the " + cbSessionId + " session");
    }

    @Override
    public void onWebSocketText(String message) {
        super.onWebSocketText(message);
        var clientEvent = gson.fromJson(message, WebSocketClientEvent.class);
        if (clientEvent.getType() == null) {
            webSession.addSessionError(
                new DBWebException("Invalid websocket event: " + message)
            );
        }
        switch (clientEvent.getType()) {
            case CBEventConstants.ClientEvents.TOPIC_SUBSCRIBE: {
                this.webSession.subscribeOnEventTopic(clientEvent.getTopic());
                break;
            }
            case CBEventConstants.ClientEvents.TOPIC_UNSUBSCRIBE: {
                this.webSession.unsubscribeFromEventTopic(clientEvent.getTopic());
                break;
            }
            default:
                webSession.addSessionError(
                    new DBWebException("Unknown websocket client event: " + clientEvent.getType())
                );
        }
    }

    @Override
    public void onWebSocketClose(int statusCode, String reason) {
        super.onWebSocketClose(statusCode, reason);
        this.webSession.removeEventHandler(this);
        log.debug("Socket Closed: [" + statusCode + "] " + reason);
    }

    @Override
    public void onWebSocketError(Throwable cause) {
        super.onWebSocketError(cause);
        log.error(cause.getMessage(), cause);
        if (webSession != null) {
            webSession.addSessionError(cause);
        }
    }

    public void awaitClosure() throws InterruptedException {
        log.debug("Awaiting closure from remote");
    }

    @Override
    public void handeWebSessionEvent(CBEvent event) {
        if (isNotConnected()) {
            return;
        }
        try {
            getRemote().sendString(gson.toJson(event));
        } catch (IOException e) {
            log.error("Failed to send websocket message", e);
            webSession.addSessionError(e);
        }
    }

    @Override
    public void close() {
        getSession().close();
    }
}

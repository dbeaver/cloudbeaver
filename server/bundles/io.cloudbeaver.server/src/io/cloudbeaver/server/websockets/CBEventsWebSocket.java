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
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.websocket.CBWebSessionEventHandler;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSClientEvent;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

import java.io.IOException;

public class CBEventsWebSocket extends WebSocketAdapter implements CBWebSessionEventHandler {
    private static final Gson gson = new Gson();
    private static final Log log = Log.getLog(CBEventsWebSocket.class);

    @NotNull
    private final BaseWebSession webSession;

    public CBEventsWebSocket(@NotNull BaseWebSession webSession) {
        this.webSession = webSession;
    }

    @Override
    public void onWebSocketConnect(Session session) {
        super.onWebSocketConnect(session);
        this.webSession.addEventHandler(this);
        log.debug("EventWebSocket connected to the " + webSession.getSessionId() + " session");
    }

    @Override
    public void onWebSocketText(String message) {
        super.onWebSocketText(message);
        var clientEvent = gson.fromJson(message, WSClientEvent.class);
        if (clientEvent.getId() == null) {
            webSession.addSessionError(
                new DBWebException("Invalid websocket event: " + message)
            );
        }
        switch (clientEvent.getId()) {
            case WSConstants.ClientEvents.TOPIC_SUBSCRIBE: {
                this.webSession.subscribeOnEventTopic(clientEvent.getTopicId());
                break;
            }
            case WSConstants.ClientEvents.TOPIC_UNSUBSCRIBE: {
                this.webSession.unsubscribeFromEventTopic(clientEvent.getTopicId());
                break;
            }
            default:
                var e = new DBWebException("Unknown websocket client event: " + clientEvent.getId());
                log.error(e.getMessage(), e);
                webSession.addSessionError(e);
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
        webSession.addSessionError(cause);
    }

    public void awaitClosure() throws InterruptedException {
        log.debug("Awaiting closure from remote");
    }

    @Override
    public void handeWebSessionEvent(WSEvent event) {
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
        onWebSocketClose(WSConstants.NORMAL_STATUS, "Closed by web session");
    }

    @NotNull
    public BaseWebSession getWebSession() {
        return webSession;
    }
}

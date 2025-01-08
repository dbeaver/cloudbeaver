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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.websocket.CBWebSessionEventHandler;
import jakarta.websocket.*;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSClientEvent;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.client.WSSessionPingClientEvent;
import org.jkiss.dbeaver.model.websocket.event.client.WSSubscribeOnTopicClientEvent;
import org.jkiss.dbeaver.model.websocket.event.client.WSUnsubscribeFromTopicClientEvent;
import org.jkiss.dbeaver.model.websocket.event.client.WSUpdateActiveProjectsClientEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSAccessTokenExpiredEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSSocketConnectedEvent;
import org.jkiss.utils.CommonUtils;

import java.time.Duration;

public class CBEventsWebSocket extends CBAbstractWebSocket implements CBWebSessionEventHandler {
    private static final Log log = Log.getLog(CBEventsWebSocket.class);

    @Nullable
    private BaseWebSession webSession;

    @Override
    public void onOpen(Session session, EndpointConfig config) {
        super.onOpen(session, config);
        if (session.getUserProperties().containsKey(CBWebSocketServerConfigurator.PROP_TOKEN_EXPIRED)) {
            handleEvent(new WSAccessTokenExpiredEvent());
            close();
        } else {
            this.webSession = (BaseWebSession) session.getUserProperties()
                .get(CBWebSocketServerConfigurator.PROP_WEB_SESSION);
            this.webSession.addEventHandler(this);
            handleEvent(new WSSocketConnectedEvent(webSession.getApplication().getApplicationRunId()));
            log.debug("EventWebSocket connected to the " + webSession.getSessionId() + " session");

            session.setMaxIdleTimeout(Duration.ofMinutes(5).toMillis());
            session.addMessageHandler(String.class, new FromUserEventHandler());
            session.addMessageHandler(PongMessage.class, new WebSocketPingPongCallback(webSession));

            CBJettyWebSocketManager.registerWebSocket(webSession.getSessionId(), this);
        }
    }

    private class FromUserEventHandler implements MessageHandler.Whole<String> {
        @Override
        public void onMessage(String message) {
            if (CommonUtils.isEmpty(message)) {
                return;
            }
            if (webSession == null) {
                log.warn("No web session for browser event");
                return;
            }
            WSClientEvent clientEvent;
            try {
                clientEvent = CBAbstractWebSocket.gson.fromJson(message, WSClientEvent.class);
            } catch (Exception e) {
                if (webSession != null) {
                    webSession.addSessionError(
                        new DBWebException("Invalid websocket event: " + e.getMessage())
                    );
                }
                log.error("Error parsing websocket event: " + e.getMessage(), e);
                return;
            }
            if (clientEvent.getId() == null) {
                webSession.addSessionError(
                    new DBWebException("Invalid websocket event: " + message)
                );
                return;
            }
            switch (clientEvent.getId()) {
                case WSSubscribeOnTopicClientEvent.ID: {
                    webSession.getEventsFilter().subscribeOnEventTopic(clientEvent.getTopicId());
                    break;
                }
                case WSUnsubscribeFromTopicClientEvent.ID: {
                    webSession.getEventsFilter().unsubscribeFromEventTopic(clientEvent.getTopicId());
                    break;
                }
                case WSUpdateActiveProjectsClientEvent.ID: {
                    var projectEvent = (WSUpdateActiveProjectsClientEvent) clientEvent;
                    webSession.getEventsFilter().setSubscribedProjects(projectEvent.getProjectIds());
                    break;
                }
                case WSSessionPingClientEvent.ID: {
                    if (webSession instanceof WebSession session) {
                        session.updateInfo(true);
                    }
                    break;
                }
                default:
                    var e = new DBWebException("Unknown websocket client event: " + clientEvent.getId());
                    log.error(e.getMessage(), e);
                    webSession.addSessionError(e);
            }
        }
    }

    @Override
    public void onClose(Session session, CloseReason closeReason) {
        super.onClose(session, closeReason);
        log.debug("Socket Closed: [" + closeReason.getCloseCode() + "] " + closeReason.getReasonPhrase());
        if (webSession != null) {
            this.webSession.removeEventHandler(this);
        }
    }

    @Override
    public void handleWebSessionEvent(WSEvent event) {
        super.handleEvent(event);
    }

    @Override
    public void onError(Session session, Throwable thr) {
        if (webSession != null) {
            webSession.addSessionError(thr);
        }
        log.trace("Error in websocket session: " + thr.getMessage(), thr);
    }

    @Override
    protected void handleEventException(Throwable e) {
        super.handleEventException(e);
        if (webSession != null) {
            webSession.addSessionError(e);
        }
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
package io.cloudbeaver.server.websockets.lsp;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.server.websockets.CBAbstractWebSocket;
import io.cloudbeaver.server.websockets.CBJettyWebSocketManager;
import io.cloudbeaver.server.websockets.CBWebSocketServerConfigurator;
import jakarta.websocket.CloseReason;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.Session;
import org.jkiss.dbeaver.Log;

public abstract class LSPWebSocket extends CBAbstractWebSocket {
    private static final Log log = Log.getLog(LSPWebSocket.class);

    private LSPWebSocketMessageHandler handler;

    @Override
    public void onOpen(Session session, EndpointConfig endpointConfig) {
        BaseWebSession webSession = (BaseWebSession) session.getUserProperties()
            .get(CBWebSocketServerConfigurator.PROP_WEB_SESSION);
        handler = new LSPWebSocketMessageHandler(webSession);
        session.addMessageHandler(handler);
        CBJettyWebSocketManager.registerWebSocket(webSession.getSessionId(), this);

        session.setMaxIdleTimeout(LSPWebSocketConstants.IDLE_TIMEOUT.toMillis());
        session.setMaxTextMessageBufferSize(Integer.MAX_VALUE);
        session.setMaxBinaryMessageBufferSize(Integer.MAX_VALUE);
    }

    @Override
    public void onClose(Session session, CloseReason closeReason) {
        log.debug("Closing websocket session: " + session.getId());
        handler.close();
    }

    @Override
    public void onError(Session session, Throwable thr) {
        log.error("LSP WebSocket error", thr);
    }
}

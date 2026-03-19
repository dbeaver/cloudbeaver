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
import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.websocket.jakarta.WebSocketLauncherBuilder;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.lsp.DBLServer;

public class LSPWebSocketEndpoint extends CBAbstractWebSocket {
    private static final Log log = Log.getLog(LSPWebSocketEndpoint.class);

    public LSPWebSocketEndpoint() {}

    @Override
    public void onOpen(Session wsSession, EndpointConfig endpointConfig) {
        BaseWebSession webSession = (BaseWebSession) wsSession.getUserProperties()
            .get(CBWebSocketServerConfigurator.PROP_WEB_SESSION);
        CBJettyWebSocketManager.registerWebSocket(webSession.getSessionId(), this);

        wsSession.setMaxIdleTimeout(LSPWebSocketConstants.IDLE_TIMEOUT.toMillis());
        wsSession.setMaxTextMessageBufferSize(Integer.MAX_VALUE);
        wsSession.setMaxBinaryMessageBufferSize(Integer.MAX_VALUE);

        LSPWebServerSessionProvider sessionProvider = new LSPWebServerSessionProvider(webSession);
        DBLServer server = new DBLServer(sessionProvider);
        Launcher<LanguageClient> launcher = new WebSocketLauncherBuilder<LanguageClient>()
            .setSession(wsSession)
            .setLocalService(server)
            .setRemoteInterface(LanguageClient.class)
            .create();
        launcher.startListening();
    }

    @Override
    public void onClose(Session session, CloseReason closeReason) {
        log.debug("Closing websocket session: " + session.getId());
    }

    @Override
    public void onError(Session session, Throwable thr) {
        log.error("LSP WebSocket error", thr);
    }
}

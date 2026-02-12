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
package io.cloudbeaver.lsp.websocket;

import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.websockets.CBWebSocketServerConfigurator;
import io.cloudbeaver.service.DBWServiceBindingWebSocket;
import io.cloudbeaver.service.DBWWebSocketContext;
import jakarta.websocket.server.ServerEndpointConfig;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;

public class LSPWebSocketServiceBinding
    implements DBWServiceBindingWebSocket<CBApplication<?>> {

    @Override
    public boolean isApplicable(@NotNull ServletApplication application) {
        return DBWServiceBindingWebSocket.super.isApplicable(application);
    }

    @Override
    public void addWebSockets(@NotNull CBApplication<?> application, @NotNull DBWWebSocketContext context) throws DBException {
        String uri = application.getServicesURI() + LSPWebSocketConstants.ENDPOINT_SUFFIX;
        ServerEndpointConfig endpointConfig = ServerEndpointConfig.Builder.create(LSPWebSocket.class, uri)
            .configurator(new CBWebSocketServerConfigurator(application.getSessionManager()))
            .build();
        context.addWebSocket(endpointConfig);
    }
}

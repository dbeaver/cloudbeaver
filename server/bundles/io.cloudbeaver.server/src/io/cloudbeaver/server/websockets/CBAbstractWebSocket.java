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

import com.google.gson.Gson;
import jakarta.websocket.Endpoint;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.Session;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSUtils;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

public abstract class CBAbstractWebSocket extends Endpoint {
    private static final Log log = Log.getLog(CBAbstractWebSocket.class);
    protected static final Gson gson = WSUtils.clientGson;

    @Nullable
    private Session webSocketSession;

    @Override
    public void onOpen(Session session, EndpointConfig config) {
        this.webSocketSession = session;
    }

    public void handleEvent(WSEvent event) {
        if (!isOpen()) {
            return;
        }
        try {
            webSocketSession.getBasicRemote().sendText(
                gson.toJson(event)
            );
        } catch (Exception e) {
            handleEventException(e);
        }
    }

    protected boolean isOpen() {
        return webSocketSession != null && webSocketSession.isOpen();
    }

    protected void handleEventException(Throwable e) {
        log.error("Failed to send websocket message", e);
    }

    public void close() {
        if (isOpen()) {
            try {
                getSession().close();
            } catch (Exception e) {
                log.error("Failed to close websocket", e);
            }
        }
    }

    @Nullable
    public Session getSession() {
        return webSocketSession;
    }

}

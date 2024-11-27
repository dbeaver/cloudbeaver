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
import org.eclipse.jetty.websocket.api.Callback;
import org.eclipse.jetty.websocket.api.Session;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSUtils;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;

public class CBAbstractWebSocket extends Session.Listener.AbstractAutoDemanding {
    private static final Log log = Log.getLog(CBAbstractWebSocket.class);
    protected static final Gson gson = WSUtils.clientGson;

    public void handleEvent(WSEvent event) {
        if (!isOpen()) {
            return;
        }
        Session session = getSession();
        session.sendText(gson.toJson(event), new Callback() {
            @Override
            public void fail(Throwable e) {
                handleEventException(e);
            }
        });

    }

    protected void handleEventException(Throwable e) {
        log.error("Failed to send websocket message", e);
    }

    public void close() {
        var session = getSession();
        // the socket may not be connected to the client
        if (session != null) {
            getSession().close();
        }
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPEvent;
import org.jkiss.dbeaver.model.DBPEventListener;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceConnectEvent;

/**
 * Sends a WebSocket event when a data source is connected.
 */
public class WebDataSourceConnectEventListener implements DBPEventListener {

    @NotNull
    private final WebSession webSession;

    public WebDataSourceConnectEventListener(@NotNull WebSession webSession) {
        this.webSession = webSession;
    }

    @Override
    public void handleDataSourceEvent(DBPEvent event) {
        if (!(event.getObject() instanceof DBPDataSourceContainer container)) {
            return;
        }

        if (event.getAction() == DBPEvent.Action.AFTER_CONNECT && event.getEnabled()) {
            webSession.addSessionEvent(
                new WSDataSourceConnectEvent(
                    container.getProject().getId(),
                    container.getId(),
                    webSession.getSessionId(),
                    webSession.getUserId()
                )
            );
        }
    }
}

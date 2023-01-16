/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import io.cloudbeaver.server.CBPlatform;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

/**
 * WebSessionMonitorJob
 */
class WebSocketPingPongJob extends AbstractJob {
    private static final int INTERVAL = 1000 * 60 * 1; // once per 1 min
    private final CBPlatform platform;
    private final CBJettyWebSocketManager webSocketManager;

    public WebSocketPingPongJob(CBPlatform platform, CBJettyWebSocketManager webSocketManager) {
        super("WebSocket monitor");
        this.platform = platform;
        setUser(false);
        setSystem(true);
        this.webSocketManager = webSocketManager;
    }

    @Override
    protected IStatus run(DBRProgressMonitor monitor) {
        if (platform.isShuttingDown()) {
            return Status.OK_STATUS;
        }

        webSocketManager.sendPing();

        if (!platform.isShuttingDown()) {
            scheduleMonitor();
        }
        return Status.OK_STATUS;
    }

    void scheduleMonitor() {
        schedule(INTERVAL);
    }

}
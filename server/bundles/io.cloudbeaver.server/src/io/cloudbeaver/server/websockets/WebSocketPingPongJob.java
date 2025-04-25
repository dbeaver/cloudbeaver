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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.server.BaseWebPlatform;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;

import java.time.Duration;

/**
 * WebSessionMonitorJob
 */
public class WebSocketPingPongJob extends AbstractJob {
    private static final long INTERVAL = Duration.ofSeconds(30).toMillis(); // once per 1 min
    private final BaseWebPlatform platform;

    public WebSocketPingPongJob(BaseWebPlatform platform) {
        super("WebSocket monitor");
        this.platform = platform;
        setUser(false);
        setSystem(true);
    }

    @Override
    protected IStatus run(DBRProgressMonitor monitor) {
        if (platform.isShuttingDown()) {
            return Status.OK_STATUS;
        }

        CBJettyWebSocketManager.sendPing();

        if (!platform.isShuttingDown()) {
            scheduleMonitor();
        }
        return Status.OK_STATUS;
    }

    public void scheduleMonitor() {
        schedule(INTERVAL);
    }

}
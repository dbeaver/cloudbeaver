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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.PeriodicJob;

import java.time.Duration;

public class LongPollingMonitorJob extends PeriodicJob {

    private static final Log log = Log.getLog(LongPollingMonitorJob.class);
    private static final Duration INTERVAL = Duration.ofSeconds(30);

    private final CBEventsLongPollingServlet longPolling;

    public LongPollingMonitorJob(
        @NotNull DBPPlatform platform,
        @NotNull CBEventsLongPollingServlet longPolling
    ) {
        super("LongPolling monitor", platform, INTERVAL);
        this.longPolling = longPolling;
    }

    @Override
    protected void doJob(@NotNull DBRProgressMonitor monitor) {
        if (!longPolling.isRunning()) {
            return;
        }

        try {
            longPolling.cleanupIdleSessions();
        } catch (Throwable t) {
            log.error("Error during cleanup of long-polling sessions", t);
        }
    }
}

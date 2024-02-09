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
package io.cloudbeaver.server.jobs;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceDisconnectEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.jobs.DataSourceMonitorJob;

import java.util.Collection;
import java.util.function.Supplier;

/**
 * Web data source monitor job.
 */
public class WebDataSourceMonitorJob extends DataSourceMonitorJob {

    public WebDataSourceMonitorJob(DBPPlatform platform) {
        super(platform);
    }

    @Override
    protected void doJob() {
        Collection<BaseWebSession> allSessions = CBPlatform.getInstance().getSessionManager().getAllActiveSessions();
        allSessions.parallelStream().forEach(s -> {
            checkDataSourceAliveInWorkspace(s.getWorkspace(), s::getLastAccessTimeMillis);
        });

    }

    @Override
    public long getLastUserActivityTime(long lastUserActivityTime) {
        if (DBWorkbench.getPlatform().getApplication() instanceof CBApplication app) {
            lastUserActivityTime = app.getMaxSessionIdleTime();
        }
        return lastUserActivityTime;
    }

    @Override
    public void showNotification (DBPDataSource dataSource, DBPDataSourceContainer dsDescriptor) {
        if (DBWorkbench.getPlatform().getApplication() instanceof CBApplication app) {
            app.getEventController().addEvent(new WSDataSourceDisconnectEvent(WSEventType.DATASOURCE_DISCONNECTED, dataSource.getName()));
        }
    }
}

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
package io.cloudbeaver.server.jobs;

import io.cloudbeaver.model.app.AppWebSessionManager;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.runtime.jobs.DataSourceMonitorJob;

import java.util.Collection;
import java.util.List;

/**
 * Web data source monitor job.
 */
public class WebDataSourceMonitorJob extends DataSourceMonitorJob {
    private final AppWebSessionManager sessionManager;

    public WebDataSourceMonitorJob(
        @NotNull DBPPlatform platform,
        @NotNull AppWebSessionManager sessionManager
    ) {
        super(platform);
        this.sessionManager = sessionManager;
    }

    @Override
    protected void doJob() {
        Collection<BaseWebSession> allSessions = sessionManager.getAllActiveSessions();
        allSessions.parallelStream().forEach(s -> {
            checkDataSourceAliveInWorkspace(s.getWorkspace(), s.getLastAccessTimeMillis());
        });

    }

    @Override
    protected void showNotification(@NotNull DBPDataSource dataSource) {
        final DBPProject project = dataSource.getContainer().getProject();
        if (project.getWorkspaceSession() instanceof WebSession webSession) {
            // TODO: Add new event for disconnect datasource
            webSession.addSessionEvent(WSDataSourceEvent.update(
                webSession.getSessionId(),
                webSession.getUserId(),
                project.getId(),
                List.of(dataSource.getContainer().getId()),
                WSDataSourceProperty.CONFIGURATION
            ));
        }
    }
}

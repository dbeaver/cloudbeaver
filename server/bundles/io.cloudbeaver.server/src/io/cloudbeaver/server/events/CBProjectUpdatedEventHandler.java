/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.server.events;

import io.cloudbeaver.events.CBEvent;
import io.cloudbeaver.events.CBEventConstants;
import io.cloudbeaver.events.CBEventHandler;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Notify all active user session that project has been updated
 */
public class CBProjectUpdatedEventHandler implements CBEventHandler {
    private static final Log log = Log.getLog(CBProjectUpdatedEventHandler.class);

    @NotNull
    @Override
    public String getSupportedEventType() {
        return CBEventConstants.CLOUDBEAVER_PROJECT_UPDATED;
    }

    @Override
    public void handleEvent(@NotNull CBEvent event) {
        log.debug(getSupportedEventType() + " event handled");
        Collection<WebSession> allSessions = CBPlatform.getInstance().getSessionManager().getAllActiveSessions();
        List<String> projects = JSONUtils.getStringList(event.getEventData(), "projects");
        for (WebSession activeUserSession : allSessions) {
            List<String> availableProjectIds = activeUserSession.getAccessibleProjects().stream()
                .map(DBPProject::getId).collect(Collectors.toList());
            if (Collections.disjoint(availableProjectIds, projects)) {
                continue;
            }
            activeUserSession.refreshUserData();
        }
    }
}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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

import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSNetworkProfileEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;

public class WSNetworkProfileEventHandler extends WSDefaultEventHandler<WSNetworkProfileEvent> {
    private static final Log log = Log.getLog(WSNetworkProfileEventHandler.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSNetworkProfileEvent event) {
        if (event.getProjectId() != null) {
            if (activeUserSession instanceof WebSession webSession) {
                WebSessionProjectImpl project = webSession.getProjectById(event.getProjectId());
                if (project == null) {
                    log.debug("Project " + event.getProjectId() + " is not found in session " + webSession.getSessionId());
                    return;
                }
                project.getDataSourceRegistry().getNetworkProfiles().reloadProfiles();
            } else {
                super.updateSessionData(activeUserSession, event);
            }
        } else {
            DBWorkbench.getPlatform().getNetworkProfiles().reloadProfiles();
            super.updateSessionData(activeUserSession, event);
        }
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSNetworkProfileEvent event) {
        if (event.getProjectId() != null && !activeUserSession.isProjectAccessible(event.getProjectId())) {
            return false;
        }
        return super.isAcceptableInSession(activeUserSession, event);
    }
}

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
package io.cloudbeaver.server.events;

import io.cloudbeaver.WebSessionProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMObjectSettings;
import org.jkiss.dbeaver.model.websocket.event.WSObjectSettingsEvent;
import org.jkiss.utils.CommonUtils;

import java.util.List;

public class WSObjectSettingsEventHandler extends WSDefaultEventHandler<WSObjectSettingsEvent> {
    private static final Log log = Log.getLog(WSObjectSettingsEventHandler.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectSettingsEvent event) {
        String projectId = event.getProjectId();
        if (projectId == null) {
            // Right now we handle only project-specific object settings
            return;
        }
        if (activeUserSession instanceof WebSession webSession) {
            WebSessionProjectImpl project = webSession.getProjectById(projectId);
            if (project == null) {
                log.warn("Project with id '" + projectId + "' not found in session '" + webSession.getSessionId() + "'");
                return;
            }
            handleEventInWebSessionProject(webSession, project, event);
        }
        super.updateSessionData(activeUserSession, event);
    }

    private void handleEventInWebSessionProject(
        @NotNull WebSession webSession,
        @NotNull WebSessionProjectImpl project,
        @NotNull WSObjectSettingsEvent event
    ) {
        String objectId = event.getObjectId();
        if (WSObjectSettingsEvent.UPDATED.equals(event.getId())) {
            {
                try {
                    List<SMObjectSettings> settings = webSession.getSecurityController().getObjectSettings(
                        project.getId(),
                        event.getSmObjectType(),
                        objectId,
                        event.getSettingIds().toArray(new String[0])
                    );
                    for (SMObjectSettings setting : settings) {
                        project.getProjectSettings().updateObjectSettingsCache(
                            setting.objectType(),
                            setting.objectId(),
                            setting.settings()
                        );
                    }
                } catch (DBException e) {
                    log.error("Error fetching updated object settings", e);
                }
            }
        } else if (WSObjectSettingsEvent.DELETED.equals(event.getId())) {
            project.getProjectSettings().deleteObjectSettingsCache(
                event.getSmObjectType(),
                objectId,
                event.getSettingIds()
            );
        }
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectSettingsEvent event) {
        return super.isAcceptableInSession(activeUserSession, event) &&
               CommonUtils.equalObjects(activeUserSession.getUserContext().getUserId(), event.getUserId());
    }
}

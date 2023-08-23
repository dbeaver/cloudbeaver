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
package io.cloudbeaver.server.events;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMObjectPermissionsGrant;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.websocket.event.WSProjectUpdateEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSObjectPermissionEvent;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class WSObjectPermissionUpdatedEventHandler extends WSDefaultEventHandler<WSObjectPermissionEvent> {
    private static final Log log = Log.getLog(WSObjectPermissionUpdatedEventHandler.class);

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectPermissionEvent event) {
        try {
            // we have accessible data sources only in web session
            if (event.getSmObjectType() == SMObjectType.datasource && !(activeUserSession instanceof WebSession)) {
                return;
            }
            var user = activeUserSession.getUserContext().getUser();
            var objectId = event.getObjectId();

            var userSubjects = new HashSet<>(Set.of(user.getTeams()));
            userSubjects.add(user.getUserId());

            var smController = CBPlatform.getInstance().getApplication().getSecurityController();
            var shouldBeAccessible = smController.getObjectPermissionGrants(event.getObjectId(), event.getSmObjectType())
                .stream()
                .map(SMObjectPermissionsGrant::getSubjectId)
                .anyMatch(userSubjects::contains);
            boolean isAccessibleNow;
            switch (event.getSmObjectType()) {
                case project:
                    var accessibleProjectIds = activeUserSession.getUserContext().getAccessibleProjectIds();
                    isAccessibleNow = accessibleProjectIds.contains(objectId);
                    if (shouldBeAccessible && !isAccessibleNow) {
                        // adding project to session cache
                        activeUserSession.addSessionProject(objectId);
                        activeUserSession.addSessionEvent(
                            WSProjectUpdateEvent.create(
                                event.getSessionId(),
                                event.getUserId(),
                                objectId
                            )
                        );
                    } else if (!shouldBeAccessible && isAccessibleNow) {
                        // removing project from session cache
                        activeUserSession.removeSessionProject(objectId);
                        activeUserSession.addSessionEvent(
                            WSProjectUpdateEvent.delete(
                                event.getSessionId(),
                                event.getUserId(),
                                objectId
                            )
                        );
                    };
                    break;
                case datasource:
                    var webSession = (WebSession) activeUserSession;
                    var project = webSession.getProjectById(WebAppUtils.getGlobalProjectId());
                    if (project == null) {
                        log.error("Project " + WebAppUtils.getGlobalProjectId() +
                            " is not found in session " + activeUserSession.getSessionId());
                        return;
                    }
                    isAccessibleNow = webSession.findWebConnectionInfo(objectId) != null;
                    var dataSources = List.of(objectId);
                    if (shouldBeAccessible && !isAccessibleNow) {
                        webSession.addAccessibleConnectionToCache(objectId);
                        webSession.addSessionEvent(
                            WSDataSourceEvent.create(
                                event.getSessionId(),
                                event.getUserId(),
                                WebAppUtils.getGlobalProjectId(),
                                dataSources,
                                WSDataSourceProperty.CONFIGURATION
                            )
                        );
                    } else if (!shouldBeAccessible && isAccessibleNow) {
                        webSession.removeAccessibleConnectionFromCache(objectId);
                        webSession.addSessionEvent(
                            WSDataSourceEvent.delete(
                                event.getSessionId(),
                                event.getUserId(),
                                WebAppUtils.getGlobalProjectId(),
                                dataSources,
                                WSDataSourceProperty.CONFIGURATION
                            )
                        );
                    }
            }
        } catch (DBException e) {
            log.error("Error on changing permissions for project " +
                event.getObjectId() + " in session " + activeUserSession.getSessionId(), e);
        }
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectPermissionEvent event) {
        return activeUserSession.getUserContext().getUser() != null && super.isAcceptableInSession(activeUserSession, event);
    }
}

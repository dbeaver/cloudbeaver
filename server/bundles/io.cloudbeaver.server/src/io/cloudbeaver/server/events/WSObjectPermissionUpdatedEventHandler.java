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
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMObjectPermissionsGrant;
import org.jkiss.dbeaver.model.security.SMObjects;
import org.jkiss.dbeaver.model.websocket.event.WSProjectUpdateEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSObjectPermissionEvent;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class WSObjectPermissionUpdatedEventHandler extends WSDefaultEventHandler<WSObjectPermissionEvent> {
    private static final Log log = Log.getLog(WSObjectPermissionUpdatedEventHandler.class);
    private volatile Set<String> subjectsWithProjectAccess;

    @Override
    public void handleEvent(@NotNull WSObjectPermissionEvent event) {
        if (!SMObjects.PROJECT_OBJECT_TYPE_ID.equals(event.getSmObjectType().getObjectType())) {
            return;
        }
        var smController = CBPlatform.getInstance().getApplication().getSecurityController();
        try {
            var permissionGrants = smController.getObjectPermissionGrants(event.getObjectId(), event.getSmObjectType());
            subjectsWithProjectAccess = permissionGrants.stream()
                .map(SMObjectPermissionsGrant::getSubjectId)
                .collect(Collectors.toSet());
            super.handleEvent(event);
            subjectsWithProjectAccess = Set.of();
        } catch (DBException e) {
            log.error("Cannot get permission grants", e);
        }

    }

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectPermissionEvent event) {
        try {
            var user = activeUserSession.getUserContext().getUser();
            var projectId = event.getObjectId();

            var userSubjects = new HashSet<>(Set.of(user.getTeams()));
            userSubjects.add(user.getUserId());

            var accessibleProjectIds = activeUserSession.getUserContext().getAccessibleProjectIds();
            var isAccessibleNow = accessibleProjectIds.contains(projectId);

            var shouldBeAccessible = subjectsWithProjectAccess.stream().anyMatch(userSubjects::contains);

            if (shouldBeAccessible && !isAccessibleNow) {
                // adding project to session cache
                activeUserSession.addSessionProject(projectId);
                activeUserSession.addSessionEvent(
                    WSProjectUpdateEvent.create(
                        event.getSessionId(),
                        event.getUserId(),
                        projectId
                    )
                );
            } else if (!shouldBeAccessible && isAccessibleNow) {
                // removing project from session cache
                activeUserSession.removeSessionProject(projectId);
                activeUserSession.addSessionEvent(
                    WSProjectUpdateEvent.delete(
                        event.getSessionId(),
                        event.getUserId(),
                        projectId
                    )
                );
            };
        } catch (DBException e) {
            log.error("Error on changing permissions for project " + event.getObjectId() + " in session " + event.getSessionId(), e);
        }
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectPermissionEvent event) {
        return activeUserSession.getUserContext().getUser() != null && super.isAcceptableInSession(activeUserSession, event);
    }
}

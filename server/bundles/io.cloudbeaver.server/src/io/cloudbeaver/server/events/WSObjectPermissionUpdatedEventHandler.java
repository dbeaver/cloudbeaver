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

import io.cloudbeaver.WebSessionGlobalProjectImpl;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMObjectPermissionsGrant;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSProjectUpdateEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceEvent;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSObjectPermissionEvent;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class WSObjectPermissionUpdatedEventHandler extends WSDefaultEventHandler<WSObjectPermissionEvent> {
    private static final Log log = Log.getLog(WSObjectPermissionUpdatedEventHandler.class);

    @Override
    public void handleEvent(@NotNull WSObjectPermissionEvent event) {
        String objectId = event.getObjectId();
        Consumer<BaseWebSession> runnable = switch (event.getSmObjectType()) {
            case project:
                yield getUpdateUserProjectsInfoConsumer(event, objectId);
            case datasource:
                try {
                    SMAdminController smController = CBApplication.getInstance().getSecurityController();
                    Set<String> dataSourcePermissions = smController.getObjectPermissionGrants(event.getObjectId(), event.getSmObjectType())
                        .stream()
                        .map(SMObjectPermissionsGrant::getSubjectId).collect(Collectors.toSet());
                    yield getUpdateUserDataSourcesInfoConsumer(event, objectId, dataSourcePermissions);
                } catch (DBException e) {
                    log.error("Error getting permissions for data source " + objectId, e);
                    yield null;
                }
        };
        if (runnable == null) {
            return;
        }
        log.debug(event.getTopicId() + " event handled");
        Collection<BaseWebSession> allSessions = CBPlatform.getInstance().getSessionManager().getAllActiveSessions();
        for (var activeUserSession : allSessions) {
            if (!isAcceptableInSession(activeUserSession, event)) {
                log.debug("Cannot handle %s event '%s' in session %s".formatted(
                    event.getTopicId(),
                    event.getId(),
                    activeUserSession.getSessionId()
                ));
                continue;
            }
            log.debug("%s event '%s' handled".formatted(event.getTopicId(), event.getId()));
            runnable.accept(activeUserSession);
        }
    }

    @NotNull
    private Consumer<BaseWebSession> getUpdateUserDataSourcesInfoConsumer(
        @NotNull WSObjectPermissionEvent event,
        @NotNull String dataSourceId,
        @NotNull Set<String> dataSourcePermissions
    ) {
        return (activeUserSession) -> {
            // we have accessible data sources only in web session
            // admins already have access for all shared connections
            if (!(activeUserSession instanceof WebSession webSession) || SMUtils.isAdmin(webSession)) {
                return;
            }
            if (!isAcceptableInSession(webSession, event)) {
                return;
            }
            var user = activeUserSession.getUserContext().getUser();
            var userSubjects = new HashSet<>(Set.of(user.getTeams()));
            userSubjects.add(user.getUserId());
            boolean shouldBeAccessible = dataSourcePermissions.stream().anyMatch(userSubjects::contains);
            List<String> dataSources = List.of(dataSourceId);
            WebSessionGlobalProjectImpl project = webSession.getGlobalProject();
            if (project == null) {
                log.error("Project " + WebAppUtils.getGlobalProjectId() +
                    " is not found in session " + activeUserSession.getSessionId());
                return;
            }
            boolean isAccessibleNow = project.findWebConnectionInfo(dataSourceId) != null;
            if (WSEventType.OBJECT_PERMISSIONS_UPDATED.getEventId().equals(event.getId())) {
                if (isAccessibleNow || !shouldBeAccessible) {
                    return;
                }
                project.addAccessibleConnectionToCache(dataSourceId);
                webSession.addSessionEvent(
                    WSDataSourceEvent.create(
                        event.getSessionId(),
                        event.getUserId(),
                        project.getId(),
                        dataSources,
                        WSDataSourceProperty.CONFIGURATION
                    )
                );
            } else if (WSEventType.OBJECT_PERMISSIONS_DELETED.getEventId().equals(event.getId())) {
                if (!isAccessibleNow || shouldBeAccessible) {
                    return;
                }
                project.removeAccessibleConnectionFromCache(dataSourceId);
                webSession.addSessionEvent(
                    WSDataSourceEvent.delete(
                        event.getSessionId(),
                        event.getUserId(),
                        project.getId(),
                        dataSources,
                        WSDataSourceProperty.CONFIGURATION
                    )
                );
            }
        };
    }

    @NotNull
    private Consumer<BaseWebSession> getUpdateUserProjectsInfoConsumer(
        @NotNull WSObjectPermissionEvent event,
        @NotNull String projectId
    ) {
        return (activeUserSession) -> {
            try {
                if (WSEventType.OBJECT_PERMISSIONS_UPDATED.getEventId().equals(event.getId())) {
                    var accessibleProjectIds = activeUserSession.getUserContext().getAccessibleProjectIds();
                    if (accessibleProjectIds.contains(event.getObjectId())) {
                        return;
                    }
                    activeUserSession.addSessionProject(projectId);
                    activeUserSession.addSessionEvent(
                        WSProjectUpdateEvent.create(
                            event.getSessionId(),
                            event.getUserId(),
                            projectId
                        )
                    );
                } else if (WSEventType.OBJECT_PERMISSIONS_DELETED.getEventId().equals(event.getId())) {
                    activeUserSession.removeSessionProject(projectId);
                    activeUserSession.addSessionEvent(
                        WSProjectUpdateEvent.delete(
                            event.getSessionId(),
                            event.getUserId(),
                            projectId
                        )
                    );
                }
            } catch (DBException e) {
                log.error("Error on changing permissions for project " +
                    event.getObjectId() + " in session " + activeUserSession.getSessionId(), e);
            }
        };
    }

    @Override
    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSObjectPermissionEvent event) {
        return activeUserSession.getUserContext().getUser() != null && super.isAcceptableInSession(activeUserSession, event);
    }
}

package io.cloudbeaver.server.events;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMObjectPermissionsGrant;
import org.jkiss.dbeaver.model.security.SMObjects;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSProjectUpdateEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSObjectPermissionEvent;

import java.util.*;
import java.util.stream.Collectors;

public class WSPermissionUpdatedEventHandler implements WSEventHandler {
    private static final Log log = Log.getLog(WSPermissionUpdatedEventHandler.class);

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.PERMISSIONS.getTopicId();
    }

    @Override
    public void handleEvent(@NotNull WSEvent event) {
        if (!(event instanceof WSObjectPermissionEvent)) {
            return;
        }
        var permissionEvent = (WSObjectPermissionEvent) event;
        if (!SMObjects.PROJECT_OBJECT_TYPE_ID.equals(permissionEvent.getSmObjectType().getObjectType())) {
            return;
        }
        var smController = CBPlatform.getInstance().getApplication().getSecurityController();
        try {
            var projectId = permissionEvent.getObjectId();
            var permissionGrants = smController.getObjectPermissionGrants(projectId, permissionEvent.getSmObjectType());
            var subjectsWithProjectAccess = permissionGrants.stream()
                .map(SMObjectPermissionsGrant::getSubjectId)
                .collect(Collectors.toSet());

            log.debug(getSupportedTopicId() + " event handled");

            Collection<BaseWebSession> allSessions = CBPlatform.getInstance().getSessionManager().getAllActiveSessions();
            for (var activeUserSession : allSessions) {
                if (WSWebUtils.isSessionIdEquals(activeUserSession, event.getSessionId())) {
                    continue;
                }
                var user = activeUserSession.getUserContext().getUser();
                if (user == null) {
                    continue;
                }

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
                }
            }
        } catch (DBException e) {
            log.error("Cannot get permission grants", e);
        }

    }
}

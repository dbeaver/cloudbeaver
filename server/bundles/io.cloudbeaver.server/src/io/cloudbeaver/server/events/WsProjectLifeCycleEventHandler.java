package io.cloudbeaver.server.events;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.event.WSEventTopic;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSProjectLifeCycleEvent;

public class WsProjectLifeCycleEventHandler extends WSProjectUpdatedEventHandler<WSProjectLifeCycleEvent> {

    private static final Log log = Log.getLog(WsProjectLifeCycleEventHandler.class);

    @NotNull
    @Override
    public String getSupportedTopicId() {
        return WSEventTopic.PROJECTS.getTopicId();
    }

    @NotNull
    @Override
    protected Class<WSProjectLifeCycleEvent> getEventClass() {
        return WSProjectLifeCycleEvent.class;
    }

    @Override
    protected void updateSessionData(BaseWebSession activeUserSession, WSProjectLifeCycleEvent event) {
        if (!activeUserSession.getUserContext().hasPermission(DBWConstants.PERMISSION_ADMIN)) {
            log.debug("The current user is not an administrator. Event skipped");
            return;
        }
        var eventId = event.getId();
        var projectId = event.getProjectId();
        try {
            if (eventId.equals(WSEventType.PROJECT_CREATED.getEventId())) {
                activeUserSession.addSessionProject(projectId);
                log.info("Project '" + projectId + "' added to '" + activeUserSession.getSessionId() + "' session");
            } else if (eventId.equals(WSEventType.PROJECT_REMOVED.getEventId())) {
                activeUserSession.removeSessionProject(projectId);
                log.info("Project '" + projectId + "' removed from '" + activeUserSession.getSessionId() + "' session");
            }
        } catch (DBException e) {
            log.warn("Failed to handle project lifecycle event", e);
        }
    }
}

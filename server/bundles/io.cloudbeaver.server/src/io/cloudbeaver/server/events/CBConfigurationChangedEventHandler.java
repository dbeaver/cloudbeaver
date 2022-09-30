package io.cloudbeaver.server.events;

import io.cloudbeaver.events.CBEvent;
import io.cloudbeaver.events.CBEventConstants;
import io.cloudbeaver.events.CBEventHandler;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.session.WebSessionManager;
import org.jkiss.dbeaver.Log;

import java.util.Collection;

public class CBConfigurationChangedEventHandler implements CBEventHandler {
    private static final Log log = Log.getLog(CBConfigurationChangedEventHandler.class);

    @Override
    public String getSupportedEventType() {
        return CBEventConstants.CLOUDBEAVER_CONFIG_CHANGED;
    }

    @Override
    public void handleEvent(CBEvent event) {
        log.debug(getSupportedEventType() + " event handled");
        Collection<WebSession> allSessions = WebSessionManager.getInstance().getAllActiveSessions();

        for (WebSession activeUserSession : allSessions) {
            activeUserSession.addSessionEvent(event);
        }
    }
}

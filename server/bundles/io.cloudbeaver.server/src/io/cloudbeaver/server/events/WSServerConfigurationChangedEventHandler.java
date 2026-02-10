package io.cloudbeaver.server.events;

import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.event.WSServerConfigurationChangedEvent;

public class WSServerConfigurationChangedEventHandler extends WSDefaultEventHandler<WSServerConfigurationChangedEvent> {

    @Override
    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSServerConfigurationChangedEvent event) {
        activeUserSession.refreshUserData();
        super.updateSessionData(activeUserSession, event);
    }
}

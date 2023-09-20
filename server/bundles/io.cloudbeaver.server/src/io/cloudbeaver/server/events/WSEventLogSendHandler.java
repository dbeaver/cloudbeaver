/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
package io.cloudbeaver.server.events;

import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.session.BaseWebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.event.WSErrorEvent;

public class WSEventLogSendHandler extends WSDefaultEventHandler<WSErrorEvent> {

    protected void updateSessionData(@NotNull BaseWebSession activeUserSession, @NotNull WSErrorEvent event) {
        activeUserSession.addSessionMessage(new WebServerMessage(WebServerMessage.MessageType.ERROR, event.getErrorMessage()));
    }

    protected boolean isAcceptableInSession(@NotNull BaseWebSession activeUserSession, @NotNull WSErrorEvent event) {
        return WSWebUtils.isSessionIdEquals(activeUserSession, event.getSessionId());
    }
}

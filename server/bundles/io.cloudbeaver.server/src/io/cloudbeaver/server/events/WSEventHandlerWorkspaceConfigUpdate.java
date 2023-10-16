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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.WorkspaceConfigEventManager;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSWorkspaceConfigurationChangedEvent;

public class WSEventHandlerWorkspaceConfigUpdate extends WSDefaultEventHandler<WSWorkspaceConfigurationChangedEvent> {
    private static final Log log = Log.getLog(WSEventHandlerWorkspaceConfigUpdate.class);

    @Override
    public void handleEvent(@NotNull WSWorkspaceConfigurationChangedEvent event) {
        String configFileName = event.getConfigFilePath();
        WorkspaceConfigEventManager.fireConfigChangedEvent(configFileName);
        super.handleEvent(event);
    }

}
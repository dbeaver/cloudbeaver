/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.WorkspaceConfigEventManager;
import org.jkiss.dbeaver.model.websocket.event.WSWorkspaceConfigurationChangedEvent;
import org.jkiss.dbeaver.registry.RegistryConstants;

public class WSEventHandlerWorkspaceConfigUpdate extends WSDefaultEventHandler<WSWorkspaceConfigurationChangedEvent> {
    private static final Log log = Log.getLog(WSEventHandlerWorkspaceConfigUpdate.class);

    @Override
    public void handleEvent(@NotNull WSWorkspaceConfigurationChangedEvent event) {
        String configFileName = event.getConfigFilePath();
        log.info("Config file changed: " + configFileName);
        WorkspaceConfigEventManager.fireConfigChangedEvent(configFileName);
        super.handleEvent(event);
    }

    @Override
    protected void updateSessionData(
        @NotNull BaseWebSession activeUserSession,
        @NotNull WSWorkspaceConfigurationChangedEvent event
    ) {
        if (isConnectionTypesConfig(event)) {
            for (WebSessionProjectImpl project : activeUserSession.getWorkspace().getProjects()) {
                project.getDataSourceRegistry().refreshConfig();
            }
        }
        super.updateSessionData(activeUserSession, event);
    }

    @Override
    protected boolean isAcceptableInSession(
        @NotNull BaseWebSession activeUserSession,
        @NotNull WSWorkspaceConfigurationChangedEvent event
    ) {
        return isConnectionTypesConfig(event) || super.isAcceptableInSession(activeUserSession, event);
    }

    private static boolean isConnectionTypesConfig(@NotNull WSWorkspaceConfigurationChangedEvent event) {
        return RegistryConstants.CONNECTION_TYPES_FILE_NAME.equals(event.getConfigFilePath());
    }
}

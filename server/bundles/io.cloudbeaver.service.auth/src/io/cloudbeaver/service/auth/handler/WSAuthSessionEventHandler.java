/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.auth.handler;

import io.cloudbeaver.model.session.*;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.session.WSAuthEvent;

import java.util.List;

public class WSAuthSessionEventHandler implements WSEventHandler<WSAuthEvent> {
    private static final Log log = Log.getLog(WSAuthSessionEventHandler.class);

    @Override
    public void handleEvent(@NotNull WSAuthEvent event) {
        SMAuthInfo authInfo = event.getAuthInfo();
        WebApplication webApplication = WebAppUtils.getWebApplication();
        WebAppSessionManager sessionManager = webApplication.getSessionManager();

        switch (authInfo.getAuthStatus()) {
            case SUCCESS:
                if (authInfo.getAuthPermissions() == null) {
                    log.error("No auth permissions available in SUCCESS auth");
                    return;
                }
                String sessionId = authInfo.getAppSessionId();
                BaseWebSession baseWebSession = sessionManager.getSession(sessionId);
                if (baseWebSession == null) {
                    log.trace("No session found in current node with id '" + sessionId + "'");
                    return;
                }
                if (baseWebSession instanceof WebSession webSession) {
                    boolean linkCredentialsWithActiveUser = !webApplication.isConfigurationMode()
                        && !webSession.isAuthorizedInSecurityManager();
                    try {
                        List<WebAuthInfo> newInfos = new WebSessionAuthProcessor(
                            webSession,
                            authInfo,
                            linkCredentialsWithActiveUser
                        ).authenticateSession();
                        //                        webSession.addSessionEvent(new WebSessionAuthEvent(newInfos));
                    } catch (DBException e) {
                        webSession.addSessionError(e);
                    }
                } else if (baseWebSession instanceof WebHeadlessSession headlessSession) {
                    headlessSession.addSessionEvent(event);
                }
                break;
            case IN_PROGRESS, ERROR, EXPIRED:
                log.error("Invalid auth status: " + authInfo.getAuthStatus());
            default:
                log.error("Unknown auth status: " + authInfo.getAuthStatus());
        }
    }
}

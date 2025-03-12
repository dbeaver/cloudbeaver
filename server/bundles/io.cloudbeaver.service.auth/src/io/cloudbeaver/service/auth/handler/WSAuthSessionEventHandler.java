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

import io.cloudbeaver.DBWebException;
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
        if (authInfo.getAuthPermissions() == null) {
            log.error("No auth permissions available in SUCCESS auth");
            return;
        }
        String sessionId = authInfo.getAppSessionId();
        BaseWebSession baseWebSession = sessionManager.getSession(sessionId);
        if (!(baseWebSession instanceof WebSession webSession)) {
            log.trace("No web session found in current node with id '" + sessionId + "'");
            return;
        }
        switch (authInfo.getAuthStatus()) {
            case SUCCESS:
                boolean linkCredentialsWithActiveUser = !webApplication.isConfigurationMode()
                    && !webSession.isAuthorizedInSecurityManager();
                try {
                    List<WebAuthInfo> newInfos = new WebSessionAuthProcessor(
                        webSession,
                        authInfo,
                        linkCredentialsWithActiveUser
                    ).authenticateSession();
                    List<WebUserAuthTokenInfo> tokenInfos = newInfos
                        .stream()
                        .map(WebUserAuthTokenInfo::new)
                        .toList();
                    webSession.addSessionEvent(new WebSessionAuthEvent(tokenInfos));
                } catch (DBException e) {
                    webSession.addSessionError(e);
                }

                break;
            case ERROR:
                webSession.addSessionEvent(new WebSessionAuthEvent(new DBWebException(authInfo.getError(), authInfo.getErrorCode())));
                break;
            case IN_PROGRESS, EXPIRED:
                log.error("Invalid auth status: " + authInfo.getAuthStatus());
            default:
                log.error("Unknown auth status: " + authInfo.getAuthStatus());
        }
    }
}

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

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.auth.WebAsyncAuthJob;
import io.cloudbeaver.utils.WebEventUtils;
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
        List<WebAsyncTaskInfo> allAuthJobs = webSession.findTasksByJob(WebAsyncAuthJob.class);
        WebAsyncTaskInfo relatedTask = allAuthJobs.stream().filter(
                task -> {
                    WebAsyncAuthJob job = (WebAsyncAuthJob) task.getJob();
                    return job.getAuthId().equals(authInfo.getAuthAttemptId());
                })
            .findFirst().orElse(null);
        if (relatedTask == null) {
            String message = "No related authentication task was found in'" + sessionId + "',"
                + " probably authentication was canceled";
            log.warn(message);
            webSession.addWarningMessage(message);
            return;
        }
        if (!relatedTask.isRunning()) {
            String message = "Related authentication task was canceled";
            log.warn(message);
            webSession.addWarningMessage(message);
            return;
        }
        WebAsyncAuthJob relatedJob = (WebAsyncAuthJob) relatedTask.getJob();
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
                    relatedJob.setAuthResult(newInfos);
                } catch (DBException e) {
                    webSession.addSessionError(e);
                    relatedTask.setJobError(e);
                }
                break;
            case ERROR:
                var error = new DBWebException(authInfo.getError(), authInfo.getErrorCode());
                relatedTask.setJobError(error);
                break;
            default:
                String message = "Invalid auth status: " + authInfo.getAuthStatus();
                log.error(message);
                var exception = new DBWebException(message);
                webSession.addSessionError(exception);
                relatedTask.setJobError(new DBWebException(message));
        }
        relatedTask.setRunning(false);
        relatedTask.setStatus(DBWConstants.TASK_STATUS_FINISHED);
        WebEventUtils.sendAsyncTaskEvent(webSession, relatedTask);
    }
}

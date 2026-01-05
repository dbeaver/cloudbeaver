/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.websocket.event.client.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSUtils;
import org.jkiss.dbeaver.model.websocket.event.WSClientEvent;
import org.jkiss.utils.CommonUtils;

public class CBClientEventProcessor {

    private static final Log log = Log.getLog(CBClientEventProcessor.class);

    final BaseWebSession webSession;

    public CBClientEventProcessor(@NotNull BaseWebSession webSession) {
        this.webSession = webSession;
    }

    public void process(@Nullable String message) {
        if (CommonUtils.isEmpty(message)) {
            return;
        }
        WSClientEvent clientEvent;
        try {
            clientEvent =  WSUtils.clientGson.fromJson(message, WSClientEvent.class);
        } catch (Exception e) {
            log.error("Error parsing event: " + e.getMessage(), e);
            webSession.addSessionError(new DBWebException("Invalid event: " + e.getMessage()));
            return;
        }

        switch (clientEvent.getId()) {
            case WSSubscribeOnTopicClientEvent.ID: {
                webSession.getEventsFilter().subscribeOnEventTopic(clientEvent.getTopicId());
                break;
            }
            case WSUnsubscribeFromTopicClientEvent.ID: {
                webSession.getEventsFilter().unsubscribeFromEventTopic(clientEvent.getTopicId());
                break;
            }
            case WSUpdateActiveProjectsClientEvent.ID: {
                var projectEvent = (WSUpdateActiveProjectsClientEvent) clientEvent;
                webSession.getEventsFilter().setSubscribedProjects(projectEvent.getProjectIds());
                break;
            }
            case WSSessionPingClientEvent.ID: {
                if (webSession instanceof WebSession session) {
                    session.updateInfo(true);
                }
                break;
            }
            case WSSessionTaskConfirmationEvent.ID: {
                if (webSession instanceof WebSession session) {
                    var taskConfirmationEvent = (WSSessionTaskConfirmationEvent) clientEvent;
                    session.handleTaskConfirmation(
                        taskConfirmationEvent.getTaskId(),
                        taskConfirmationEvent.isConfirmed(),
                        taskConfirmationEvent.isSkipConfirmations()
                    );
                }
                break;
            }
            case WSSessionTaskWithParametersConfirmationEvent.ID: {
                if (webSession instanceof WebSession session) {
                    var taskParamsConfirmationEvent = (WSSessionTaskWithParametersConfirmationEvent) clientEvent;
                    session.handleTaskConfirmationWithParameters(
                        taskParamsConfirmationEvent.getTaskId(),
                        taskParamsConfirmationEvent.getParameters()
                    );
                }
                break;
            }
            default:
                var e = new DBWebException("Unknown client event: " + clientEvent.getId());
                log.error(e.getMessage(), e);
                webSession.addSessionError(e);
        }
    }
}
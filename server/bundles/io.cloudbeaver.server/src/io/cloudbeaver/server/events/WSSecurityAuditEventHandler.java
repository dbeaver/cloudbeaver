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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;

public class WSSecurityAuditEventHandler implements WSEventHandler<WSSecurityAuditEvent> {
    private static final Log auditLog = Log.getLog(WSSecurityAuditEventHandler.class);

    @Override
    public void handleEvent(@NotNull WSSecurityAuditEvent event) {
        auditLog.info(String.format(
            "topic=%s id=%s kind=%s reasonCode=%s userId=%s sessionId=%s "
                + "projectId=%s connectionId=%s driverId=%s errorClass=%s timestamp=%d",
            event.getTopicId(),
            event.getId(),
            event.getKind(),
            event.getReasonCode(),
            event.getUserId(),
            event.getSessionId(),
            event.getProjectId(),
            event.getConnectionId(),
            event.getDriverId(),
            event.getErrorClass(),
            event.getTimestamp()
        ));
    }
}

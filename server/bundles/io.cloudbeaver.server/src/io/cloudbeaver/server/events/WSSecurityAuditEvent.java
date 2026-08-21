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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.websocket.event.WSAbstractEvent;

public class WSSecurityAuditEvent extends WSAbstractEvent {
    public static final String TOPIC = "cb_security_audit";
    public static final String ID = "cb_security_audit_updated";

    public enum Kind {
        /** Fires before invoking the DBeaver core password-change handler. */
        ATTEMPTED,
        /** Fires after handler success and credential-store persistence. */
        SUCCEEDED,
        /** Fires on handler exception or credential-store persistence failure. */
        FAILED,
        /** Fires on any of the pre-invocation gate rejections. */
        GATE_REJECTED
    }

    @Nullable
    private final String projectId;
    @Nullable
    private final String connectionId;
    @Nullable
    private final String driverId;
    @NotNull
    private final Kind kind;
    @Nullable
    private final String reasonCode;
    @Nullable
    private final String errorClass;

    public WSSecurityAuditEvent(
        @Nullable String sessionId,
        @Nullable String userId,
        @Nullable String projectId,
        @Nullable String connectionId,
        @Nullable String driverId,
        @NotNull Kind kind,
        @Nullable String reasonCode,
        @Nullable String errorClass
    ) {
        super(ID, TOPIC, sessionId, userId);
        this.projectId = projectId;
        this.connectionId = connectionId;
        this.driverId = driverId;
        this.kind = kind;
        this.reasonCode = reasonCode;
        this.errorClass = errorClass;
    }

    @Nullable
    public String getProjectId() {
        return projectId;
    }

    @Nullable
    public String getConnectionId() {
        return connectionId;
    }

    @Nullable
    public String getDriverId() {
        return driverId;
    }

    @NotNull
    public Kind getKind() {
        return kind;
    }

    @Nullable
    public String getReasonCode() {
        return reasonCode;
    }

    @Nullable
    public String getErrorClass() {
        return errorClass;
    }
}

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
package io.cloudbeaver.websocket.event.client;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSClientEvent;

public class WSActionConfirmationClientEvent extends WSClientEvent {

    public static final String ID = "cb_client_action_confirmation";

    @NotNull
    private final String actionId;
    private final boolean confirmed;

    public WSActionConfirmationClientEvent(
        @NotNull String actionId,
        boolean confirmed
    ) {
        super(ID, WSConstants.TOPIC_SESSION_ACTION);
        this.actionId = actionId;
        this.confirmed = confirmed;
    }

    @NotNull
    public String getActionId() {
        return actionId;
    }

    public boolean isConfirmed() {
        return confirmed;
    }
}

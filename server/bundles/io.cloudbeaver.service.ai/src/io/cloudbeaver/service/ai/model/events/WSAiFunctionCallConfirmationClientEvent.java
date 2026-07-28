/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp
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
package io.cloudbeaver.service.ai.model.events;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSClientEvent;

import java.util.List;

public class WSAiFunctionCallConfirmationClientEvent extends WSClientEvent {

    public static final String ID = "cb_client_ai_function_call_confirmation";

    @NotNull
    private final String conversationId;
    @NotNull
    private final String messageId;
    private final List<String> confirmedFunctionCalls;
    private final List<String> declinedFunctionCalls;

    public WSAiFunctionCallConfirmationClientEvent(
        @NotNull String conversationId,
        @NotNull String messageId,
        @NotNull List<String> confirmedFunctionCalls,
        @NotNull List<String> declinedFunctionCalls
    ) {
        super(ID, WSConstants.TOPIC_AI);
        this.conversationId = conversationId;
        this.messageId = messageId;
        this.confirmedFunctionCalls = confirmedFunctionCalls;
        this.declinedFunctionCalls = declinedFunctionCalls;
    }

    @NotNull
    public String getConversationId() {
        return conversationId;
    }

    @NotNull
    public String getMessageId() {
        return messageId;
    }

    @NotNull
    public List<String> getConfirmedFunctionCalls() {
        return confirmedFunctionCalls == null ? List.of() : confirmedFunctionCalls;
    }

    @NotNull
    public List<String> getDeclinedFunctionCalls() {
        return declinedFunctionCalls == null ? List.of() : declinedFunctionCalls;
    }
}

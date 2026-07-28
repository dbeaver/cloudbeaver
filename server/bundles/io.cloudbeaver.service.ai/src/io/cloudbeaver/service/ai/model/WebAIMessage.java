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
package io.cloudbeaver.service.ai.model;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

public class WebAIMessage {

    private final AIChatMessage message;
    private final AIChatConversation conversation;

    public WebAIMessage(@NotNull AIChatMessage message, @NotNull AIChatConversation conversation) {
        this.message = message;
        this.conversation = conversation;
    }

    @NotNull
    public String getConversationId() {
        return conversation.getId().toString();
    }

    public int getId() {
        return message.id();
    }

    @NotNull
    public AIMessageType getRole() {
        return message.message().getRole();
    }

    @NotNull
    public String getContent() {
        return message.message().getContent();
    }

    @NotNull
    public String getDisplayMessage() {
        return message.message().getDisplayMessage();
    }

    @Nullable
    public AIFunctionCall getFunctionCall() {
        return message.message().getFunctionCall();
    }

    @Nullable
    public List<AIFunctionCall> getConfirmationFunctionCalls() {
        if (message.message().getConfirmation() instanceof AIFunctionCallConfirmation fcc) {
            return fcc.getFunctionCalls();
        }
        return null;
    }

    @Nullable
    public AIConfirmation getFunctionConfirmation() {
        return message.message().getConfirmation();
    }

    @Nullable
    public AIFunctionResult getFunctionResult() {
        return message.message().getFunctionResult();
    }

    @NotNull
    public OffsetDateTime getTime() {
        return message.message().getTime().atZone(ZoneId.systemDefault())
            .withZoneSameInstant(ZoneOffset.UTC)
            .toOffsetDateTime();
    }
}

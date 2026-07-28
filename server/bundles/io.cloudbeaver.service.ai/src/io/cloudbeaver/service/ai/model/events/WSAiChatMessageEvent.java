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

import io.cloudbeaver.service.ai.model.WebAIMessage;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.AIFunctionCall;
import org.jkiss.dbeaver.model.ai.AIFunctionCallConfirmation;
import org.jkiss.dbeaver.model.ai.AIFunctionResult;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSAbstractSessionEvent;
import org.jkiss.utils.CommonUtils;

import java.time.format.DateTimeFormatter;

public class WSAiChatMessageEvent extends WSAbstractSessionEvent {
    private static final String ID = "cb_ai_chat_message";

    private final String messageId;
    @NotNull
    private final String conversationId;
    @Nullable
    private final String content;
    @Nullable
    private final String displayMessage;
    @NotNull
    private final String role;

    private final String time;

    @Nullable
    private AIFunctionCallConfirmation functionConfirmation;
    @Nullable
    private final AIFunctionCall functionCall;
    @Nullable
    private final AIFunctionResult functionResult;

    public WSAiChatMessageEvent(@NotNull WebAIMessage message) {
        super(ID, WSConstants.TOPIC_AI);
        this.messageId = CommonUtils.toString(message.getId());
        this.conversationId = message.getConversationId();
        this.displayMessage = message.getDisplayMessage();
        this.content = message.getContent();
        this.role = message.getRole().name();
        this.time = message.getTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        this.functionCall = message.getFunctionCall();
        this.functionResult = message.getFunctionResult();

        if (message.getConfirmationFunctionCalls() != null) {
            this.functionConfirmation = new AIFunctionCallConfirmation(
                message.getConfirmationFunctionCalls());
        }
    }

    @NotNull
    public String getConversationId() {
        return conversationId;
    }

    public String getMessageId() {
        return messageId;
    }

    @Nullable
    public String getDisplayMessage() {
        return displayMessage;
    }

    @Nullable
    public String getContent() {
        return content;
    }

    @NotNull
    public String getRole() {
        return role;
    }

    @NotNull
    public String getTime() {
        return time;
    }

    @Nullable
    public AIFunctionCallConfirmation getFunctionConfirmation() {
        return functionConfirmation;
    }

    @Nullable
    public AIFunctionCall getFunctionCall() {
        return functionCall;
    }

    @Nullable
    public AIFunctionResult getFunctionResult() {
        return functionResult;
    }
}

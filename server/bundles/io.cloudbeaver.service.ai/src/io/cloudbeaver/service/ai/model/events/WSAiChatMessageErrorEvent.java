/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp
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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSAbstractSessionEvent;
import org.jkiss.utils.CommonUtils;

import java.util.UUID;

public class WSAiChatMessageErrorEvent extends WSAbstractSessionEvent {

    private final String messageId;
    @NotNull
    private final String conversationId;
    @Nullable
    private final String errorMessage;

    public WSAiChatMessageErrorEvent(@NotNull UUID conversationId, int messageId, @Nullable Throwable throwable) {
        super("cb_ai_chat_message_error", WSConstants.TOPIC_AI);
        this.conversationId = conversationId.toString();
        this.messageId = CommonUtils.toString(messageId);
        this.errorMessage = CommonUtils.getAllExceptionMessages(throwable);
    }

    @NotNull
    public String getConversationId() {
        return conversationId;
    }

    @NotNull
    public String getMessageId() {
        return messageId;
    }

    @Nullable
    public String getErrorMessage() {
        return errorMessage;
    }
}

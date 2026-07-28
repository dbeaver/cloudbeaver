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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageChunkEvent;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageErrorEvent;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageEvent;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.*;
import org.jkiss.utils.CommonUtils;

import java.util.List;

public class WebAiChatResponseConsumer implements AIChatResponseConsumer {
    private final StringBuilder responseBuilder;
    private final AIChatConversation conversation;
    private final WebSession webSession;
    private final AIChatSession chatSession;

    public WebAiChatResponseConsumer(
        @NotNull AIChatConversation conversation,
        @NotNull WebSession webSession,
        @NotNull AIChatSession chatSession
    ) {
        this.conversation = conversation;
        this.webSession = webSession;
        this.chatSession = chatSession;
        this.responseBuilder = new StringBuilder();
    }

    @Override
    public void nextMessageChunk(@NotNull String item) {
        if (CommonUtils.isEmpty(item)) {
            return;
        }
        if (responseBuilder.isEmpty()) {
            var chatMessage = new AIChatMessage(conversation.getNextMessageId(), AIMessage.assistantMessage("", null));
            webSession.addSessionEvent(new WSAiChatMessageEvent(new WebAIMessage(chatMessage, conversation)));
        }
        responseBuilder.append(item);
        webSession.addSessionEvent(new WSAiChatMessageChunkEvent(
            conversation.getId(),
            conversation.getNextMessageId(),
            item,
            false
        ));
    }

    @Override
    public void processFunctionCall(@NotNull AIMessage fcMessage) {
        // Send function call to front-end over web sockets
        AIChatMessage chatMessage = conversation.addMessage(fcMessage);
        WebAIMessage webMessage = new WebAIMessage(chatMessage, conversation);
        webSession.addSessionEvent(new WSAiChatMessageEvent(webMessage));
        chatSession.notifyMessageAdd(conversation, chatMessage);
    }

    @Override
    public void warning(@NotNull String message) {
        AIChatMessage chatMessage = conversation.addMessage(AIMessage.warningMessage(message));
        webSession.addSessionEvent(new WSAiChatMessageEvent(new WebAIMessage(chatMessage, conversation)));
    }

    @Override
    public void error(@NotNull Throwable throwable) {
        var errorMessage = conversation.addMessage(AIMessage.errorMessage(throwable));
        if (responseBuilder.isEmpty()) {
            webSession.addSessionEvent(
                new WSAiChatMessageEvent(new WebAIMessage(errorMessage, conversation)));
        } else {
            webSession.addSessionEvent(
                new WSAiChatMessageErrorEvent(
                    conversation.getId(),
                    conversation.getNextMessageId(),
                    throwable
                ));
        }
        chatSession.notifyMessageAdd(conversation, errorMessage);
    }

    @Override
    public void complete(@NotNull List<AIMessageMeta> meta, boolean finishConversation) {
        if (responseBuilder.isEmpty()) {
            return;
        }
        AIChatMessage responseMessage = conversation.addMessage(AIMessage.assistantMessage(responseBuilder.toString(), meta));
        chatSession.notifyMessageAdd(conversation, responseMessage);
        webSession.addSessionEvent(new WSAiChatMessageChunkEvent(conversation.getId(), responseMessage.id(), null, true));
    }
}

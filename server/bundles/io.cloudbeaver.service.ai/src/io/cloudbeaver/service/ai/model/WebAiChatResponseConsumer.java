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
package io.cloudbeaver.service.ai.model;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.WebAIUtils;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageChunkEvent;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageErrorEvent;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageEvent;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.*;
import org.jkiss.dbeaver.model.ai.internal.AIChatMessages;
import org.jkiss.utils.CommonUtils;

import java.util.List;
import java.util.concurrent.CancellationException;

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
        synchronized (conversation) {
            if (!isCurrent() || CommonUtils.isEmpty(item)) {
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
    }

    @Override
    public void processFunctionCall(@NotNull AIMessage fcMessage) {
        synchronized (conversation) {
            if (!isCurrent()) {
                return;
            }
            // Send function call to front-end over web sockets
            AIChatMessage chatMessage = conversation.addMessage(fcMessage);
            WebAIMessage webMessage = new WebAIMessage(chatMessage, conversation);
            webSession.addSessionEvent(new WSAiChatMessageEvent(webMessage));
            chatSession.notifyMessageAdd(conversation, chatMessage);
        }
    }

    @Override
    public void warning(@NotNull String message) {
        synchronized (conversation) {
            if (!isCurrent()) {
                return;
            }
            AIChatMessage chatMessage = conversation.addMessage(AIMessage.warningMessage(message));
            webSession.addSessionEvent(new WSAiChatMessageEvent(new WebAIMessage(chatMessage, conversation)));
            chatSession.notifyMessageAdd(conversation, chatMessage);
        }
    }

    @Override
    public void error(@NotNull Throwable throwable) {
        synchronized (conversation) {
            if (!isCurrent()) {
                return;
            }
            AIMessage aiMessage = throwable instanceof CancellationException cancellationException
                ? AIMessage.warningMessage(cancellationException.getMessage())
                : AIMessage.errorMessage(throwable);

            AIChatMessage errorMessage = conversation.addMessage(aiMessage);
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
    }

    @Override
    public void complete(@NotNull List<AIMessageMeta> meta, boolean finishConversation, boolean isCanceled) {
        synchronized (conversation) {
            if (!isCurrent()) {
                return;
            }
            if (!responseBuilder.isEmpty()) {
                AIChatMessage responseMessage = conversation.addMessage(AIMessage.assistantMessage(responseBuilder.toString(), meta));
                responseBuilder.setLength(0);
                chatSession.notifyMessageAdd(conversation, responseMessage);
                webSession.addSessionEvent(new WSAiChatMessageChunkEvent(conversation.getId(), responseMessage.id(), null, true));
            }
            if (isCanceled) {
                warning(AIChatMessages.ai_chat_conversation_cancelled);
            }
            if (finishConversation || isCanceled) {
                webSession.removeAttribute(WebAIUtils.getResponseAttr(conversation));
            }
        }
    }

    private boolean isCurrent() {
        return webSession.getAttribute(WebAIUtils.getResponseAttr(conversation)) == this;
    }
}

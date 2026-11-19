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
package io.cloudbeaver.service.ai;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.model.WebAiChatResponseConsumer;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageEvent;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.*;
import org.jkiss.dbeaver.model.ai.prompt.AIPromptGenerateSql;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CancellationException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class WebAiChatResponseConsumerTest {
    private final Map<String, Object> attributes = new HashMap<>();
    private final WebSession webSession = Mockito.mock(WebSession.class);
    private final AIChatSession chatSession = Mockito.mock(AIChatSession.class);
    private final AIChatConversation conversation = new AIChatConversation(
        UUID.randomUUID(), "Test", new AIPromptGenerateSql(), List.of(), null, 0, null
    );

    @BeforeEach
    void setUp() {
        Mockito.when(webSession.getAttribute(Mockito.anyString()))
            .thenAnswer(invocation -> attributes.get(invocation.getArgument(0)));
        Mockito.doAnswer(invocation -> attributes.remove(invocation.getArgument(0)))
            .when(webSession).removeAttribute(Mockito.anyString());
    }

    @Test
    void cancelBeforeFirstChunkSendsOneWarningImmediately() {
        WebAiChatResponseConsumer consumer = register();
        consumer.complete(List.of(), true, true);
        consumer.complete(List.of(), true, true);
        consumer.error(new CancellationException());

        assertEquals(1, conversation.getMessages().size());
        assertEquals(AIMessageType.WARNING, conversation.getMessages().getFirst().message().getRole());
        assertFalse(attributes.containsKey(WebAIUtils.getResponseAttr(conversation)));
        verify(webSession, times(1)).addSessionEvent(Mockito.argThat(
            event -> event instanceof WSAiChatMessageEvent message && message.getRole().equals("WARNING")
        ));
    }

    @Test
    void partialResponseAndImmediateWarningHaveDifferentIds() {
        WebAiChatResponseConsumer consumer = register();
        consumer.nextMessageChunk("Partial answer");
        consumer.complete(List.of(), true, true);

        List<AIChatMessage> messages = conversation.getMessages();
        assertEquals(2, messages.size());
        assertEquals("Partial answer", messages.getFirst().message().getContent());
        assertEquals(AIMessageType.WARNING, messages.getLast().message().getRole());
        assertNotEquals(messages.getFirst().id(), messages.getLast().id());
    }

    @Test
    void canceledConsumerCannotWriteToNextRequest() {
        WebAiChatResponseConsumer old = register();
        old.complete(List.of(), true, true);
        WebAiChatResponseConsumer current = register();
        old.nextMessageChunk("Late");
        old.warning("Late warning");
        old.error(new IllegalStateException("Late error"));
        old.processFunctionCall(AIMessage.assistantMessage("Late function", null));
        old.complete(List.of(), true, false);

        assertEquals(1, conversation.getMessages().size());
        assertSame(current, attributes.get(WebAIUtils.getResponseAttr(conversation)));
        current.complete(List.of(), true, true);
        assertEquals(2, conversation.getMessages().size());
    }

    @Test
    void functionContinuationDoesNotDuplicatePartialAnswerOrWarning() {
        WebAiChatResponseConsumer first = register();
        first.nextMessageChunk("Before function");
        first.complete(List.of(), false, false);
        assertSame(first, attributes.get(WebAIUtils.getResponseAttr(conversation)));
        WebAiChatResponseConsumer continuation = register();
        continuation.complete(List.of(), true, true);
        first.complete(List.of(), true, true);

        assertEquals(2, conversation.getMessages().size());
        assertEquals(AIMessageType.WARNING, conversation.getMessages().getLast().message().getRole());
    }

    @NotNull
    private WebAiChatResponseConsumer register() {
        WebAiChatResponseConsumer consumer = new WebAiChatResponseConsumer(conversation, webSession, chatSession);
        attributes.put(WebAIUtils.getResponseAttr(conversation), consumer);
        return consumer;
    }
}

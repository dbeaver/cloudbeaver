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

import io.cloudbeaver.service.ai.model.WebAIMessage;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageEvent;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.*;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;

public class WebAIMessageConfirmationTest {
    private AIToolboxManager toolboxManager;
    private AIToolbox toolbox;
    private AIFunctionSettings settings;
    private AIChatConversation conversation;

    @BeforeEach
    public void setUp() {
        toolboxManager = Mockito.mock(AIToolboxManager.class);
        toolbox = Mockito.mock(AIToolbox.class);
        settings = new AIFunctionSettings();
        conversation = Mockito.mock(AIChatConversation.class);
        Mockito.when(toolbox.getToolboxId()).thenReturn("db");
        Mockito.when(toolboxManager.getFunctionSettings()).thenReturn(settings);
        Mockito.when(conversation.getId()).thenReturn(java.util.UUID.randomUUID());
    }

    @Test
    public void savedDesktopAllowListIsUsedForLiveAndReloadedMessages() {
        AIFunctionDescriptor function = function("uiOpenDBeaverSQLEditor", "openSQLEditor");
        settings.getToolboxSettings(toolbox).setFunctionAllowMode(function, AIFunctionAllowMode.ALWAYS_ALLOW);
        AIChatMessage message = confirmation("db_uiOpenDBeaverSQLEditor");

        WebAIMessage liveMessage = new WebAIMessage(message, conversation, toolboxManager);
        Assertions.assertEquals(Boolean.FALSE, liveMessage.getFunctionConfirmationRequired());
        Assertions.assertEquals(Boolean.FALSE, new WSAiChatMessageEvent(liveMessage).getFunctionConfirmationRequired());
        Assertions.assertEquals(Boolean.FALSE,
            new WebAIMessage(message, conversation, toolboxManager).getFunctionConfirmationRequired());

        settings.getToolboxSettings(toolbox).setFunctionAllowMode(function, AIFunctionAllowMode.ASK);
        Assertions.assertEquals(Boolean.TRUE,
            new WebAIMessage(message, conversation, toolboxManager).getFunctionConfirmationRequired());
    }

    @Test
    public void legacyDesktopAllowListIsRecognized() {
        function("uiOpenDBeaverEntityEditor", "openTableDataEditor");
        settings.getToolboxSettings(toolbox).getAlwaysAllowedFunctions().add("openTableDataEditor");

        Assertions.assertEquals(Boolean.FALSE,
            webMessage("db_uiOpenDBeaverEntityEditor").getFunctionConfirmationRequired());
    }

    @Test
    public void mixedBatchStillRequiresApproval() {
        AIFunctionDescriptor allowed = function("uiOpenDBeaverSQLEditor", "openSQLEditor");
        function("uiOpenDBeaverEntityEditor", "openTableDataEditor");
        settings.getToolboxSettings(toolbox).setFunctionAllowMode(allowed, AIFunctionAllowMode.ALWAYS_ALLOW);

        Assertions.assertEquals(Boolean.TRUE,
            webMessage("db_uiOpenDBeaverSQLEditor", "db_uiOpenDBeaverEntityEditor").getFunctionConfirmationRequired());
    }

    @Test
    public void unknownToolRequiresApproval() {
        Assertions.assertEquals(Boolean.TRUE, webMessage("unknown_tool").getFunctionConfirmationRequired());
    }

    @Test
    public void systemToolRespectsExplicitAskSetting() {
        AIFunctionDescriptor function = function("readMetadata", "readMetadataLegacy");
        Mockito.when(function.isSystem()).thenReturn(true);
        Mockito.when(function.getDefaultAllowMode()).thenReturn(AIFunctionAllowMode.ALWAYS_ALLOW);
        settings.getToolboxSettings(toolbox).setFunctionAllowMode(function, AIFunctionAllowMode.ASK);

        Assertions.assertEquals(Boolean.TRUE, webMessage("db_readMetadata").getFunctionConfirmationRequired());
    }

    @Test
    public void ordinaryMessageHasNoApprovalDecision() {
        WebAIMessage message = new WebAIMessage(
            new AIChatMessage(1, AIMessage.assistantMessage("hello", null)), conversation, toolboxManager
        );
        Assertions.assertNull(message.getFunctionConfirmationRequired());
    }

    @NotNull
    private AIFunctionDescriptor function(@NotNull String functionId, @NotNull String legacyId) {
        AIFunctionDescriptor function = Mockito.mock(AIFunctionDescriptor.class);
        Mockito.when(function.getId()).thenReturn(functionId);
        Mockito.when(function.getLegacyId()).thenReturn(legacyId);
        Mockito.when(function.getToolbox()).thenReturn(toolbox);
        Mockito.when(function.getFullId()).thenReturn("db_" + functionId);
        Mockito.when(function.getDefaultAllowMode()).thenReturn(AIFunctionAllowMode.ASK);
        Mockito.when(toolboxManager.getFunctionByFullId("db_" + functionId)).thenReturn(function);
        return function;
    }

    @NotNull
    private AIChatMessage confirmation(@NotNull String... functionIds) {
        List<AIFunctionCall> calls = java.util.Arrays.stream(functionIds)
            .map(functionId -> new AIFunctionCall(functionId, Map.of()))
            .toList();
        return new AIChatMessage(1, AIMessage.functionConfirmation(calls));
    }

    @NotNull
    private WebAIMessage webMessage(@NotNull String... functionIds) {
        return new WebAIMessage(confirmation(functionIds), conversation, toolboxManager);
    }
}

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
package io.cloudbeaver.service.ai.model.events;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.WebAIUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.ai.*;
import org.jkiss.dbeaver.model.ai.utils.AIUtils;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.websocket.event.WSClientEventHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class WSAiFunctionCallConfirmationHandler implements WSClientEventHandler<WSAiFunctionCallConfirmationClientEvent> {
    public static final Log log = Log.getLog(WSAiFunctionCallConfirmationHandler.class);

    @Override
    public void handleEvent(@NotNull SMSession session, @NotNull WSAiFunctionCallConfirmationClientEvent event) throws DBException {
        if (session instanceof WebSession webSession) {
            AIChatSession chatSession = WebAIUtils.findAiChatSession(webSession);
            if (chatSession == null) {
                webSession.addSessionError(new DBException("Chat session '" + event.getConversationId() + "' not found."));
                return;
            }
            AIChatConversation conversation = chatSession.getConversation(event.getConversationId());
            if (conversation == null) {
                webSession.addSessionError(new DBException("Chat conversation '" + event.getConversationId() + "' not found"));
                return;
            }
            AIChatMessage message = conversation.getMessage(event.getMessageId());
            if (message == null || !(message.message().getConfirmation() instanceof AIFunctionCallConfirmation fcc)) {
                webSession.addSessionError(new DBException("Chat conversation confirmation '" + event.getMessageId() + "' not found"));
                return;
            }
            List<AIFunctionCall> declinedCalls = new ArrayList<>();
            List<AIFunctionCall> approvedCalls = new ArrayList<>();

            List<String> confirmedFunctions = event.getConfirmedFunctionCalls();
            List<String> declinedFunctions = event.getDeclinedFunctionCalls();

            for (AIFunctionCall fc : fcc.getFunctionCalls()) {
                if (confirmedFunctions.contains(fc.getId().toString())) {
                    approvedCalls.add(fc);
                } else if (declinedFunctions.contains(fc.getId().toString())) {
                    declinedCalls.add(fc);
                }
            }

            chatSession.declineFunctionCalls(conversation, declinedCalls);
            CompletableFuture<AIChatConversation> submission;
            if (approvedCalls.isEmpty()) {
                submission = WebAIUtils.scheduleConversationSubmission(
                    webSession,
                    chatSession,
                    conversation,
                    null,
                    "Continue AI conversation"
                );
            } else {
                submission = WebAIUtils.scheduleConversationSubmission(
                    webSession,
                    chatSession,
                    conversation,
                    new AIFunctionCallConfirmation(approvedCalls),
                    "Confirm function calls"
                );
                AIToolboxManager toolboxManager = chatSession.getAssistant().getToolboxManager();
                if (!declinedCalls.isEmpty() && !AIUtils.hasInformationFunctions(toolboxManager, approvedCalls)) {
                    submission = submission.thenCompose(ignored -> WebAIUtils.scheduleConversationSubmission(
                        webSession,
                        chatSession,
                        conversation,
                        null,
                        "Continue AI conversation"
                    ));
                }

            }

        }
    }
}

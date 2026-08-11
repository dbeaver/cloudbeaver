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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.ai.model.WebAIChatConversation;
import io.cloudbeaver.service.ai.model.WebAIMessage;
import io.cloudbeaver.service.ai.model.WebAISendChatMessageInfo;
import io.cloudbeaver.service.ai.model.WebAiChatResponseConsumer;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageEvent;
import io.cloudbeaver.utils.ServletAppUtils;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.ai.*;
import org.jkiss.dbeaver.model.ai.qm.AIChatStorage;
import org.jkiss.dbeaver.model.ai.quota.UserTokenQuotaService;
import org.jkiss.dbeaver.model.ai.registry.AIAssistantRegistry;
import org.jkiss.dbeaver.model.ai.utils.AIUtils;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNUtils;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.utils.CommonUtils;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class WebAIUtils {
    private static final Log log = Log.getLog(WebAIUtils.class);
    private static final String AI_WAITING_ATTR = "ai.waiting.";
    public static final String AI_CHAT_ATTR = "ai_chat";
    public static final String AI_CHAT_USER_ATTR = "ai_chat_user";

    @NotNull
    public static List<String> convertObjectIdsToNodePaths(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPProject project,
        @NotNull String[] objectIds
    ) {
        List<String> customObjectIdList = new ArrayList<>();
        for (String id : objectIds) {
            if (id != null && !id.isEmpty()) {
                try {
                    DBSObject dbpObject = DBUtils.findObjectById(monitor, project, id);
                    if (dbpObject != null) {
                        DBNDatabaseNode dbNode = DBNUtils.getNodeByObject(monitor, dbpObject, false);
                        if (dbNode != null) {
                            customObjectIdList.add(dbNode.getNodeUri());
                        }
                    }
                } catch (DBException e) {
                    log.error("Error finding object by ID: " + id, e);
                }
            }
        }
        return customObjectIdList;
    }

    @NotNull
    public static String[] convertNodePathsToObjectIds(
        @NotNull WebSession session,
        @NotNull DBPProject project,
        @NotNull String[] nodePaths
    ) {
        List<DBNNode> nodes = new ArrayList<>();
        for (String nodePath : nodePaths) {
            if (nodePath != null && !nodePath.isEmpty()) {
                try {
                    DBNNode node = session.getNavigatorModelOrThrow().getNodeByPath(session.getProgressMonitor(), project, nodePath);
                    if (node != null) {
                        nodes.add(node);
                    }
                } catch (DBException e) {
                    log.error("Error finding object by ID: " + nodePath, e);
                }
            }
        }
        return nodes.stream()
            .map(DBNDatabaseNode.class::cast)
            .map(DBNDatabaseNode::getValueObject)
            .map(DBSObject.class::cast)
            .map(DBUtils::getObjectFullId)
            .toArray(String[]::new);
    }

    @Nullable
    public static AIChatSession findAiChatSession(@NotNull WebSession webSession) {
        return webSession.getAttribute(AI_CHAT_ATTR);
    }

    @Nullable
    public static AIContextSettingsChatConversation getConversationSettings(
        @NotNull AIChatSession chatSession,
        @NotNull AIChatConversation conversation
    ) {
        DBPDataSourceContainer container = conversation.getDataSource();
        if (container == null) {
            return null;
        }
        AIContextSettingsChatConversation chatContextSettings = conversation.getCustomSettings();
        if (chatContextSettings == null) {
            chatContextSettings = new AIContextSettingsChatConversation(chatSession, conversation);
            conversation.setCustomSettings(chatContextSettings);
        }
        chatContextSettings.loadDataSourceDefaults();
        chatSession.updateScopeSettingsIfNeeded(chatContextSettings, container);
        return chatContextSettings;
    }

    @NotNull
    public static CompletableFuture<AIChatConversation> scheduleConversationSubmission(
        @NotNull WebSession webSession,
        @NotNull AIChatSession aiChatSession,
        @NotNull AIChatConversation conversation,
        @Nullable AIConfirmation confirmation,
        @NotNull String jobName
    ) {
        CompletableFuture<AIChatConversation> result = new CompletableFuture<>();
        AbstractJob job = new AbstractJob(jobName) {
            @NotNull
            @Override
            protected IStatus run(@NotNull DBRProgressMonitor monitor) {
                try {
                    AIChatResponseConsumer subscriber = new WebAiChatResponseConsumer(conversation, webSession, aiChatSession);
                    aiChatSession.processAICompletion(
                        monitor,
                        conversation,
                        subscriber,
                        WebAIUtils.getConversationSettings(aiChatSession, conversation),
                        confirmation
                    ).whenComplete((submittedConversation, error) -> {
                        if (error != null) {
                            result.completeExceptionally(error);
                        } else {
                            result.complete(submittedConversation);
                        }
                    });
                } catch (DBException e) {
                    if (monitor.isCanceled()) {
                        log.debug("AI completion cancelled", e);
                    } else {
                        log.error("Error processing AI completion", e);
                        var errorMessage = conversation.addMessage(AIMessage.errorMessage(e));
                        webSession.addSessionEvent(new WSAiChatMessageEvent(new WebAIMessage(errorMessage, conversation)));
                        aiChatSession.notifyMessageAdd(conversation, errorMessage);
                    }
                } finally {
                    // Only clear the flag if it still points to this job
                    if (webSession.getAttribute(getWaitingAttr(conversation)) == this) {
                        webSession.removeAttribute(getWaitingAttr(conversation));
                    }
                }
                return Status.OK_STATUS;
            }
        };
        webSession.setAttribute(getWaitingAttr(conversation), job);
        job.schedule();
        return result;
    }

    @NotNull
    public static String getWaitingAttr(@NotNull AIChatConversation conversation) {
        return AI_WAITING_ATTR + conversation.getId();
    }

    @NotNull
    public static AIChatSession getAiChatSession(@NotNull WebSession webSession) throws DBWebException {
        validateAiPluginEnabled();
        String aiChatSessionUser = webSession.getAttribute(AI_CHAT_USER_ATTR);
        boolean sameUser = webSession.isAuthorizedInSecurityManager() &&
            CommonUtils.equalObjects(webSession.getUserId(), aiChatSessionUser);
        if (sameUser || webSession.getUserId() == null) {
            AIChatSession aiChatSession = webSession.getAttribute(AI_CHAT_ATTR);
            if (aiChatSession != null) {
                return aiChatSession;
            }
        }
        return createChatSession(webSession);
    }

    @NotNull
    public static AIChatSession createChatSession(@NotNull WebSession webSession) {
        AIAssistant assistant = AIAssistantRegistry.getInstance().getAssistant(webSession.getWorkspace());
        AIChatStorage qmChatStorage = assistant.createChatStorage();

        AIChatSession aiChatSession = new AIChatSession(
            webSession.getWorkspace(),
            dataSourceContainer -> DBUtils.getDefaultContext(dataSourceContainer, false),
            qmChatStorage,
            assistant.getChatSessionProvider(),
            new UserTokenQuotaService(Clock.systemUTC(), qmChatStorage)
        );
        aiChatSession.addListener(new AIChatListener() {
            @Override
            public void messageAdded(@NotNull AIChatConversation conversation, @NotNull AIChatMessage message) {
                if (message.message().getConfirmation() instanceof AIFunctionCallConfirmation fcc) {
                    for (AIFunctionCall fc : fcc.getFunctionCalls()) {
                        // functions are not resolved at the current step, we need to resolve them first
                        // otherwise no information about a function will be sent
                        AIFunctionDescriptor function = fc.getOrResolveFunction(aiChatSession.getAssistant().getToolboxManager());
                        if (function == null) {
                            log.warn("Function is not found for function call " + fc.getFunctionName());
                        }
                    }
                    WebAIMessage confirmationMessage = new WebAIMessage(message, conversation);
                    WSAiChatMessageEvent event = new WSAiChatMessageEvent(confirmationMessage);
                    webSession.addSessionEvent(event);
                }
            }
        });
        webSession.setAttribute(AI_CHAT_ATTR, aiChatSession);
        if (webSession.getUser() != null) {
            String userId = webSession.getUserId();
            webSession.setAttribute(AI_CHAT_USER_ATTR, userId);
        }
        return aiChatSession;
    }

    @NotNull
    public static AIChatConversation getAiChatConversation(
        @NotNull WebSession webSession,
        @NotNull String conversationId
    ) throws DBWebException {
        try {
            AIChatSession aiChatSession = getAiChatSession(webSession);
            AIChatConversation conversation = aiChatSession.getConversation(conversationId);
            if (conversation == null) {
                throw new DBWebException("Invalid chat conversation ID " + conversationId);
            }
            return conversation;
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @NotNull
    public static WebAISendChatMessageInfo submitPrompt(
        @NotNull WebSession webSession,
        @NotNull AIChatSession aiChatSession,
        @NotNull AIChatConversation conversation,
        @NotNull AIMessage message
    ) throws DBException {
        if (!isMetaTransferConfirmed(conversation)) {
            throw new DBWebException("AI services restricted for '%s'. Please contact your administrator if you need it.".formatted(
                conversation.getDataSource()));
        }
        AIChatMessage promptMessage;
        AIChatMessage result;
        synchronized (conversation) {
            String caption = conversation.getCaption();
            promptMessage = conversation.addMessage(message);
            webSession.addSessionEvent(new WSAiChatMessageEvent(new WebAIMessage(promptMessage, conversation)));
            aiChatSession.notifyMessageAdd(conversation, promptMessage);
            if (!CommonUtils.equalObjects(caption, conversation.getCaption())) {
                aiChatSession.notifyConversationRenamed(conversation, conversation.getCaption());
            }
            if (!AIUtils.hasValidConfiguration()) {
                throw new DBWebException("Invalid AI configuration");
            }
            if (webSession.getAttribute(WebAIUtils.getWaitingAttr(conversation)) != null) {
                throw new DBWebException("Conversation is already waiting for response");
            }
            result = new AIChatMessage(conversation.getNextMessageId(), AIMessage.assistantMessage("", null));
            WebAIUtils.scheduleConversationSubmission(webSession, aiChatSession, conversation, null, "AI completion");
        }
        return new WebAISendChatMessageInfo(
            new WebAIChatConversation(webSession, conversation),
            new WebAIMessage(promptMessage, conversation),
            new WebAIMessage(result, conversation)
        );
    }

    private static boolean isMetaTransferConfirmed(@NotNull AIChatConversation conversation) {
        DBPDataSourceContainer dataSourceContainer = conversation.getDataSource();
        if (dataSourceContainer == null) {
            return true;
        }
        AIContextSettingsDataSource dsSettings = new AIContextSettingsDataSource(dataSourceContainer);
        return dsSettings.isMetaTransferConfirmed();
    }


    public static void validateAiPluginEnabled() throws DBWebException {
        var isAiEnabled = ServletAppUtils.getServletApplication().getAppConfiguration()
            .isFeatureEnabled(WebAIFeatureProvider.AI_FEATURE_ID);
        if (!isAiEnabled) {
            throw new DBWebException("AI feature is disabled");
        }
    }
}

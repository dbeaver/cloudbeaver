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
package io.cloudbeaver.service.ai.gql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.ai.WebAIUtils;
import io.cloudbeaver.service.ai.model.*;
import io.cloudbeaver.service.ai.model.events.WSAiChatMessageEvent;
import io.cloudbeaver.service.ai.model.inputs.DataSourceId;
import io.cloudbeaver.service.ai.model.inputs.WebAIChatConversationInput;
import io.cloudbeaver.service.ai.model.inputs.WebAIConfigurationProfileInput;
import io.cloudbeaver.service.ai.model.inputs.WebAiChatCompletionSettingsInput;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import io.cloudbeaver.utils.WebEventUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.NotNullWhen;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.ai.*;
import org.jkiss.dbeaver.model.ai.engine.AIDatabaseContext;
import org.jkiss.dbeaver.model.ai.engine.AIEngine;
import org.jkiss.dbeaver.model.ai.engine.AIEngineProperties;
import org.jkiss.dbeaver.model.ai.engine.AIModel;
import org.jkiss.dbeaver.model.ai.internal.AIChatMessages;
import org.jkiss.dbeaver.model.ai.prompt.AIPromptGenerateSql;
import org.jkiss.dbeaver.model.ai.registry.*;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.logical.DBSLogicalDataSource;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.websocket.event.WSWorkspaceConfigurationChangedEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.properties.PropertySourceEditable;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.stream.Collectors;

public class WebServiceAI implements DBWServiceAI {

    private static final Log log = Log.getLog(WebServiceAI.class);
    public static final String AI_WAITING_ATTR = "ai.waiting.";

    @NotNull
    @Override
    public WebAISettingsConfig getAiSettings() throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        AISettings settings = AISettingsManager.getInstance().getSettings();
        try {
            AIConfigurationProfile configuration = settings.getDefaultConfiguration();
            return new WebAISettingsConfig(
                configuration.getEngineId(),
                configuration.getProfileId(),
                getAiLanguage()
            );
        } catch (DBException e) {
            throw new DBWebException(e);
        }
    }

    @NotNull
    @Override
    public List<WebAIEngine> getEngineConfigurations() throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        List<WebAIEngine> result = new ArrayList<>();
        AIEngineRegistry.getInstance().getCompletionEngines().forEach(
            engineDescriptor -> result.add(new WebAIEngine(engineDescriptor))
        );
        return result;
    }

    @NotNull
    @Override
    public List<WebPropertyInfo> getEngineConfigurationParameters(
        @NotNull WebSession webSession,
        @NotNull String engineId,
        @Nullable String profileId,
        @Nullable Map<String, Object> settingsInput
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        try {
            AIConfigurationProfile profile = getDefaultConfiguration(engineId, profileId);

            AIEngineProperties engineConfiguration;
            if (settingsInput != null) {
                engineConfiguration = toEngineConfiguration(
                    webSession.getProgressMonitor(),
                    profile,
                    fillModelDefaults(webSession.getProgressMonitor(), profile, settingsInput)
                );
            } else {
                engineConfiguration = profile.getConfiguration();
            }

            return List.of(
                WebServiceUtils.getObjectFilteredProperties(webSession, engineConfiguration, null)
            );
        } catch (DBException e) {
            throw new DBWebException("Error getting engine configuration parameters", e);
        }
    }

    @NotNull
    private AIConfigurationProfile getDefaultConfiguration(@NotNull String engineId, @Nullable String profileId) throws DBException {
        AISettings aiSettings = AISettingsManager.getInstance().getSettings();
        if (profileId != null) {
            return aiSettings.getConfiguration(profileId);
        }

        AIConfigurationProfile profile = new AIConfigurationProfile();
        profile.setEngineId(engineId);
        profile.getEngineDescriptor(); // validate engine descriptor
        return profile;
    }

    @NotNull
    @Override
    public List<WebAIFunctionInfo> getFunctions(@NotNull WebSession webSession) throws DBWebException {
        AIAssistant assistant = AIAssistantRegistry.getInstance().getAssistant(webSession.getWorkspace());
        return assistant.getToolboxManager().getAllFunctions(AIFunctionPurpose.TOOL).stream()
            .map(WebAIFunctionInfo::new)
            .toList();
    }

    @NotNull
    @Override
    public List<WebAIConfigurationProfile> getProfiles(@NotNull WebSession webSession) {
        return Arrays.stream(AISettingsManager.getInstance().getSettings().getConfigurations())
            .map(profile -> new WebAIConfigurationProfile(webSession, profile))
            .toList();
    }

    @NotNull
    @Override
    public WebAISettingsConfig saveAiSettings(@NotNull WebSession webSession, @NotNull WebAISettingsConfig config) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();

        try {
            setAiLanguage(webSession, config.getLanguage());
        } catch (DBException e) {
            throw new DBWebException("Error when saving AI language", e);
        }
        AISettings aiSettings = AISettingsManager.getInstance().getSettings();
        AIConfigurationProfile profile = aiSettings.getConfigurationOrNull(config.getDefaultConfiguration());
        aiSettings.setDefaultConfiguration(profile);
        AISettingsManager.getInstance().saveSettings();

        addAISettingsChangedEvent(webSession);
        return new WebAISettingsConfig(
            profile == null ? "" : profile.getEngineId(),
            profile == null ? null : profile.getProfileId(),
            getAiLanguage()
        );
    }

    @Override
    public boolean saveEngineConfiguration(
        @NotNull WebSession webSession,
        @NotNull String profileId,
        @NotNull Map<String, Object> engineSettingsInput
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        try {
            AISettings settings = AISettingsManager.getInstance().getSettings();
            AIConfigurationProfile profile = settings.getConfiguration(profileId);
            profile.setConfiguration(toEngineConfiguration(webSession.getProgressMonitor(), profile, engineSettingsInput));
            AISettingsManager.getInstance().saveSettings();
            addAISettingsChangedEvent(webSession);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error saving AI configuration " + profileId);
        }
    }

    @NotNull
    @Override
    public WebAsyncTaskInfo performQueryCompletion(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String request
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException {
                monitor.beginTask("Perform query completion", 1);
                monitor.subTask("Perform query completion for " + request);
                try {
                    WebSQLProcessor processor = contextInfo.getProcessor();
                    DBSLogicalDataSource lDataSource = new DBSLogicalDataSource(
                        processor.getConnection().getDataSourceContainer(),
                        "AI logical wrapper",
                        null
                    );
                    AIDatabaseContext dbContext = new AIDatabaseContext.Builder(lDataSource)
                        .setExecutionContext(processor.getExecutionContext())
                        .build();

                    AIAssistant assistant = AIAssistantRegistry.getInstance().getAssistant(webSession.getWorkspace());

                    AIFunctionContext fc = new AIFunctionContext(monitor, dbContext, new AIPromptGenerateSql());
                    AIMessage userMessage = AIMessage.userMessage(request);
                    AIAssistantResponse result = assistant.generateText(
                        monitor,
                        AISettingsManager.getStaticSettings().getDefaultConfiguration(),
                        fc,
                        List.of(userMessage)
                    );

                    if (result.isText()) {
                        this.result = AITextUtils.extractGeneratedSqlQuery(
                            monitor, dbContext, userMessage, result.getText());
                    } else {
                        this.result = "";
                    }
                } catch (DBException e) {
                    throw new InvocationTargetException(e);
                } finally {
                    monitor.done();
                }
            }
        };

        return webSession.createAndRunAsyncTask("AI perform completion query", runnable);
    }

    @Nullable
    @Override
    public String performQueryCompletionResult(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        WebAsyncTaskInfo taskStatus = webSession.asyncTaskStatus(taskId, false);
        return CommonUtils.toString(taskStatus.getResult());
    }

    @NotNull
    @Override
    public WebAIChatConversation createChat(
        @NotNull WebSession webSession,
        @NotNull WebAIChatConversationInput conversationInput
    ) throws DBWebException {
        AIChatSession aiChatSession = WebAIUtils.getAiChatSession(webSession);
        DBPDataSourceContainer dataSource = getDataSource(webSession, conversationInput.dataSourceId());
        try {
            String promptGeneratorId = conversationInput.promptGeneratorId();
            if (promptGeneratorId == null) {
                // by default use SQL generator
                promptGeneratorId = AIPromptGenerateSql.SQL_GENERATOR_ID;
            }
            AIPromptGeneratorDescriptor descriptor = AIPromptGeneratorRegistry.getInstance().getPromptGenerator(promptGeneratorId);
            if (descriptor == null) {
                throw new DBWebException("Invalid prompt generator ID " + promptGeneratorId);
            }
            AIChatConversation newConversation = new AIChatConversation(
                conversationInput.caption() != null ? conversationInput.caption() : "New conversation",
                descriptor.createGenerator(),
                dataSource
            );
            aiChatSession.addConversation(newConversation);
            saveCompletionSettings(webSession, aiChatSession, newConversation, conversationInput.settings());
            return new WebAIChatConversation(webSession, newConversation);
        } catch (DBException e) {
            throw new DBWebException("Error creating conversation", e);
        }
    }

    @NotNull
    @Override
    public WebAIChatConversation updateChatConversation(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @NotNull WebAIChatConversationInput input
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        AIChatSession aiChatSession = WebAIUtils.getAiChatSession(webSession);
        AIChatConversation conversation = WebAIUtils.getAiChatConversation(webSession, conversationId);
        String caption = input.caption();
        if (caption != null) {
            renameConversation(aiChatSession, conversation, caption);
        }
        saveCompletionSettings(webSession, aiChatSession, conversation, input.settings());
        return new WebAIChatConversation(webSession, conversation);
    }

    @Override
    public boolean deleteChatConversation(@NotNull WebSession webSession, @NotNull String conversationId) throws DBWebException {
        try {
            AIChatSession aiChatSession = WebAIUtils.getAiChatSession(webSession);
            AIChatConversation conversation = aiChatSession.getConversation(conversationId);
            if (conversation == null) {
                throw new DBWebException("Invalid conversation ID " + conversationId);
            }
            aiChatSession.removeConversation(conversation);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
        return true;
    }

    @NotNull
    @Override
    public List<WebAIChatConversation> getChatConversations(
        @NotNull WebSession webSession,
        @Nullable DataSourceId dataSourceId
    ) throws DBWebException {
        AIChatSession session = WebAIUtils.getAiChatSession(webSession);
        DBPDataSourceContainer connectionInfo = getDataSource(webSession, dataSourceId);
        try {
            return session.getAllConversations(connectionInfo).stream()
                .map(c -> new WebAIChatConversation(webSession, c))
                .collect(Collectors.toList());
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @NotNull
    @Override
    public WebAIChatConversation getChatConversationInfo(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @Nullable Boolean loadMetrics
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        AIChatConversation conversation = WebAIUtils.getAiChatConversation(webSession, conversationId);
        WebAIChatConversationMetrics metrics = null;
        if (loadMetrics != null && loadMetrics) {
            AIExtendedUsage aiExtendedUsage = conversation.computeUsage();
            metrics = WebAIChatConversationMetrics.from(aiExtendedUsage);
        }
        return new WebAIChatConversation(webSession, conversation, metrics);
    }

    @NotNull
    @Override
    public WebAISendChatMessageInfo asyncSendChatMessage(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @NotNull String prompt
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        try {
            AIChatSession aiChatSession = WebAIUtils.getAiChatSession(webSession);
            AIChatConversation conversation = aiChatSession.getConversation(conversationId);
            if (conversation == null) {
                throw new DBWebException("Invalid chat conversation ID " + conversationId);
            }
            if (prompt.trim().isEmpty()) {
                throw new DBWebException("Invalid prompt");
            }
            AIMessage message = AIMessage.userMessage(prompt.trim());
            return WebAIUtils.submitPrompt(webSession, aiChatSession, conversation, message);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public boolean setLastChatMessage(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @NotNull String messageId
    ) throws DBWebException {
        AIChatSession chatSession = WebAIUtils.getAiChatSession(webSession);
        AIChatConversation conversation = WebAIUtils.getAiChatConversation(webSession, conversationId);
        AIChatMessage message = conversation.getMessages().stream()
            .filter(m -> messageId.equals(CommonUtils.toString(m.id())))
            .findFirst()
            .orElseThrow(() -> new DBWebException("Invalid message ID " + messageId));
        chatSession.notifyMessagesRemove(conversation, message);
        conversation.clearMessagesAfter(message);
        return true;
    }

    @Override
    public boolean cancelChatMessage(
        @NotNull WebSession webSession,
        @NotNull String conversationId
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        AIChatConversation conversation = WebAIUtils.getAiChatConversation(webSession, conversationId);
        synchronized (conversation) {
            boolean completionStarted = conversation.isActive();
            conversation.cancelConversation();
            boolean hadPendingJob = false;
            if (webSession.getAttribute(WebAIUtils.getWaitingAttr(conversation)) instanceof AbstractJob job) {
                hadPendingJob = true;
                job.cancel();
            }
            webSession.removeAttribute(WebAIUtils.getWaitingAttr(conversation));
            if (hadPendingJob && !completionStarted) {
                // The completion job was still queued, so its response consumer will not be called.
                // We need to add a cancellation message to the conversation and notify the client.
                AIChatMessage cancelMessage = conversation.addMessage(
                    AIMessage.warningMessage(AIChatMessages.ai_chat_conversation_cancelled));
                webSession.addSessionEvent(new WSAiChatMessageEvent(new WebAIMessage(cancelMessage, conversation)));
            }
        }
        return true;
    }

    @NotNull
    @Override
    public WebAIDataSourceSettings getDataSourceAiSettings(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @NotNull DataSourceId dataSourceId
    ) throws DBWebException {
        DBPDataSourceContainer dataSourceContainer = getDataSource(webSession, dataSourceId);
        AIContextSettingsDataSource settings = new AIContextSettingsDataSource(dataSourceContainer);
        String userOrigin = ServletAppUtils.getOriginFromRequest(request);
        return new WebAIDataSourceSettings(settings, userOrigin);
    }

    @NotNull
    @Override
    public WebAIDataSourceSettings saveDataSourceAiSettings(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull DataSourceId dataSourceId,
        @NotNull WebAiChatCompletionSettingsInput settingsInput
    ) throws DBWebException {
        DBPDataSourceContainer dataSourceContainer = getDataSource(webSession, dataSourceId);
        AIContextSettingsDataSource aiSettings = new AIContextSettingsDataSource(dataSourceContainer);
        if (settingsInput.mcpEnabled() != null) {
            aiSettings.setMcpEnabled(settingsInput.mcpEnabled());
        }
        if (settingsInput.metaTransferConfirmed() != null) {
            aiSettings.setMetaTransferConfirmed(settingsInput.metaTransferConfirmed());
        }
        if (settingsInput.scope() != null) {
            aiSettings.setScope(settingsInput.scope());
        }
        if (settingsInput.customObjectIds() != null) {
            aiSettings.setCustomObjectIds(
                WebAIUtils.convertNodePathsToObjectIds(
                    webSession,
                    dataSourceContainer.getProject(),
                    settingsInput.customObjectIds()
                )
            );
        }
        aiSettings.saveSettings();
        String userOrigin = ServletAppUtils.getOriginFromRequest(request);
        return new WebAIDataSourceSettings(aiSettings, userOrigin);
    }

    @NotNull
    @Override
    public WebAIConfigurationProfile createProfile(
        @NotNull WebSession webSession,
        @NotNull WebAIConfigurationProfileInput input
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        AISettings settings = AISettingsManager.getInstance().getSettings();
        if (CommonUtils.isEmpty(input.profileId())) {
            throw new DBWebException("Profile ID is not specified");
        }
        if (CommonUtils.isEmpty(input.engineId())) {
            throw new DBWebException("Engine ID is not specified");
        }
        if (CommonUtils.isEmpty(input.profileName())) {
            throw new DBWebException("Profile name is not specified");
        }
        AIEngineDescriptor engineDescriptor = AIEngineRegistry.getInstance().getEngineDescriptor(input.engineId());
        if (engineDescriptor == null) {
            throw new DBWebException("Invalid AI engine configuration ID " + input.engineId());
        }
        try {
            settings.createConfiguration(input.profileId(), engineDescriptor);
            AIConfigurationProfile profile = settings.getConfiguration(input.profileId());
            profile.setProfileName(input.profileName());
            if (input.configuration() != null) {
                profile.setConfiguration(toEngineConfiguration(webSession.getProgressMonitor(), profile, input.configuration()));
            }
            AISettingsManager.getInstance().saveSettings();
            addAISettingsChangedEvent(webSession);
            return new WebAIConfigurationProfile(webSession, settings.getConfiguration(input.profileId()));
        } catch (DBException e) {

            throw new DBWebException("Error creating AI configuration " + input.profileId(), e);
        }
    }

    @NotNull
    @Override
    public WebAIConfigurationProfile updateProfile(
        @NotNull WebSession webSession,
        @NotNull WebAIConfigurationProfileInput input
    ) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        try {
            AISettings settings = AISettingsManager.getInstance().getSettings();
            AIConfigurationProfile profile = settings.getConfiguration(input.profileId());
            if (input.profileName() != null) {
                profile.setProfileName(input.profileName());
            }
            if (input.configuration() != null) {
                profile.setConfiguration(toEngineConfiguration(webSession.getProgressMonitor(), profile, input.configuration()));
            }
            AISettingsManager.getInstance().saveSettings();
            addAISettingsChangedEvent(webSession);
            return new WebAIConfigurationProfile(webSession, profile);
        } catch (DBException e) {
            throw new DBWebException("Error updating AI configuration " + input.profileId(), e);
        }
    }

    @Override
    public boolean deleteProfile(@NotNull WebSession webSession, @NotNull String profileId) throws DBWebException {
        WebAIUtils.validateAiPluginEnabled();
        try {
            AISettings settings = AISettingsManager.getInstance().getSettings();
            AIConfigurationProfile profile = settings.getConfiguration(profileId);
            settings.removeConfiguration(profile);
        } catch (DBException e) {
            throw new DBWebException("Error deleting AI configuration " + profileId, e);
        }
        return true;
    }

    @NotNullWhen("dataSourceId != null")
    private DBPDataSourceContainer getDataSource(
        @NotNull WebSession webSession,
        @Nullable DataSourceId dataSourceId
    ) throws DBWebException {
        if (dataSourceId == null) {
            return null;
        }
        return WebDataSourceUtils.getWebConnectionInfo(webSession, dataSourceId.projectId(), dataSourceId.connectionId())
            .getDataSourceContainer();
    }

    private void addAISettingsChangedEvent(@NotNull WebSession webSession) {
        ServletAppUtils.getServletApplication().getEventController().addEvent(
            new WSWorkspaceConfigurationChangedEvent(
                AISettingsManager.AI_CONFIGURATION_FILE_NAME,
                WebEventUtils.getSmSessionId(webSession),
                webSession.getUserId()
            )
        );
    }

    @NotNull
    private Map<String, Object> fillModelDefaults(
        @NotNull DBRProgressMonitor monitor,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> engineSettingsInput
    ) throws DBException {
        // TODO: Think how default values can be set without modifying input map and not affecting the code model
        Map<String, Object> inputProperties = JSONUtils.getObject(engineSettingsInput, "properties");

        AIEngineProperties configuration;
        try {
            configuration = profile.getConfiguration();

            if (!configuration.isValidConfiguration()) {
                inputProperties.put(AIConstants.AI_CONTEXT_SIZE_PROPERTY, AIConstants.DEFAULT_CONTEXT_WINDOW_SIZE);
                return engineSettingsInput;
            }
        } catch (DBException e) {
            throw new DBWebException("Error converting engine configuration", e);
        }

        if (!profile.getEngineDescriptor().isProvidesMetadata()) {
            return engineSettingsInput;
        }
        try (AIEngine<?> engine = profile.getEngineDescriptor().createEngineInstance(configuration)) {
            Object modelId = inputProperties.get(AIConstants.AI_MODEL_PROPERTY);
            AIModel model = engine.getModels(monitor)
                .stream()
                .filter(m -> Objects.equals(m.name(), modelId))
                .findFirst()
                .orElse(null);

            if (model != null) {
                inputProperties.put(AIConstants.AI_CONTEXT_SIZE_PROPERTY, model.contextWindowSize());
                inputProperties.put(AIConstants.AI_TEMPERATURE_PROPERTY, model.defaultTemperature());
            } else {
                inputProperties.put(AIConstants.AI_CONTEXT_SIZE_PROPERTY, AIConstants.DEFAULT_CONTEXT_WINDOW_SIZE);
                log.info("Model " + modelId + " not found");
            }
        } catch (DBException e) {
            log.info("Error fetching models ", e);
        }
        return engineSettingsInput;
    }

    @NotNull
    private AIEngineProperties toEngineConfiguration(
        @NotNull DBRProgressMonitor progressMonitor,
        @NotNull AIConfigurationProfile profile,
        @NotNull Map<String, Object> engineSettingsInput
    ) throws DBWebException {
        Map<String, Object> engineProperties = JSONUtils.getObject(engineSettingsInput, "properties");
        // TODO: Think how default values can be set without modifying input map and not affecting the code model
        if (engineProperties.get(AIConstants.AI_TEMPERATURE_PROPERTY) instanceof String stringValue && stringValue.isBlank()) {
            engineProperties.put(AIConstants.AI_TEMPERATURE_PROPERTY, 0.0);
        }
        if (engineProperties.get(AIConstants.AI_CONTEXT_SIZE_PROPERTY) instanceof String stringValue && stringValue.isBlank()) {
            engineProperties.put(AIConstants.AI_CONTEXT_SIZE_PROPERTY, AIConstants.DEFAULT_CONTEXT_WINDOW_SIZE);
        }

        try {
            AIEngineProperties configuration = profile.getConfiguration();
            PropertySourceEditable pse = new PropertySourceEditable(configuration, configuration);
            pse.collectProperties();
            for (DBPPropertyDescriptor pd : pse.getProperties()) {
                Object value = engineProperties.get(pd.getId());
                if (value != null) {
                    pse.setPropertyValue(progressMonitor, pd.getId(), value);
                }
            }
            return configuration;
        } catch (DBException e) {
            throw new DBWebException("Error converting engine configuration", e);
        }
    }

    private void renameConversation(
        @NotNull AIChatSession chatSession,
        @NotNull AIChatConversation conversation,
        @NotNull String newName
    ) {
        conversation.setCaption(newName.trim());
        chatSession.notifyConversationRenamed(conversation, newName.trim());
    }

    private static void saveCompletionSettings(
        @NotNull WebSession webSession,
        @NotNull AIChatSession session,
        @NotNull AIChatConversation conversation,
        @Nullable WebAiChatCompletionSettingsInput settingsInput
    ) throws DBWebException {
        AIContextSettingsChatConversation settings = WebAIUtils.getConversationSettings(session, conversation);
        if (settings == null || settingsInput == null) {
            return;
        }
        if (settingsInput.profile() != null) {
            AIConfigurationProfile profile = AISettingsManager.getInstance().getSettings().getConfigurationOrNull(settingsInput.profile());
            if (profile == null) {
                throw new DBWebException("Invalid AI configuration profile " + settingsInput.profile());
            }
            conversation.setProfile(profile);
        }
        if (settingsInput.metaTransferConfirmed() != null) {
            settings.setMetaTransferConfirmed(settingsInput.metaTransferConfirmed());
        }
        if (settingsInput.scope() != null) {
            settings.setScope(settingsInput.scope());
        }
        if (settingsInput.customObjectIds() != null) {
            DBPProject project = conversation.getDataSource() == null ? null : conversation.getDataSource().getProject();
            if (project != null) {
                settings.setCustomObjectIds(WebAIUtils.convertNodePathsToObjectIds(webSession, project, settingsInput.customObjectIds()));
            }
        }
        try {
            settings.saveSettings();
        } catch (DBException e) {
            throw new DBWebException("Error saving AI completion settings", e);
        }
    }

    private static void setAiLanguage(@NotNull WebSession webSession, @Nullable String language) throws DBException {
        if (language != null) {
            CBApplication.getInstance().saveProductConfiguration(
                webSession,
                Map.of(AIConstants.AI_RESPONSE_LANGUAGE, language)
            );
        }
    }

    @Nullable
    private static String getAiLanguage() {
        return DBWorkbench.getPlatform().getPreferenceStore()
            .getString(AIConstants.AI_RESPONSE_LANGUAGE);
    }

}

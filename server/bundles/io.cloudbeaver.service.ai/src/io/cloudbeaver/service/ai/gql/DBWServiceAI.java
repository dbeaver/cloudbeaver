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

import io.cloudbeaver.*;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.ai.model.*;
import io.cloudbeaver.service.ai.model.inputs.DataSourceId;
import io.cloudbeaver.service.ai.model.inputs.WebAIChatConversationInput;
import io.cloudbeaver.service.ai.model.inputs.WebAIConfigurationProfileInput;
import io.cloudbeaver.service.ai.model.inputs.WebAiChatCompletionSettingsInput;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.rm.RMConstants;

import java.util.List;
import java.util.Map;

/**
 * Service for executing GraphQL functions for AI module.
 */
public interface DBWServiceAI extends DBWService {

    @NotNull
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebAISettingsConfig getAiSettings() throws DBWebException;

    @NotNull
    @WebAction
    List<WebAIEngine> getEngineConfigurations() throws DBWebException;

    @NotNull
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<WebPropertyInfo> getEngineConfigurationParameters(
        @NotNull WebSession webSession,
        @NotNull String engineId,
        @Nullable String profileId,
        @Nullable Map<String, Object> engineSettings
    ) throws DBWebException;

    @NotNull
    @WebAction
    List<WebAIFunctionInfo> getFunctions(@NotNull WebSession webSession) throws DBWebException;

    @NotNull
    @WebAction
    List<WebAIConfigurationProfile> getProfiles(@NotNull WebSession webSession) throws DBWebException;

    @NotNull
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebAISettingsConfig saveAiSettings(
        @NotNull WebSession webSession,
        @NotNull WebAISettingsConfig config
    ) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean saveEngineConfiguration(
        @NotNull WebSession webSession,
        @NotNull String profileId,
        @WebParameterSecure @NotNull Map<String, Object> engineSettings
    ) throws DBWebException;

    @NotNull
    @WebAction
    WebAsyncTaskInfo performQueryCompletion(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String request
    ) throws DBWebException;

    @Nullable
    @WebAction
    String performQueryCompletionResult(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException;

    @NotNull
    @WebAction
    WebAIChatConversation createChat(
        @NotNull WebSession webSession,
        @NotNull WebAIChatConversationInput conversationInput
    ) throws DBWebException;

    @NotNull
    @WebAction
    WebAIChatConversation updateChatConversation(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @NotNull WebAIChatConversationInput conversationInput
    ) throws DBWebException;

    @WebAction
    boolean deleteChatConversation(@NotNull WebSession webSession, @NotNull String conversationId) throws DBWebException;

    @NotNull
    @WebAction
    List<WebAIChatConversation> getChatConversations(
        @NotNull WebSession webSession,
        @Nullable DataSourceId dataSourceId
    ) throws DBWebException;

    @NotNull
    @WebAction
    WebAIChatConversation getChatConversationInfo(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @Nullable Boolean loadMetrics
    ) throws DBWebException;

    @NotNull
    @WebAction
    WebAISendChatMessageInfo asyncSendChatMessage(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @NotNull String prompt
    ) throws DBWebException;

    @WebAction
    boolean setLastChatMessage(
        @NotNull WebSession webSession,
        @NotNull String conversationId,
        @NotNull String messageId
    ) throws DBWebException;

    @WebAction
    boolean cancelChatMessage(
        @NotNull WebSession webSession,
        @NotNull String conversationId
    ) throws DBWebException;

    @NotNull
    @WebAction
    WebAIDataSourceSettings getDataSourceAiSettings(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @NotNull DataSourceId dataSourceId
    ) throws DBWebException;

    @NotNull
    @WebProjectAction(requireProjectPermissions = RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT)
    WebAIDataSourceSettings saveDataSourceAiSettings(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull DataSourceId dataSourceId,
        @NotNull WebAiChatCompletionSettingsInput settings
    ) throws DBWebException;

    @NotNull
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebAIConfigurationProfile createProfile(
        @NotNull WebSession webSession,
        @WebParameterSecure @NotNull WebAIConfigurationProfileInput config
    ) throws DBWebException;

    @NotNull
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebAIConfigurationProfile updateProfile(
        @NotNull WebSession webSession,
        @WebParameterSecure @NotNull WebAIConfigurationProfileInput config
    ) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteProfile(@NotNull WebSession webSession, @NotNull String profileId) throws DBWebException;
}

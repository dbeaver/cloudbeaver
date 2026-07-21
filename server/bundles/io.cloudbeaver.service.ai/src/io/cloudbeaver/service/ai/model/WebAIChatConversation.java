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
import io.cloudbeaver.service.ai.gql.WebServiceAI;
import io.cloudbeaver.service.ai.model.inputs.DataSourceId;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.ai.AIChatConversation;
import org.jkiss.dbeaver.model.ai.AIContextSettingsChatConversation;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

public class WebAIChatConversation {

    @NotNull
    private final WebSession webSession;
    @NotNull
    private final AIChatConversation conversation;
    @Nullable
    private final WebAIChatConversationMetrics metrics;

    public WebAIChatConversation(
        @NotNull WebSession webSession,
        @NotNull AIChatConversation conversation
    ) {
        this.webSession = webSession;
        this.conversation = conversation;
        this.metrics = null;
    }

    public WebAIChatConversation(
        @NotNull WebSession webSession,
        @NotNull AIChatConversation conversation,
        @Nullable WebAIChatConversationMetrics metrics
    ) {
        this.webSession = webSession;
        this.conversation = conversation;
        this.metrics = metrics;
    }

    @Nullable
    public DataSourceId getDataSourceId() {
        DBPDataSourceContainer dataSourceContainer = conversation.getDataSource();
        if (dataSourceContainer == null) {
            return null;
        }
        return new DataSourceId(
            dataSourceContainer.getProject().getId(),
            dataSourceContainer.getId()
        );
    }

    @NotNull
    public UUID getId() {
        return conversation.getId();
    }

    @NotNull
    public String getPromptGeneratorId() {
        return conversation.getPromptGenerator().generatorId();
    }

    @NotNull
    public String getCaption() {
        return conversation.getCaption();
    }

    @Nullable
    public WebAIChatConversationSettings getSettings() {
        AIContextSettingsChatConversation settings = conversation.getCustomSettings();
        if (settings == null) {
            return null;
        }
        return new WebAIChatConversationSettings(webSession, settings, conversation.getDataSource());
    }

    @NotNull
    public OffsetDateTime getTime() {
        LocalDateTime time = conversation.getMessages().isEmpty() ? conversation.getTime() : conversation.getLastMessageTime();
        return time.atZone(ZoneId.systemDefault())
            .withZoneSameInstant(ZoneOffset.UTC)
            .toOffsetDateTime();
    }

    @NotNull
    public List<WebAIMessage> getMessages() {
        return conversation.getMessages().stream()
            .map(message -> new WebAIMessage(message, conversation))
            .toList();
    }

    public boolean isWaitingForResponse() {
        return webSession.getAttribute(WebServiceAI.AI_WAITING_ATTR + conversation.getId()) != null;
    }

    @Nullable
    public WebAIChatConversationMetrics getMetrics() {
        return metrics;
    }

    @Nullable
    public String getProfile() {
        return conversation.getProfile() == null ? null : conversation.getProfile().getProfileId();
    }

    @NotNull
    public AIChatConversation getConversation() {
        return conversation;
    }
}

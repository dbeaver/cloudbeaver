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

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceInitializer;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.ai.WebAIFeatureProvider;
import io.cloudbeaver.service.ai.model.inputs.DataSourceId;
import io.cloudbeaver.service.ai.model.inputs.WebAIChatConversationInput;
import io.cloudbeaver.service.ai.model.inputs.WebAIConfigurationProfileInput;
import io.cloudbeaver.service.ai.model.inputs.WebAiChatCompletionSettingsInput;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.ai.AIConstants;
import org.jkiss.dbeaver.model.ai.registry.AISettingsManager;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.PrefUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class WebServiceBindingAI extends WebServiceBindingBase<DBWServiceAI> implements DBWServiceInitializer {
    private static final Log log = Log.getLog(WebServiceBindingAI.class);

    public WebServiceBindingAI() {
        super(DBWServiceAI.class, new WebServiceAI(), "schema/service.ai.graphqls");
        DBPPreferenceStore store = DBWorkbench.getPlatform().getPreferenceStore();
        PrefUtils.setDefaultPreferenceValue(store, AIConstants.AI_INCLUDE_SOURCE_TEXT_IN_QUERY_COMMENT, true);
    }

    @Override
    public void bindWiring(DBWBindingContext model) {
        model.getQueryType()
            .dataFetcher("aiSettings", env -> getService(env).getAiSettings())
            .dataFetcher("aiListEngines", env -> getService(env).getEngineConfigurations())
            .dataFetcher(
                "aiListEngineProperties",
                env -> getService(env).getEngineConfigurationParameters(
                    getWebSession(env),
                    getArgumentVal(env, "engineId"),
                    getArgument(env, "profileId"),
                    env.getArgument("settings")
                )
            ).dataFetcher("aiListFunctions", env -> getService(env).getFunctions(getWebSession(env))
            ).dataFetcher("aiListProfiles", env -> getService(env).getProfiles(getWebSession(env))
            ).dataFetcher(
                "aiListChatConversations",
                env -> getService(env).getChatConversations(
                    getWebSession(env),
                    JSONUtils.deserializeObject(getArgument(env, "dataSourceId"), DataSourceId.class)
                )
            ).dataFetcher(
                "aiChatConversationInfo",
                env -> getService(env).getChatConversationInfo(
                    getWebSession(env),
                    getArgumentVal(env, "conversationId"),
                    env.getArgument("loadMetrics")
                )
            ).dataFetcher(
                "aiDataSourceSettings",
                env -> getService(env).getDataSourceAiSettings(
                    GraphQLEndpoint.getServletRequestOrThrow(env),
                    getWebSession(env),
                    JSONUtils.deserializeObject(getArgumentVal(env, "dataSourceId"), DataSourceId.class)
                )
            );
        model.getMutationType()
            .dataFetcher(
                "aiSaveSettings",
                env -> getService(env).saveAiSettings(
                    getWebSession(env),
                    JSONUtils.deserializeObject(getArgumentVal(env, "settings"), WebAISettingsConfig.class)
                )
            )
            .dataFetcher(
                "aiSaveDataSourceSettings",

                env -> {
                    DataSourceId dataSourceId = JSONUtils.deserializeObject(
                        getArgumentVal(env, "dataSourceId"),
                        DataSourceId.class
                    );
                    return getService(env).saveDataSourceAiSettings(
                        GraphQLEndpoint.getServletRequestOrThrow(env),
                        getWebSession(env),
                        dataSourceId.projectId(),
                        dataSourceId,
                        JSONUtils.deserializeObject(getArgumentVal(env, "settings"), WebAiChatCompletionSettingsInput.class)
                    );
                }
            )
            .dataFetcher(
                "aiSaveEngineConfiguration",
                env -> getService(env).saveEngineConfiguration(
                    getWebSession(env),
                    getArgumentVal(env, "profileId"),
                    getArgumentVal(env, "settings")
                )
            ).dataFetcher(
                "asyncAiPerformQueryCompletion",
                env -> getService(env).performQueryCompletion(
                    getWebSession(env),
                    WebServiceBindingSQL.getSQLContext(env),
                    getArgumentVal(env, "request")
                )
            ).dataFetcher(
                "asyncAiPerformQueryCompletionResult",
                env -> getService(env).performQueryCompletionResult(
                    getWebSession(env),
                    getArgumentVal(env, "taskId")
                )
            ).dataFetcher(
                "aiCreateChatConversation",
                env -> getService(env).createChat(
                    getWebSession(env),
                    JSONUtils.deserializeObject(getArgument(env, "config"), WebAIChatConversationInput.class)
                )
            ).dataFetcher(
                "aiUpdateChatConversation",
                env -> getService(env).updateChatConversation(
                    getWebSession(env),
                    getArgumentVal(env, "conversationId"),
                    JSONUtils.deserializeObject(getArgument(env, "config"), WebAIChatConversationInput.class)
                )
            ).dataFetcher(
                "aiDeleteChatConversation",
                env -> getService(env).deleteChatConversation(
                    getWebSession(env),
                    getArgumentVal(env, "conversationId")
                )
            ).dataFetcher(
                "aiSendChatMessage",
                env -> getService(env).asyncSendChatMessage(
                    getWebSession(env),
                    getArgumentVal(env, "conversationId"),
                    getArgumentVal(env, "prompt")
                )
            ).dataFetcher(
                "aiClearLastChatMessages",
                env -> getService(env).setLastChatMessage(
                    getWebSession(env),
                    getArgumentVal(env, "conversationId"),
                    getArgumentVal(env, "messageId")
                )
            ).dataFetcher(
                "aiCancelChatMessage",
                env -> getService(env).cancelChatMessage(
                    getWebSession(env),
                    getArgumentVal(env, "conversationId")
                )
            ).dataFetcher(
                "aiCreateProfile", env -> getService(env).createProfile(
                    getWebSession(env),
                    JSONUtils.deserializeObject(getArgumentVal(env, "config"), WebAIConfigurationProfileInput.class)
                )
            ).dataFetcher(
                "aiUpdateProfile", env -> getService(env).updateProfile(
                    getWebSession(env),
                    JSONUtils.deserializeObject(getArgumentVal(env, "config"), WebAIConfigurationProfileInput.class)
                )
            ).dataFetcher(
                "aiDeleteProfile", env -> getService(env).deleteProfile(
                    getWebSession(env),
                    getArgumentVal(env, "profileId")
                )
            );
    }

    @Override
    public void initializeService(@NotNull CBApplication<?> application) {
        // adds event listener to config file changer
        AISettingsManager.getInstance().addChangedListener(
            x -> {
                // check if AI is enabled
                boolean aiEnabled = !x.getSettings().isAiDisabled();
                List<String> enabledFeatures = new ArrayList<>(Arrays.asList(application.getAppConfiguration().getEnabledFeatures()));
                boolean aiFeatureEnabled = enabledFeatures.contains(WebAIFeatureProvider.AI_FEATURE_ID);
                // remove AI feature if it is disabled (and do not remove if it is enabled)
                if ((aiEnabled && aiFeatureEnabled) || (!aiEnabled && !aiFeatureEnabled)) {
                    // nothing to change
                    return;
                }
                if (aiEnabled) {
                    enabledFeatures.add(WebAIFeatureProvider.AI_FEATURE_ID);
                } else {
                    enabledFeatures.remove(WebAIFeatureProvider.AI_FEATURE_ID);
                }
                application.getAppConfiguration().setEnabledFeatures(enabledFeatures.toArray(String[]::new));
                if (application.isConfigurationMode()) {
                    return;
                }
                try {
                    application.flushConfiguration();
                } catch (Exception e) {
                    log.error("Failed to save server configuration", e);
                }
            }
        );
    }
}

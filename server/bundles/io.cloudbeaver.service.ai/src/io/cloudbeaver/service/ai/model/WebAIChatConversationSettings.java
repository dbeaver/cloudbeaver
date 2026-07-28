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
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.ai.AIContextSettingsChatConversation;
import org.jkiss.dbeaver.model.ai.AIDatabaseScope;
import org.jkiss.dbeaver.model.app.DBPProject;

import java.util.List;

public class WebAIChatConversationSettings {
    private static final Log log = Log.getLog(WebAIChatConversationSettings.class);

    @NotNull
    private final WebSession webSession;
    @NotNull
    private final AIContextSettingsChatConversation settings;
    @Nullable
    private final DBPProject project;

    public WebAIChatConversationSettings(
        @NotNull WebSession webSession,
        @NotNull AIContextSettingsChatConversation settings,
        @Nullable DBPDataSourceContainer container
    ) {
        this.webSession = webSession;
        this.settings = settings;
        this.project = container == null ? null : container.getProject();
    }

    public boolean isMetaTransferConfirmed() {
        return true; //FIXME: we need to implement this
    }

    public AIDatabaseScope getScope() {
        return settings.getScope();
    }

    public List<String> getCustomObjectIds() {
        if (project == null) {
            return List.of();
        }
        String[] customObjectIds = settings.getCustomObjectIds();
        if (customObjectIds == null || customObjectIds.length == 0) {
            return List.of();
        }
        return WebAIUtils.convertObjectIdsToNodePaths(
            webSession.getProgressMonitor(),
            project,
            customObjectIds
        );
    }
}

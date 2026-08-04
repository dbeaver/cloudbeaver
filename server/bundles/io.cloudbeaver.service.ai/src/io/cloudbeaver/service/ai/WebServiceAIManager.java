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
import io.cloudbeaver.service.ai.gql.WebAISettingsConfig;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.AIConstants;
import org.jkiss.dbeaver.runtime.DBWorkbench;

public class WebServiceAIManager {

    public WebAISettingsConfig getAiSettings() throws DBWebException {
        return null;
    }

    @Nullable
    private static String getAiLanguage() {
        return DBWorkbench.getPlatform().getPreferenceStore()
            .getString(AIConstants.AI_RESPONSE_LANGUAGE);
    }
}

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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.ai.AIContextSettings;
import org.jkiss.dbeaver.model.ai.AIContextSettingsDataSource;
import org.jkiss.dbeaver.model.ai.AIDatabaseScope;
import org.jkiss.dbeaver.model.meta.Property;

public class WebAIDataSourceSettings {
    @NotNull
    private final AIContextSettingsDataSource settings;

    @NotNull
    private final String userOrigin;

    public WebAIDataSourceSettings(@NotNull AIContextSettingsDataSource settings, @NotNull String userOrigin) {
        this.settings = settings;
        this.userOrigin = userOrigin;
    }

    @Property
    public boolean isMetaTransferConfirmed() {
        return settings.isMetaTransferConfirmed();
    }

    @Nullable
    @Property
    public AIDatabaseScope getScope() {
        return settings.getScope();
    }

    @NotNull
    public DBPDataSourceContainer getDataSourceContainer() {
        return settings.getDataSourceContainer();
    }

    @NotNull
    public AIContextSettings getSettings() {
        return settings;
    }

    @NotNull
    public String getUserOrigin() {
        return userOrigin;
    }
}

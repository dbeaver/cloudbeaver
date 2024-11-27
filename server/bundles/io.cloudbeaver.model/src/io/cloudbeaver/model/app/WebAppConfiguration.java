/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.model.app;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;

import java.util.Map;

/**
 * Application configuration
 */
public interface WebAppConfiguration extends ServletAppConfiguration {
    DataSourceNavigatorSettings.Preset PRESET_WEB = new DataSourceNavigatorSettings.Preset("web",
        "Web",
        "Default view");

    DBNBrowseSettings getDefaultNavigatorSettings();

    boolean isPublicCredentialsSaveEnabled();

    boolean isAdminCredentialsSaveEnabled();

    default String[] getDisabledBetaFeatures() {
        return new String[0];
    }

    default String[] getEnabledAuthProviders() {
        return new String[0];
    }

    @NotNull
    String[] getEnabledDrivers();

    @NotNull
    String[] getDisabledDrivers();

    Map<String, Object> getResourceQuotas();
}

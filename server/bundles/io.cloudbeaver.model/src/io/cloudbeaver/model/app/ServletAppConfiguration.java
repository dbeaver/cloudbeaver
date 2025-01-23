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
import org.jkiss.code.Nullable;

import java.util.Map;

/**
 * Application configuration
 */
public interface ServletAppConfiguration {
    String getAnonymousUserTeam();

    boolean isAnonymousAccessEnabled();

    @Nullable
    <T> T getResourceQuota(String quotaId);

    String getDefaultUserTeam();

    <T> T getPluginOption(@NotNull String pluginId, @NotNull String option);

    Map<String, Object> getPluginConfig(@NotNull String pluginId, boolean create);

    boolean isResourceManagerEnabled();

    boolean isSecretManagerEnabled();

    boolean isFeaturesEnabled(String[] requiredFeatures);

    boolean isFeatureEnabled(String id);

    @NotNull
    default String[] getEnabledFeatures() {
        return new String[0];
    }

    default boolean isSupportsCustomConnections() {
        return true;
    }
}

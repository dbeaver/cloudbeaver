/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import io.cloudbeaver.DBWFeatureSet;
import io.cloudbeaver.registry.WebFeatureRegistry;
import org.jkiss.code.NotNull;
import org.jkiss.utils.ArrayUtils;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public abstract class BaseWebAppConfiguration implements WebAppConfiguration {
    public static final String DEFAULT_APP_ANONYMOUS_ROLE_NAME = "user";

    protected final Map<String, Object> plugins;
    protected boolean anonymousAccessEnabled;
    protected String anonymousUserRole;
    protected String defaultUserRole;
    protected boolean resourceManagerEnabled;
    protected String[] enabledFeatures;

    public BaseWebAppConfiguration() {
        this.plugins = new LinkedHashMap<>();
        this.anonymousAccessEnabled = true;
        this.anonymousUserRole = DEFAULT_APP_ANONYMOUS_ROLE_NAME;
        this.defaultUserRole = DEFAULT_APP_ANONYMOUS_ROLE_NAME;
        this.resourceManagerEnabled = true;
        this.enabledFeatures = null;
    }

    public BaseWebAppConfiguration(BaseWebAppConfiguration src) {
        this.plugins = new LinkedHashMap<>(src.plugins);
        this.anonymousAccessEnabled = src.anonymousAccessEnabled;
        this.anonymousUserRole = src.anonymousUserRole;
        this.defaultUserRole = src.defaultUserRole;
        this.resourceManagerEnabled = src.resourceManagerEnabled;
        this.enabledFeatures = src.enabledFeatures;
    }

    @Override
    public boolean isAnonymousAccessEnabled() {
        return anonymousAccessEnabled;
    }

    @Override
    public String getAnonymousUserRole() {
        return anonymousUserRole;
    }

    @Override
    public String getDefaultUserRole() {
        return defaultUserRole;
    }

    @Override
    public <T> T getPluginOption(@NotNull String pluginId, @NotNull String option) {
        return (T) getPluginConfig(pluginId, false).get(option);
    }

    @Override
    public Map<String, Object> getPluginConfig(@NotNull String pluginId, boolean create) {
        Object config = plugins.get(pluginId);
        if (config instanceof Map) {
            return (Map<String, Object>) config;
        } else {
            if (create) {
                Map<String, Object> newConfig = new LinkedHashMap<>();
                plugins.put(pluginId, newConfig);
                return newConfig;
            } else {
                return Collections.emptyMap();
            }
        }
    }

    @Override
    public boolean isResourceManagerEnabled() {
        return resourceManagerEnabled;
    }

    public boolean isFeatureEnabled(String id) {
        return ArrayUtils.contains(getEnabledFeatures(), id);
    }

    public boolean isFeaturesEnabled(String[] features) {
        return ArrayUtils.containsAll(getEnabledFeatures(), features);
    }

    public String[] getEnabledFeatures() {
        if (enabledFeatures == null) {
            // No config - enable all features (+backward compatibility)
            return WebFeatureRegistry.getInstance().getWebFeatures()
                .stream().map(DBWFeatureSet::getId).toArray(String[]::new);
        }
        return enabledFeatures;
    }

    public void setEnabledFeatures(String[] enabledFeatures) {
        this.enabledFeatures = enabledFeatures;
    }
}

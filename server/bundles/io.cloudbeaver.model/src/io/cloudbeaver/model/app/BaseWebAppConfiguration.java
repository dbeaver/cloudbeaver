/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.utils.ArrayUtils;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public abstract class BaseWebAppConfiguration implements ServletAppConfiguration {
    public static final String DEFAULT_APP_ANONYMOUS_TEAM_NAME = "user";

    protected final Map<String, Object> plugins;
    protected String defaultUserTeam = DEFAULT_APP_ANONYMOUS_TEAM_NAME;
    protected boolean resourceManagerEnabled;
    protected boolean secretManagerEnabled;
    protected boolean showReadOnlyConnectionInfo;
    protected String[] enabledFeatures;
    protected String[] disabledBetaFeatures;


    public BaseWebAppConfiguration() {
        this.plugins = new LinkedHashMap<>();
        this.resourceManagerEnabled = true;
        this.enabledFeatures = null;
        this.disabledBetaFeatures = new String[0];
        this.showReadOnlyConnectionInfo = false;
        this.secretManagerEnabled = false;
    }

    public BaseWebAppConfiguration(BaseWebAppConfiguration src) {
        this.plugins = new LinkedHashMap<>(src.plugins);
        this.defaultUserTeam = src.defaultUserTeam;
        this.resourceManagerEnabled = src.resourceManagerEnabled;
        this.enabledFeatures = src.enabledFeatures;
        this.disabledBetaFeatures = src.disabledBetaFeatures;
        this.showReadOnlyConnectionInfo = src.showReadOnlyConnectionInfo;
        this.secretManagerEnabled = src.secretManagerEnabled;
    }

    @Override
    public String getDefaultUserTeam() {
        return defaultUserTeam;
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

    @Override
    public boolean isSecretManagerEnabled() {
        return secretManagerEnabled;
    }

    @Override
    public boolean isFeatureEnabled(String id) {
        if (DBConstants.PRODUCT_FEATURE_DISTRIBUTED.equals(id)) {
            return ServletAppUtils.getServletApplication().isDistributed();
        }
        return ArrayUtils.contains(getEnabledFeatures(), id);
    }

    @Override
    public boolean isFeaturesEnabled(String[] features) {
        return ArrayUtils.containsAll(getEnabledFeatures(), features);
    }

    @NotNull
    @Override
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

    public boolean isShowReadOnlyConnectionInfo() {
        return showReadOnlyConnectionInfo;
    }

    public String[] getDisabledBetaFeatures() {
        return disabledBetaFeatures;
    }
}

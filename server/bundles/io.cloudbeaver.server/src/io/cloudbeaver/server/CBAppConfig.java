/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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
package io.cloudbeaver.server;

import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Application configuration
 */
public class CBAppConfig {
    public static final DataSourceNavigatorSettings DEFAULT_VIEW_SETTINGS = DataSourceNavigatorSettings.PRESET_FULL.getSettings();

    private boolean anonymousAccessEnabled = true;
    private String anonymousUserRole = CBConstants.DEFAUL_APP_ANONYMOUS_ROLE_NAME;
    private String defaultUserRole = CBConstants.DEFAUL_APP_ANONYMOUS_ROLE_NAME;
    private boolean supportsCustomConnections = true;
    private boolean supportsConnectionBrowser = false;
    private boolean supportsUserWorkspaces = false;
    private boolean publicCredentialsSaveEnabled = true;
    private boolean adminCredentialsSaveEnabled = true;
    private String[] enabledDrivers = new String[0];
    private String[] disabledDrivers = new String[0];
    private String defaultAuthProvider = LocalAuthProvider.PROVIDER_ID;
    private String[] enabledAuthProviders = null;
    private DataSourceNavigatorSettings defaultNavigatorSettings = DEFAULT_VIEW_SETTINGS;
    private Map<String, Object> plugins = new LinkedHashMap<>();
    private Map<String, Object> authConfiguration = new LinkedHashMap<>();

    public boolean isAnonymousAccessEnabled() {
        return anonymousAccessEnabled;
    }

    public void setAnonymousAccessEnabled(boolean anonymousAccessEnabled) {
        this.anonymousAccessEnabled = anonymousAccessEnabled;
    }

    public String getAnonymousUserRole() {
        return anonymousUserRole;
    }

    public String getDefaultUserRole() {
        return defaultUserRole;
    }

    public boolean isSupportsCustomConnections() {
        return supportsCustomConnections;
    }

    public void setSupportsCustomConnections(boolean supportsCustomConnections) {
        this.supportsCustomConnections = supportsCustomConnections;
    }

    public boolean isSupportsConnectionBrowser() {
        return supportsConnectionBrowser;
    }

    public boolean isSupportsUserWorkspaces() {
        return supportsUserWorkspaces;
    }

    public boolean isPublicCredentialsSaveEnabled() {
        return publicCredentialsSaveEnabled;
    }

    public void setPublicCredentialsSaveEnabled(boolean publicCredentialsSaveEnabled) {
        this.publicCredentialsSaveEnabled = publicCredentialsSaveEnabled;
    }

    public boolean isAdminCredentialsSaveEnabled() {
        return adminCredentialsSaveEnabled;
    }

    public void setAdminCredentialsSaveEnabled(boolean adminCredentialsSaveEnabled) {
        this.adminCredentialsSaveEnabled = adminCredentialsSaveEnabled;
    }

    public String[] getEnabledDrivers() {
        return enabledDrivers;
    }

    public String[] getDisabledDrivers() {
        return disabledDrivers;
    }

    public String getDefaultAuthProvider() {
        return defaultAuthProvider;
    }

    public void setDefaultAuthProvider(String defaultAuthProvider) {
        this.defaultAuthProvider = defaultAuthProvider;
    }

    public String[] getEnabledAuthProviders() {
        if (enabledAuthProviders == null) {
            // No config - enable all providers (+backward compatibility)
            return WebServiceRegistry.getInstance().getAuthProviders()
                .stream().map(WebAuthProviderDescriptor::getId).toArray(String[]::new);
        }
        return enabledAuthProviders;
    }

    public void setEnabledAuthProviders(String[] enabledAuthProviders) {
        this.enabledAuthProviders = enabledAuthProviders;
    }

    public DBNBrowseSettings getDefaultNavigatorSettings() {
        return defaultNavigatorSettings;
    }

    public void setDefaultNavigatorSettings(DBNBrowseSettings defaultNavigatorSettings) {
        this.defaultNavigatorSettings = new DataSourceNavigatorSettings(defaultNavigatorSettings);
    }

    @NotNull
    public Map<String, Object> getPlugins() {
        return plugins;
    }

    public Map<String, Object> getPluginConfig(@NotNull String pluginId) {
        return getPluginConfig(pluginId, false);
    }

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

    public <T> T getPluginOption(@NotNull String pluginId, @NotNull String option) {
        return (T)getPluginConfig(pluginId).get(option);
    }

    public Map<String, Object> getAuthConfiguration() {
        return authConfiguration;
    }

    @NotNull
    public Map<String, Object> getAuthConfiguration(@NotNull String providerId) {
        Object apConfig = authConfiguration.get(providerId);
        if (apConfig instanceof Map) {
            return (Map<String, Object>) apConfig;
        }
        return Collections.emptyMap();
    }

}

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
package io.cloudbeaver.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.annotations.Expose;
import io.cloudbeaver.DBWFeatureSet;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.app.BaseWebAppConfiguration;
import io.cloudbeaver.model.app.WebAuthConfiguration;
import io.cloudbeaver.registry.WebFeatureRegistry;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Application configuration
 */
public class CBAppConfig extends BaseWebAppConfiguration implements WebAuthConfiguration {
    public static final DataSourceNavigatorSettings DEFAULT_VIEW_SETTINGS = DataSourceNavigatorSettings.PRESET_FULL.getSettings();

    private boolean supportsCustomConnections;
    private boolean supportsConnectionBrowser;
    private boolean supportsUserWorkspaces;
    private boolean enableReverseProxyAuth;
    private boolean forwardProxy;
    private boolean publicCredentialsSaveEnabled;
    private boolean adminCredentialsSaveEnabled;
    private boolean linkExternalCredentialsWithUser;

    private boolean redirectOnFederatedAuth;

    private String[] enabledDrivers;
    private String[] disabledDrivers;
    private String[] enabledFeatures;
    private DataSourceNavigatorSettings defaultNavigatorSettings;

    private final Map<String, Object> resourceQuotas;

    private String defaultAuthProvider;
    private String[] enabledAuthProviders;

    private final List<SMAuthProviderCustomConfiguration> authConfigurations;
    // Legacy auth configs, left for backward compatibility
    @Expose(serialize = false)
    private final Map<String, SMAuthProviderCustomConfiguration> authConfiguration;

    public CBAppConfig() {
        super();
        this.supportsCustomConnections = true;
        this.supportsConnectionBrowser = false;
        this.supportsUserWorkspaces = false;
        this.publicCredentialsSaveEnabled = true;
        this.adminCredentialsSaveEnabled = true;
        this.redirectOnFederatedAuth = false;
        this.enabledDrivers = new String[0];
        this.disabledDrivers = new String[0];
        this.defaultAuthProvider = LocalAuthProvider.PROVIDER_ID;
        this.enabledFeatures = null;
        this.enabledAuthProviders = null;
        this.defaultNavigatorSettings = DEFAULT_VIEW_SETTINGS;
        this.authConfiguration = new LinkedHashMap<>();
        this.authConfigurations = new ArrayList<>();
        this.resourceQuotas = new LinkedHashMap<>();
        this.enableReverseProxyAuth = false;
        this.forwardProxy = false;
        this.linkExternalCredentialsWithUser = true;
    }

    public CBAppConfig(CBAppConfig src) {
        super(src);
        this.supportsCustomConnections = src.supportsCustomConnections;
        this.supportsConnectionBrowser = src.supportsConnectionBrowser;
        this.supportsUserWorkspaces = src.supportsUserWorkspaces;
        this.publicCredentialsSaveEnabled = src.publicCredentialsSaveEnabled;
        this.adminCredentialsSaveEnabled = src.adminCredentialsSaveEnabled;
        this.redirectOnFederatedAuth = src.redirectOnFederatedAuth;
        this.enabledDrivers = src.enabledDrivers;
        this.disabledDrivers = src.disabledDrivers;
        this.defaultAuthProvider = src.defaultAuthProvider;
        this.enabledFeatures = src.enabledFeatures;
        this.enabledAuthProviders = src.enabledAuthProviders;
        this.defaultNavigatorSettings = src.defaultNavigatorSettings;
        this.authConfiguration = new LinkedHashMap<>(src.authConfiguration);
        this.authConfigurations = new ArrayList<>(src.authConfigurations);
        this.resourceQuotas = new LinkedHashMap<>(src.resourceQuotas);
        this.enableReverseProxyAuth = src.enableReverseProxyAuth;
        this.forwardProxy = src.forwardProxy;
        this.linkExternalCredentialsWithUser = src.linkExternalCredentialsWithUser;
    }


    public void setAnonymousAccessEnabled(boolean anonymousAccessEnabled) {
        this.anonymousAccessEnabled = anonymousAccessEnabled;
    }

    public void setResourceManagerEnabled(boolean resourceManagerEnabled) {
        this.resourceManagerEnabled = resourceManagerEnabled;
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

    public boolean isRedirectOnFederatedAuth() {
        return redirectOnFederatedAuth;
    }

    public String[] getEnabledDrivers() {
        return enabledDrivers;
    }

    public void setEnabledDrivers(String[] enabledDrivers) {
        this.enabledDrivers = enabledDrivers;
    }

    public String[] getDisabledDrivers() {
        return disabledDrivers;
    }

    public void setDisabledDrivers(String[] disabledDrivers) {
        this.disabledDrivers = disabledDrivers;
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

    @Override
    public boolean isAuthProviderEnabled(String id) {
        var authProviderDescriptor = AuthProviderRegistry.getInstance().getAuthProvider(id);
        if (authProviderDescriptor == null) {
            return false;
        }

        if (!ArrayUtils.contains(getEnabledAuthProviders(), id)) {
            return false;
        }
        if (!ArrayUtils.isEmpty(authProviderDescriptor.getRequiredFeatures())) {
            for (String rf : authProviderDescriptor.getRequiredFeatures()) {
                if (!isFeatureEnabled(rf)) {
                    return false;
                }
            }
        }
        return true;
    }

    @Override
    public String getDefaultAuthProvider() {
        return defaultAuthProvider;
    }

    public void setDefaultAuthProvider(String defaultAuthProvider) {
        this.defaultAuthProvider = defaultAuthProvider;
    }

    @Override
    public String[] getEnabledAuthProviders() {
        if (enabledAuthProviders == null) {
            // No config - enable all providers (+backward compatibility)
            return AuthProviderRegistry.getInstance().getAuthProviders()
                .stream().map(AuthProviderDescriptor::getId).toArray(String[]::new);
        }
        return enabledAuthProviders;
    }

    public void setEnabledAuthProviders(String[] enabledAuthProviders) {
        this.enabledAuthProviders = enabledAuthProviders;
    }

    public String[] getAllAuthProviders() {
        return AuthProviderRegistry.getInstance().getAuthProviders()
            .stream().map(AuthProviderDescriptor::getId).toArray(String[]::new);
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

    public void setPlugins(@NotNull Map<String, Object> plugins) {
        this.plugins.clear();
        this.plugins.putAll(plugins);
    }

    public Map<String, Object> getPluginConfig(@NotNull String pluginId) {
        return getPluginConfig(pluginId, false);
    }

    public <T> T getPluginOptions(@NotNull String pluginId, @NotNull String option, Class<T> theClass) throws DBException {
        Map<String, Object> iamSettingsMap = CBPlatform.getInstance().getApplication().getAppConfiguration().getPluginOption(
            pluginId, option);
        if (CommonUtils.isEmpty(iamSettingsMap)) {
            throw new DBException("Settings '" + option + "' not specified in plugin '" + pluginId + "' configuration");
        }

        Gson gson = new GsonBuilder().create();
        return gson.fromJson(
            gson.toJsonTree(iamSettingsMap),
            theClass);
    }

    ////////////////////////////////////////////
    // Quotas

    public Map<String, Object> getResourceQuotas() {
        return resourceQuotas;
    }

    public <T> T getResourceQuota(String quotaId) {
        return (T) resourceQuotas.get(quotaId);
    }

    public <T> T getResourceQuota(String quotaId, T defaultValue) {
        if (resourceQuotas.containsKey(quotaId)) {
            return (T) resourceQuotas.get(quotaId);
        } else {
            return defaultValue;
        }
    }


    ////////////////////////////////////////////
    // Auth provider configs

    @Override
    public List<SMAuthProviderCustomConfiguration> getAuthCustomConfigurations() {
        return authConfigurations;
    }

    @Override
    @Nullable
    public SMAuthProviderCustomConfiguration getAuthProviderConfiguration(@NotNull String id) {
        synchronized (authConfigurations) {
            return authConfigurations.stream().filter(c -> c.getId().equals(id)).findAny().orElse(null);
        }
    }

    public void addAuthProviderConfiguration(@NotNull SMAuthProviderCustomConfiguration config) {
        synchronized (authConfigurations) {
            authConfigurations.removeIf(c -> c.getId().equals(config.getId()));
            authConfigurations.add(config);
        }
    }

    public void setAuthProvidersConfigurations(List<SMAuthProviderCustomConfiguration> authProviders) {
        synchronized (authConfigurations) {
            authConfigurations.clear();
            authConfigurations.addAll(authProviders);
        }
    }

    public boolean deleteAuthProviderConfiguration(@NotNull String id) {
        synchronized (authConfigurations) {
            return authConfigurations.removeIf(c -> c.getId().equals(id));
        }
    }

    public void loadLegacyCustomConfigs() {
        // Convert legacy map of configs into list
        if (!authConfiguration.isEmpty()) {
            for (Map.Entry<String, SMAuthProviderCustomConfiguration> entry : authConfiguration.entrySet()) {
                entry.getValue().setId(entry.getKey());
                authConfigurations.add(entry.getValue());
            }
            authConfiguration.clear();
        }
    }

    public boolean isLinkExternalCredentialsWithUser() {
        return linkExternalCredentialsWithUser;
    }


    ////////////////////////////////////////////
    // Reverse proxy auth

    public boolean isEnabledReverseProxyAuth() {
        return enableReverseProxyAuth;
    }

    ////////////////////////////////////////////
    // Forward proxy

    public boolean isEnabledForwardProxy() {
        return forwardProxy;
    }

}

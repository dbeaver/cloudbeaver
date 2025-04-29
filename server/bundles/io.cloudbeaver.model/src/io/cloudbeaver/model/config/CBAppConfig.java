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
package io.cloudbeaver.model.config;

import com.google.gson.annotations.Expose;
import io.cloudbeaver.auth.provider.local.LocalAuthProviderConstants;
import io.cloudbeaver.model.app.BaseWebAppConfiguration;
import io.cloudbeaver.model.app.ServletAuthConfiguration;
import io.cloudbeaver.model.app.WebAppConfiguration;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;

/**
 * Application configuration
 */
public class CBAppConfig extends BaseWebAppConfiguration implements ServletAuthConfiguration, WebAppConfiguration {
    private static final Log log = Log.getLog(CBAppConfig.class);

    public static final DataSourceNavigatorSettings DEFAULT_VIEW_SETTINGS = PRESET_WEB.getSettings();
    private final Set<SMAuthProviderCustomConfiguration> authConfigurations;
    // Legacy auth configs, left for backward compatibility
    @Expose(serialize = false)
    private final Map<String, SMAuthProviderCustomConfiguration> authConfiguration;

    private boolean supportsCustomConnections;
    private boolean enableReverseProxyAuth;
    private boolean forwardProxy;
    private boolean publicCredentialsSaveEnabled;
    private boolean adminCredentialsSaveEnabled;
    private boolean linkExternalCredentialsWithUser;

    private boolean redirectOnFederatedAuth;
    private boolean anonymousAccessEnabled;
    private boolean grantConnectionsAccessToAnonymousTeam;
    private boolean systemVariablesResolvingEnabled;
    @Deprecated
    private String anonymousUserRole;
    private String anonymousUserTeam;

    private String[] enabledDrivers;
    private String[] disabledDrivers;
    private DataSourceNavigatorSettings defaultNavigatorSettings;

    private final Map<String, Object> resourceQuotas;
    private String defaultAuthProvider;
    private String[] enabledAuthProviders;

    public CBAppConfig() {
        this.defaultAuthProvider = LocalAuthProviderConstants.PROVIDER_ID;
        this.enabledAuthProviders = null;
        this.authConfigurations = new LinkedHashSet<>();
        this.authConfiguration = new LinkedHashMap<>();
        this.anonymousAccessEnabled = false;
        this.anonymousUserRole = DEFAULT_APP_ANONYMOUS_TEAM_NAME;
        this.anonymousUserTeam = DEFAULT_APP_ANONYMOUS_TEAM_NAME;
        this.supportsCustomConnections = true;
        this.publicCredentialsSaveEnabled = true;
        this.adminCredentialsSaveEnabled = true;
        this.redirectOnFederatedAuth = false;
        this.enabledDrivers = new String[0];
        this.disabledDrivers = new String[0];
        this.defaultNavigatorSettings = DEFAULT_VIEW_SETTINGS;
        this.resourceQuotas = new LinkedHashMap<>();
        this.enableReverseProxyAuth = false;
        this.forwardProxy = false;
        this.linkExternalCredentialsWithUser = true;
        this.grantConnectionsAccessToAnonymousTeam = false;
        this.systemVariablesResolvingEnabled = false;
    }

    public CBAppConfig(CBAppConfig src) {
        super(src);
        this.defaultAuthProvider = src.defaultAuthProvider;
        this.enabledAuthProviders = src.enabledAuthProviders;
        this.authConfigurations = new LinkedHashSet<>(src.authConfigurations);
        this.authConfiguration = new LinkedHashMap<>(src.authConfiguration);
        this.anonymousAccessEnabled = src.anonymousAccessEnabled;
        this.anonymousUserRole = src.anonymousUserRole;
        this.anonymousUserTeam = src.anonymousUserTeam;
        this.supportsCustomConnections = src.supportsCustomConnections;
        this.publicCredentialsSaveEnabled = src.publicCredentialsSaveEnabled;
        this.adminCredentialsSaveEnabled = src.adminCredentialsSaveEnabled;
        this.redirectOnFederatedAuth = src.redirectOnFederatedAuth;
        this.enabledDrivers = src.enabledDrivers;
        this.disabledDrivers = src.disabledDrivers;
        this.defaultNavigatorSettings = src.defaultNavigatorSettings;
        this.resourceQuotas = new LinkedHashMap<>(src.resourceQuotas);
        this.enableReverseProxyAuth = src.enableReverseProxyAuth;
        this.forwardProxy = src.forwardProxy;
        this.linkExternalCredentialsWithUser = src.linkExternalCredentialsWithUser;
        this.grantConnectionsAccessToAnonymousTeam = src.grantConnectionsAccessToAnonymousTeam;
        this.systemVariablesResolvingEnabled = src.systemVariablesResolvingEnabled;
    }

    @Override
    public boolean isAnonymousAccessEnabled() {
        return anonymousAccessEnabled;
    }

    @Override
    public String getAnonymousUserTeam() {
        return CommonUtils.notNull(anonymousUserTeam, anonymousUserRole);
    }

    public void setAnonymousAccessEnabled(boolean anonymousAccessEnabled) {
        this.anonymousAccessEnabled = anonymousAccessEnabled;
    }

    public void setResourceManagerEnabled(boolean resourceManagerEnabled) {
        this.resourceManagerEnabled = resourceManagerEnabled;
    }

    public void setSecretManagerEnabled(boolean secretManagerEnabled) {
        this.secretManagerEnabled = secretManagerEnabled;
    }

    public boolean isSupportsCustomConnections() {
        return supportsCustomConnections;
    }

    public void setSupportsCustomConnections(boolean supportsCustomConnections) {
        this.supportsCustomConnections = supportsCustomConnections;
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

    @NotNull
    public String[] getEnabledDrivers() {
        return enabledDrivers;
    }

    public void setEnabledDrivers(String[] enabledDrivers) {
        this.enabledDrivers = enabledDrivers;
    }

    @NotNull
    public String[] getDisabledDrivers() {
        return disabledDrivers;
    }

    public void setDisabledDrivers(String[] disabledDrivers) {
        this.disabledDrivers = disabledDrivers;
    }

    public String[] getAllAuthProviders() {
        return WebAuthProviderRegistry.getInstance().getAuthProviders()
            .stream().map(WebAuthProviderDescriptor::getId).toArray(String[]::new);
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

    ////////////////////////////////////////////
    // Quotas

    public Map<String, Object> getResourceQuotas() {
        return resourceQuotas;
    }

    public <T> T getResourceQuota(String quotaId) {
        Object quota = resourceQuotas.get(quotaId);
        if (quota instanceof String) {
            quota = CommonUtils.toDouble(quota);
        }
        return (T) quota;
    }

    public <T> T getResourceQuota(String quotaId, T defaultValue) {
        if (resourceQuotas.containsKey(quotaId)) {
            return (T) getResourceQuota(quotaId);
        } else {
            return defaultValue;
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


    public boolean isGrantConnectionsAccessToAnonymousTeam() {
        return grantConnectionsAccessToAnonymousTeam;
    }

    public boolean isDriverForceEnabled(@NotNull String driverId) {
        return ArrayUtils.containsIgnoreCase(getEnabledDrivers(), driverId);
    }

    public boolean isSystemVariablesResolvingEnabled() {
        return systemVariablesResolvingEnabled;
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
            return WebAuthProviderRegistry.getInstance().getAuthProviders()
                .stream().map(WebAuthProviderDescriptor::getId).toArray(String[]::new);
        }
        return enabledAuthProviders;
    }

    public void setEnabledAuthProviders(String[] enabledAuthProviders) {
        this.enabledAuthProviders = enabledAuthProviders;
    }

    @Override
    public boolean isAuthProviderEnabled(String id) {
        var authProviderDescriptor = WebAuthProviderRegistry.getInstance().getAuthProvider(id);
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

    ////////////////////////////////////////////
    // Auth provider configs
    @Override
    public Set<SMAuthProviderCustomConfiguration> getAuthCustomConfigurations() {
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

    public void setAuthProvidersConfigurations(Collection<SMAuthProviderCustomConfiguration> authProviders) {
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
}

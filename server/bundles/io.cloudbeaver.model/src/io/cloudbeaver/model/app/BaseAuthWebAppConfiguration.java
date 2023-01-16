/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import com.google.gson.annotations.Expose;
import io.cloudbeaver.auth.provider.local.LocalAuthProviderConstants;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.utils.ArrayUtils;

import java.util.*;

public abstract class BaseAuthWebAppConfiguration extends BaseWebAppConfiguration implements WebAuthConfiguration {
    private String defaultAuthProvider;
    private String[] enabledAuthProviders;
    private final Set<SMAuthProviderCustomConfiguration> authConfigurations;
    // Legacy auth configs, left for backward compatibility
    @Expose(serialize = false)
    private final Map<String, SMAuthProviderCustomConfiguration> authConfiguration;

    public BaseAuthWebAppConfiguration() {
        super();
        this.defaultAuthProvider = LocalAuthProviderConstants.PROVIDER_ID;
        this.enabledAuthProviders = null;
        this.authConfigurations = new LinkedHashSet<>();
        this.authConfiguration = new LinkedHashMap<>();
    }

    public BaseAuthWebAppConfiguration(BaseAuthWebAppConfiguration src) {
        super(src);
        this.defaultAuthProvider = src.defaultAuthProvider;
        this.enabledAuthProviders = src.enabledAuthProviders;
        this.authConfigurations = new LinkedHashSet<>(src.authConfigurations);
        this.authConfiguration = new LinkedHashMap<>(src.authConfiguration);
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

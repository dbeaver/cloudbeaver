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
package io.cloudbeaver.server;

import io.cloudbeaver.DBWFeatureSet;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.config.AdminServerConfig;
import io.cloudbeaver.model.config.CBAppConfig;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public class CBServerConfigurationMapper<C extends CBServerConfig, I extends AdminServerConfig> {
    private static final Log log = Log.getLog(CBServerConfigurationMapper.class);

    @NotNull
    public CBServerConfigurations loadServerConfigurationsFromParams(@NotNull Map<String, Object> params) {
        CBAppConfig appConfig = new CBAppConfig(CBApplication.getInstance().getAppConfiguration());
        C serverConfig = createServerConfiguration();
        serverConfig.setServerName(CBApplication.getInstance().getServerName());
        serverConfig.setMaxSessionIdleTime(CBApplication.getInstance().getMaxSessionIdleTime());
        String adminName = null;
        String adminPassword = null;

        if (!params.isEmpty()) {    // FE can send an empty configuration
            I config = createInputConfiguration(params);
            adminName = config.getAdminName();
            adminPassword = config.getAdminPassword();

            populateConfigurations(config, serverConfig, appConfig);
        }

        return new CBServerConfigurations(
            serverConfig,
            appConfig,
            adminName,
            adminPassword
        );
    }

    protected void populateConfigurations(@NotNull I input, @NotNull C serverConfig, @NotNull CBAppConfig appConfig) {
        appConfig.setAnonymousAccessEnabled(input.isAnonymousAccessEnabled());
        appConfig.setSupportsCustomConnections(input.isCustomConnectionsEnabled());
        appConfig.setPublicCredentialsSaveEnabled(input.isPublicCredentialsSaveEnabled());
        appConfig.setAdminCredentialsSaveEnabled(input.isAdminCredentialsSaveEnabled());
        updateDisabledFeaturesConfig(appConfig, input.getEnabledFeatures());
        // custom logic for enabling embedded drivers
        updateDisabledDriversConfig(appConfig, input.getDisabledDrivers());
        appConfig.setResourceManagerEnabled(input.isResourceManagerEnabled());
        appConfig.setSecretManagerEnabled(input.isSecretManagerEnabled());

        if (CommonUtils.isEmpty(input.getEnabledAuthProviders())) {
            // All of them
            appConfig.setEnabledAuthProviders(new String[0]);
        } else {
            appConfig.setEnabledAuthProviders(input.getEnabledAuthProviders().toArray(new String[0]));
        }

        appConfig.setDefaultNavigatorSettings(
            CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());

        serverConfig.setServerName(input.getServerName());
        serverConfig.setMaxSessionIdleTime(input.getSessionExpireTime());
        if (input.getForceHttps() != null) {
            serverConfig.setForceHttps(input.getForceHttps());
        }
        if (input.getSupportedHosts() != null) {
            serverConfig.setSupportedHosts(input.getSupportedHosts());
        }
        if (input.getBindSessionToIp() != null) {
            serverConfig.setBindSessionToIp(input.getBindSessionToIp());
        }
    }

    private void updateDisabledFeaturesConfig(@NotNull CBAppConfig appConfig, @NotNull List<String> enabledFeatures) {
        Set<String> enabledIds = new LinkedHashSet<>(enabledFeatures);
        appConfig.setEnabledFeatures(enabledFeatures.toArray(new String[0]));
        String[] disabledFeatures = ServletAppUtils.getServletApplication().getFeatureRegistry().getWebFeatures().stream()
            .map(DBWFeatureSet::getId)
            .filter(id -> !enabledIds.contains(id))
            .toArray(String[]::new);
        appConfig.setDisabledFeatures(disabledFeatures);
    }

    // we disable embedded drivers by default and enable it in enabled drivers list
    // that's why we need so complicated logic for disabling drivers

    private void updateDisabledDriversConfig(@NotNull CBAppConfig appConfig, @NotNull String[] disabledDriversConfig) {
        Set<String> disabledIds = new LinkedHashSet<>(Arrays.asList(disabledDriversConfig));
        Set<String> enabledIds = new LinkedHashSet<>(Arrays.asList(appConfig.getEnabledDrivers()));

        // remove all disabled embedded drivers from enabled drivers list
        enabledIds.removeAll(disabledIds);

        // enable embedded driver if it is not in disabled drivers list
        for (String driverId : appConfig.getDisabledDrivers()) {
            if (disabledIds.contains(driverId)) {
                // driver is also disabled
                continue;
            }
            // driver is removed from disabled list
            // we need to enable if it is embedded
            try {
                DBPDriver driver = WebDataSourceUtils.getDriverById(driverId);
                if (driver.isEmbedded()) {
                    enabledIds.add(driverId);
                }
            } catch (DBWebException e) {
                log.error("Failed to find driver by id", e);
            }
        }
        appConfig.setDisabledDrivers(disabledDriversConfig);
        appConfig.setEnabledDrivers(enabledIds.toArray(String[]::new));
    }

    @NotNull
    protected C createServerConfiguration() {
        return (C) new CBServerConfig();
    }

    @NotNull
    protected I createInputConfiguration(@NotNull Map<String, Object> params) {
        return (I) new AdminServerConfig(params);
    }
}

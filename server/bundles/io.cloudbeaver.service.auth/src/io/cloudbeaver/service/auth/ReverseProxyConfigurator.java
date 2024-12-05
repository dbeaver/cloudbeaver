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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.auth.provider.rp.RPAuthProvider;
import io.cloudbeaver.model.app.ServletAppConfiguration;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletAuthApplication;
import io.cloudbeaver.model.app.ServletServerConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;

import java.util.HashMap;
import java.util.Map;

public class ReverseProxyConfigurator implements DBWServiceServerConfigurator {
    private static final Log log = Log.getLog(ReverseProxyConfigurator.class);

    @Override
    public void configureServer(
        @NotNull ServletApplication application,
        @Nullable WebSession session,
        @NotNull ServletServerConfiguration serverConfiguration,
        @NotNull ServletAppConfiguration appConfig
    ) throws DBException {
    }

    @Override
    public void migrateConfigurationIfNeeded(@NotNull ServletApplication application) throws DBException {
        if (migrationNotNeeded(application)) {
            return;
        }
        migrateConfiguration(application);
    }

    @Override
    public void reloadConfiguration(@NotNull ServletAppConfiguration appConfig) throws DBException {

    }

    private void migrateConfiguration(
        @NotNull ServletApplication application
    ) {
        if (!(application instanceof ServletAuthApplication authApplication)) {
            return;
        }

        SMAuthProviderCustomConfiguration smReverseProxyProviderConfiguration =
            authApplication.getAuthConfiguration().getAuthProviderConfiguration(RPAuthProvider.AUTH_PROVIDER);
        if (smReverseProxyProviderConfiguration  == null) {
            smReverseProxyProviderConfiguration  = new SMAuthProviderCustomConfiguration(RPAuthProvider.AUTH_PROVIDER);
            smReverseProxyProviderConfiguration.setProvider(RPAuthProvider.AUTH_PROVIDER);
            smReverseProxyProviderConfiguration.setDisplayName("Reverse Proxy");
            smReverseProxyProviderConfiguration.setDescription(
                "This provider was created automatically"
            );
            smReverseProxyProviderConfiguration .setIconURL("");
            Map<String, Object> parameters = new HashMap<>();
            parameters.put(RPConstants.PARAM_USER, RPAuthProvider.X_USER);
            parameters.put(RPConstants.PARAM_TEAM, RPAuthProvider.X_TEAM);
            parameters.put(RPConstants.PARAM_FIRST_NAME, RPAuthProvider.X_FIRST_NAME);
            parameters.put(RPConstants.PARAM_LAST_NAME, RPAuthProvider.X_LAST_NAME);
            parameters.put(RPConstants.PARAM_FULL_NAME, RPAuthProvider.X_FULL_NAME);
            smReverseProxyProviderConfiguration.setParameters(parameters);
            authApplication.getAuthConfiguration().addAuthProviderConfiguration(smReverseProxyProviderConfiguration );
            try {
                authApplication.flushConfiguration();
            } catch (Exception e) {
                log.error("Failed to save server configuration", e);
            }
        }
    }

    private boolean migrationNotNeeded(@NotNull ServletApplication application) {
        if (!(application instanceof ServletAuthApplication authApplication)) {
            return true;
        }

        if (!authApplication.getAuthConfiguration().isAuthProviderEnabled(RPAuthProvider.AUTH_PROVIDER)) {
            log.debug("Reverse proxy provider disabled, migration not needed");
            return true;
        }

        boolean isReverseProxyConfigured = authApplication.getAuthConfiguration()
            .getAuthCustomConfigurations().stream()
            .anyMatch(p -> p.getProvider().equals(RPAuthProvider.AUTH_PROVIDER));

        if (isReverseProxyConfigured) {
            log.debug("Reverse proxy provider already exist, migration not needed");
            return true;
        }
        return false;
    }
}

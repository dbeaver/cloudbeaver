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
package io.cloudbeaver.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.model.config.WebDatabaseConfig;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Server configuration controller for embedded products.
 */
public class CBServerConfigurationControllerEmbedded<T extends CBServerConfig> extends CBServerConfigurationController<T> {

    private static final Log log = Log.getLog(CBServerConfigurationControllerEmbedded.class);

    public CBServerConfigurationControllerEmbedded(@NotNull T serverConfig, @NotNull Path homeDirectory) {
        super(serverConfig, homeDirectory);
    }

    @NotNull
    @Override
    protected Map<String, Object> collectServerConfigProperties(
        @NotNull CBServerConfig serverConfig,
        @NotNull Map<String, Object> originServerConfig
    ) {
        Map<String, Object> serverConfigProperties = super.collectServerConfigProperties(serverConfig, originServerConfig);

        var databaseConfigProperties = new LinkedHashMap<String, Object>();
        Map<String, Object> oldRuntimeDBConfig = JSONUtils.getObject(originServerConfig,
            CBConstants.PARAM_DB_CONFIGURATION);
        Gson gson = getGson();
        Map<String, Object> dbConfigMap = gson.fromJson(
            gson.toJsonTree(getServerConfiguration().getDatabaseConfiguration()),
            JSONUtils.MAP_TYPE_TOKEN
        );
        if (!CommonUtils.isEmpty(dbConfigMap)) {
            for (Map.Entry<String, Object> mp : dbConfigMap.entrySet()) {
                copyConfigValue(oldRuntimeDBConfig, databaseConfigProperties, mp.getKey(), mp.getValue());
            }
            serverConfigProperties.put(CBConstants.PARAM_DB_CONFIGURATION, databaseConfigProperties);
        }
        savePasswordPolicyConfig(originServerConfig, serverConfigProperties);
        return serverConfigProperties;
    }


    private void savePasswordPolicyConfig(Map<String, Object> originServerConfig, Map<String, Object> serverConfigProperties) {
        // save password policy configuration
        var passwordPolicyProperties = new LinkedHashMap<String, Object>();

        var oldRuntimePasswordPolicyConfig = JSONUtils.getObject(
            JSONUtils.getObject(originServerConfig, CBConstants.PARAM_SM_CONFIGURATION),
            CBConstants.PARAM_PASSWORD_POLICY_CONFIGURATION
        );
        Gson gson = getGson();
        Map<String, Object> passwordPolicyConfig = gson.fromJson(
            gson.toJsonTree(getServerConfiguration().getSecurityManagerConfiguration().getPasswordPolicyConfiguration()),
            JSONUtils.MAP_TYPE_TOKEN
        );
        if (!CommonUtils.isEmpty(passwordPolicyConfig)) {
            for (Map.Entry<String, Object> mp : passwordPolicyConfig.entrySet()) {
                copyConfigValue(oldRuntimePasswordPolicyConfig, passwordPolicyProperties, mp.getKey(), mp.getValue());
            }
            serverConfigProperties.put(
                CBConstants.PARAM_SM_CONFIGURATION,
                Map.of(CBConstants.PARAM_PASSWORD_POLICY_CONFIGURATION, passwordPolicyProperties)
            );
        }
    }

    @NotNull
    @Override
    protected GsonBuilder getGsonBuilder() {
        GsonBuilder gsonBuilder = super.getGsonBuilder();
        var databaseConfiguration = getServerConfiguration().getDatabaseConfiguration();
        InstanceCreator<WebDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        return gsonBuilder
            .registerTypeAdapter(WebDatabaseConfig.class, dbConfigCreator);
    }
}

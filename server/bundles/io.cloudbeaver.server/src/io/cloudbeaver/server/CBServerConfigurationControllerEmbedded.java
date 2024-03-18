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
import io.cloudbeaver.service.security.db.WebDatabaseConfig;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public class CBServerConfigurationControllerEmbedded<T extends CBServerConfig> extends CBServerConfigurationController<T> {

    private static final Log log = Log.getLog(CBServerConfigurationControllerEmbedded.class);

    public CBServerConfigurationControllerEmbedded(T serverConfig) {
        super(serverConfig);
    }

    @Override
    protected void readProductConfiguration(Map<String, Object> serverConfig, Gson gson)
        throws DBException {
        String productConfigPath = WebAppUtils.getRelativePath(
            JSONUtils.getString(
                serverConfig,
                CBConstants.PARAM_PRODUCT_CONFIGURATION,
                CBConstants.DEFAULT_PRODUCT_CONFIGURATION
            ),
            WebAppUtils.getWebApplication().getHomeDirectory().toString()
        );

        if (!CommonUtils.isEmpty(productConfigPath)) {
            File productConfigFile = new File(productConfigPath);
            if (!productConfigFile.exists()) {
                log.error("Product configuration file not found (" + productConfigFile.getAbsolutePath() + "'");
            } else {
                log.debug("Load product configuration from '" + productConfigFile.getAbsolutePath() + "'");
                try (Reader reader = new InputStreamReader(new FileInputStream(productConfigFile),
                    StandardCharsets.UTF_8)) {
                    productConfiguration.putAll(JSONUtils.parseMap(gson, reader));
                } catch (Exception e) {
                    throw new DBException("Error reading product configuration", e);
                }
            }
        }

        // Add product config from runtime
        File rtConfig = getRuntimeProductConfigFilePath().toFile();
        if (rtConfig.exists()) {
            log.debug("Load product runtime configuration from '" + rtConfig.getAbsolutePath() + "'");
            try (Reader reader = new InputStreamReader(new FileInputStream(rtConfig), StandardCharsets.UTF_8)) {
                productConfiguration.putAll(JSONUtils.parseMap(gson, reader));
            } catch (Exception e) {
                throw new DBException("Error reading product runtime configuration", e);
            }
        }
    }

    @NotNull
    @Override
    protected Map<String, Object> collectServerConfigProperties(
        String newServerName,
        String newServerURL,
        long sessionExpireTime,
        Map<String, Object> originServerConfig
    ) {
        Map<String, Object> serverConfigProperties = super.collectServerConfigProperties(
            newServerName, newServerURL, sessionExpireTime, originServerConfig);

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
            gson.toJsonTree(securityManagerConfiguration.getPasswordPolicyConfiguration()),
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

    @Override
    protected GsonBuilder getGsonBuilder() {
        GsonBuilder gsonBuilder = super.getGsonBuilder();
        var databaseConfiguration = getServerConfiguration().getDatabaseConfiguration();
        InstanceCreator<WebDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<WebDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();
        return gsonBuilder
            .registerTypeAdapter(WebDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(WebDatabaseConfig.Pool.class, dbPoolConfigCreator);
    }


}

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

import io.cloudbeaver.auth.provider.AuthProviderConfig;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.utils.CommonUtils;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class ConfigurationUtils {
    private static final Log log = Log.getLog(JSONUtils.class);

    private ConfigurationUtils() {
    }

    public static Map<String, Object> appConfigToMap(@Nullable CBAppConfig appConfig) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (appConfig == null) {
            return res;
        }
        res.put("anonymousAccessEnabled", appConfig.isAnonymousAccessEnabled());
        res.put("supportsCustomConnections", appConfig.isSupportsCustomConnections());
        res.put("publicCredentialsSaveEnabled", appConfig.isPublicCredentialsSaveEnabled());
        res.put("adminCredentialsSaveEnabled", appConfig.isAdminCredentialsSaveEnabled());

        Map<String, Object> resourceQuotas = appConfig.getResourceQuotas();
        if (!CommonUtils.isEmpty(resourceQuotas)) {
            res.put(CBConstants.PARAM_RESOURCE_QUOTAS, resourceQuotas);
        }

        Map<String, AuthProviderConfig> authProviders = appConfig.getAuthProviderConfigurations();
        if (!CommonUtils.isEmpty(authProviders)) {
            res.put(CBConstants.PARAM_AUTH_PROVIDERS, authProviders);
        }

        Map<String, Object> navSettingsMap = ConfigurationUtils.defaultNavigatorSettingsConfigToMap(
            appConfig.getDefaultNavigatorSettings()
        );
        if (!CommonUtils.isEmpty(navSettingsMap)) {
            res.put("defaultNavigatorSettings", navSettingsMap);
        }

        if (appConfig.getEnabledFeatures() != null) {
            res.put("enabledFeatures", Arrays.asList(appConfig.getEnabledFeatures()));
        }
        if (appConfig.getEnabledAuthProviders() != null) {
            res.put("enabledAuthProviders", Arrays.asList(appConfig.getEnabledAuthProviders()));
        }

        if (!CommonUtils.isEmpty(appConfig.getPlugins())) {
            res.put("plugins", appConfig.getPlugins());
        }

        return res;
    }

    public static Map<String, Object> defaultNavigatorSettingsConfigToMap(@Nullable DBNBrowseSettings navSettings) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (navSettings == null) {
            return res;
        }
        // Save only differences in def navigator settings
        if (navSettings.isShowSystemObjects() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowSystemObjects()) {
            res.put("showSystemObjects", navSettings.isShowSystemObjects());
        }
        if (navSettings.isShowUtilityObjects() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowUtilityObjects()) {
            res.put("showUtilityObjects", navSettings.isShowUtilityObjects());
        }
        if (navSettings.isShowOnlyEntities() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowOnlyEntities()) {
            res.put("showOnlyEntities", navSettings.isShowOnlyEntities());
        }
        if (navSettings.isMergeEntities() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isMergeEntities()) {
            res.put("mergeEntities", navSettings.isMergeEntities());
        }
        if (navSettings.isHideFolders() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideFolders()) {
            res.put("hideFolders", navSettings.isHideFolders());
        }
        if (navSettings.isHideSchemas() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideSchemas()) {
            res.put("hideSchemas", navSettings.isHideSchemas());
        }
        if (navSettings.isHideVirtualModel() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideVirtualModel()) {
            res.put("hideVirtualModel", navSettings.isHideVirtualModel());
        }
        return res;
    }

    public static Map<String, Object> serverConfigToMap(String newServerName,
                                                        String newServerURL,
                                                        long sessionExpireTime,
                                                        CBDatabaseConfig databaseConfiguration) {
        Map<String, Object> serverMap = new LinkedHashMap<>();
        if (!CommonUtils.isEmpty(newServerName)) {
            serverMap.put(CBConstants.PARAM_SERVER_NAME, newServerName);
        }
        if (!CommonUtils.isEmpty(newServerURL)) {
            serverMap.put(CBConstants.PARAM_SERVER_URL, newServerURL);
        }
        if (sessionExpireTime > 0) {
            serverMap.put(CBConstants.PARAM_SESSION_EXPIRE_PERIOD, sessionExpireTime);
        }

        Map<String, Object> dbMap = ConfigurationUtils.databaseConfigToMap(databaseConfiguration);
        if (!CommonUtils.isEmpty(dbMap)) {
            serverMap.put(CBDatabase.PARAM_DB_CONFIGURATION, dbMap);
        }
        return serverMap;
    }

    public static Map<String, Object> databaseConfigToMap(@Nullable CBDatabaseConfig databaseConfiguration) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (databaseConfiguration == null) {
            return res;
        }
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_DRIVER_CONFIGURATION,
            v -> databaseConfiguration.getDriver()
        );
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_URL_CONFIGURATION,
            v -> databaseConfiguration.getUrl()
        );
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_USER_CONFIGURATION,
            v -> databaseConfiguration.getUser()
        );
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_PW_CONFIGURATION,
            v -> databaseConfiguration.getPassword()
        );
        res.put(CBDatabase.PARAM_DB_CREATE_DATABASE_CONFIGURATION, databaseConfiguration.isCreateDatabase());
        res.put(CBDatabase.PARAM_DB_ALLOW_PUBLIC_ACCESS_CONFIGURATION, databaseConfiguration.isAllowPublicAccess());
        res.computeIfAbsent(
            CBDatabase.PARAM_DB_INITIAL_DATA_CONFIGURATION_CONFIGURATION,
            v -> databaseConfiguration.getInitialDataConfiguration()
        );
        Map<String, Object> poolMap = ConfigurationUtils.poolDatabaseConfigToMap(databaseConfiguration);
        if (!CommonUtils.isEmpty(poolMap)) {
            res.put(CBDatabase.PARAM_DB_POOL_CONFIGURATION, poolMap);
        }
        return res;
    }

    public static Map<String, Object> poolDatabaseConfigToMap(@Nullable CBDatabaseConfig databaseConfiguration) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (databaseConfiguration == null) {
            return res;
        }
        CBDatabaseConfig.Pool pool = databaseConfiguration.getPool();
        if (pool == null) {
            return res;
        } else {
            res.put(CBDatabase.PARAM_DB_POOL_MIN_IDLE_CONNECTIONS_CONFIGURATION, pool.getMinIdleConnections());
            res.put(CBDatabase.PARAM_DB_POOL_MAX_IDLE_CONNECTIONS_CONFIGURATION, pool.getMaxIdleConnections());
            res.put(CBDatabase.PARAM_DB_POOL_MAX_CONNECTIONS_CONFIGURATION, pool.getMaxConnections());
            res.computeIfAbsent(
                CBDatabase.PARAM_DB_POOL_VALIDATION_QUERY_CONFIGURATION,
                v -> pool.getValidationQuery()
            );
        }
        return res;
    }
}

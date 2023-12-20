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
package io.cloudbeaver.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.model.app.BaseServerConfigurationController;
import io.cloudbeaver.model.app.BaseWebApplication;
import io.cloudbeaver.service.security.SMControllerConfiguration;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.runtime.IVariableResolver;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.dbeaver.utils.PrefUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.CommonUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public abstract class CBServerConfigurationController extends BaseServerConfigurationController {

    private static final Log log = Log.getLog(CBServerConfigurationController.class);

    // Configurations
    private final CBServerConfig serverConfiguration = new CBServerConfig();
    protected final Map<String, Object> productConfiguration = new HashMap<>();
    protected final SMControllerConfiguration securityManagerConfiguration = new SMControllerConfiguration();
    private final CBAppConfig appConfiguration = new CBAppConfig();
    private Map<String, String> externalProperties = new LinkedHashMap<>();
    private Map<String, Object> originalConfigurationProperties = new LinkedHashMap<>();

    public String getAuthServiceURL() {
        return Stream.of(serverConfiguration.getServerURL(),
                serverConfiguration.getRootURI(),
                serverConfiguration.getServicesURI())
            .map(WebAppUtils::removeSideSlashes)
            .filter(CommonUtils::isNotEmpty)
            .collect(Collectors.joining("/"));
    }

    @Override
    public void loadServerConfiguration(Path configPath) throws DBException {
        log.debug("Using configuration [" + configPath + "]");

        if (!Files.exists(configPath)) {
            log.error("Configuration file " + configPath + " doesn't exist. Use defaults.");
        } else {
            loadConfiguration(configPath);
        }

        // Try to load configuration from runtime app config file
        Path runtimeConfigPath = getRuntimeAppConfigPath();
        if (Files.exists(runtimeConfigPath)) {
            log.debug("Runtime configuration [" + runtimeConfigPath.toAbsolutePath() + "]");
            loadConfiguration(runtimeConfigPath);
        }

        // Set default preferences
        PrefUtils.setDefaultPreferenceValue(ModelPreferences.getPreferences(),
            ModelPreferences.UI_DRIVERS_HOME,
            getServerConfiguration().getDriversLocation());
    }

    public void loadConfiguration(Path configPath) throws DBException {
        CBAppConfig prevConfig = new CBAppConfig(appConfiguration);
        Map<String, Object> configProps = readConfiguration(configPath);
        try {
            parseConfiguration(configProps);
        } catch (Exception e) {
            throw new DBException("Error parsing server configuration", e);
        }

        // Backward compatibility: load configs map
        appConfiguration.loadLegacyCustomConfigs();

        // Merge new config with old one
        mergeOldConfiguration(prevConfig);

        patchConfigurationWithProperties(productConfiguration);
    }

    protected void parseConfiguration(Map<String, Object> configProps) throws DBException {
        Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");

        readExternalProperties(serverConfig);
        patchConfigurationWithProperties(configProps); // patch again because properties can be changed

        getServerConfiguration().parseConfiguration(serverConfig);

        Gson gson = getGson();
        //SM config
        gson.fromJson(
            gson.toJsonTree(JSONUtils.getObject(serverConfig, CBConstants.PARAM_SM_CONFIGURATION)),
            SMControllerConfiguration.class
        );
        // App config
        Map<String, Object> appConfig = JSONUtils.getObject(configProps, "app");
        validateConfiguration(appConfig);
        gson.fromJson(gson.toJsonTree(appConfig), CBAppConfig.class);

        readProductConfiguration(serverConfig, gson);

    }

    protected void validateConfiguration(Map<String, Object> appConfig) throws DBException {

    }

    private void readExternalProperties(Map<String, Object> serverConfig) {
        String externalPropertiesFile = JSONUtils.getString(serverConfig, CBConstants.PARAM_EXTERNAL_PROPERTIES);
        if (!CommonUtils.isEmpty(externalPropertiesFile)) {
            Properties props = new Properties();
            try (InputStream is = Files.newInputStream(Path.of(externalPropertiesFile))) {
                props.load(is);
            } catch (IOException e) {
                log.error("Error loading external properties from " + externalPropertiesFile, e);
            }
            for (String propName : props.stringPropertyNames()) {
                this.externalProperties.put(propName, props.getProperty(propName));
            }
        }
    }

    protected void mergeOldConfiguration(CBAppConfig prevConfig) {
        Map<String, Object> mergedPlugins = Stream.concat(
                prevConfig.getPlugins().entrySet().stream(),
                appConfiguration.getPlugins().entrySet().stream()
            )
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (o, o2) -> o2));
        appConfiguration.setPlugins(mergedPlugins);

        Set<SMAuthProviderCustomConfiguration> mergedAuthProviders = Stream.concat(
                prevConfig.getAuthCustomConfigurations().stream(),
                appConfiguration.getAuthCustomConfigurations().stream()
            )
            .collect(Collectors.toCollection(LinkedHashSet::new));
        appConfiguration.setAuthProvidersConfigurations(mergedAuthProviders);
    }

    protected void readProductConfiguration(Map<String, Object> serverConfig, Gson gson)
        throws DBException {
        String productConfigPath = WebAppUtils.getRelativePath(
            JSONUtils.getString(
                serverConfig,
                CBConstants.PARAM_PRODUCT_CONFIGURATION,
                CBConstants.DEFAULT_PRODUCT_CONFIGURATION
            ),
            CBApplication.getInstance().getHomeDirectory().toString()
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

    protected Map<String, Object> readConnectionsPermissionsConfiguration(Path parentPath) {
        String permissionsConfigPath = WebAppUtils.getRelativePath(CBConstants.DEFAULT_DATASOURCE_PERMISSIONS_CONFIGURATION,
            parentPath);
        File permissionsConfigFile = new File(permissionsConfigPath);
        if (permissionsConfigFile.exists()) {
            log.debug("Load permissions configuration from '" + permissionsConfigFile.getAbsolutePath() + "'");
            try (Reader reader = new InputStreamReader(new FileInputStream(permissionsConfigFile),
                StandardCharsets.UTF_8)) {
                return JSONUtils.parseMap(getGson(), reader);
            } catch (Exception e) {
                log.error("Error reading permissions configuration", e);
            }
        }
        return null;
    }

    protected Map<String, Object> readConfiguration(Path configPath) throws DBException {
        Map<String, Object> configProps = new LinkedHashMap<>();
        if (Files.exists(configPath)) {
            log.debug("Read configuration [" + configPath.toAbsolutePath() + "]");
            // saves original configuration file
            this.originalConfigurationProperties.putAll(readConfigurationFile(configPath));

            configProps.putAll(readConfigurationFile(configPath));
            patchConfigurationWithProperties(configProps); // patch original properties
        }
        return configProps;
    }

    public Map<String, Object> readConfigurationFile(Path path) throws DBException {
        try (Reader reader = new InputStreamReader(new FileInputStream(path.toFile()), StandardCharsets.UTF_8)) {
            return JSONUtils.parseMap(getGson(), reader);
        } catch (Exception e) {
            throw new DBException("Error parsing server configuration", e);
        }
    }

    protected GsonBuilder getGsonBuilder() {
        // Stupid way to populate existing objects but ok google (https://github.com/google/gson/issues/431)
        InstanceCreator<CBAppConfig> appConfigCreator = type -> appConfiguration;
        InstanceCreator<DataSourceNavigatorSettings> navSettingsCreator = type -> (DataSourceNavigatorSettings) appConfiguration.getDefaultNavigatorSettings();
        InstanceCreator<SMControllerConfiguration> smConfigCreator = type -> securityManagerConfiguration;
        return new GsonBuilder()
            .setLenient()
            .registerTypeAdapter(CBAppConfig.class, appConfigCreator)
            .registerTypeAdapter(DataSourceNavigatorSettings.class, navSettingsCreator)
            .registerTypeAdapter(SMControllerConfiguration.class, smConfigCreator);
    }

    protected void saveRuntimeConfig(SMCredentialsProvider credentialsProvider) throws DBException {
        saveRuntimeConfig(
            serverConfiguration.getServerName(),
            serverConfiguration.getServerURL(),
            serverConfiguration.getMaxSessionIdleTime(),
            appConfiguration,
            credentialsProvider
        );
    }

    protected void saveRuntimeConfig(
        String newServerName,
        String newServerURL,
        long sessionExpireTime,
        CBAppConfig appConfig,
        SMCredentialsProvider credentialsProvider
    ) throws DBException {
        if (newServerName == null) {
            throw new DBException("Invalid server configuration, server name cannot be empty");
        }
        Map<String, Object> configurationProperties = collectConfigurationProperties(newServerName,
            newServerURL,
            sessionExpireTime,
            appConfig);
        writeRuntimeConfig(configurationProperties);
    }

    private void writeRuntimeConfig(Map<String, Object> configurationProperties) throws DBException {
        Path runtimeConfigPath = getRuntimeAppConfigPath();
        if (Files.exists(runtimeConfigPath)) {
            ContentUtils.makeFileBackup(runtimeConfigPath);
        }

        try (Writer out = new OutputStreamWriter(new FileOutputStream(runtimeConfigPath.toFile()), StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder()
                .setLenient()
                .setPrettyPrinting()
                .create();
            gson.toJson(configurationProperties, out);

        } catch (IOException e) {
            throw new DBException("Error writing runtime configuration", e);
        }
    }

    protected Map<String, Object> collectConfigurationProperties(
        String newServerName,
        String newServerURL,
        long sessionExpireTime,
        CBAppConfig appConfig
    ) {
        Map<String, Object> rootConfig = new LinkedHashMap<>();
        {
            var originServerConfig = BaseWebApplication.getServerConfigProps(this.originalConfigurationProperties); // get server properties from original configuration file
            var serverConfigProperties = collectServerConfigProperties(newServerName, newServerURL, sessionExpireTime, originServerConfig);
            rootConfig.put("server", serverConfigProperties);
        }
        {
            var appConfigProperties = new LinkedHashMap<String, Object>();
            Map<String, Object> oldAppConfig = JSONUtils.getObject(this.originalConfigurationProperties, "app");
            rootConfig.put("app", appConfigProperties);

            copyConfigValue(
                oldAppConfig, appConfigProperties, "anonymousAccessEnabled", appConfig.isAnonymousAccessEnabled());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                "supportsCustomConnections",
                appConfig.isSupportsCustomConnections());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                "publicCredentialsSaveEnabled",
                appConfig.isPublicCredentialsSaveEnabled());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                "adminCredentialsSaveEnabled",
                appConfig.isAdminCredentialsSaveEnabled());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "enableReverseProxyAuth", appConfig.isEnabledReverseProxyAuth());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "forwardProxy", appConfig.isEnabledForwardProxy());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                "linkExternalCredentialsWithUser",
                appConfig.isLinkExternalCredentialsWithUser());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "redirectOnFederatedAuth", appConfig.isRedirectOnFederatedAuth());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                CBConstants.PARAM_RESOURCE_MANAGER_ENABLED,
                appConfig.isResourceManagerEnabled());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                CBConstants.PARAM_SHOW_READ_ONLY_CONN_INFO,
                appConfig.isShowReadOnlyConnectionInfo());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                CBConstants.PARAM_CONN_GRANT_ANON_ACCESS,
                appConfig.isGrantConnectionsAccessToAnonymousTeam());

            Map<String, Object> resourceQuotas = new LinkedHashMap<>();
            Map<String, Object> originResourceQuotas = JSONUtils.getObject(oldAppConfig,
                CBConstants.PARAM_RESOURCE_QUOTAS);
            for (Map.Entry<String, Object> mp : appConfig.getResourceQuotas().entrySet()) {
                copyConfigValue(originResourceQuotas, resourceQuotas, mp.getKey(), mp.getValue());
            }
            appConfigProperties.put(CBConstants.PARAM_RESOURCE_QUOTAS, resourceQuotas);

            {
                // Save only differences in def navigator settings
                DBNBrowseSettings navSettings = appConfig.getDefaultNavigatorSettings();
                var navigatorProperties = new LinkedHashMap<String, Object>();
                appConfigProperties.put("defaultNavigatorSettings", navigatorProperties);

                if (navSettings.isShowSystemObjects() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowSystemObjects()) {
                    navigatorProperties.put("showSystemObjects", navSettings.isShowSystemObjects());
                }
                if (navSettings.isShowUtilityObjects() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowUtilityObjects()) {
                    navigatorProperties.put("showUtilityObjects", navSettings.isShowUtilityObjects());
                }
                if (navSettings.isShowOnlyEntities() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowOnlyEntities()) {
                    navigatorProperties.put("showOnlyEntities", navSettings.isShowOnlyEntities());
                }
                if (navSettings.isMergeEntities() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isMergeEntities()) {
                    navigatorProperties.put("mergeEntities", navSettings.isMergeEntities());
                }
                if (navSettings.isHideFolders() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideFolders()) {
                    navigatorProperties.put("hideFolders", navSettings.isHideFolders());
                }
                if (navSettings.isHideSchemas() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideSchemas()) {
                    navigatorProperties.put("hideSchemas", navSettings.isHideSchemas());
                }
                if (navSettings.isHideVirtualModel() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideVirtualModel()) {
                    navigatorProperties.put("hideVirtualModel", navSettings.isHideVirtualModel());
                }
            }
            if (appConfig.getEnabledFeatures() != null) {
                appConfigProperties.put("enabledFeatures", Arrays.asList(appConfig.getEnabledFeatures()));
            }
            if (appConfig.getEnabledAuthProviders() != null) {
                appConfigProperties.put("enabledAuthProviders", Arrays.asList(appConfig.getEnabledAuthProviders()));
            }
            if (appConfig.getEnabledDrivers() != null) {
                appConfigProperties.put("enabledDrivers", Arrays.asList(appConfig.getEnabledDrivers()));
            }
            if (appConfig.getDisabledDrivers() != null) {
                appConfigProperties.put("disabledDrivers", Arrays.asList(appConfig.getDisabledDrivers()));
            }

            if (!CommonUtils.isEmpty(appConfig.getPlugins())) {
                appConfigProperties.put("plugins", appConfig.getPlugins());
            }
            if (!CommonUtils.isEmpty(appConfig.getAuthCustomConfigurations())) {
                appConfigProperties.put("authConfigurations", appConfig.getAuthCustomConfigurations());
            }
        }
        return rootConfig;
    }

    @NotNull
    protected Map<String, Object> collectServerConfigProperties(
        String newServerName,
        String newServerURL,
        long sessionExpireTime,
        Map<String, Object> originServerConfig
    ) {
        var serverConfigProperties = new LinkedHashMap<String, Object>();
        if (!CommonUtils.isEmpty(newServerName)) {
            copyConfigValue(originServerConfig,
                serverConfigProperties,
                CBConstants.PARAM_SERVER_NAME,
                newServerName);
        }
        if (!CommonUtils.isEmpty(newServerURL)) {
            copyConfigValue(
                originServerConfig, serverConfigProperties, CBConstants.PARAM_SERVER_URL, newServerURL);
        }
        if (sessionExpireTime > 0) {
            copyConfigValue(
                originServerConfig,
                serverConfigProperties,
                CBConstants.PARAM_SESSION_EXPIRE_PERIOD,
                sessionExpireTime);
        }
        return serverConfigProperties;
    }

    ////////////////////////////////////////////////////////////////////////
    // Configuration utils

    private void patchConfigurationWithProperties(Map<String, Object> configProps) {
        IVariableResolver varResolver = new SystemVariablesResolver() {
            @Override
            public String get(String name) {
                String propValue = externalProperties.get(name);
                if (propValue != null) {
                    return propValue;
                }
                return super.get(name);
            }
        };
        BaseWebApplication.patchConfigurationWithProperties(configProps, varResolver);
    }

    // gets info about patterns from original configuration file and saves it to runtime config
    protected void copyConfigValue(
        Map<String, Object> oldConfig,
        Map<String, Object> newConfig,
        String key,
        Object defaultValue
    ) {
        Object value = oldConfig.get(key);
        if (value instanceof Map && defaultValue instanceof Map) {
            Map<String, Object> subValue = new LinkedHashMap<>();
            Map<String, Object> oldConfigValue = JSONUtils.getObject(oldConfig, key);
            for (Map.Entry<String, Object> entry : oldConfigValue.entrySet()) {
                copyConfigValue(oldConfigValue, subValue, entry.getKey(), ((Map) defaultValue).get(entry.getKey()));
            }
            newConfig.put(key, subValue);
        } else {
            Object newConfigValue = WebAppUtils.getExtractedValue(oldConfig.get(key), defaultValue);
            newConfig.put(key, newConfigValue);
        }
    }

    @NotNull
    protected Path getRuntimeAppConfigPath() {
        return getDataDirectory(true).resolve(CBConstants.RUNTIME_APP_CONFIG_FILE_NAME);
    }

    @NotNull
    protected Path getRuntimeProductConfigFilePath() {
        return getDataDirectory(false).resolve(CBConstants.RUNTIME_PRODUCT_CONFIG_FILE_NAME);
    }

    @NotNull
    public Path getDataDirectory(boolean create) {
        File dataDir = new File(serverConfiguration.getWorkspaceLocation(), CBConstants.RUNTIME_DATA_DIR_NAME);
        if (create && !dataDir.exists()) {
            if (!dataDir.mkdirs()) {
                log.error("Can't create data directory '" + dataDir.getAbsolutePath() + "'");
            }
        }
        return dataDir.toPath();
    }

    public CBServerConfig getServerConfiguration() {
        return serverConfiguration;
    }

    public CBAppConfig getAppConfiguration() {
        return appConfiguration;
    }

    public Map<String, Object> getProductConfiguration() {
        return productConfiguration;
    }

    public SMControllerConfiguration getSecurityManagerConfiguration() {
        return securityManagerConfiguration;
    }
}
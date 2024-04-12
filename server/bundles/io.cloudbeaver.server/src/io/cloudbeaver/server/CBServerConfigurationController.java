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
import io.cloudbeaver.model.app.BaseServerConfigurationController;
import io.cloudbeaver.model.app.BaseWebApplication;
import io.cloudbeaver.service.security.PasswordPolicyConfiguration;
import io.cloudbeaver.service.security.SMControllerConfiguration;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.IVariableResolver;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.dbeaver.utils.PrefUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.CommonUtils;

import java.io.*;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public abstract class CBServerConfigurationController<T extends CBServerConfig>
    extends BaseServerConfigurationController<T> {

    private static final Log log = Log.getLog(CBServerConfigurationController.class);

    // Configurations
    @NotNull
    private final T serverConfiguration;
    private final CBAppConfig appConfiguration = new CBAppConfig();
    @NotNull
    protected final Path homeDirectory;
    private final Map<String, String> externalProperties = new LinkedHashMap<>();
    private final Map<String, Object> originalConfigurationProperties = new LinkedHashMap<>();

    protected CBServerConfigurationController(@NotNull T serverConfiguration, @NotNull Path homeDirectory) {
        this.serverConfiguration = serverConfiguration;
        this.homeDirectory = homeDirectory;
    }

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
        PrefUtils.setDefaultPreferenceValue(DBWorkbench.getPlatform().getPreferenceStore(),
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

        patchConfigurationWithProperties(getServerConfiguration().getProductSettings());
    }

    protected void parseConfiguration(Map<String, Object> configProps) throws DBException {
        Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");

        readExternalProperties(serverConfig);
        patchConfigurationWithProperties(configProps); // patch again because properties can be changed

        Gson gson = getGson();
        Map<String, Object> currentConfigurationAsMap = gson.fromJson(gson.toJson(getServerConfiguration()),
            JSONUtils.MAP_TYPE_TOKEN);
        serverConfig = WebAppUtils.mergeConfigurations(currentConfigurationAsMap, serverConfig);
        gson.fromJson(
            gson.toJson(serverConfig),
            getServerConfiguration().getClass()
        );

        parseServerConfiguration();

        //SM config
        gson.fromJson(
            gson.toJson(JSONUtils.getObject(serverConfig, CBConstants.PARAM_SM_CONFIGURATION)),
            SMControllerConfiguration.class
        );
        // App config
        Map<String, Object> appConfig = JSONUtils.getObject(configProps, "app");
        validateConfiguration(appConfig);
        gson.fromJson(gson.toJson(appConfig), CBAppConfig.class);
        readProductConfiguration(serverConfig, gson);
    }

    public T parseServerConfiguration() {
        var config = getServerConfiguration();
        if (config.getServerURL() == null) {
            String hostName = config.getServerHost();
            if (CommonUtils.isEmpty(hostName)) {
                try {
                    hostName = InetAddress.getLocalHost().getHostName();
                } catch (UnknownHostException e) {
                    log.debug("Error resolving localhost address: " + e.getMessage());
                    hostName = CBApplication.HOST_LOCALHOST;
                }
            }
            config.setServerURL("http://" + hostName + ":" + config.getServerPort());
        }

        config.setContentRoot(WebAppUtils.getRelativePath(config.getContentRoot(), homeDirectory));
        config.setRootURI(readRootUri(config.getRootURI()));
        config.setDriversLocation(WebAppUtils.getRelativePath(config.getDriversLocation(), homeDirectory));
        config.setWorkspaceLocation(WebAppUtils.getRelativePath(config.getWorkspaceLocation(), homeDirectory));

        String staticContentsFile = config.getStaticContent();
        if (!CommonUtils.isEmpty(staticContentsFile)) {
            try {
                config.setStaticContent(Files.readString(Path.of(staticContentsFile)));
            } catch (IOException e) {
                log.error("Error reading static contents from " + staticContentsFile, e);
            }
        }
        return config;
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
        // legacy configuration with path to product.conf file
        if (!serverConfig.containsKey(CBConstants.PARAM_PRODUCT_SETTINGS)
            && serverConfig.get(CBConstants.PARAM_PRODUCT_CONFIGURATION) instanceof String
        ) {
            String productConfigPath = WebAppUtils.getRelativePath(
                JSONUtils.getString(
                    serverConfig,
                    CBConstants.PARAM_PRODUCT_CONFIGURATION,
                    CBConstants.DEFAULT_PRODUCT_CONFIGURATION
                ),
                homeDirectory
            );
            if (!CommonUtils.isEmpty(productConfigPath)) {
                File productConfigFile = new File(productConfigPath);
                if (!productConfigFile.exists()) {
                    log.error("Product configuration file not found (" + productConfigFile.getAbsolutePath() + "'");
                } else {
                    log.debug("Load product configuration from '" + productConfigFile.getAbsolutePath() + "'");
                    try (Reader reader = new InputStreamReader(new FileInputStream(productConfigFile),
                        StandardCharsets.UTF_8)) {
                        serverConfiguration.getProductSettings()
                            .putAll(WebAppUtils.flattenMap(JSONUtils.parseMap(gson, reader)));
                    } catch (Exception e) {
                        throw new DBException("Error reading product configuration", e);
                    }
                }
            }
        }

        // Add product config from runtime
        File rtConfig = getRuntimeProductConfigFilePath().toFile();
        if (rtConfig.exists()) {
            log.debug("Load product runtime configuration from '" + rtConfig.getAbsolutePath() + "'");
            try (Reader reader = new InputStreamReader(new FileInputStream(rtConfig), StandardCharsets.UTF_8)) {
                var runtimeProductSettings = JSONUtils.parseMap(gson, reader);
                var productSettings = serverConfiguration.getProductSettings();
                productSettings.putAll(runtimeProductSettings);
                Map<String, Object> flattenConfig = WebAppUtils.flattenMap(productSettings);
                productSettings.clear();
                productSettings.putAll(flattenConfig);
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
        var securityManagerConfiguration = getServerConfiguration().getSecurityManagerConfiguration();
        InstanceCreator<SMControllerConfiguration> smConfigCreator = type -> securityManagerConfiguration;
        InstanceCreator<T> serverConfigCreator = type -> serverConfiguration;
        InstanceCreator<PasswordPolicyConfiguration> smPasswordPoliceConfigCreator =
            type -> securityManagerConfiguration.getPasswordPolicyConfiguration();
        return new GsonBuilder()
            .setLenient()
            .registerTypeAdapter(getServerConfiguration().getClass(), serverConfigCreator)
            .registerTypeAdapter(CBAppConfig.class, appConfigCreator)
            .registerTypeAdapter(DataSourceNavigatorSettings.class, navSettingsCreator)
            .registerTypeAdapter(SMControllerConfiguration.class, smConfigCreator)
            .registerTypeAdapter(PasswordPolicyConfiguration.class, smPasswordPoliceConfigCreator);
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
        writeRuntimeConfig(getRuntimeAppConfigPath(), configurationProperties);
    }

    private void writeRuntimeConfig(Path runtimeConfigPath, Map<String, Object> configurationProperties)
        throws DBException {
        if (Files.exists(runtimeConfigPath)) {
            ContentUtils.makeFileBackup(runtimeConfigPath);
        }

        try (Writer out = new OutputStreamWriter(new FileOutputStream(runtimeConfigPath.toFile()),
            StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder()
                .setLenient()
                .setPrettyPrinting()
                .create();
            gson.toJson(configurationProperties, out);

        } catch (IOException e) {
            throw new DBException("Error writing runtime configuration", e);
        }
    }


    public void updateServerUrl(@NotNull SMCredentialsProvider credentialsProvider, @Nullable String newPublicUrl) throws DBException {
        getServerConfiguration().setServerURL(newPublicUrl);
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
            var serverConfigProperties = collectServerConfigProperties(newServerName,
                newServerURL,
                sessionExpireTime,
                originServerConfig);
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
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                "systemVariablesResolvingEnabled",
                appConfig.isSystemVariablesResolvingEnabled()
            );
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
        var productConfigProperties = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        Map<String, Object> oldProductRuntimeConfig = JSONUtils.getObject(originServerConfig,
            CBConstants.PARAM_PRODUCT_SETTINGS);
        if (!CommonUtils.isEmpty(getServerConfiguration().getProductSettings())) {
            for (Map.Entry<String, Object> mp : getServerConfiguration().getProductSettings().entrySet()) {
                copyConfigValue(oldProductRuntimeConfig, productConfigProperties, mp.getKey(), mp.getValue());
            }
            serverConfigProperties.put(CBConstants.PARAM_PRODUCT_SETTINGS, productConfigProperties);
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

    public void saveProductConfiguration(Map<String, Object> productConfiguration) throws DBException {
        Map<String, Object> productSettings = getServerConfiguration().getProductSettings();
        Map<String, Object> mergedConfig = WebAppUtils.mergeConfigurations(productSettings, productConfiguration);
        productSettings.clear();
        productSettings.putAll(WebAppUtils.flattenMap(mergedConfig));
    }

    public T getServerConfiguration() {
        return serverConfiguration;
    }

    public CBAppConfig getAppConfiguration() {
        return appConfiguration;
    }

    public Map<String, Object> getProductConfiguration() {
        return getServerConfiguration().getProductSettings();
    }

    private String readRootUri(String uri) {
        //slashes are needed to correctly display static resources on ui
        if (!uri.endsWith("/")) {
            uri = uri + '/';
        }
        if (!uri.startsWith("/")) {
            uri = '/' + uri;
        }
        return uri;
    }
}
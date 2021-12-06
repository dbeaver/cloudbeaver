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

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import com.google.gson.stream.JsonWriter;
import io.cloudbeaver.DBWConnectionGrant;
import io.cloudbeaver.DBWSecurityController;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.provider.AuthProviderConfig;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.jetty.CBJettyServer;
import io.cloudbeaver.service.DBWServiceInitializer;
import org.eclipse.core.runtime.Platform;
import org.eclipse.equinox.app.IApplicationContext;
import org.eclipse.osgi.service.datalocation.Location;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPApplication;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.PrefUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.StandardConstants;

import java.io.*;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * This class controls all aspects of the application's execution
 */
public class CBApplication extends BaseApplicationImpl {

    private static final Log log = Log.getLog(CBApplication.class);

    private static final boolean RECONFIGURATION_ALLOWED = true;

    static {
        Log.setDefaultDebugStream(System.out);
    }

    public static CBApplication getInstance() {
        return (CBApplication) BaseApplicationImpl.getInstance();
    }

    private String serverURL;
    private int serverPort = CBConstants.DEFAULT_SERVER_PORT;
    private String serverName = null;
    private String contentRoot = CBConstants.DEFAULT_CONTENT_ROOT;
    private String rootURI = CBConstants.DEFAULT_ROOT_URI;
    private String servicesURI = CBConstants.DEFAULT_SERVICES_URI;

    private String workspaceLocation = CBConstants.DEFAULT_WORKSPACE_LOCATION;
    private String driversLocation = CBConstants.DEFAULT_DRIVERS_LOCATION;
    private File homeDirectory;

    // Configurations
    private final Map<String, Object> productConfiguration = new HashMap<>();
    private final CBAppConfig appConfiguration = new CBAppConfig();
    private final CBDatabaseConfig databaseConfiguration = new CBDatabaseConfig();

    // Persistence
    private CBDatabase database;
    private CBSecurityController securityController;

    private long maxSessionIdleTime = CBConstants.MAX_SESSION_IDLE_TIME;

    private boolean develMode = false;
    private boolean configurationMode = false;
    private String localHostAddress;
    private final List<InetAddress> localInetAddresses = new ArrayList<>();

    public CBApplication() {
    }

    public String getServerURL() {
        return serverURL;
    }

    public int getServerPort() {
        return serverPort;
    }

    public String getServerName() {
        return serverName;
    }

    public String getContentRoot() {
        return contentRoot;
    }

    public String getRootURI() {
        return rootURI;
    }

    public String getServicesURI() {
        return servicesURI;
    }

    public String getDriversLocation() {
        return driversLocation;
    }

    public File getHomeDirectory() {
        return homeDirectory;
    }

    public long getMaxSessionIdleTime() {
        return maxSessionIdleTime;
    }

    public CBDatabaseConfig getDatabaseConfiguration() {
        return databaseConfiguration;
    }

    public CBAppConfig getAppConfiguration() {
        return appConfiguration;
    }

    public Map<String, Object> getProductConfiguration() {
        return productConfiguration;
    }

    public DBWSecurityController getSecurityController() {
        return securityController;
    }

    @Override
    public boolean isHeadlessMode() {
        return true;
    }

    CBDatabase getDatabase() {
        return database;
    }

    @Override
    public Object start(IApplicationContext context) {
        String configPath = CBConstants.DEFAULT_CONFIG_FILE_PATH;

        String[] args = Platform.getCommandLineArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals(CBConstants.CLI_PARAM_WEB_CONFIG) && args.length > i + 1) {
                configPath = args[i + 1];
                break;
            }
        }
        try {
            loadConfiguration(configPath);

            File runtimeConfigFile = getRuntimeAppConfigFile();
            if (runtimeConfigFile.exists()) {
                log.debug("Runtime configuration [" + runtimeConfigFile.getAbsolutePath() + "]");
                parseConfiguration(runtimeConfigFile);
            }
        } catch (Exception e) {
            log.error("Error parsing configuration", e);
            return null;
        }

        configurationMode = CommonUtils.isEmpty(serverName);
        //|| CommonUtils.isEmpty(databaseConfiguration.getUser()) || CommonUtils.isEmpty(databaseConfiguration.getPassword());

        // Determine address for local host
        localHostAddress = System.getenv(CBConstants.VAR_CB_LOCAL_HOST_ADDR);
        if (CommonUtils.isEmpty(localHostAddress)) {
            localHostAddress = System.getProperty(CBConstants.VAR_CB_LOCAL_HOST_ADDR);
        }
        if (CommonUtils.isEmpty(localHostAddress) || "127.0.0.1".equals(localHostAddress) || "::0".equals(localHostAddress)) {
            localHostAddress = "localhost";
        }

        final Runtime runtime = Runtime.getRuntime();

        Location instanceLoc = Platform.getInstanceLocation();
        try {
            if (!instanceLoc.isSet()) {
                URL wsLocationURL = new URL(
                    "file",  //$NON-NLS-1$
                    null,
                    workspaceLocation);
                instanceLoc.set(wsLocationURL, true);
            }
        } catch (Exception e) {
            log.error("Error setting workspace location to " + workspaceLocation, e);
            return null;
        }

        CBPlatform.setApplication(this);

        log.debug(GeneralUtils.getProductName() + " " + GeneralUtils.getProductVersion() + " is starting"); //$NON-NLS-1$
        log.debug("\tOS: " + System.getProperty(StandardConstants.ENV_OS_NAME) + " " + System.getProperty(StandardConstants.ENV_OS_VERSION) + " (" + System.getProperty(StandardConstants.ENV_OS_ARCH) + ")");
        log.debug("\tJava version: " + System.getProperty(StandardConstants.ENV_JAVA_VERSION) + " by " + System.getProperty(StandardConstants.ENV_JAVA_VENDOR) + " (" + System.getProperty(StandardConstants.ENV_JAVA_ARCH) + "bit)");
        log.debug("\tInstall path: '" + SystemVariablesResolver.getInstallPath() + "'"); //$NON-NLS-1$ //$NON-NLS-2$
        log.debug("\tGlobal workspace: '" + instanceLoc.getURL() + "'"); //$NON-NLS-1$ //$NON-NLS-2$
        log.debug("\tMemory available " + (runtime.totalMemory() / (1024 * 1024)) + "Mb/" + (runtime.maxMemory() / (1024 * 1024)) + "Mb");

        DBPApplication application = DBWorkbench.getPlatform().getApplication();

        log.debug("\tContent root: " + new File(contentRoot).getAbsolutePath());
        log.debug("\tDrivers storage: " + new File(driversLocation).getAbsolutePath());
        //log.debug("\tDrivers root: " + driversLocation);
        //log.debug("\tProduct details: " + application.getInfoDetails());
        log.debug("\tBase port: " + serverPort);
        log.debug("\tBase URI: " + servicesURI);
        if (develMode) {
            log.debug("\tDevelopment mode");
        } else {
            log.debug("\tProduction mode");
        }
        if (configurationMode) {
            log.debug("\tServer is in configuration mode!");
        }
        {
            determineLocalAddresses();
            log.debug("\tLocal host addresses:");
            for (InetAddress ia : localInetAddresses) {
                log.debug("\t\t" + ia.getHostAddress() + " (" + ia.getCanonicalHostName() + ")");
            }
        }
        {
            // Perform services initialization
            for (DBWServiceInitializer wsi : WebServiceRegistry.getInstance().getWebServices(DBWServiceInitializer.class)) {
                try {
                    wsi.initializeService(this);
                } catch (Exception e) {
                    log.warn("Error initializing web service " + wsi.getClass().getName(), e);
                }
            }

        }

        {
            try {
                initializeDatabase();
            } catch (Exception e) {
                log.error("Error initializing database", e);
                return null;
            }
        }

        Thread shutdownThread = new Thread(() -> {
            try {
                database.shutdown();
            } catch (Exception e) {
                log.error(e);
            }
        });
        Runtime.getRuntime().addShutdownHook(shutdownThread);

        if (configurationMode) {
            // Try to configure automatically
            performAutoConfiguration(new File(configPath).getParentFile());
        }

        try {
            initializeServer();
        } catch (DBException e) {
            log.error("Error initializing server", e);
            return null;
        }
        runWebServer();

        log.debug("Shutdown");

        return null;
    }

    /**
     * Configures server automatically.
     * Called on startup
     *
     * @param configPath
     */
    protected void performAutoConfiguration(File configPath) {
        String autoServerName = System.getenv(CBConstants.VAR_AUTO_CB_SERVER_NAME);
        String autoServerURL = System.getenv(CBConstants.VAR_AUTO_CB_SERVER_URL);
        String autoAdminName = System.getenv(CBConstants.VAR_AUTO_CB_ADMIN_NAME);
        String autoAdminPassword = System.getenv(CBConstants.VAR_AUTO_CB_ADMIN_PASSWORD);

        if (CommonUtils.isEmpty(autoServerName) || CommonUtils.isEmpty(autoAdminName) || CommonUtils.isEmpty(autoAdminPassword)) {
            // Try to load from auto config file
            if (configPath.exists()) {
                File autoConfigFile = new File(configPath, CBConstants.AUTO_CONFIG_FILE_NAME);
                if (autoConfigFile.exists()) {
                    Properties autoProps = new Properties();
                    try (InputStream is = new FileInputStream(autoConfigFile)) {
                        autoProps.load(is);

                        autoServerName = autoProps.getProperty(CBConstants.VAR_AUTO_CB_SERVER_NAME);
                        autoServerURL = autoProps.getProperty(CBConstants.VAR_AUTO_CB_SERVER_URL);
                        autoAdminName = autoProps.getProperty(CBConstants.VAR_AUTO_CB_ADMIN_NAME);
                        autoAdminPassword = autoProps.getProperty(CBConstants.VAR_AUTO_CB_ADMIN_PASSWORD);
                    } catch (IOException e) {
                        log.error("Error loading auto configuration file '" + autoConfigFile.getAbsolutePath() + "'", e);
                    }
                }
            }
        }

        if (CommonUtils.isEmpty(autoServerName) || CommonUtils.isEmpty(autoAdminName) || CommonUtils.isEmpty(autoAdminPassword)) {
            log.info("No auto configuration was found. Server must be configured manually");
            return;
        }
        try {
            finishConfiguration(
                autoServerName,
                autoServerURL,
                autoAdminName,
                autoAdminPassword,
                Collections.emptyList(),
                maxSessionIdleTime,
                getAppConfiguration());
        } catch (Exception e) {
            log.error("Error loading server auto configuration", e);
        }
    }

    protected void initializeServer() throws DBException {

    }

    private void determineLocalAddresses() {
        try {
//            InetAddress localHost = InetAddress.getLocalHost();
//            InetAddress[] allMyIps = InetAddress.getAllByName(localHost.getCanonicalHostName());
//            for (InetAddress addr : allMyIps) {
//                System.out.println("Local addr: " + addr);
//            }
            try {
                InetAddress dockerAddress = InetAddress.getByName(CBConstants.VAR_HOST_DOCKER_INTERNAL);
                localInetAddresses.add(dockerAddress);
                log.debug("\tRun in Docker container (" + dockerAddress + ")?");
            } catch (UnknownHostException e) {
                // Ignore - not a docker env
            }

            boolean hasLoopbackAddress = false;
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements(); ) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements(); ) {
                    InetAddress localInetAddress = enumIpAddr.nextElement();
                    boolean loopbackAddress = localInetAddress.isLoopbackAddress();
                    if (loopbackAddress ? !hasLoopbackAddress : !localInetAddress.isLinkLocalAddress()) {
                        if (loopbackAddress) {
                            hasLoopbackAddress = true;
                        }
                        localInetAddresses.add(localInetAddress);
                    }
                }
            }
        } catch (Exception e) {
            log.error(e);
        }

    }

    @NotNull
    private File getRuntimeAppConfigFile() {
        return new File(getDataDirectory(false), CBConstants.RUNTIME_APP_CONFIG_FILE_NAME);
    }

    @NotNull
    private File getRuntimeProductConfigFile() {
        return new File(getDataDirectory(false), CBConstants.RUNTIME_PRODUCT_CONFIG_FILE_NAME);
    }

    @NotNull
    File getDataDirectory(boolean create) {
        File dataDir = new File(workspaceLocation, CBConstants.RUNTIME_DATA_DIR_NAME);
        if (create && !dataDir.exists()) {
            if (!dataDir.mkdirs()) {
                log.error("Can't create data directory '" + dataDir.getAbsolutePath() + "'");
            }
        }
        return dataDir;
    }

    private void initializeDatabase() throws DBException {
        if (databaseConfiguration == null) {
            throw new DBException("Database configuration missing");
        }
        database = new CBDatabase(this, databaseConfiguration);

        securityController = new CBSecurityController(database);

        database.initialize();

        securityController.initializeMetaInformation();
    }

    private void loadConfiguration(String configPath) {
        log.debug("Using configuration [" + configPath + "]");

        File configFile = new File(configPath);
        if (!configFile.exists()) {
            log.error("Configuration file " + configFile.getAbsolutePath() + " doesn't exist. Use defaults.");
        } else {
            parseConfiguration(configFile);
        }
        // Set default preferences
        PrefUtils.setDefaultPreferenceValue(ModelPreferences.getPreferences(), ModelPreferences.UI_DRIVERS_HOME, getDriversLocation());
    }

    private void parseConfiguration(File configFile) {
        String homeFolder = System.getenv(CBConstants.ENV_CB_HOME);
        if (CommonUtils.isEmpty(homeFolder)) {
            homeFolder = System.getProperty("user.dir");
        }
        if (CommonUtils.isEmpty(homeFolder)) {
            homeFolder = ".";
        }
        homeDirectory = new File(homeFolder);
        String productConfigPath = null;

        CBAppConfig prevConfig = new CBAppConfig(appConfiguration);

        // Stupid way to populate existing objects but ok google (https://github.com/google/gson/issues/431)
        InstanceCreator<CBAppConfig> appConfigCreator = type -> appConfiguration;
        InstanceCreator<CBDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<CBDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();
        InstanceCreator<DataSourceNavigatorSettings> navSettingsCreator = type -> (DataSourceNavigatorSettings) appConfiguration.getDefaultNavigatorSettings();

        Gson gson = new GsonBuilder()
            .setLenient()
            .registerTypeAdapter(CBAppConfig.class, appConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.Pool.class, dbPoolConfigCreator)
            .registerTypeAdapter(DataSourceNavigatorSettings.class, navSettingsCreator)
            .create();

        try (Reader reader = new InputStreamReader(new FileInputStream(configFile), StandardCharsets.UTF_8)) {
            Map<String, Object> configProps = JSONUtils.parseMap(gson, reader);

            Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");
            serverPort = JSONUtils.getInteger(serverConfig, CBConstants.PARAM_SERVER_PORT, serverPort);
            if (serverConfig.containsKey(CBConstants.PARAM_SERVER_URL)) {
                serverURL = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_URL, serverURL);
            } else if (serverURL == null) {
                serverURL = "http://" + InetAddress.getLocalHost().getHostName() + ":" + serverPort;
            }

            serverName = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_NAME, serverName);
            contentRoot = getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_CONTENT_ROOT, contentRoot), homeFolder);
            rootURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_ROOT_URI, rootURI);
            servicesURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVICES_URI, servicesURI);
            driversLocation = getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_DRIVERS_LOCATION, driversLocation), homeFolder);
            workspaceLocation = getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_WORKSPACE_LOCATION, workspaceLocation), homeFolder);

            maxSessionIdleTime = JSONUtils.getLong(serverConfig, CBConstants.PARAM_SESSION_EXPIRE_PERIOD, maxSessionIdleTime);

            develMode = JSONUtils.getBoolean(serverConfig, CBConstants.PARAM_DEVEL_MODE, develMode);

            // App config
            Map<String, Object> appConfig = JSONUtils.getObject(configProps, "app");
            gson.fromJson(gson.toJsonTree(appConfig), CBAppConfig.class);

            // Database config
            Map<String, Object> databaseConfig = JSONUtils.getObject(serverConfig, CBConstants.PARAM_DB_CONFIGURATION);
            gson.fromJson(gson.toJsonTree(databaseConfig), CBDatabaseConfig.class);

            productConfigPath = getRelativePath(
                JSONUtils.getString(
                    serverConfig,
                    CBConstants.PARAM_PRODUCT_CONFIGURATION,
                    CBConstants.DEFAULT_PRODUCT_CONFIGURATION
                ),
                homeFolder
            );
        } catch (IOException e) {
            log.error("Error parsing server configuration", e);
        }

        // Merge new config with old one
        {
            Map<String, Object> mergedPlugins = Stream.concat(
                    prevConfig.getPlugins().entrySet().stream(),
                    appConfiguration.getPlugins().entrySet().stream()
                )
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (o, o2) -> o2));
            appConfiguration.getPlugins().clear();
            appConfiguration.getPlugins().putAll(mergedPlugins);

            Map<String, AuthProviderConfig> mergedAuthProviders = Stream.concat(
                    prevConfig.getAuthProviderConfigurations().entrySet().stream(),
                    appConfiguration.getAuthProviderConfigurations().entrySet().stream()
                )
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (o, o2) -> o2));
            appConfiguration.getAuthProviderConfigurations().clear();
            mergedAuthProviders.forEach(appConfiguration::setAuthProviderConfiguration);
        }

        if (!CommonUtils.isEmpty(productConfigPath)) {
            File productConfigFile = new File(productConfigPath);
            if (!productConfigFile.exists()) {
                log.error("Product configuration file not found (" + productConfigFile.getAbsolutePath() + "'");
            } else {
                log.debug("Load product configuration from '" + productConfigFile.getAbsolutePath() + "'");
                try (Reader reader = new InputStreamReader(new FileInputStream(productConfigFile), StandardCharsets.UTF_8)) {
                    productConfiguration.putAll(JSONUtils.parseMap(gson, reader));
                } catch (Exception e) {
                    log.error("Error reading product configuration", e);
                }
            }
        }

        // Add product config from runtime
        {
            File rtConfig = getRuntimeProductConfigFile();
            if (rtConfig.exists()) {
                log.debug("Load product runtime configuration from '" + rtConfig.getAbsolutePath() + "'");
                try (Reader reader = new InputStreamReader(new FileInputStream(rtConfig), StandardCharsets.UTF_8)) {
                    productConfiguration.putAll(JSONUtils.parseMap(gson, reader));
                } catch (Exception e) {
                    log.error("Error reading product runtime configuration", e);
                }
            }
        }
    }

    static String getRelativePath(String path, String curDir) {
        return getRelativePath(path, new File(curDir));
    }

    static String getRelativePath(String path, File curDir) {
        if (path.startsWith("/") || path.length() > 2 && path.charAt(1) == ':') {
            return path;
        }
        return new File(curDir, path).getAbsolutePath();
    }

    private void runWebServer() {
        log.debug("Starting Jetty server (" + serverPort + ") ");
        new CBJettyServer().runServer();
    }


    @Override
    public void stop() {
        shutdown();
    }

    private void shutdown() {
        log.debug("Cloudbeaver Server is stopping"); //$NON-NLS-1$
    }

    @Override
    public String getInfoDetails() {
        return "";
    }

    @Override
    public String getDefaultProjectName() {
        return "GlobalConfiguration";
    }

    public boolean isDevelMode() {
        return develMode;
    }

    public boolean isConfigurationMode() {
        return configurationMode;
    }

    public String getLocalHostAddress() {
        return localHostAddress;
    }

    public boolean isLocalInetAddress(String hostName) {
        for (InetAddress addr : localInetAddresses) {
            if (addr.getHostAddress().equals(hostName)) {
                return true;
            }
        }
        return false;
    }

    public List<InetAddress> getLocalInetAddresses() {
        return localInetAddresses;
    }

    public synchronized void finishConfiguration(
        @NotNull String newServerName,
        @NotNull String newServerURL,
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<WebAuthInfo> authInfoList,
        long sessionExpireTime,
        @NotNull CBAppConfig appConfig) throws DBException {
        if (!RECONFIGURATION_ALLOWED && !isConfigurationMode()) {
            throw new DBException("Application must be in configuration mode");
        }

        if (isConfigurationMode()) {
            database.finishConfiguration(adminName, adminPassword, authInfoList);
        }

        // Save runtime configuration
        log.debug("Saving runtime configuration");
        saveRuntimeConfig(newServerName, newServerURL, sessionExpireTime, appConfig);

        // Grant permissions to predefined connections
        if (isConfigurationMode() && appConfig.isAnonymousAccessEnabled()) {
            grantAnonymousAccessToConnections(appConfig, adminName);
        }

        // Re-load runtime configuration
        try {
            log.debug("Reloading application configuration");
            File runtimeConfigFile = getRuntimeAppConfigFile();
            if (runtimeConfigFile.exists()) {
                log.debug("Runtime configuration [" + runtimeConfigFile.getAbsolutePath() + "]");
                parseConfiguration(runtimeConfigFile);
            }
        } catch (Exception e) {
            throw new DBException("Error parsing configuration", e);
        }

        configurationMode = CommonUtils.isEmpty(serverName);
    }

    public synchronized void flushConfiguration() throws DBException {
        saveRuntimeConfig(serverName, serverURL, maxSessionIdleTime, appConfiguration);
    }


    private void grantAnonymousAccessToConnections(CBAppConfig appConfig, String adminName) {
        try {
            String anonymousRoleId = appConfig.getAnonymousUserRole();
            DBWSecurityController securityController = getSecurityController();
            for (DBPDataSourceContainer ds : WebServiceUtils.getGlobalDataSourceRegistry().getDataSources()) {
                DBWConnectionGrant[] grants = securityController.getConnectionSubjectAccess(ds.getId());
                if (ArrayUtils.isEmpty(grants)) {
                    securityController.setConnectionSubjectAccess(
                        ds.getId(),
                        new String[]{anonymousRoleId},
                        adminName);
                }
            }
        } catch (Exception e) {
            log.error("Error granting anonymous access to connections", e);
        }
    }

    private void saveRuntimeConfig(String newServerName,
                                   String newServerURL,
                                   long sessionExpireTime,
                                   CBAppConfig appConfig) throws DBException {
        File runtimeConfigFile = getRuntimeAppConfigFile();
        try (Writer out = new OutputStreamWriter(new FileOutputStream(runtimeConfigFile), StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder()
                .setLenient()
                .setPrettyPrinting()
                .create();
            try (JsonWriter json = gson.newJsonWriter(out)) {
                json.setLenient(true);
                json.beginObject();
                {
                    json.name("server");
                    json.beginObject();
                    if (!CommonUtils.isEmpty(newServerName)) {
                        JSONUtils.field(json, CBConstants.PARAM_SERVER_NAME, newServerName);
                    }
                    if (!CommonUtils.isEmpty(newServerURL)) {
                        JSONUtils.field(json, CBConstants.PARAM_SERVER_URL, newServerURL);
                    }
                    if (sessionExpireTime > 0) {
                        JSONUtils.field(json, CBConstants.PARAM_SESSION_EXPIRE_PERIOD, sessionExpireTime);
                    }

                    json.name(CBConstants.PARAM_DB_CONFIGURATION);
                    json.beginObject();
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_DRIVER_CONFIGURATION,
                        databaseConfiguration.getDriver()
                    );
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_URL_CONFIGURATION,
                        databaseConfiguration.getUrl()
                    );
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_USER_CONFIGURATION,
                        databaseConfiguration.getUser()
                    );
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_PW_CONFIGURATION,
                        databaseConfiguration.getPassword()
                    );
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_CREATE_DATABASE_CONFIGURATION,
                        databaseConfiguration.isCreateDatabase()
                    );
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_ALLOW_PUBLIC_ACCESS_CONFIGURATION,
                        databaseConfiguration.isAllowPublicAccess()
                    );
                    JSONUtils.fieldNE(
                        json,
                        CBConstants.PARAM_DB_INITIAL_DATA_CONFIGURATION_CONFIGURATION,
                        databaseConfiguration.getInitialDataConfiguration()
                    );

                    CBDatabaseConfig.Pool pool = databaseConfiguration.getPool();
                    if (pool != null) {
                        json.name(CBConstants.PARAM_DB_POOL_CONFIGURATION);
                        json.beginObject();
                        JSONUtils.fieldNE(
                            json,
                            CBConstants.PARAM_DB_POOL_MIN_IDLE_CONNECTIONS_CONFIGURATION,
                            pool.getMinIdleConnections()
                        );
                        JSONUtils.fieldNE(
                            json,
                            CBConstants.PARAM_DB_POOL_MAX_IDLE_CONNECTIONS_CONFIGURATION,
                            pool.getMaxIdleConnections()
                        );
                        JSONUtils.fieldNE(
                            json,
                            CBConstants.PARAM_DB_POOL_MAX_CONNECTIONS_CONFIGURATION,
                            pool.getMaxConnections()
                        );
                        JSONUtils.fieldNE(
                            json,
                            CBConstants.PARAM_DB_POOL_VALIDATION_QUERY_CONFIGURATION,
                            pool.getValidationQuery()
                        );
                        json.endObject();
                    }
                    json.endObject();

                    json.endObject();
                }
                {
                    json.name("app");
                    json.beginObject();
                    JSONUtils.field(json, "anonymousAccessEnabled", appConfig.isAnonymousAccessEnabled());
                    JSONUtils.field(json, "supportsCustomConnections", appConfig.isSupportsCustomConnections());
                    JSONUtils.field(json, "publicCredentialsSaveEnabled", appConfig.isPublicCredentialsSaveEnabled());
                    JSONUtils.field(json, "adminCredentialsSaveEnabled", appConfig.isAdminCredentialsSaveEnabled());

                    Map<String, Object> resourceQuotas = appConfig.getResourceQuotas();
                    if (!CommonUtils.isEmpty(resourceQuotas)) {
                        JSONUtils.serializeProperties(json, CBConstants.PARAM_RESOURCE_QUOTAS, resourceQuotas);
                    }

                    Map<String, AuthProviderConfig> authProviders = appConfig.getAuthProviderConfigurations();
                    if (!CommonUtils.isEmpty(authProviders)) {
                        JSONUtils.serializeProperties(json, CBConstants.PARAM_AUTH_PROVIDERS, authProviders);
                    }

                    {
                        // Save only differences in def navigator settings
                        DBNBrowseSettings navSettings = appConfig.getDefaultNavigatorSettings();

                        json.name("defaultNavigatorSettings");
                        json.beginObject();
                        if (navSettings.isShowSystemObjects() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowSystemObjects())
                            JSONUtils.field(json, "showSystemObjects", navSettings.isShowSystemObjects());
                        if (navSettings.isShowUtilityObjects() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowUtilityObjects())
                            JSONUtils.field(json, "showUtilityObjects", navSettings.isShowUtilityObjects());
                        if (navSettings.isShowOnlyEntities() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isShowOnlyEntities())
                            JSONUtils.field(json, "showOnlyEntities", navSettings.isShowOnlyEntities());
                        if (navSettings.isMergeEntities() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isMergeEntities())
                            JSONUtils.field(json, "mergeEntities", navSettings.isMergeEntities());
                        if (navSettings.isHideFolders() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideFolders())
                            JSONUtils.field(json, "hideFolders", navSettings.isHideFolders());
                        if (navSettings.isHideSchemas() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideSchemas())
                            JSONUtils.field(json, "hideSchemas", navSettings.isHideSchemas());
                        if (navSettings.isHideVirtualModel() != CBAppConfig.DEFAULT_VIEW_SETTINGS.isHideVirtualModel())
                            JSONUtils.field(json, "hideVirtualModel", navSettings.isHideVirtualModel());

                        json.endObject();
                    }
                    if (appConfig.getEnabledFeatures() != null) {
                        JSONUtils.serializeStringList(json, "enabledFeatures", Arrays.asList(appConfig.getEnabledFeatures()), true);
                    }
                    if (appConfig.getEnabledAuthProviders() != null) {
                        JSONUtils.serializeStringList(json, "enabledAuthProviders", Arrays.asList(appConfig.getEnabledAuthProviders()), true);
                    }

                    if (!CommonUtils.isEmpty(appConfig.getPlugins())) {
                        JSONUtils.serializeProperties(json, "plugins", appConfig.getPlugins());
                    }
                    if (!CommonUtils.isEmpty(appConfig.getAuthProviderConfigurations())) {
                        json.name("authConfiguration");
                        gson.toJson(appConfig.getAuthProviderConfigurations(), Map.class, json);
                    }

                    json.endObject();
                }
                json.endObject();
            }

        } catch (IOException e) {
            throw new DBException("Error writing runtime configuration", e);
        }
    }

    ////////////////////////////////////////////////////////////////////////
    // License management

    public boolean isLicenseRequired() {
        return false;
    }

    public boolean isLicenseValid() {
        return false;
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.model.app.BaseWebApplication;
import io.cloudbeaver.model.app.WebAuthApplication;
import io.cloudbeaver.model.app.WebAuthConfiguration;
import io.cloudbeaver.model.rm.local.LocalResourceController;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebDriverRegistry;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.jetty.CBJettyServer;
import io.cloudbeaver.service.DBWServiceInitializer;
import io.cloudbeaver.service.security.CBEmbeddedSecurityController;
import io.cloudbeaver.service.security.EmbeddedSecurityControllerFactory;
import io.cloudbeaver.service.security.SMControllerConfiguration;
import io.cloudbeaver.service.session.WebSessionManager;
import io.cloudbeaver.utils.WebAppUtils;
import io.cloudbeaver.websocket.CBEventController;
import io.cloudbeaver.websocket.event.WSServerConfigurationChangedEvent;
import org.eclipse.core.runtime.Platform;
import org.eclipse.osgi.service.datalocation.Location;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPApplication;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.security.*;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.IVariableResolver;
import org.jkiss.dbeaver.utils.ContentUtils;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Permission;
import java.security.Policy;
import java.security.ProtectionDomain;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * This class controls all aspects of the application's execution
 */
public class CBApplication extends BaseWebApplication implements WebAuthApplication {

    private static final Log log = Log.getLog(CBApplication.class);

    private static final boolean RECONFIGURATION_ALLOWED = true;

    static {
        Log.setDefaultDebugStream(System.out);
    }

    private String staticContent = "";

    public static CBApplication getInstance() {
        return (CBApplication) BaseApplicationImpl.getInstance();
    }

    private String serverURL;
    protected int serverPort = CBConstants.DEFAULT_SERVER_PORT;
    private String serverHost = null;
    private String serverName = null;
    private String contentRoot = CBConstants.DEFAULT_CONTENT_ROOT;
    private String rootURI = CBConstants.DEFAULT_ROOT_URI;
    private String servicesURI = CBConstants.DEFAULT_SERVICES_URI;

    private String workspaceLocation = CBConstants.DEFAULT_WORKSPACE_LOCATION;
    private String driversLocation = CBConstants.DEFAULT_DRIVERS_LOCATION;
    private File homeDirectory;

    // Configurations
    protected final Map<String, Object> productConfiguration = new HashMap<>();
    protected final Map<String, Object> databaseConfiguration = new HashMap<>();
    protected final SMControllerConfiguration securityManagerConfiguration = new SMControllerConfiguration();
    private final CBAppConfig appConfiguration = new CBAppConfig();
    private Map<String, String> externalProperties = new LinkedHashMap<>();
    private Map<String, Object> originalConfigurationProperties = new LinkedHashMap<>();

    // Persistence
    protected SMAdminController securityController;

    private long maxSessionIdleTime = CBConstants.MAX_SESSION_IDLE_TIME;

    private boolean develMode = false;
    private boolean configurationMode = false;
    private boolean enableSecurityManager = false;
    private String localHostAddress;
    private final List<InetAddress> localInetAddresses = new ArrayList<>();

    protected final CBEventController eventController = new CBEventController();

    private WebSessionManager sessionManager;

    public CBApplication() {
    }

    public String getServerURL() {
        return serverURL;
    }

    // Port this server listens on. If set the 0 a random port is assigned which may be obtained with getLocalPort()
    @Override
    public int getServerPort() {
        return serverPort;
    }

    // The network interface this connector binds to as an IP address or a hostname.  If null or 0.0.0.0, then bind to all interfaces.
    public String getServerHost() {
        return serverHost;
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

    public Path getHomeDirectory() {
        return homeDirectory.toPath();
    }

    @Override
    public boolean isMultiNode() {
        return false;
    }

    public long getMaxSessionIdleTime() {
        return maxSessionIdleTime;
    }

    public CBAppConfig getAppConfiguration() {
        return appConfiguration;
    }

    @Override
    public WebAuthConfiguration getAuthConfiguration() {
        return appConfiguration;
    }

    @Override
    public String getAuthServiceURL() {
        return Stream.of(getServerURL(), getRootURI(), getServicesURI())
            .map(WebAppUtils::removeSideSlashes)
            .filter(CommonUtils::isNotEmpty)
            .collect(Collectors.joining("/"));
    }

    public Map<String, Object> getProductConfiguration() {
        return productConfiguration;
    }

    public SMAdminController getSecurityController() {
        return securityController;
    }

    @Override
    public SMController createSecurityController(@NotNull SMCredentialsProvider credentialsProvider) throws DBException {
        return new EmbeddedSecurityControllerFactory().createSecurityService(
            this,
            databaseConfiguration,
            credentialsProvider,
            securityManagerConfiguration
        );
    }

    @Override
    public SMAdminController getAdminSecurityController(@NotNull SMCredentialsProvider credentialsProvider) throws DBException {
        return new EmbeddedSecurityControllerFactory().createSecurityService(
            this,
            databaseConfiguration,
            credentialsProvider,
            securityManagerConfiguration
        );
    }

    @Override
    public boolean isHeadlessMode() {
        return true;
    }

    @Override
    public boolean isMultiuser() {
        return true;
    }

    @Override
    protected void startServer() {
        CBPlatform.setApplication(this);

        Path configPath;
        try {
            configPath = loadServerConfiguration();
            if (configPath == null) {
                return;
            }
        } catch (DBException e) {
            log.error(e);
            return;
        }

        configurationMode = CommonUtils.isEmpty(serverName);

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
            return;
        }

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
        log.debug("\tListen port: " + serverPort + (CommonUtils.isEmpty(serverHost) ? " on all interfaces" : " on " + serverHost));
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
                initializeSecurityController();
            } catch (Exception e) {
                log.error("Error initializing database", e);
                return;
            }
        }
        try {
            initializeServer();
        } catch (DBException e) {
            log.error("Error initializing server", e);
            return;
        }

        if (configurationMode) {
            // Try to configure automatically
            performAutoConfiguration(configPath.toFile().getParentFile());
        } else if (appConfiguration.isGrantConnectionsAccessToAnonymousTeam() && !isMultiNode()) {
            grantAnonymousAccessToConnections(appConfiguration, "auto-grant");
        }

        if (enableSecurityManager) {
            Policy.setPolicy(new Policy() {
                @Override
                public boolean implies(ProtectionDomain domain, Permission permission) {
                    return true;
                }
            });
            System.setSecurityManager(new SecurityManager());
        }

        eventController.scheduleCheckJob();

        runWebServer();

        log.debug("Shutdown");

        return;
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
                getAppConfiguration(),
                null
            );
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
        return getDataDirectory(true).resolve(CBConstants.RUNTIME_APP_CONFIG_FILE_NAME).toFile();
    }

    @NotNull
    private Path getRuntimeProductConfigFilePath() {
        return getDataDirectory(false).resolve(CBConstants.RUNTIME_PRODUCT_CONFIG_FILE_NAME);
    }

    @NotNull
    public Path getDataDirectory(boolean create) {
        File dataDir = new File(workspaceLocation, CBConstants.RUNTIME_DATA_DIR_NAME);
        if (create && !dataDir.exists()) {
            if (!dataDir.mkdirs()) {
                log.error("Can't create data directory '" + dataDir.getAbsolutePath() + "'");
            }
        }
        return dataDir.toPath();
    }

    @Override
    public Path getWorkspaceDirectory() {
        return Path.of(workspaceLocation);
    }

    private void initializeSecurityController() throws DBException {
        securityController = createGlobalSecurityController();
    }

    protected SMAdminController createGlobalSecurityController() throws DBException {
        return new EmbeddedSecurityControllerFactory().createSecurityService(
            this,
            databaseConfiguration,
            new NoAuthCredentialsProvider(),
            securityManagerConfiguration
        );
    }

    @Nullable
    @Override
    protected Path loadServerConfiguration() throws DBException {
        Path path = super.loadServerConfiguration();

        File runtimeConfigFile = getRuntimeAppConfigFile();
        if (runtimeConfigFile.exists()) {
            log.debug("Runtime configuration [" + runtimeConfigFile.getAbsolutePath() + "]");
            parseConfiguration(runtimeConfigFile);
        }

        return path;
    }

    @Override
    protected void loadConfiguration(String configPath) throws DBException {
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

    @Override
    public RMController createResourceController(@NotNull SMCredentialsProvider credentialsProvider) {
        return LocalResourceController.builder(credentialsProvider, this::getSecurityController).build();
    }

    private void parseConfiguration(File configFile) throws DBException {
        Map<String, Object> configProps = readConfiguration(configFile);
        parseConfiguration(configProps);
    }

    protected void parseConfiguration(Map<String, Object> configProps) throws DBException {
        String homeFolder = initHomeFolder();

        CBAppConfig prevConfig = new CBAppConfig(appConfiguration);
        Gson gson = getGson();
        try {
            Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");
            serverPort = JSONUtils.getInteger(serverConfig, CBConstants.PARAM_SERVER_PORT, serverPort);
            serverHost = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_HOST, serverHost);
            if (serverConfig.containsKey(CBConstants.PARAM_SERVER_URL)) {
                serverURL = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_URL, serverURL);
            } else if (serverURL == null) {
                String hostName = serverHost;
                if (CommonUtils.isEmpty(hostName)) {
                    hostName = InetAddress.getLocalHost().getHostName();
                }
                serverURL = "http://" + hostName + ":" + serverPort;
            }

            serverName = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_NAME, serverName);
            contentRoot = WebAppUtils.getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_CONTENT_ROOT, contentRoot), homeFolder);
            rootURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_ROOT_URI, rootURI);
            servicesURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVICES_URI, servicesURI);
            driversLocation = WebAppUtils.getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_DRIVERS_LOCATION, driversLocation), homeFolder);
            workspaceLocation = WebAppUtils.getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_WORKSPACE_LOCATION, workspaceLocation), homeFolder);

            maxSessionIdleTime = JSONUtils.getLong(serverConfig, CBConstants.PARAM_SESSION_EXPIRE_PERIOD, maxSessionIdleTime);

            develMode = JSONUtils.getBoolean(serverConfig, CBConstants.PARAM_DEVEL_MODE, develMode);
            enableSecurityManager = JSONUtils.getBoolean(serverConfig, CBConstants.PARAM_SECURITY_MANAGER, enableSecurityManager);
            //SM config
            gson.fromJson(
                gson.toJsonTree(JSONUtils.getObject(serverConfig, CBConstants.PARAM_SM_CONFIGURATION)),
                SMControllerConfiguration.class
            );
            // App config
            Map<String, Object> appConfig = JSONUtils.getObject(configProps, "app");
            validateConfiguration(appConfig);
            gson.fromJson(gson.toJsonTree(appConfig), CBAppConfig.class);

            databaseConfiguration.putAll(JSONUtils.getObject(serverConfig, CBConstants.PARAM_DB_CONFIGURATION));

            readProductConfiguration(serverConfig, gson, homeFolder);

            String staticContentsFile = JSONUtils.getString(serverConfig, CBConstants.PARAM_STATIC_CONTENT);
            if (!CommonUtils.isEmpty(staticContentsFile)) {
                try {
                    staticContent = Files.readString(Path.of(staticContentsFile));
                } catch (IOException e) {
                    log.error("Error reading static contents from " + staticContentsFile, e);
                }
            }
            parseAdditionalConfiguration(configProps);
        } catch (IOException | DBException e) {
            throw new DBException("Error parsing server configuration", e);
        }

        // Backward compatibility: load configs map
        appConfiguration.loadLegacyCustomConfigs();

        // Merge new config with old one
        mergeOldConfiguration(prevConfig);

        patchConfigurationWithProperties(productConfiguration);
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

    @NotNull
    protected String initHomeFolder() {
        String homeFolder = System.getenv(CBConstants.ENV_CB_HOME);
        if (CommonUtils.isEmpty(homeFolder)) {
            homeFolder = System.getProperty("user.dir");
        }
        if (CommonUtils.isEmpty(homeFolder)) {
            homeFolder = ".";
        }
        homeDirectory = new File(homeFolder);
        return homeFolder;
    }

    protected void validateConfiguration(Map<String, Object> appConfig) throws DBException {

    }

    protected void readProductConfiguration(Map<String, Object> serverConfig, Gson gson, String homeFolder) throws DBException {
        String productConfigPath = WebAppUtils.getRelativePath(
            JSONUtils.getString(
                serverConfig,
                CBConstants.PARAM_PRODUCT_CONFIGURATION,
                CBConstants.DEFAULT_PRODUCT_CONFIGURATION
            ),
            homeFolder
        );

        if (!CommonUtils.isEmpty(productConfigPath)) {
            File productConfigFile = new File(productConfigPath);
            if (!productConfigFile.exists()) {
                log.error("Product configuration file not found (" + productConfigFile.getAbsolutePath() + "'");
            } else {
                log.debug("Load product configuration from '" + productConfigFile.getAbsolutePath() + "'");
                try (Reader reader = new InputStreamReader(new FileInputStream(productConfigFile), StandardCharsets.UTF_8)) {
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

    protected Map<String, Object> readConfiguration(File configFile) throws DBException {
        Map<String, Object> configProps = new LinkedHashMap<>();
        if (configFile.exists()) {
            log.debug("Read configuration [" + configFile.getAbsolutePath() + "]");
            // saves original configuration file
            this.originalConfigurationProperties.putAll(readConfigurationFile(configFile));

            configProps.putAll(readConfigurationFile(configFile));
            patchConfigurationWithProperties(configProps); // patch original properties
        }

        readAdditionalConfiguration(configProps);
        if (configProps.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> serverConfig = getServerConfigProps(configProps);
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

        patchConfigurationWithProperties(configProps); // patch again because properties can be changed
        return configProps;
    }

    public Map<String, Object> readConfigurationFile(File configFile) throws DBException {
        try (Reader reader = new InputStreamReader(new FileInputStream(configFile), StandardCharsets.UTF_8)) {
            return JSONUtils.parseMap(getGson(), reader);
        } catch (IOException e) {
            throw new DBException("Error parsing server configuration", e);
        }
    }

    private Gson getGson() {
        // Stupid way to populate existing objects but ok google (https://github.com/google/gson/issues/431)
        InstanceCreator<CBAppConfig> appConfigCreator = type -> appConfiguration;
        InstanceCreator<DataSourceNavigatorSettings> navSettingsCreator = type -> (DataSourceNavigatorSettings) appConfiguration.getDefaultNavigatorSettings();
        InstanceCreator<SMControllerConfiguration> smConfigCreator = type -> securityManagerConfiguration;

        return new GsonBuilder()
            .setLenient()
            .registerTypeAdapter(CBAppConfig.class, appConfigCreator)
            .registerTypeAdapter(DataSourceNavigatorSettings.class, navSettingsCreator)
            .registerTypeAdapter(SMControllerConfiguration.class, smConfigCreator)
            .create();
    }

    protected void readAdditionalConfiguration(Map<String, Object> rootConfig) throws DBException {

    }

    protected void parseAdditionalConfiguration(Map<String, Object> serverConfig) throws DBException {

    }

    private void runWebServer() {
        log.debug("Starting Jetty server (" + serverPort + " on " + (CommonUtils.isEmpty(serverHost) ? "all interfaces" : serverHost) + ") ");
        new CBJettyServer().runServer();
    }


    @Override
    public void stop() {
        shutdown();
    }

    protected void shutdown() {
        try {
            if (securityController instanceof CBEmbeddedSecurityController) {
                ((CBEmbeddedSecurityController) securityController).shutdown();
            }
        } catch (Exception e) {
            log.error(e);
        }
        log.debug("Cloudbeaver Server is stopping"); //$NON-NLS-1$
    }

    @Override
    public String getInfoDetails(DBRProgressMonitor monitor) {
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
        @NotNull CBAppConfig appConfig,
        @Nullable SMCredentialsProvider credentialsProvider
    ) throws DBException {
        if (!RECONFIGURATION_ALLOWED && !isConfigurationMode()) {
            throw new DBException("Application must be in configuration mode");
        }

        if (isConfigurationMode()) {
            finishSecurityServiceConfiguration(adminName, adminPassword, authInfoList);
        }

        // Save runtime configuration
        log.debug("Saving runtime configuration");
        saveRuntimeConfig(newServerName, newServerURL, sessionExpireTime, appConfig, credentialsProvider);

        // Grant permissions to predefined connections
        if (appConfig.isGrantConnectionsAccessToAnonymousTeam()) {
            grantAnonymousAccessToConnections(appConfig, adminName);
        }

        // Re-load runtime configuration
        try {
            log.debug("Reloading application configuration");
            Map<String, Object> runtimeConfigProps = readRuntimeConfigurationProperties();
            if (!runtimeConfigProps.isEmpty()) {
                parseConfiguration(runtimeConfigProps);
            }
        } catch (Exception e) {
            throw new DBException("Error parsing configuration", e);
        }

        configurationMode = CommonUtils.isEmpty(serverName);

        String sessionId = null;
        if (credentialsProvider instanceof WebSession) {
            sessionId = ((WebSession) credentialsProvider).getSessionId();
        }
        eventController.addEvent(new WSServerConfigurationChangedEvent(sessionId));
    }

    protected Map<String, Object> readRuntimeConfigurationProperties() throws DBException {
        File runtimeConfigFile = getRuntimeAppConfigFile();
        return readConfiguration(runtimeConfigFile);
    }

    protected void finishSecurityServiceConfiguration(
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<WebAuthInfo> authInfoList
    ) throws DBException {
        if (securityController instanceof CBEmbeddedSecurityController) {
            ((CBEmbeddedSecurityController) securityController).finishConfiguration(adminName, adminPassword, authInfoList);
        }
    }

    public synchronized void flushConfiguration(SMCredentialsProvider credentialsProvider) throws DBException {
        saveRuntimeConfig(serverName, serverURL, maxSessionIdleTime, appConfiguration, credentialsProvider);
    }


    private void grantAnonymousAccessToConnections(CBAppConfig appConfig, String adminName) {
        try {
            String anonymousTeamId = appConfig.getAnonymousUserTeam();
            var securityController = getSecurityController();
            for (DBPDataSourceContainer ds : WebServiceUtils.getGlobalDataSourceRegistry().getDataSources()) {
                var datasourcePermissions = securityController.getObjectPermissions(anonymousTeamId, ds.getId(), SMObjects.DATASOURCE);
                if (ArrayUtils.isEmpty(datasourcePermissions.getPermissions())) {
                    securityController.setObjectPermissions(
                        Set.of(ds.getId()),
                        SMObjects.DATASOURCE,
                        Set.of(anonymousTeamId),
                        Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION),
                        adminName
                    );
                }
            }
        } catch (Exception e) {
            log.error("Error granting anonymous access to connections", e);
        }
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
        validateConfiguration(configurationProperties);
        writeRuntimeConfig(configurationProperties);
    }

    private void writeRuntimeConfig(Map<String, Object> configurationProperties) throws DBException {
        File runtimeConfigFile = getRuntimeAppConfigFile();
        if (runtimeConfigFile.exists()) {
            ContentUtils.makeFileBackup(runtimeConfigFile.toPath());
        }

        try (Writer out = new OutputStreamWriter(new FileOutputStream(runtimeConfigFile), StandardCharsets.UTF_8)) {
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
            var serverConfigProperties = new LinkedHashMap<String, Object>();
            var originServerConfig = getServerConfigProps(this.originalConfigurationProperties); // get server properties from original configuration file
            rootConfig.put("server", serverConfigProperties);
            if (!CommonUtils.isEmpty(newServerName)) {
                copyConfigValue(originServerConfig, serverConfigProperties, CBConstants.PARAM_SERVER_NAME, newServerName);
            }
            if (!CommonUtils.isEmpty(newServerURL)) {
                copyConfigValue(
                    originServerConfig, serverConfigProperties, CBConstants.PARAM_SERVER_URL, newServerURL);
            }
            if (sessionExpireTime > 0) {
                copyConfigValue(
                    originServerConfig, serverConfigProperties, CBConstants.PARAM_SESSION_EXPIRE_PERIOD, sessionExpireTime);
            }
            var databaseConfigProperties = new LinkedHashMap<String, Object>();
            Map<String, Object> oldRuntimeDBConfig = JSONUtils.getObject(originServerConfig, CBConstants.PARAM_DB_CONFIGURATION);
            if (!CommonUtils.isEmpty(databaseConfiguration)) {
                for (Map.Entry<String, Object> mp : databaseConfiguration.entrySet()) {
                    copyConfigValue(oldRuntimeDBConfig, databaseConfigProperties, mp.getKey(), mp.getValue());
                }
                serverConfigProperties.put(CBConstants.PARAM_DB_CONFIGURATION, databaseConfigProperties);
            }
        }
        {
            var appConfigProperties = new LinkedHashMap<String, Object>();
            Map<String, Object> oldAppConfig = JSONUtils.getObject(this.originalConfigurationProperties, "app");
            rootConfig.put("app", appConfigProperties);

            copyConfigValue(
                oldAppConfig, appConfigProperties, "anonymousAccessEnabled", appConfig.isAnonymousAccessEnabled());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "supportsCustomConnections", appConfig.isSupportsCustomConnections());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "publicCredentialsSaveEnabled", appConfig.isPublicCredentialsSaveEnabled());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "adminCredentialsSaveEnabled", appConfig.isAdminCredentialsSaveEnabled());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "enableReverseProxyAuth", appConfig.isEnabledReverseProxyAuth());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "forwardProxy", appConfig.isEnabledForwardProxy());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "linkExternalCredentialsWithUser", appConfig.isLinkExternalCredentialsWithUser());
            copyConfigValue(
                oldAppConfig, appConfigProperties, "redirectOnFederatedAuth", appConfig.isRedirectOnFederatedAuth());
            copyConfigValue(
                oldAppConfig, appConfigProperties, CBConstants.PARAM_RESOURCE_MANAGER_ENABLED, appConfig.isResourceManagerEnabled());
            copyConfigValue(
                oldAppConfig, appConfigProperties, CBConstants.PARAM_SHOW_READ_ONLY_CONN_INFO, appConfig.isShowReadOnlyConnectionInfo());
            copyConfigValue(
                oldAppConfig,
                appConfigProperties,
                CBConstants.PARAM_CONN_GRANT_ANON_ACCESS,
                appConfig.isGrantConnectionsAccessToAnonymousTeam());

            Map<String, Object> resourceQuotas = new LinkedHashMap<>();
            Map<String, Object> originResourceQuotas = JSONUtils.getObject(oldAppConfig, CBConstants.PARAM_RESOURCE_QUOTAS);
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

    ////////////////////////////////////////////////////////////////////////
    // License management

    public boolean isLicenseRequired() {
        return false;
    }

    public boolean isLicenseValid() {
        return false;
    }

    /**
     *
     */
    public String getStaticContent() {
        return staticContent;
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
        patchConfigurationWithProperties(configProps, varResolver);
    }

    public WebSessionManager getSessionManager() {
        if (sessionManager == null) {
            sessionManager = createSessionManager();
        }
        return sessionManager;
    }

    protected WebSessionManager createSessionManager() {
        return new WebSessionManager(this);
    }

    @NotNull
    public WebDriverRegistry getDriverRegistry() {
        return WebDriverRegistry.getInstance();
    }

    public Set<String> getAvailableAuthRoles() {
        return Set.of();
    }

    // gets info about patterns from original configuration file and saves it to runtime config
    private void copyConfigValue(Map<String, Object> oldConfig, Map<String, Object> newConfig, String key, Object defaultValue) {
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

    @Override
    public CBEventController getEventController() {
        return eventController;
    }

    public SMControllerConfiguration getSecurityManagerConfiguration() {
        return securityManagerConfiguration;
    }
}

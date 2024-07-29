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

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.model.app.BaseWebApplication;
import io.cloudbeaver.model.app.WebAuthApplication;
import io.cloudbeaver.model.app.WebAuthConfiguration;
import io.cloudbeaver.registry.WebDriverRegistry;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.jetty.CBJettyServer;
import io.cloudbeaver.service.DBWServiceInitializer;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import io.cloudbeaver.service.security.SMControllerConfiguration;
import io.cloudbeaver.service.session.WebSessionManager;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.eclipse.core.runtime.Platform;
import org.eclipse.osgi.service.datalocation.Location;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.auth.AuthInfo;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;
import org.jkiss.dbeaver.model.websocket.event.WSServerConfigurationChangedEvent;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.ui.DBPPlatformUI;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.StandardConstants;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.file.Path;
import java.security.Permission;
import java.security.Policy;
import java.security.ProtectionDomain;
import java.util.*;

/**
 * This class controls all aspects of the application's execution
 */
public abstract class CBApplication<T extends CBServerConfig> extends BaseWebApplication implements WebAuthApplication {

    private static final Log log = Log.getLog(CBApplication.class);

    private static final boolean RECONFIGURATION_ALLOWED = true;
    /**
     * In configuration mode sessions expire after a week
     */
    private static final long CONFIGURATION_MODE_SESSION_IDLE_TIME = 60 * 60 * 1000 * 24 * 7;
    public static final String HOST_LOCALHOST = "localhost";
    public static final String HOST_127_0_0_1 = "127.0.0.1";


    static {
        Log.setDefaultDebugStream(System.out);
    }


    public static CBApplication getInstance() {
        return (CBApplication) BaseApplicationImpl.getInstance();
    }

    private final File homeDirectory;

    // Persistence
    protected SMAdminController securityController;
    private boolean configurationMode = false;
    private String localHostAddress;
    protected String containerId;
    private final List<InetAddress> localInetAddresses = new ArrayList<>();

    protected final WSEventController eventController = new WSEventController();

    private WebSessionManager sessionManager;

    public CBApplication() {
        this.homeDirectory = new File(initHomeFolder());
    }

    public String getServerURL() {
        return getServerConfiguration().getServerURL();
    }

    // Port this server listens on. If set the 0 a random port is assigned which may be obtained with getLocalPort()
    @Override
    public int getServerPort() {
        return getServerConfiguration().getServerPort();
    }

    // The network interface this connector binds to as an IP address or a hostname.  If null or 0.0.0.0, then bind to all interfaces.
    public String getServerHost() {
        return getServerConfiguration().getServerHost();
    }

    public String getServerName() {
        return getServerConfiguration().getServerName();
    }

    public String getRootURI() {
        return getServerConfiguration().getRootURI();
    }

    public String getServicesURI() {
        return getServerConfiguration().getServicesURI();
    }


    public Path getHomeDirectory() {
        return homeDirectory.toPath();
    }

    @Override
    public boolean isMultiNode() {
        return false;
    }

    /**
     * @return actual max session idle time
     */
    public long getMaxSessionIdleTime() {
        if (isConfigurationMode()) {
            return CONFIGURATION_MODE_SESSION_IDLE_TIME;
        }
        return getServerConfiguration().getMaxSessionIdleTime();
    }

    /**
     * @return max session idle time from server configuration, may differ from {@link #getMaxSessionIdleTime()}
     */

    public CBAppConfig getAppConfiguration() {
        return getServerConfigurationController().getAppConfiguration();
    }

    public T getServerConfiguration() {
        return getServerConfigurationController().getServerConfiguration();
    }

    @Override
    public WebAuthConfiguration getAuthConfiguration() {
        return getAppConfiguration();
    }

    @Override
    public String getAuthServiceURL() {
        return getServerConfigurationController().getAuthServiceURL();
    }

    public Map<String, Object> getProductConfiguration() {
        return getServerConfigurationController().getProductConfiguration();
    }

    public SMControllerConfiguration getSecurityManagerConfiguration() {
        return getServerConfiguration().getSecurityManagerConfiguration();
    }

    public SMAdminController getSecurityController() {
        return securityController;
    }

    @Override
    protected void startServer() {
        CBPlatform.setApplication(this);
        try {
            if (!loadServerConfiguration()) {
                return;
            }
            if (CommonUtils.isEmpty(this.getAppConfiguration().getDefaultUserTeam())) {
                throw new DBException("Default user team must be specified");
            }
        } catch (DBException e) {
            log.error(e);
            return;
        }
        refreshDisabledDriversConfig();

        configurationMode = CommonUtils.isEmpty(getServerConfiguration().getServerName());

        eventController.setForceSkipEvents(isConfigurationMode()); // do not send events if configuration mode is on

        // Determine address for local host
        localHostAddress = System.getenv(CBConstants.VAR_CB_LOCAL_HOST_ADDR);
        if (CommonUtils.isEmpty(localHostAddress)) {
            localHostAddress = System.getProperty(CBConstants.VAR_CB_LOCAL_HOST_ADDR);
        }
        if (CommonUtils.isEmpty(localHostAddress) || HOST_127_0_0_1.equals(localHostAddress) || "::0".equals(
            localHostAddress)) {
            localHostAddress = HOST_LOCALHOST;
        }

        final Runtime runtime = Runtime.getRuntime();
        initializeAdditionalConfiguration();

        Location instanceLoc = Platform.getInstanceLocation();
        try {
            if (!instanceLoc.isSet()) {
                URL wsLocationURL = new URL(
                    "file",  //$NON-NLS-1$
                    null,
                    getServerConfiguration().getWorkspaceLocation());
                instanceLoc.set(wsLocationURL, true);
            }
        } catch (Exception e) {
            log.error("Error setting workspace location to " + getServerConfiguration().getWorkspaceLocation(), e);
            return;
        }

        log.debug(GeneralUtils.getProductName() + " " + GeneralUtils.getProductVersion() + " is starting"); //$NON-NLS-1$
        log.debug("\tOS: " + System.getProperty(StandardConstants.ENV_OS_NAME) + " " + System.getProperty(
            StandardConstants.ENV_OS_VERSION) + " (" + System.getProperty(StandardConstants.ENV_OS_ARCH) + ")");
        log.debug("\tJava version: " + System.getProperty(StandardConstants.ENV_JAVA_VERSION) + " by " + System.getProperty(
            StandardConstants.ENV_JAVA_VENDOR) + " (" + System.getProperty(StandardConstants.ENV_JAVA_ARCH) + "bit)");
        log.debug("\tInstall path: '" + SystemVariablesResolver.getInstallPath() + "'"); //$NON-NLS-1$ //$NON-NLS-2$
        log.debug("\tGlobal workspace: '" + instanceLoc.getURL() + "'"); //$NON-NLS-1$ //$NON-NLS-2$
        log.debug("\tMemory available " + (runtime.totalMemory() / (1024 * 1024)) + "Mb/" + (runtime.maxMemory() / (1024 * 1024)) + "Mb");

        DBWorkbench.getPlatform().getApplication();

        log.debug("\tContent root: " + new File(getServerConfiguration().getContentRoot()).getAbsolutePath());
        log.debug("\tDrivers storage: " + new File(getServerConfiguration().getDriversLocation()).getAbsolutePath());
        //log.debug("\tDrivers root: " + driversLocation);
        //log.debug("\tProduct details: " + application.getInfoDetails());
        log.debug("\tListen port: " + getServerPort() + (CommonUtils.isEmpty(getServerHost()) ? " on all interfaces" : " on " + getServerHost()));
        log.debug("\tBase URI: " + getServicesURI());
        if (isDevelMode()) {
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
            for (DBWServiceInitializer wsi : WebServiceRegistry.getInstance()
                .getWebServices(DBWServiceInitializer.class)) {
                try {
                    wsi.initializeService(this);
                } catch (Exception e) {
                    log.warn("Error initializing web service " + wsi.getClass().getName(), e);
                }
            }

        }

        try {
            initializeServer();
        } catch (DBException e) {
            log.error("Error initializing server", e);
            return;
        }

        try {
            initializeSecurityController();
        } catch (Exception e) {
            log.error("Error initializing database", e);
            return;
        }


        if (configurationMode) {
            // Try to configure automatically
            performAutoConfiguration(getMainConfigurationFilePath().toFile().getParentFile());
        } else if (!isMultiNode()) {
            var appConfiguration = getServerConfigurationController().getAppConfiguration();
            if (appConfiguration.isGrantConnectionsAccessToAnonymousTeam()) {
                grantAnonymousAccessToConnections(appConfiguration, CBConstants.ADMIN_AUTO_GRANT);
            }
            grantPermissionsToConnections();
        }

        if (getServerConfiguration().isEnableSecurityManager()) {
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

    protected void initializeAdditionalConfiguration() {

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

        if (CommonUtils.isEmpty(autoServerName) || CommonUtils.isEmpty(autoAdminName) || CommonUtils.isEmpty(
            autoAdminPassword)) {
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
                        log.error("Error loading auto configuration file '" + autoConfigFile.getAbsolutePath() + "'",
                            e);
                    }
                }
            }
        }

        if (CommonUtils.isEmpty(autoServerName) || CommonUtils.isEmpty(autoAdminName) || CommonUtils.isEmpty(
            autoAdminPassword)) {
            log.info("No auto configuration was found. Server must be configured manually");
            return;
        }
        CBServerConfig serverConfig = new CBServerConfig();
        serverConfig.setServerName(autoServerName);
        serverConfig.setServerURL(autoServerURL);
        serverConfig.setMaxSessionIdleTime(getMaxSessionIdleTime());
        try {
            finishConfiguration(
                autoAdminName,
                autoAdminPassword,
                Collections.emptyList(),
                serverConfig,
                getAppConfiguration(),
                null
            );
        } catch (Exception e) {
            log.error("Error loading server auto configuration", e);
        }
    }

    protected void initializeServer() throws DBException {
        for (DBWServiceServerConfigurator wsc : WebServiceRegistry.getInstance()
            .getWebServices(DBWServiceServerConfigurator.class)) {
            try {
                wsc.migrateConfigurationIfNeeded(this);
            } catch (Exception e) {
                log.warn("Error migration configuration " + wsc.getClass().getName(), e);
            }
        }
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
    public Path getDataDirectory(boolean create) {
        File dataDir = new File(getServerConfiguration().getWorkspaceLocation(), CBConstants.RUNTIME_DATA_DIR_NAME);
        if (create && !dataDir.exists()) {
            if (!dataDir.mkdirs()) {
                log.error("Can't create data directory '" + dataDir.getAbsolutePath() + "'");
            }
        }
        return dataDir.toPath();
    }

    @Override
    public Path getWorkspaceDirectory() {
        return Path.of(getServerConfiguration().getWorkspaceLocation());
    }

    private void initializeSecurityController() throws DBException {
        securityController = createGlobalSecurityController();
    }

    protected abstract SMAdminController createGlobalSecurityController() throws DBException;

    @NotNull
    protected String initHomeFolder() {
        String homeFolder = System.getenv(CBConstants.ENV_CB_HOME);
        if (CommonUtils.isEmpty(homeFolder)) {
            homeFolder = System.getProperty("user.dir");
        }
        if (CommonUtils.isEmpty(homeFolder)) {
            homeFolder = ".";
        }
        return homeFolder;
    }

    private void runWebServer() {
        log.debug(
            String.format("Starting Jetty server (%d on %s) ",
                getServerPort(),
                CommonUtils.isEmpty(getServerHost()) ? "all interfaces" : getServerHost())
        );
        new CBJettyServer(this).runServer();
    }


    @Override
    public void stop() {
        shutdown();
    }

    protected void shutdown() {
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
        return getServerConfiguration().isDevelMode();
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
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<AuthInfo> authInfoList,
        @NotNull CBServerConfig serverConfig,
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
        getServerConfigurationController().saveRuntimeConfig(serverConfig, appConfig, credentialsProvider);

        // Grant permissions to predefined connections
        if (appConfig.isGrantConnectionsAccessToAnonymousTeam()) {
            grantAnonymousAccessToConnections(appConfig, adminName);
        }
        reloadConfiguration(credentialsProvider);
    }

    public synchronized void reloadConfiguration(@Nullable SMCredentialsProvider credentialsProvider) throws DBException {
        // Re-load runtime configuration
        try {
            Path runtimeAppConfigPath = getServerConfigurationController().getRuntimeAppConfigPath();
            log.debug("Reloading application configuration");
            getServerConfigurationController().loadConfiguration(runtimeAppConfigPath);
        } catch (Exception e) {
            throw new DBException("Error parsing configuration", e);
        }

        configurationMode = CommonUtils.isEmpty(getServerName());

        // Reloading configuration by services
        for (DBWServiceServerConfigurator wsc : WebServiceRegistry.getInstance()
            .getWebServices(DBWServiceServerConfigurator.class)) {
            try {
                wsc.reloadConfiguration(getAppConfiguration());
            } catch (Exception e) {
                log.warn("Error reloading configuration by web service " + wsc.getClass().getName(), e);
            }
        }

        sendConfigChangedEvent(credentialsProvider);
        eventController.setForceSkipEvents(isConfigurationMode());
    }

    protected abstract void finishSecurityServiceConfiguration(
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<AuthInfo> authInfoList
    ) throws DBException;

    public synchronized void flushConfiguration(SMCredentialsProvider webSession) throws DBException {
        getServerConfigurationController().saveRuntimeConfig(webSession);
    }

    public synchronized void flushConfiguration() throws DBException {
        getServerConfigurationController().saveRuntimeConfig(new NoAuthCredentialsProvider());
    }


    private void grantAnonymousAccessToConnections(CBAppConfig appConfig, String adminName) {
        try {
            String anonymousTeamId = appConfig.getAnonymousUserTeam();
            var securityController = getSecurityController();
            for (DBPDataSourceContainer ds : WebServiceUtils.getGlobalDataSourceRegistry().getDataSources()) {
                var datasourcePermissions = securityController.getObjectPermissions(anonymousTeamId,
                    ds.getId(),
                    SMObjectType.datasource);
                if (ArrayUtils.isEmpty(datasourcePermissions.getPermissions())) {
                    securityController.setObjectPermissions(
                        Set.of(ds.getId()),
                        SMObjectType.datasource,
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

    private void grantPermissionsToConnections() {
        try {
            var globalRegistry = WebDataSourceUtils.getGlobalDataSourceRegistry();
            var permissionsConfiguration = getServerConfigurationController().readConnectionsPermissionsConfiguration(
                globalRegistry.getProject().getMetadataFolder(false));

            if (permissionsConfiguration == null) {
                return;
            }
            for (var entry : permissionsConfiguration.entrySet()) {
                var dataSourceId = entry.getKey();
                var ds = globalRegistry.getDataSource(dataSourceId);
                if (ds == null) {
                    log.error("Connection " + dataSourceId + " is not found in project " + globalRegistry.getProject()
                        .getName());
                }
                List<String> permissions = JSONUtils.getStringList(permissionsConfiguration, dataSourceId);
                var securityController = getSecurityController();
                securityController.deleteAllObjectPermissions(dataSourceId, SMObjectType.datasource);
                securityController.setObjectPermissions(
                    Set.of(dataSourceId),
                    SMObjectType.datasource,
                    new HashSet<>(permissions),
                    Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION),
                    CBConstants.ADMIN_AUTO_GRANT
                );
            }
        } catch (DBException e) {
            log.error("Error granting permissions to connections", e);
        }
    }

    ////////////////////////////////////////////////////////////////////////
    // License management

    @Override
    public boolean isLicenseRequired() {
        return false;
    }

    public boolean isLicenseValid() {
        return false;
    }

    @Nullable
    public String getLicenseStatus() {
        return null;
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

    public List<String> getAvailableAuthRoles() {
        return List.of();
    }

    public List<String> getAvailableTeamRoles() {
        return List.of();
    }

    @Override
    public WSEventController getEventController() {
        return eventController;
    }

    @Nullable
    public String getDefaultAuthRole() {
        return null;
    }

    public String getContainerId() {
        if (containerId == null) {
            containerId = System.getenv("HOSTNAME");
        }
        return containerId;
    }

    @NotNull
    @Override
    public Class<? extends DBPPlatform> getPlatformClass() {
        return CBPlatform.class;
    }

    @Override
    public Class<? extends DBPPlatformUI> getPlatformUIClass() {
        return CBPlatformUI.class;
    }

    public void saveProductConfiguration(SMCredentialsProvider credentialsProvider, Map<String, Object> productConfiguration) throws DBException {
        getServerConfigurationController().saveProductConfiguration(productConfiguration);
        flushConfiguration(credentialsProvider);
        sendConfigChangedEvent(credentialsProvider);
    }

    protected void sendConfigChangedEvent(SMCredentialsProvider credentialsProvider) {
        String sessionId = null;
        if (credentialsProvider != null && credentialsProvider.getActiveUserCredentials() != null) {
            sessionId = credentialsProvider.getActiveUserCredentials().getSmSessionId();
        }
        eventController.addEvent(new WSServerConfigurationChangedEvent(sessionId, null));
    }

    @Override
    public abstract CBServerConfigurationController<T> getServerConfigurationController();

    private void refreshDisabledDriversConfig() {
        CBAppConfig config = getAppConfiguration();
        Set<String> disabledDrivers = new LinkedHashSet<>(Arrays.asList(config.getDisabledDrivers()));
        for (DBPDriver driver : CBPlatform.getInstance().getApplicableDrivers()) {
            if (!driver.isEmbedded() || config.isDriverForceEnabled(driver.getFullId())) {
                continue;
            }
            disabledDrivers.add(driver.getFullId());
        }
        config.setDisabledDrivers(disabledDrivers.toArray(new String[0]));
    }

    @Override
    public boolean isEnvironmentVariablesAccessible() {
        return getAppConfiguration().isSystemVariablesResolvingEnabled();
    }
}

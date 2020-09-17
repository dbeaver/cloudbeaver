/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import io.cloudbeaver.server.jetty.CBJettyServer;
import org.eclipse.core.runtime.Platform;
import org.eclipse.equinox.app.IApplicationContext;
import org.eclipse.osgi.service.datalocation.Location;
import org.jkiss.code.NotNull;
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
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * This class controls all aspects of the application's execution
 */
public class CBApplication extends BaseApplicationImpl {

    private static final Log log = Log.getLog(CBApplication.class);

    static {
        Log.setDefaultDebugStream(System.out);
    }

    public static CBApplication getInstance() {
        return (CBApplication) BaseApplicationImpl.getInstance();
    }

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

    private DBNBrowseSettings defaultNavigatorSettings = DataSourceNavigatorSettings.PRESET_FULL.getSettings();

    private long maxSessionIdleTime = CBConstants.MAX_SESSION_IDLE_TIME;

    private boolean develMode = false;
    private boolean configurationMode = false;

    public CBApplication() {
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
            if (args[i].equals(CBConstants.CLI_PARAM_WEB_CONFIG) & args.length > i + 1) {
                configPath = args[i + 1];
                break;
            }
        }
        try {
            loadConfiguration(configPath);

            File runtimeConfigFile = getRuntimeConfigFile();
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
        log.debug("\tProduct details: " + application.getInfoDetails());
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

        runWebServer();

        log.debug("Shutdown");

        return null;
    }

    @NotNull
    private File getRuntimeConfigFile() {
        return new File(getDataDirectory(false), CBConstants.RUNTIME_CONFIG_FILE_NAME);
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

        // Stupid way to populate existing objects but ok google (https://github.com/google/gson/issues/431)
        InstanceCreator<CBAppConfig> appConfigCreator = type -> appConfiguration;
        InstanceCreator<CBDatabaseConfig> dbConfigCreator = type -> databaseConfiguration;
        InstanceCreator<CBDatabaseConfig.Pool> dbPoolConfigCreator = type -> databaseConfiguration.getPool();

        Gson gson = new GsonBuilder()
            .setLenient()
            .registerTypeAdapter(CBAppConfig.class, appConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.class, dbConfigCreator)
            .registerTypeAdapter(CBDatabaseConfig.Pool.class, dbPoolConfigCreator)
            .create();

        try (Reader reader = new InputStreamReader(new FileInputStream(configFile), StandardCharsets.UTF_8)) {
            Map<String, Object> configProps = JSONUtils.parseMap(gson, reader);

            Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");
            serverPort = JSONUtils.getInteger(serverConfig, CBConstants.PARAM_SERVER_PORT, serverPort);
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

            gson.fromJson(
                gson.toJsonTree(JSONUtils.getObject(configProps, "app")), CBAppConfig.class);

            gson.fromJson(
                gson.toJsonTree(JSONUtils.getObject(serverConfig, "database")), CBDatabaseConfig.class);

            productConfigPath = getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_PRODUCT_CONFIGURATION, CBConstants.DEFAULT_PRODUCT_CONFIGURATION), homeFolder);
        } catch (IOException e) {
            log.error("Error parsing server configuration", e);
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
        return serverName;
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

    public synchronized void finishConfiguration(
        String newServerName,
        String adminName,
        String adminPassword,
        CBAppConfig appConfig) throws DBException
    {
        if (!isConfigurationMode()) {
            throw new DBException("Application must be in configuration mode");
        }

        database.finishConfiguration(adminName, adminPassword);

        // Save runtime configuration
        log.debug("Saving runtime configuration");
        saveRuntimeConfig(newServerName, appConfig);

        // Grant permissions to predefined connections
        if (appConfig.isAnonymousAccessEnabled()) {
            grantAnonymousAccessToConnections(appConfig, adminName);
        }

        // Re-load runtime configuration
        try {
            log.debug("Reloading application configuration");
            File runtimeConfigFile = getRuntimeConfigFile();
            if (runtimeConfigFile.exists()) {
                log.debug("Runtime configuration [" + runtimeConfigFile.getAbsolutePath() + "]");
                parseConfiguration(runtimeConfigFile);
            }
        } catch (Exception e) {
            throw new DBException("Error parsing configuration", e);
        }

        configurationMode = CommonUtils.isEmpty(serverName);
    }

    private void grantAnonymousAccessToConnections(CBAppConfig appConfig, String adminName) {
        try {
            String anonymousRoleId = appConfig.getAnonymousUserRole();
            DBWSecurityController securityController = getSecurityController();
            for (DBPDataSourceContainer ds : WebServiceUtils.getDataSourceRegistry().getDataSources()) {
                DBWConnectionGrant[] grants = securityController.getConnectionSubjectAccess(ds.getId());
                if (ArrayUtils.isEmpty(grants)) {
                    securityController.setConnectionSubjectAccess(
                        ds.getId(),
                        new String[] { anonymousRoleId },
                        adminName);
                }
            }
        } catch (Exception e) {
            log.error("Error granting anonymous access to connections", e);
        }
    }

    private void saveRuntimeConfig(String newServerName, CBAppConfig appConfig) throws DBException {

        File runtimeConfigFile = getRuntimeConfigFile();
        try (Writer out = new OutputStreamWriter(new FileOutputStream(runtimeConfigFile), StandardCharsets.UTF_8)) {
            Gson gson = new GsonBuilder()
                .setLenient()
                .setPrettyPrinting()
                .create();
            try (JsonWriter json = gson.newJsonWriter(out)) {
                json.beginObject();
                {
                    json.name("server");
                    json.beginObject();
                    if (!CommonUtils.isEmpty(newServerName)) {
                        JSONUtils.field(json, "serverName", newServerName);
                    }
                    json.endObject();
                }
                {
                    json.name("app");
                    json.beginObject();
                    JSONUtils.field(json, "anonymousAccessEnabled", appConfig.isAnonymousAccessEnabled());
                    JSONUtils.field(json, "authenticationEnabled", appConfig.isAuthenticationEnabled());
                    JSONUtils.field(json, "supportsCustomConnections", appConfig.isSupportsCustomConnections());
                    json.endObject();
                }
                json.endObject();
            }

        } catch (IOException e) {
            throw new DBException("Error writing runtime configuration", e);
        }
    }

    public DBNBrowseSettings getDefaultNavigatorSettings() {
        return defaultNavigatorSettings;
    }

    public void setDefaultNavigatorSettings(DBNBrowseSettings defaultNavigatorSettings) {
        this.defaultNavigatorSettings = defaultNavigatorSettings;
    }

}

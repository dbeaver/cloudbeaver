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
import io.cloudbeaver.DBWSecurityController;
import io.cloudbeaver.server.jetty.CBJettyServer;
import org.eclipse.core.runtime.Platform;
import org.eclipse.equinox.app.IApplicationContext;
import org.eclipse.osgi.service.datalocation.Location;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.app.DBPApplication;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.registry.BaseApplicationImpl;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.dbeaver.utils.PrefUtils;
import org.jkiss.dbeaver.utils.SystemVariablesResolver;
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

    public static final String APPLICATION_PLUGIN_ID = "io.cloudbeaver.server";

    public static CBApplication getInstance() {
        return (CBApplication) BaseApplicationImpl.getInstance();
    }

    private int serverPort = CBConstants.DEFAULT_SERVER_PORT;
    private String serverName = CBConstants.DEFAULT_SERVER_NAME;
    private String contentRoot = CBConstants.DEFAULT_CONTENT_ROOT;
    private String rootURI = CBConstants.DEFAULT_ROOT_URI;
    private String servicesURI = CBConstants.DEFAULT_SERVICES_URI;

    private String workspaceLocation = CBConstants.DEFAULT_WORKSPACE_LOCATION;
    private String driversLocation = CBConstants.DEFAULT_DRIVERS_LOCATION;

    private Map<String, Object> productConfiguration = new HashMap<>();
    private CBAppConfig appConfiguration;
    private CBDatabaseConfig databaseConfiguration;
    private CBDatabase database;
    private CBSecurityController securityController;

    private long maxSessionIdleTime = CBConstants.MAX_SESSION_IDLE_TIME;

    private boolean develMode = false;

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
        } catch (Exception e) {
            log.error("Error parsing configuration", e);
            return null;
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
        log.debug("\tProduct details: " + application.getInfoDetails());
        log.debug("\tBase port: " + serverPort);
        log.debug("\tBase URI: " + servicesURI);
        if (develMode) {
            log.debug("\tDevelopment mode");
        } else {
            log.debug("\tProduction mode");
        }

        try {
            initializeDatabase();
        } catch (Exception e) {
            log.error("Error initializing database", e);
            return null;
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

    private void initializeDatabase() throws DBException {
        if (databaseConfiguration == null) {
            throw new DBException("Database configuration missing");
        }
        database = new CBDatabase(this, databaseConfiguration);

        securityController = new CBSecurityController(database);

        database.initialize();
    }

    private void loadConfiguration(String configPath) {
        log.debug("Using configuration " + configPath);

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
        String productConfigPath = null;

        Gson gson = new GsonBuilder().setLenient().create();

        try (Reader reader = new InputStreamReader(new FileInputStream(configFile), StandardCharsets.UTF_8)) {
            Map<String, Object> configProps = JSONUtils.parseMap(gson, reader);

            Map<String, Object> serverConfig = JSONUtils.getObject(configProps, "server");
            serverPort = JSONUtils.getInteger(serverConfig, CBConstants.PARAM_SERVER_PORT, CBConstants.DEFAULT_SERVER_PORT);
            serverName = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_NAME, CBConstants.DEFAULT_SERVER_NAME);
            contentRoot = this.getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_CONTENT_ROOT, CBConstants.DEFAULT_CONTENT_ROOT), homeFolder);
            rootURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_ROOT_URI, CBConstants.DEFAULT_ROOT_URI);
            servicesURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVICES_URI, CBConstants.DEFAULT_SERVICES_URI);
            driversLocation = this.getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_DRIVERS_LOCATION, CBConstants.DEFAULT_DRIVERS_LOCATION), homeFolder);
            workspaceLocation = this.getRelativePath(
                JSONUtils.getString(serverConfig, CBConstants.PARAM_WORKSPACE_LOCATION, CBConstants.DEFAULT_WORKSPACE_LOCATION), homeFolder);

            maxSessionIdleTime = JSONUtils.getLong(serverConfig, CBConstants.PARAM_SESSION_EXPIRE_PERIOD, CBConstants.MAX_SESSION_IDLE_TIME);

            develMode = JSONUtils.getBoolean(serverConfig, CBConstants.PARAM_DEVEL_MODE, false);

            appConfiguration = gson.fromJson(
                gson.toJsonTree(JSONUtils.getObject(configProps, "app")), CBAppConfig.class);

            databaseConfiguration = gson.fromJson(
                gson.toJsonTree(JSONUtils.getObject(serverConfig, "database")), CBDatabaseConfig.class);

            productConfigPath = this.getRelativePath(
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

                    //gsonBuilder.registerTypeAdapter(Object.class, new JSONBestNumberObjectDeserializer());

                    productConfiguration = JSONUtils.parseMap(gson, reader);
                } catch (Exception e) {
                    log.error("Error reading product configuration", e);
                }
            }
        }
    }

    private String getRelativePath(String path, String curDir) {
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
}

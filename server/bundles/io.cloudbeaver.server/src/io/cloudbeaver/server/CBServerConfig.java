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

import io.cloudbeaver.auth.CBAuthConstants;
import io.cloudbeaver.model.app.WebServerConfiguration;
import io.cloudbeaver.service.security.db.WebDatabaseConfig;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public class CBServerConfig implements WebServerConfiguration {

    private static final Log log = Log.getLog(CBServerConfig.class);

    protected String serverURL;
    protected int serverPort = CBConstants.DEFAULT_SERVER_PORT;
    private String serverHost = null;
    private String serverName = null;
    private String sslConfigurationPath = null;
    private String contentRoot = CBConstants.DEFAULT_CONTENT_ROOT;
    private String rootURI = CBConstants.DEFAULT_ROOT_URI;
    private String servicesURI = CBConstants.DEFAULT_SERVICES_URI;

    private String workspaceLocation = CBConstants.DEFAULT_WORKSPACE_LOCATION;
    private String driversLocation = CBConstants.DEFAULT_DRIVERS_LOCATION;
    private long maxSessionIdleTime = CBAuthConstants.MAX_SESSION_IDLE_TIME;
    private boolean develMode = false;
    private boolean enableSecurityManager = false;

    private WebDatabaseConfig databaseConfiguration = new WebDatabaseConfig();
    private String staticContent = "";

    public String getServerURL() {
        if (serverURL == null) {
            String hostName = serverHost;
            if (CommonUtils.isEmpty(hostName)) {
                try {
                    hostName = InetAddress.getLocalHost().getHostName();
                } catch (UnknownHostException e) {
                    log.debug("Error resolving localhost address: " + e.getMessage());
                    hostName = CBApplication.HOST_LOCALHOST;
                }
            }
            serverURL = "http://" + hostName + ":" + serverPort;
        }
        return serverURL;
    }

    public int getServerPort() {
        return serverPort;
    }

    public String getServerHost() {
        return serverHost;
    }

    public String getServerName() {
        return serverName;
    }

    public String getSslConfigurationPath() {
        return sslConfigurationPath;
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

    public String getWorkspaceLocation() {
        return workspaceLocation;
    }

    public String getDriversLocation() {
        return driversLocation;
    }

    public WebDatabaseConfig getDatabaseConfiguration() {
        return databaseConfiguration;
    }

    public String getStaticContent() {
        return staticContent;
    }

    protected void parseConfiguration(Map<String, Object> serverConfig) {
        serverPort = JSONUtils.getInteger(serverConfig, CBConstants.PARAM_SERVER_PORT, serverPort);
        serverHost = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_HOST, serverHost);
        if (serverConfig.containsKey(CBConstants.PARAM_SERVER_URL)) {
            serverURL = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_URL, serverURL);
        } else if (serverURL == null) {
            String hostName = serverHost;
            if (CommonUtils.isEmpty(hostName)) {
                try {
                    hostName = InetAddress.getLocalHost().getHostName();
                } catch (UnknownHostException e) {
                    log.debug("Error resolving localhost address: " + e.getMessage());
                    hostName = CBApplication.HOST_LOCALHOST;
                }
            }
            serverURL = "http://" + hostName + ":" + serverPort;
        }

        serverName = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVER_NAME, serverName);
        sslConfigurationPath = JSONUtils.getString(serverConfig, CBConstants.PARAM_SSL_CONFIGURATION_PATH, sslConfigurationPath);
        var homeDirectory = CBApplication.getInstance().getHomeDirectory().toString();
        contentRoot = WebAppUtils.getRelativePath(
            JSONUtils.getString(serverConfig, CBConstants.PARAM_CONTENT_ROOT, contentRoot), homeDirectory);
        rootURI = readRootUri(serverConfig);
        servicesURI = JSONUtils.getString(serverConfig, CBConstants.PARAM_SERVICES_URI, servicesURI);
        driversLocation = WebAppUtils.getRelativePath(
            JSONUtils.getString(serverConfig, CBConstants.PARAM_DRIVERS_LOCATION, driversLocation), homeDirectory);
        workspaceLocation = WebAppUtils.getRelativePath(
            JSONUtils.getString(serverConfig, CBConstants.PARAM_WORKSPACE_LOCATION, workspaceLocation), homeDirectory);

        maxSessionIdleTime = JSONUtils.getLong(serverConfig,
            CBConstants.PARAM_SESSION_EXPIRE_PERIOD,
            maxSessionIdleTime);

        develMode = JSONUtils.getBoolean(serverConfig, CBConstants.PARAM_DEVEL_MODE, develMode);
        enableSecurityManager = JSONUtils.getBoolean(serverConfig,
            CBConstants.PARAM_SECURITY_MANAGER,
            enableSecurityManager);

        String staticContentsFile = JSONUtils.getString(serverConfig, CBConstants.PARAM_STATIC_CONTENT);
        if (!CommonUtils.isEmpty(staticContentsFile)) {
            try {
                staticContent = Files.readString(Path.of(staticContentsFile));
            } catch (IOException e) {
                log.error("Error reading static contents from " + staticContentsFile, e);
            }
        }
    }

    private String readRootUri(Map<String, Object> serverConfig) {
        String uri = JSONUtils.getString(serverConfig, CBConstants.PARAM_ROOT_URI, rootURI);
        //slashes are needed to correctly display static resources on ui
        if (!uri.endsWith("/")) {
            uri = uri + '/';
        }
        if (!uri.startsWith("/")) {
            uri = '/' + uri;
        }
        return uri;
    }

    @Override
    public boolean isDevelMode() {
        return develMode;
    }

    public long getMaxSessionIdleTime() {
        return maxSessionIdleTime;
    }

    public boolean isEnableSecurityManager() {
        return enableSecurityManager;
    }

}

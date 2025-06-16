/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.model.config;

import com.google.gson.annotations.SerializedName;
import io.cloudbeaver.auth.CBAuthConstants;
import io.cloudbeaver.model.app.WebServerConfiguration;
import io.cloudbeaver.server.CBConstants;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;

import java.util.HashMap;
import java.util.Map;

public class CBServerConfig implements WebServerConfiguration {

    private static final Log log = Log.getLog(CBServerConfig.class);

    protected String serverURL;
    protected boolean secureCookies;
    protected int serverPort = CBConstants.DEFAULT_SERVER_PORT;
    private String serverHost = null;
    private String serverName = null;
    private String sslConfigurationPath = null;
    private String contentRoot = CBConstants.DEFAULT_CONTENT_ROOT;
    private String rootURI = CBConstants.DEFAULT_ROOT_URI;
    private String serviceURI = CBConstants.DEFAULT_SERVICES_URI;

    private String driversLocation = CBConstants.DEFAULT_DRIVERS_LOCATION;
    @SerializedName("expireSessionAfterPeriod")
    private long maxSessionIdleTime = CBAuthConstants.MAX_SESSION_IDLE_TIME;
    private boolean develMode = false;
    private boolean enableSecurityManager = false;
    private final Map<String, Object> productSettings = new HashMap<>();

    @SerializedName("sm")
    protected SMControllerConfiguration securityManagerConfiguration;
    @SerializedName("database")
    private WebDatabaseConfig databaseConfiguration = new WebDatabaseConfig();
    private String staticContent = "";

    public CBServerConfig() {
        this.securityManagerConfiguration = createSecurityManagerConfiguration();
    }

    public String getServerURL() {
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
        return serviceURI;
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

    public void setServerURL(String serverURL) {
        this.serverURL = serverURL;
    }

    public void setServerPort(int serverPort) {
        this.serverPort = serverPort;
    }

    public void setServerHost(String serverHost) {
        this.serverHost = serverHost;
    }

    public void setServerName(String serverName) {
        this.serverName = serverName;
    }

    public void setSslConfigurationPath(String sslConfigurationPath) {
        this.sslConfigurationPath = sslConfigurationPath;
    }

    public void setContentRoot(String contentRoot) {
        this.contentRoot = contentRoot;
    }

    public void setRootURI(String rootURI) {
        this.rootURI = rootURI;
    }

    public void setServicesURI(String servicesURI) {
        this.serviceURI = servicesURI;
    }

    public void setDriversLocation(String driversLocation) {
        this.driversLocation = driversLocation;
    }

    public void setMaxSessionIdleTime(long maxSessionIdleTime) {
        this.maxSessionIdleTime = maxSessionIdleTime;
    }

    public void setDevelMode(boolean develMode) {
        this.develMode = develMode;
    }

    public void setEnableSecurityManager(boolean enableSecurityManager) {
        this.enableSecurityManager = enableSecurityManager;
    }

    public void setDatabaseConfiguration(WebDatabaseConfig databaseConfiguration) {
        this.databaseConfiguration = databaseConfiguration;
    }

    public void setStaticContent(String staticContent) {
        this.staticContent = staticContent;
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

    @NotNull
    public Map<String, Object> getProductSettings() {
        return productSettings;
    }

    public <T extends SMControllerConfiguration> T getSecurityManagerConfiguration() {
        return (T) securityManagerConfiguration;
    }

    protected SMControllerConfiguration createSecurityManagerConfiguration() {
        return new SMControllerConfiguration();
    }

    public boolean isSecureCookies() {
        return secureCookies;
    }
}

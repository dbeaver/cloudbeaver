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
package io.cloudbeaver.model;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.app.BaseWebAppConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.service.sql.WebDataFormat;
import io.cloudbeaver.utils.CBModelConstants;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebCommonUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.admin.sessions.DBAServerSessionManager;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPAuthModelDescriptor;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriverConfigurationType;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.preferences.DBPPropertySource;
import org.jkiss.dbeaver.model.rm.RMConstants;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.runtime.DBRRunnableParametrized;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Web connection info
 */
public class WebConnectionInfo {

    private static final Log log = Log.getLog(WebConnectionInfo.class);
    public static final String SECURED_VALUE = "********";

    private static final String FEATURE_HAS_TOOLS = "hasTools";
    private static final String FEATURE_CONNECTED = "connected";
    private static final String FEATURE_VIRTUAL = "virtual";
    private static final String FEATURE_TEMPORARY = "temporary";
    private static final String FEATURE_READ_ONLY = "readOnly";
    private static final String FEATURE_PROVIDED = "provided";
    private static final String FEATURE_MANAGEABLE = "manageable";

    private static final String TOOL_SESSION_MANAGER = "sessionManager";
    
    private final WebSession session;
    private final DBPDataSourceContainer dataSourceContainer;
    private WebServerError connectError;

    private String connectTime;
    private String serverVersion;
    private String clientVersion;
    @Nullable
    private Boolean credentialsSavedInSession;

    private transient Map<String, Object> savedAuthProperties;
    private transient List<WebNetworkHandlerConfigInput> savedNetworkCredentials;
    private transient List<DBRRunnableParametrized<WebConnectionInfo>> closeListeners = null;

    public WebConnectionInfo(WebSession session, DBPDataSourceContainer ds) {
        this.session = session;
        this.dataSourceContainer = ds;
    }

    public WebSession getSession() {
        return session;
    }

    public DBPDataSourceContainer getDataSourceContainer() {
        return dataSourceContainer;
    }

    public DBPDataSource getDataSource() {
        return dataSourceContainer.getDataSource();
    }

    @Property
    public String getId() {
        return dataSourceContainer.getId();
    }

    @Property
    public String getDriverId() {
        return dataSourceContainer.getDriver().getFullId();
    }

    @Property
    public String getName() {
        return dataSourceContainer.getName();
    }

    @Property
    public String getDescription() {
        return dataSourceContainer.getDescription();
    }

    @Property
    public String getHost() {
        if (canViewReadOnlyConnections()) {
            return dataSourceContainer.getConnectionConfiguration().getHostName();
        }
        return SECURED_VALUE;
    }

    @Property
    public String getPort() {
        if (canViewReadOnlyConnections()) {
            return dataSourceContainer.getConnectionConfiguration().getHostPort();
        }
        return SECURED_VALUE;
    }

    @Property
    public String getServerName() {
        return dataSourceContainer.getConnectionConfiguration().getServerName();
    }

    @Property
    public String getDatabaseName() {
        if (canViewReadOnlyConnections()) {
            return dataSourceContainer.getConnectionConfiguration().getDatabaseName();
        }
        return SECURED_VALUE;
    }

    @Property
    public String getUrl() {
        if (canViewReadOnlyConnections()) {
            return dataSourceContainer.getConnectionConfiguration().getUrl();
        }
        return SECURED_VALUE;
    }

    @Property
    public Map<String, String> getProperties() {
        if (canViewReadOnlyConnections()) {
            return dataSourceContainer.getConnectionConfiguration().getProperties();
        }
        return Collections.emptyMap();
    }

    @Property
    public boolean isConnected() {
        return dataSourceContainer.isConnected();
    }

    @Property
    public boolean isProvided() {
        return dataSourceContainer.isProvided();
    }

    @Property
    public boolean isReadOnly() {
        return dataSourceContainer.isConnectionReadOnly();
    }

    @Property
    public boolean isUseUrl() {
        return CommonUtils.isEmpty(dataSourceContainer.getDriver().getSampleURL());
    }

    @Property
    public boolean isSaveCredentials() {
        return dataSourceContainer.isSavePassword();
    }

    @Property
    public boolean isCredentialsSaved() throws DBException {
        // isCredentialsSaved can be true if credentials were saved during connection init for global project
        return dataSourceContainer.isCredentialsSaved() && !(credentialsSavedInSession != null && credentialsSavedInSession);
    }

    @Property
    public boolean isSharedCredentials() {
        return dataSourceContainer.isSharedCredentials();
    }

    @Property
    public String getFolder() {
        DBPDataSourceFolder folder = dataSourceContainer.getFolder();
        return folder == null ? null : folder.getFolderPath();
    }

    @Property
    public String getNodePath() {
        return DBNDataSource.makeDataSourceItemPath(dataSourceContainer);
    }

    @Property
    public String getConnectTime() {
        return dataSourceContainer.getConnectTime() == null ? null :
            CBModelConstants.ISO_DATE_FORMAT.format(dataSourceContainer.getConnectTime().toInstant());
    }

    @Property
    public WebServerError getConnectError() {
        return connectError;
    }

    public void setConnectError(Throwable connectError) {
        this.connectError = connectError == null ? null : new WebServerError(connectError);
    }

    public void setConnectTime(String connectTime) {
        this.connectTime = connectTime;
    }

    @Property
    public String getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(String serverVersion) {
        this.serverVersion = serverVersion;
    }

    @Property
    public String getClientVersion() {
        return clientVersion;
    }

    public void setClientVersion(String clientVersion) {
        this.clientVersion = clientVersion;
    }

    @Property
    public String[] getFeatures() {
        List<String> features = new ArrayList<>();

        if (dataSourceContainer.isConnected()) {
            features.add(FEATURE_CONNECTED);
            if (!getTools().isEmpty()) {
                features.add(FEATURE_HAS_TOOLS);
            }
        }
        if (dataSourceContainer.isHidden()) {
            features.add(FEATURE_VIRTUAL);
        }
        if (dataSourceContainer.isTemporary()) {
            features.add(FEATURE_TEMPORARY);
        }
        if (dataSourceContainer.isConnectionReadOnly()) {
            features.add(FEATURE_READ_ONLY);
        }
        if (dataSourceContainer.isProvided()) {
            features.add(FEATURE_PROVIDED);
        }
        if (dataSourceContainer.isManageable()) {
            features.add(FEATURE_MANAGEABLE);
        }

        return features.toArray(new String[0]);
    }

    @Property
    public DBNBrowseSettings getNavigatorSettings() {
        return dataSourceContainer.getNavigatorSettings();
    }

    @Property
    public List<WebDataFormat> getSupportedDataFormats() {
        List<WebDataFormat> formats = new ArrayList<>();
        formats.add(WebDataFormat.resultset);
        DBPDataSource dataSource = dataSourceContainer.getDataSource();
        if (dataSource == null) {
            return formats;
        }
        if (Boolean.TRUE.equals(dataSource.getDataSourceFeature(DBPDataSource.FEATURE_DOCUMENT_DATA_SOURCE))) {
            formats.add(WebDataFormat.document);
        }
        return formats;
    }

    @Property
    public WebConnectionOriginInfo getOrigin() {
        return new WebConnectionOriginInfo(session, dataSourceContainer, dataSourceContainer.getOrigin());
    }

    @Property
    public DBPDriverConfigurationType getConfigurationType() {
        DBPDriverConfigurationType configurationType = dataSourceContainer.getConnectionConfiguration().getConfigurationType();
        if (configurationType == null) {
            configurationType = DBPDriverConfigurationType.MANUAL;
        }
        return configurationType;
    }

    @Property
    public boolean isAuthNeeded() throws DBException {
        return !dataSourceContainer.isConnected() &&
            !(dataSourceContainer.isCredentialsSaved() || isAuthPropertiesEmpty()) &&
            !dataSourceContainer.getDriver().isAnonymousAccess();
    }

    // we don't show non-secured properties in FE when connecting to DB without saved credentials
    private boolean isAuthPropertiesEmpty() {
        return Arrays.stream(getAuthProperties()).allMatch(f -> f.hasFeature(DBConstants.PROP_FEATURE_NON_SECURED));
    }

    @Property
    public String getAuthModel() {
        String authModelId = dataSourceContainer.getConnectionConfiguration().getAuthModelId();
        if (CommonUtils.isEmpty(authModelId)) {
            authModelId = AuthModelDatabaseNative.ID;
        }
        return authModelId;
    }

    @Property
    public WebPropertyInfo[] getAuthProperties() {
        String authModelId = getAuthModel();
        DBPAuthModelDescriptor authModel = DBWorkbench.getPlatform().getDataSourceProviderRegistry().getAuthModel(authModelId);
        if (authModel == null) {
            return new WebPropertyInfo[0];
        }

        // Fill user provided credentials
        DBPConnectionConfiguration configWithAuth = new DBPConnectionConfiguration(dataSourceContainer.getConnectionConfiguration());

        // show all properties if it is a manual connection
        Predicate<DBPPropertyDescriptor> predicate = CommonUtils.isEmpty(getRequiredAuth())
            ? p -> true
            : p -> WebCommonUtils.isAuthPropertyApplicable(p, session.getContextCredentialsProviders());

        DBPPropertySource credentialsSource = authModel.createCredentialsSource(dataSourceContainer, configWithAuth);
        return Arrays.stream(credentialsSource.getProperties())
            .filter(predicate)
            .map(p -> new WebPropertyInfo(session, p, credentialsSource)).toArray(WebPropertyInfo[]::new);
    }

    @Property
    public List<WebNetworkHandlerConfig> getNetworkHandlersConfig() {
        var registry = NetworkHandlerRegistry.getInstance();
        return dataSourceContainer.getConnectionConfiguration()
            .getHandlers()
            .stream()
            .filter(handlerConf -> {
                NetworkHandlerDescriptor descriptor = registry.getDescriptor(handlerConf.getId());
                return descriptor != null && !descriptor.isDesktopHandler();
            })
            .map(WebNetworkHandlerConfig::new)
            .collect(Collectors.toList());
    }

    @Property
    public Map<String, Object> getCredentials() {
        //dataSourceContainer.getConnectionConfiguration().getCredentialsProvider().getCredentials();
        return null;
    }

    public Map<String, Object> getSavedAuthProperties() {
        return savedAuthProperties;
    }

    public List<WebNetworkHandlerConfigInput> getSavedNetworkCredentials() {
        return savedNetworkCredentials;
    }

    public void setSavedCredentials(Map<String, Object> authProperties, List<WebNetworkHandlerConfigInput> networkCredentials) {
        this.savedAuthProperties = authProperties;
        this.savedNetworkCredentials = networkCredentials;
    }

    public void clearCache() {
        this.savedAuthProperties = null;
        this.savedNetworkCredentials = null;
        this.fireCloseListeners();
    }

    public void fireCloseListeners() {
        if (closeListeners != null) {
            for (DBRRunnableParametrized<WebConnectionInfo> listener : closeListeners) {
                try {
                    listener.run(this);
                } catch (Exception e) {
                    log.debug(e);
                }
            }
            closeListeners = null;
        }
    }

    @Property
    public Map<String, String> getMainPropertyValues() {
        Map<String, String> mainProperties = new LinkedHashMap<>();
        mainProperties.put(DBConstants.PROP_HOST, getHost());
        mainProperties.put(DBConstants.PROP_PORT, getPort());
        mainProperties.put(DBConstants.PROP_DATABASE, getDatabaseName());
        mainProperties.put(DBConstants.PROP_SERVER, getServerName());
        return mainProperties;
    }

    @Property
    public Map<String, String> getProviderProperties() {
        return dataSourceContainer.getConnectionConfiguration().getProviderProperties();
    }

    @Override
    public String toString() {
        return "WebConnection:" + dataSourceContainer.toString();
    }

    @Property
    public boolean isCanViewSettings() {
        return canViewReadOnlyConnections();
    }

    @Property
    public boolean isCanEdit() {
        return hasProjectPermission(RMProjectPermission.DATA_SOURCES_EDIT);
    }

    @Property
    public boolean isCanDelete() {
        return isCanEdit();
    }

    @Property
    public String getProjectId() {
        return dataSourceContainer.getProject().getId();
    }

    @Property
    public String getRequiredAuth() {
        return dataSourceContainer.getRequiredExternalAuth();
    }

    private boolean hasProjectPermission(RMProjectPermission projectPermission) {
        DBPProject project = dataSourceContainer.getProject();
        if (!(project instanceof WebProjectImpl webProject)) {
            return false;
        }
        return SMUtils.hasProjectPermission(session, webProject.getRMProject(), projectPermission);
    }

    private boolean canViewReadOnlyConnections() {
        if (isCanEdit()) {
            return true;
        }
        BaseWebAppConfiguration appConfig = (BaseWebAppConfiguration) ServletAppUtils.getServletApplication()
            .getAppConfiguration();
        return appConfig.isShowReadOnlyConnectionInfo();

    }

    public void addCloseListener(DBRRunnableParametrized<WebConnectionInfo> listener) {
        if (closeListeners == null) {
            closeListeners = new ArrayList<>();
        }
        closeListeners.add(listener);
    }

    @Property
    public int getKeepAliveInterval() {
        return dataSourceContainer.getConnectionConfiguration().getKeepAliveInterval();
    }

    @Property
    public boolean isAutocommit() {
        Boolean isAutoCommit = dataSourceContainer.getConnectionConfiguration().getBootstrap().getDefaultAutoCommit();
        if (isAutoCommit == null) {
            return true;
        }
        return isAutoCommit;
    }

    @Property
    public List<WebSecretInfo> getSharedSecrets() throws DBException {
        return dataSourceContainer.listSharedCredentials()
            .stream()
            .map(WebSecretInfo::new)
            .collect(Collectors.toList());
    }

    @NotNull
    @Property
    public List<String> getTools() {
        if (!session.hasPermission(RMConstants.PERMISSION_DATABASE_DEVELOPER)) {
            return List.of();
        }
        List<String> tools = new ArrayList<>();
        // checks inside that datasource is not null in container, and it is adaptable to session manager class
        if (DBUtils.getAdapter(DBAServerSessionManager.class, dataSourceContainer) != null) {
            tools.add(TOOL_SESSION_MANAGER);
        }
        return tools;
    }

    /**
     * Updates param that checks whether credentials were saved only in session.
     */
    public void setCredentialsSavedInSession(@Nullable Boolean credentialsSavedInSession) {
        this.credentialsSavedInSession = credentialsSavedInSession;
    }
}

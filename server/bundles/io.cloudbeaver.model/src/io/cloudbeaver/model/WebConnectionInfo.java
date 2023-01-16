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
package io.cloudbeaver.model;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.app.BaseWebAppConfiguration;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.service.sql.WebDataFormat;
import io.cloudbeaver.utils.CBModelConstants;
import io.cloudbeaver.utils.WebAppUtils;
import io.cloudbeaver.utils.WebCommonUtils;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPAuthModelDescriptor;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPDriverConfigurationType;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.preferences.DBPPropertySource;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Web connection info
 */
public class WebConnectionInfo {

    private static final String SECURED_VALUE = "********";
    private final WebSession session;
    private final DBPDataSourceContainer dataSourceContainer;
    private WebServerError connectError;

    private String connectTime;
    private String serverVersion;
    private String clientVersion;

    private transient Map<String, Object> savedAuthProperties;
    private transient List<WebNetworkHandlerConfigInput> savedNetworkCredentials;

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
    public boolean isTemplate() {
        return dataSourceContainer.isTemplate();
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
        return dataSourceContainer.isCredentialsSaved();
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
            CBModelConstants.ISO_DATE_FORMAT.format(dataSourceContainer.getConnectTime());
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
            features.add("connected");
        }
        if (dataSourceContainer.isHidden()) {
            features.add("virtual");
        }
        if (dataSourceContainer.isTemporary()) {
            features.add("temporary");
        }
        if (dataSourceContainer.isConnectionReadOnly()) {
            features.add("readOnly");
        }
        if (dataSourceContainer.isProvided()) {
            features.add("provided");
        }
        if (dataSourceContainer.isManageable()) {
            features.add("manageable");
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
            !dataSourceContainer.isCredentialsSaved() &&
            !dataSourceContainer.getDriver().isAnonymousAccess();
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

        // Fill session and user provided credentials
        DBPConnectionConfiguration configWithAuth = new DBPConnectionConfiguration(dataSourceContainer.getConnectionConfiguration());
        session.provideAuthParameters(session.getProgressMonitor(), dataSourceContainer, configWithAuth);


        DBPPropertySource credentialsSource = authModel.createCredentialsSource(dataSourceContainer, configWithAuth);
        return Arrays.stream(credentialsSource.getProperties())
            .filter(p -> WebCommonUtils.isAuthPropertyApplicable(p, session.getContextCredentialsProviders()))
            .map(p -> new WebPropertyInfo(session, p, credentialsSource)).toArray(WebPropertyInfo[]::new);
    }

    @Property
    public List<WebNetworkHandlerConfig> getNetworkHandlersConfig() {
        return dataSourceContainer.getConnectionConfiguration().getHandlers().stream()
            .map(WebNetworkHandlerConfig::new).collect(Collectors.toList());
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

    public void clearSavedCredentials() {
        this.savedAuthProperties = null;
        this.savedNetworkCredentials = null;
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
        if (!(project instanceof WebProjectImpl)) {
            return false;
        }
        return SMUtils.hasProjectPermission(session, ((WebProjectImpl) project).getRmProject(), projectPermission);
    }

    private boolean canViewReadOnlyConnections() {
        if (isCanEdit()) {
            return true;
        }
        BaseWebAppConfiguration appConfig = (BaseWebAppConfiguration) WebAppUtils.getWebApplication().getAppConfiguration();
        return appConfig.isShowReadOnlyConnectionInfo();

    }
}

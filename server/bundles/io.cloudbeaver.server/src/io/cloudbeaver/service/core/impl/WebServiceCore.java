/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.core.impl;


import io.cloudbeaver.*;
import io.cloudbeaver.model.*;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletSystemInformationCollector;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.WebApplication;
import io.cloudbeaver.service.core.DBWServiceCore;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebCommonUtils;
import io.cloudbeaver.utils.WebConnectionFolderUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.jobs.Job;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistryCache;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMObjectType;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.connection.DBPConnectionType;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.exec.DBCConnectException;
import org.jkiss.dbeaver.model.meta.ForTest;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.net.DBWHandlerConfiguration;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.dbeaver.model.net.DBWNetworkHandler;
import org.jkiss.dbeaver.model.net.DBWTunnel;
import org.jkiss.dbeaver.model.net.ssh.SSHSession;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettingsUtils;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;
import org.jkiss.dbeaver.registry.network.NetworkHandlerRegistry;
import org.jkiss.dbeaver.registry.project.BaseProjectSettings;
import org.jkiss.dbeaver.registry.settings.ProductSettingDescriptor;
import org.jkiss.dbeaver.registry.settings.ProductSettingsRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.jobs.ConnectionTestJob;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.concurrent.CancellationException;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceCore implements DBWServiceCore {

    private static final Log log = Log.getLog(WebServiceCore.class);

    @Override
    public WebServerConfig getServerConfig(@Nullable WebSession webSession) {
        WebServerConfig webServerConfig = WebAppUtils.getWebApplication().getWebServerConfig();
        webServerConfig.setProvideSensitiveInformation(webServerConfig.isConfigurationMode() ||
            (webSession != null && webSession.getUser() != null));
        return webServerConfig;
    }

    @Override
    public WebPropertyInfo[] getSystemInformationProperties(@NotNull WebSession webSession) {
        ServletSystemInformationCollector<?> collector = WebAppUtils.getWebApplication().getSystemInformationCollector();
        try {
            collector.collectInternalDatabaseUseInformation();
        } catch (DBException e) {
            log.error("Error collecting system information", e);
        }
        return WebCommonUtils.getObjectProperties(webSession, collector);
    }

    @Override
    public List<WebDatabaseDriverInfo> getDriverList(@NotNull WebSession webSession, String driverId) {
        List<WebDatabaseDriverInfo> result = new ArrayList<>();
        for (DBPDriver driver : WebAppUtils.getWebApplication().getDriverRegistry().getApplicableDrivers()) {
            if (driverId == null || driverId.equals(driver.getFullId())) {
                result.add(new WebDatabaseDriverInfo(webSession, driver));
            }
        }
        return result;
    }

    @Override
    public List<WebDatabaseAuthModel> getAuthModels(@NotNull WebSession webSession) {
        return DataSourceProviderRegistry.getInstance().getAllAuthModels().stream()
            .map(am -> new WebDatabaseAuthModel(webSession, am)).collect(Collectors.toList());
    }

    @Override
    public List<WebNetworkHandlerDescriptor> getNetworkHandlers(@NotNull WebSession webSession) {
        return NetworkHandlerRegistry.getInstance().getDescriptors().stream()
            .filter(d -> !d.isDesktopHandler())
            .map(d -> new WebNetworkHandlerDescriptor(webSession, d)).collect(Collectors.toList());
    }

    @Override
    public List<WebConnectionInfo> getUserConnections(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @Nullable String id,
        @Nullable List<String> projectIds
    ) throws DBWebException {
        if (id != null) {
            WebConnectionInfo connectionInfo = getConnectionState(webSession, projectId, id);
            if (connectionInfo != null) {
                return Collections.singletonList(connectionInfo);
            }
        }
        var stream = webSession.getAccessibleProjects().stream();
        if (projectId != null) {
            stream = stream.filter(c -> c.getId().equals(projectId));
        }
        if (projectIds != null) {
            stream = stream.filter(c -> projectIds.contains(c.getId()));
        }
        Set<String> applicableDrivers = WebServiceUtils.getApplicableDriversIds();
        return stream
            .flatMap(p -> p.getConnections().stream())
            .filter(c -> applicableDrivers.contains(c.getDataSourceContainer().getDriver().getId()))
            .toList();
    }

    @Override
    public List<WebConnectionFolderInfo> getConnectionFolders(
        @NotNull WebSession webSession, @Nullable String projectId, @Nullable String id
    ) throws DBWebException {
        if (projectId == null) {
            return webSession.getAccessibleProjects().stream()
                .flatMap(pr -> getConnectionFoldersFromProject(webSession, pr).stream())
                .collect(Collectors.toList());
        }
        if (id != null) {
            WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(webSession, projectId, id);
            return Collections.singletonList(folderInfo);
        }
        DBPProject project = getProjectById(webSession, projectId);
        return getConnectionFoldersFromProject(webSession, project);
    }

    private List<WebConnectionFolderInfo> getConnectionFoldersFromProject(
        @NotNull WebSession webSession,
        @NotNull DBPProject project
    ) {
        return project.getDataSourceRegistry().getAllFolders().stream()
            .map(f -> new WebConnectionFolderInfo(webSession, f)).collect(Collectors.toList());
    }

    @Override
    public String[] getSessionPermissions(@NotNull WebSession webSession) throws DBWebException {
        if (ServletAppUtils.getServletApplication().isConfigurationMode()) {
            return new String[]{
                DBWConstants.PERMISSION_ADMIN
            };
        }
        return webSession.getSessionPermissions().toArray(new String[0]);
    }

    @Override
    public WebSession openSession(
        @NotNull WebSession webSession,
        @Nullable String defaultLocale,
        @NotNull HttpServletRequest servletRequest,
        @NotNull HttpServletResponse servletResponse
    ) throws DBWebException {
        for (WebSessionHandlerDescriptor hd : WebHandlerRegistry.getInstance().getSessionHandlers()) {
            try {
                hd.getInstance().handleSessionOpen(webSession, servletRequest, servletResponse);
            } catch (Exception e) {
                log.error("Error calling session handler '" + hd.getId() + "'", e);
                webSession.addSessionError(e);
            }
        }
        webSession.setLocale(defaultLocale);
        return webSession;
    }

    /**
     * Updates the user's permissions
     *
     * @deprecated CB-2773. The actual way to get session state is {@code WSSessionStateEvent} which sends periodically via web socket.
     */
    @Deprecated
    @Override
    public WebSession getSessionState(@NotNull WebSession webSession) throws DBWebException {
        try {
            webSession.getUserContext().refreshPermissions();
        } catch (DBException e) {
            throw new DBWebException("Cannot refresh user permissions", e);
        }
        return webSession;
    }

    @Override
    public List<WebServerMessage> readSessionLog(
        @NotNull WebSession webSession,
        Integer maxEntries,
        Boolean clearEntries
    ) {
        return webSession.readLog(maxEntries, clearEntries);
    }

    @Override
    public boolean closeSession(HttpServletRequest request) throws DBWebException {
        try {
            var baseWebSession = WebAppUtils.getWebApplication().getSessionManager().closeSession(request);
            if (baseWebSession instanceof WebSession webSession) {
                for (WebSessionHandlerDescriptor hd : WebHandlerRegistry.getInstance().getSessionHandlers()) {
                    try {
                        hd.getInstance().handleSessionClose(webSession);
                    } catch (Exception e) {
                        log.error("Error calling session handler '" + hd.getId() + "'", e);
                        baseWebSession.addSessionError(e);
                    }
                }
                return true;
            }
        } catch (Exception e) {
            throw new DBWebException("Error closing session", e);
        }
        return false;
    }

    @Override
    @Deprecated
    public boolean touchSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException {
        return WebAppUtils.getWebApplication().getSessionManager().touchSession(request, response);
    }

    @Override
    @Deprecated
    public WebSession updateSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response)
        throws DBWebException {
        var sessionManager = WebAppUtils.getWebApplication().getSessionManager();
        sessionManager.touchSession(request, response);
        return sessionManager.getWebSession(request, response, true);
    }

    @Override
    public boolean refreshSessionConnections(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response)
        throws DBWebException {
        WebSession session = WebAppUtils.getWebApplication().getSessionManager().getWebSession(request, response);
        if (session == null) {
            return false;
        } else {
            // We do full user refresh because we need to get config from global project
            session.refreshUserData();
            return true;
        }
    }

    @Override
    public boolean changeSessionLanguage(@NotNull WebSession webSession, String locale) {
        webSession.setLocale(locale);
        return true;
    }

    @Override
    public WebConnectionInfo getConnectionState(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        return WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, connectionId);
    }

    @NotNull
    @Override
    public WebPropertyInfo[] getDriverProperties(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        WebConnectionConfig configInput = project.getConnectionConfigInput(connectionConfig);

        configInput.setSaveCredentials(true); // It is used in createConnectionFromConfig

        DataSourceDescriptor dataSource = (DataSourceDescriptor) WebDataSourceUtils.getLocalOrGlobalDataSource(
            webSession, projectId, configInput.getConnectionId());
        try {
            DataSourceDescriptor testDataSource = getDataSourceDescriptor(webSession, dataSource, configInput, project);
            DBPConnectionConfiguration connectionConfiguration
                = new DBPConnectionConfiguration(testDataSource.getConnectionConfiguration());
            return WebServiceUtils.getDriverProperties(
                webSession,
                testDataSource.getDriver(),
                testDataSource,
                connectionConfiguration
            );
        } catch (DBWebException e) {
            log.error("Error getting driver properties", e);
            return new WebPropertyInfo[0];
        }

    }

    @NotNull
    @Override
    public List<DBPConnectionType> getConnectionTypes(@NotNull WebSession webSession, @Nullable String id) {
        return DataSourceProviderRegistry.getInstance().getConnectionTypes().stream()
            .map(ct -> id == null || id.equals(ct.getId()) ? ct : null)
            .filter(Objects::nonNull)
            .toList();
    }


    @Override
    public WebConnectionInfo initConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId,
        @Nullable Map<String, Object> authProperties,
        @Nullable List<WebNetworkHandlerConfigInput> networkCredentials,
        boolean saveCredentials,
        boolean sharedCredentials,
        @Nullable String selectedSecretId
    ) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, connectionId);
        connectionInfo.validateConnection();
        connectionInfo.setSavedCredentials(authProperties, networkCredentials);

        var dataSourceContainer = connectionInfo.getDataSourceContainer();
        if (dataSourceContainer.isConnected()) {
            throw new DBWebException("Datasource '" + dataSourceContainer.getName() + "' is already connected");
        }
        if (dataSourceContainer.isSharedCredentials() && selectedSecretId != null) {
            List<DBSSecretValue> allSecrets;
            try {
                allSecrets = dataSourceContainer.listSharedCredentials();
            } catch (DBException e) {
                throw new DBWebException("Error loading connection secret", e);
            }
            DBSSecretValue selectedSecret =
                allSecrets.stream()
                    .filter(secret -> selectedSecretId.equals(secret.getUniqueId()))
                    .findFirst().orElse(null);
            if (selectedSecret == null) {
                throw new DBWebException("Secret not found:" + selectedSecretId);
            }
            dataSourceContainer.setSelectedSharedCredentials(selectedSecret);
        }

        boolean oldSavePassword = dataSourceContainer.isSavePassword();
        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        validateDriverLibrariesPresence(dataSourceContainer);
        try {
            boolean connect = dataSourceContainer.connect(monitor, true, false);
        } catch (Exception e) {
            if (e instanceof DBCConnectException) {
                Throwable rootCause = CommonUtils.getRootCause(e);
                if (rootCause instanceof ClassNotFoundException) {
                    log.error(e);
                    throwDriverNotFoundException(dataSourceContainer);
                }
            }
            throw new DBWebException("Error connecting to database", e);
        } finally {
            dataSourceContainer.setSavePassword(oldSavePassword);
            connectionInfo.clearCache();
        }
        // Mark all specified network configs as saved
        boolean[] saveConfig = new boolean[1];

        if (networkCredentials != null) {
            networkCredentials.forEach(c -> {
                if (CommonUtils.toBoolean(c.isSavePassword())) {
                    DBWHandlerConfiguration handlerCfg = dataSourceContainer.getConnectionConfiguration()
                        .getHandler(c.getId());
                    if (handlerCfg != null &&
                        // check username param only for ssh config
                        !(CommonUtils.isEmpty(c.getUserName()) && CommonUtils.equalObjects(
                            handlerCfg.getType(),
                            DBWHandlerType.TUNNEL
                        ))
                    ) {
                        WebDataSourceUtils.updateHandlerCredentials(handlerCfg, c);
                        handlerCfg.setSavePassword(true);
                        saveConfig[0] = true;
                    }
                }
            });
        }
        if (saveCredentials) {
            // Save all passed credentials in the datasource container
            WebDataSourceUtils.saveAuthProperties(
                webSession.getProgressMonitor(),
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration(),
                authProperties,
                true,
                sharedCredentials
            );

            var project = dataSourceContainer.getProject();
            if (project.isUseSecretStorage()) {
                try {
                    dataSourceContainer.persistSecrets(
                        DBSSecretController.getProjectSecretController(dataSourceContainer.getProject())
                    );
                } catch (DBException e) {
                    throw new DBWebException("Failed to save credentials", e);
                }
            }

            WebDataSourceUtils.saveCredentialsInDataSource(
                connectionInfo,
                dataSourceContainer,
                dataSourceContainer.getConnectionConfiguration()
            );
            // don't understand why whe need to set this flag here
            // need to discover it, maybe we can avoid it at all
            saveConfig[0] = sharedCredentials;
        }
        if (WebServiceUtils.isGlobalProject(dataSourceContainer.getProject())) {
            // Do not flush config for global project (only admin can do it - CB-2415)
            if (saveCredentials) {
                connectionInfo.setCredentialsSavedInSession(true);
            }
            saveConfig[0] = false;
        }
        if (saveConfig[0]) {
            dataSourceContainer.persistConfiguration();
        }

        return connectionInfo;
    }

    @Override
    public WebConnectionInfo createConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        return getProjectById(webSession, projectId).createConnection(connectionConfig);
    }

    @Override
    public WebConnectionInfo updateConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        return getProjectById(webSession, projectId).updateConnection(connectionConfig);
    }

    @Override
    public boolean deleteConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        return getProjectById(webSession, projectId).deleteConnection(connectionId);

    }

    @Override
    public WebConnectionInfo copyConnectionFromNode(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String nodePath,
        @NotNull Map<String, Object> connectionConfig
    ) throws DBWebException {
        try {
            DBNModel navigatorModel = webSession.getNavigatorModelOrThrow();
            WebSessionProjectImpl project = getProjectById(webSession, projectId);
            DBPDataSourceRegistry dataSourceRegistry = project.getDataSourceRegistry();

            DBNNode srcNode = navigatorModel.getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (srcNode == null) {
                throw new DBException("Node '" + nodePath + "' not found");
            }
            if (!(srcNode instanceof DBNDataSource dbnDataSource)) {
                throw new DBException("Node '" + nodePath + "' is not a datasource node");
            }
            DBPDataSourceContainer dataSourceTemplate = dbnDataSource.getDataSourceContainer();
            if (!dataSourceTemplate.isExternallyProvided()) {
                if (!CommonUtils.equalObjects(dataSourceTemplate.getProject(), project)) {
                    throw new DBException("Copying connection to another project is not allowed");
                }
            }

            DataSourceDescriptor newDataSource = dataSourceRegistry.createDataSource(dataSourceTemplate);

            ServletApplication app = ServletAppUtils.getServletApplication();
            if (app instanceof WebApplication webApplication) {
                newDataSource.setNavigatorSettings(
                    dataSourceTemplate.isExternallyProvided() ?
                        webApplication.getAppConfiguration().getDefaultNavigatorSettings() :
                        dataSourceTemplate.getNavigatorSettings().getOriginalSettings()
                );
            }

            WebConnectionConfig config = project.getConnectionConfigInput(connectionConfig);

            // Copy props from config
            if (!CommonUtils.isEmpty(config.getName())) {
                newDataSource.setName(config.getName());
            }
            if (!CommonUtils.isEmpty(config.getDescription())) {
                newDataSource.setDescription(config.getDescription());
            }

            dataSourceRegistry.addDataSource(newDataSource);

            dataSourceRegistry.checkForErrors();
            return project.addConnection(newDataSource);
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    @NotNull
    public WebConnectionInfo testConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull Map<String, Object> connectionConfig,
        @Nullable List<Map<String, Object>> extensions
    ) throws DBWebException {
        WebSessionProjectImpl project = getConnectionTestProject(webSession, projectId);
        WebConnectionConfig configInput = project.getConnectionConfigInput(connectionConfig);
        configInput.setSaveCredentials(true); // It is used in createConnectionFromConfig

        Map<String, Map<String, Object>> extensionConfigurations = new LinkedHashMap<>();
        if (!CommonUtils.isEmpty(extensions)) {
            for (Map<String, Object> extension : extensions) {
                if (extension == null) {
                    throw new DBWebException("Connection test extension must be an object");
                }
                Object idValue = extension.get("id");
                if (!(idValue instanceof String id) || CommonUtils.isEmpty(id)) {
                    throw new DBWebException("Connection test extension ID must be specified");
                }
                Object configurationValue = extension.get("configuration");
                if (!(configurationValue instanceof Map<?, ?> configuration)) {
                    throw new DBWebException(
                        "Configuration for connection test extension '" + id + "' must be an object"
                    );
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> typedConfiguration = (Map<String, Object>) configuration;
                if (extensionConfigurations.putIfAbsent(id, typedConfiguration) != null) {
                    throw new DBWebException("Duplicate connection test extension '" + id + "'");
                }
            }
        }
        DataSourceDescriptor originalDataSource = (DataSourceDescriptor) WebDataSourceUtils.getLocalOrGlobalDataSource(
            webSession, projectId, configInput.getConnectionId());

        DataSourceDescriptor testDataSource = null;
        Throwable testError = null;
        try {
            testDataSource = createTestDataSourceDescriptor(originalDataSource, configInput, project);
            testDataSource.setTemporary(true);
            configureTestDataSourceDescriptor(webSession, originalDataSource, testDataSource, configInput, project);
            for (Map.Entry<String, Map<String, Object>> extension : extensionConfigurations.entrySet()) {
                testDataSource.setExtension(extension.getKey(), extension.getValue());
            }

            WebConnectionInfo connectionInfo = project.addTemporaryConnection(testDataSource);
            connectionInfo.setSavedCredentials(configInput.getCredentials(), configInput.getNetworkHandlersConfig());
            return runConnectionTest(webSession, testDataSource, connectionInfo);
        } catch (DBWebException e) {
            testError = e;
            throw e;
        } catch (RuntimeException | Error e) {
            testError = e;
            throw e;
        } finally {
            if (testDataSource != null) {
                DBWebException cleanupError = cleanupTemporaryDataSource(project, testDataSource);
                if (cleanupError != null) {
                    if (testError == null) {
                        throw cleanupError;
                    }
                    testError.addSuppressed(cleanupError);
                }
            }
        }
    }

    @NotNull
    private static WebConnectionInfo runConnectionTest(
        @NotNull WebSession webSession,
        @NotNull DataSourceDescriptor testDataSource,
        @NotNull WebConnectionInfo connectionInfo
    ) throws DBWebException {
        try {
            ConnectionTestJob connectionTestJob = new ConnectionTestJob(testDataSource, param -> {
            });
            DBRProgressMonitor monitor = webSession.getProgressMonitor();
            IStatus status = connectionTestJob.run(monitor);
            checkConnectionTestCancellation(monitor, status);
            if (connectionTestJob.getConnectError() != null) {
                if (connectionTestJob.getConnectError() instanceof DBCConnectException error) {
                    Throwable rootCause = CommonUtils.getRootCause(error);
                    if (rootCause instanceof ClassNotFoundException) {
                        log.error(error);
                        throwDriverNotFoundException(testDataSource);
                    }
                }
                throw new DBWebException("Connection failed", connectionTestJob.getConnectError());
            }
            connectionInfo.setConnectError(connectionTestJob.getConnectError());
            connectionInfo.setServerVersion(connectionTestJob.getServerVersion());
            connectionInfo.setClientVersion(connectionTestJob.getClientVersion());
            connectionInfo.setConnectTime(RuntimeUtils.formatExecutionTime(connectionTestJob.getConnectTime()));
            return connectionInfo;
        } catch (DBException e) {
            throw new DBWebException("Error connecting to database", e);
        }
    }

    @NotNull
    private DataSourceDescriptor getDataSourceDescriptor(
        @NotNull WebSession webSession,
        @Nullable DataSourceDescriptor dataSource,
        @NotNull WebConnectionConfig configInput,
        @NotNull WebSessionProjectImpl project
    ) throws DBWebException {
        DataSourceDescriptor testDataSource = createTestDataSourceDescriptor(dataSource, configInput, project);
        configureTestDataSourceDescriptor(webSession, dataSource, testDataSource, configInput, project);
        return testDataSource;
    }

    @NotNull
    private DataSourceDescriptor createTestDataSourceDescriptor(
        @Nullable DataSourceDescriptor dataSource,
        @NotNull WebConnectionConfig configInput,
        @NotNull WebSessionProjectImpl project
    ) throws DBWebException {
        if (dataSource != null) {
            try {
                // Check that creds are saved to trigger secrets resolve
                dataSource.isCredentialsSaved();
            } catch (DBException e) {
                throw new DBWebException("Can't determine whether datasource credentials are saved", e);
            }

            return (DataSourceDescriptor) dataSource.createCopy(dataSource.getRegistry());
        }
        return project.getDataSourceContainerFromInput(configInput);
    }

    private void configureTestDataSourceDescriptor(
        @NotNull WebSession webSession,
        @Nullable DataSourceDescriptor dataSource,
        @NotNull DataSourceDescriptor testDataSource,
        @NotNull WebConnectionConfig configInput,
        @NotNull WebSessionProjectImpl project
    ) throws DBWebException {
        if (dataSource != null) {
            project.updateDataSourceContainerFromInput(configInput, testDataSource);
            if (configInput.getSelectedSecretId() != null) {
                try {
                    dataSource.listSharedCredentials()
                        .stream()
                        .filter(secret -> configInput.getSelectedSecretId().equals(secret.getSubjectId()))
                        .findFirst()
                        .ifPresent(testDataSource::setSelectedSharedCredentials);

                } catch (DBException e) {
                    throw new DBWebException("Failed to load secret value: " + configInput.getSelectedSecretId());
                }
            }
            WebDataSourceUtils.saveAuthProperties(
                webSession.getProgressMonitor(),
                testDataSource,
                testDataSource.getConnectionConfiguration(),
                configInput.getCredentials(),
                true,
                false,
                true
            );
        }
        validateDriverLibrariesPresence(testDataSource);
        webSession.provideAuthParameters(
            webSession.getProgressMonitor(),
            testDataSource,
            testDataSource.getConnectionConfiguration()
        );
        testDataSource.setSavePassword(true); // We need for test to avoid password callback
        testDataSource.setAccessCheckRequired(!webSession.hasPermission(DBWConstants.PERMISSION_ADMIN));
    }

    @ForTest
    public static void checkConnectionTestCancellation(
        @NotNull DBRProgressMonitor monitor,
        @NotNull IStatus status
    ) {
        if (monitor.isCanceled() || status.matches(IStatus.CANCEL)) {
            throw new CancellationException("Connection test was canceled");
        }
    }

    @Nullable
    @ForTest
    public static DBWebException cleanupTemporaryDataSource(
        @NotNull WebSessionProjectImpl project,
        @NotNull DataSourceDescriptor dataSource
    ) {
        boolean interrupted = Thread.interrupted();
        Job[] jobs;
        Throwable lookupFailure = null;
        try {
            jobs = Job.getJobManager().find(dataSource);
        } catch (Throwable e) {
            jobs = new Job[0];
            lookupFailure = e;
        }
        return cleanupTemporaryDataSource(project, dataSource, jobs, lookupFailure, interrupted);
    }

    @Nullable
    @ForTest
    public static DBWebException cleanupTemporaryDataSource(
        @NotNull WebSessionProjectImpl project,
        @NotNull DataSourceDescriptor dataSource,
        @NotNull Job[] jobs
    ) {
        return cleanupTemporaryDataSource(project, dataSource, jobs, null, Thread.interrupted());
    }

    @Nullable
    private static DBWebException cleanupTemporaryDataSource(
        @NotNull WebSessionProjectImpl project,
        @NotNull DataSourceDescriptor dataSource,
        @NotNull Job[] jobs,
        @Nullable Throwable initialFailure,
        boolean interrupted
    ) {
        Throwable cleanupFailure = cancelCleanupJobs(jobs, initialFailure);
        CleanupResult joinResult = joinCleanupJobs(jobs, cleanupFailure);
        cleanupFailure = joinResult.failure();
        boolean shouldRestoreInterrupt = consumeInterrupt(interrupted || joinResult.interrupted());
        cleanupFailure = disconnectTemporaryDataSource(dataSource, cleanupFailure);
        shouldRestoreInterrupt = consumeInterrupt(shouldRestoreInterrupt);
        cleanupFailure = removeTemporaryConnection(project, dataSource, cleanupFailure);
        shouldRestoreInterrupt = consumeInterrupt(shouldRestoreInterrupt);
        cleanupFailure = removeTemporaryDataSource(dataSource, cleanupFailure);
        shouldRestoreInterrupt = consumeInterrupt(shouldRestoreInterrupt);
        if (shouldRestoreInterrupt) {
            Thread.currentThread().interrupt();
        }
        return cleanupFailure == null ? null : new DBWebException(
            "Failed to clean up temporary connection",
            cleanupFailure
        );
    }

    @Nullable
    private static Throwable cancelCleanupJobs(@NotNull Job[] jobs, @Nullable Throwable initialFailure) {
        Throwable cleanupFailure = initialFailure;
        for (Job job : jobs) {
            try {
                if (job.getState() != Job.NONE) {
                    job.cancel();
                }
            } catch (Throwable e) {
                cleanupFailure = appendCleanupFailure(cleanupFailure, e);
            }
        }
        return cleanupFailure;
    }

    @NotNull
    private static CleanupResult joinCleanupJobs(@NotNull Job[] jobs, @Nullable Throwable initialFailure) {
        Throwable cleanupFailure = initialFailure;
        boolean interrupted = false;
        for (Job job : jobs) {
            boolean joined = false;
            while (!joined) {
                try {
                    job.join();
                    joined = true;
                } catch (InterruptedException e) {
                    interrupted = true;
                    Thread.interrupted();
                    cleanupFailure = appendCleanupFailure(cleanupFailure, e);
                } catch (Throwable e) {
                    cleanupFailure = appendCleanupFailure(cleanupFailure, e);
                    joined = true;
                }
            }
        }
        return new CleanupResult(cleanupFailure, interrupted);
    }

    @Nullable
    private static Throwable disconnectTemporaryDataSource(
        @NotNull DataSourceDescriptor dataSource,
        @Nullable Throwable initialFailure
    ) {
        Throwable cleanupFailure = initialFailure;
        try {
            if (!dataSource.disconnect(new VoidProgressMonitor())) {
                throw new DBWebException("Failed to disconnect temporary connection");
            }
        } catch (Throwable e) {
            cleanupFailure = appendCleanupFailure(cleanupFailure, e);
        }
        return cleanupFailure;
    }

    @Nullable
    private static Throwable removeTemporaryConnection(
        @NotNull WebSessionProjectImpl project,
        @NotNull DataSourceDescriptor dataSource,
        @Nullable Throwable initialFailure
    ) {
        Throwable cleanupFailure = initialFailure;
        try {
            WebConnectionInfo cachedConnection = project.findWebConnectionInfo(dataSource.getId());
            if (cachedConnection != null && cachedConnection.getDataSourceContainer() == dataSource) {
                project.removeConnection(dataSource);
            }
            cachedConnection = project.findWebConnectionInfo(dataSource.getId());
            if (cachedConnection != null && cachedConnection.getDataSourceContainer() == dataSource) {
                throw new DBWebException("Failed to remove temporary connection from the web session cache");
            }
        } catch (Throwable e) {
            cleanupFailure = appendCleanupFailure(cleanupFailure, e);
        }
        return cleanupFailure;
    }

    @Nullable
    private static Throwable removeTemporaryDataSource(
        @NotNull DataSourceDescriptor dataSource,
        @Nullable Throwable initialFailure
    ) {
        Throwable cleanupFailure = initialFailure;
        try {
            DBPDataSourceRegistry registry = dataSource.getRegistry();
            if (registry.getDataSource(dataSource.getId()) == dataSource) {
                if (registry instanceof DBPDataSourceRegistryCache registryCache) {
                    registryCache.removeDataSourceFromList(dataSource);
                } else {
                    throw new DBWebException("Project registry does not support temporary connection cleanup");
                }
            } else {
                dataSource.dispose();
            }
            if (registry.getDataSource(dataSource.getId()) == dataSource) {
                throw new DBWebException("Failed to remove temporary connection from the project registry");
            }
        } catch (Throwable e) {
            cleanupFailure = appendCleanupFailure(cleanupFailure, e);
        }
        return cleanupFailure;
    }

    private static boolean consumeInterrupt(boolean interrupted) {
        boolean currentInterrupt = Thread.interrupted();
        return interrupted || currentInterrupt;
    }

    @NotNull
    private static Throwable appendCleanupFailure(@Nullable Throwable current, @NotNull Throwable next) {
        if (current == null) {
            return next;
        }
        if (!Objects.equals(current, next)) {
            current.addSuppressed(next);
        }
        return current;
    }

    private record CleanupResult(@Nullable Throwable failure, boolean interrupted) {
    }

    @Override
    public WebNetworkEndpointInfo testNetworkHandler(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @Nullable String connectionId,
        @NotNull WebNetworkHandlerConfigInput nhConfig
    ) throws DBWebException {
        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        monitor.beginTask("Instantiate SSH tunnel", 2);

        NetworkHandlerDescriptor handlerDescriptor = NetworkHandlerRegistry.getInstance()
            .getDescriptor(nhConfig.getId());
        if (handlerDescriptor == null) {
            throw new DBWebException("Network handler '" + nhConfig.getId() + "' not found");
        }
        try {
            DBWNetworkHandler handler = handlerDescriptor.createHandler(DBWNetworkHandler.class);
            if (handler instanceof DBWTunnel tunnel) {
                DBPConnectionConfiguration connectionConfig = new DBPConnectionConfiguration();
                connectionConfig.setHostName(DBConstants.HOST_LOCALHOST);
                connectionConfig.setHostPort(CommonUtils.toString(nhConfig.getProperties()
                    .get(DBWHandlerConfiguration.PROP_PORT)));
                try {
                    monitor.subTask("Initialize tunnel");

                    DBWHandlerConfiguration currentConnectionHandlerConfig =
                        getCurrentConnectionHandlerConfig(webSession, projectId, connectionId, nhConfig.getId());

                    DBWHandlerConfiguration configuration = currentConnectionHandlerConfig == null
                        ? new DBWHandlerConfiguration(handlerDescriptor, null)
                        : new DBWHandlerConfiguration(currentConnectionHandlerConfig);

                    WebDataSourceUtils.updateHandlerConfig(configuration, nhConfig);
                    configuration.setSavePassword(true);
                    configuration.setEnabled(true);
                    tunnel.initializeHandler(monitor, configuration, connectionConfig);
                    monitor.worked(1);
                    // Get info
                    if (tunnel.getImplementation() instanceof SSHSession session) {
                        return new WebNetworkEndpointInfo(
                            "Connected",
                            session.getClientVersion(),
                            session.getServerVersion());
                    } else {
                        return new WebNetworkEndpointInfo("Connected");
                    }
                } finally {
                    monitor.subTask("Close tunnel");
                    tunnel.closeTunnel(monitor);
                    monitor.worked(1);
                }
            } else {
                return new WebNetworkEndpointInfo(nhConfig.getId() + " is not a tunnel");
            }
        } catch (Exception e) {
            throw new DBWebException("Error testing network handler endpoint", e);
        } finally {
            // Close it
            monitor.done();
        }
    }

    @Nullable
    private DBWHandlerConfiguration getCurrentConnectionHandlerConfig(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @Nullable String connectionId,
        @NotNull String handlerConfigId
    ) throws DBWebException {
        if (projectId == null || connectionId == null) {
            return null;
        }
        WebSessionProjectImpl sessionProject = webSession.getAccessibleProjectById(projectId);
        WebConnectionInfo connectionInfo = sessionProject.getWebConnectionInfo(connectionId);
        DBPConnectionConfiguration connectionConfiguration = connectionInfo.getDataSourceContainer().getConnectionConfiguration();
        return connectionConfiguration.getHandler(handlerConfigId);
    }

    @Override
    public WebConnectionInfo closeConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId
    ) throws DBWebException {
        WebSessionProjectImpl project = getProjectById(webSession, projectId);
        WebConnectionInfo connectionInfo = project.getWebConnectionInfo(connectionId);

        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        WebDataSourceUtils.disconnectDataSource(webSession, dataSourceContainer, true);
        return connectionInfo;
    }

    // Projects
    @Override
    public List<WebProjectInfo> getProjects(@NotNull WebSession session) {
        var customConnectionsEnabled =
            ServletAppUtils.getServletApplication().getAppConfiguration().isSupportsCustomConnections()
                || SMUtils.isRMAdmin(session);
        return session.getAccessibleProjects().stream()
            .filter(pr -> customConnectionsEnabled || !RMProjectType.USER.equals(pr.getRMProject().getType()))
            .map(pr -> new WebProjectInfo(session, pr, customConnectionsEnabled))
            .collect(Collectors.toList());
    }

    // Folders
    @Override
    public WebConnectionFolderInfo createConnectionFolder(
        @NotNull WebSession session,
        @Nullable String projectId,
        @Nullable String parentPath,
        @NotNull String folderName
    ) throws DBWebException {
        WebConnectionFolderUtils.validateConnectionFolder(folderName);
        session.addInfoMessage("Create new folder");
        WebConnectionFolderInfo parentFolder = null;
        try {
            if (parentPath != null) {
                parentFolder = WebConnectionFolderUtils.getFolderInfo(session, projectId, parentPath);
            }
            WebProjectImpl project = getProjectById(session, projectId);
            DBPDataSourceRegistry registry = project.getDataSourceRegistry();
            DBPDataSourceFolder newFolder = registry.addFolder(
                parentFolder == null ? null : parentFolder.getDataSourceFolder(), folderName
            );
            WebServiceUtils.refreshDatabases(session, projectId);
            return new WebConnectionFolderInfo(session, newFolder);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public WebConnectionFolderInfo renameConnectionFolder(
        @NotNull WebSession session,
        @Nullable String projectId,
        @NotNull String folderPath,
        @NotNull String newPath
    ) throws DBWebException {
        WebConnectionFolderUtils.validateConnectionFolder(newPath);
        WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, projectId, folderPath);
        folderInfo.getDataSourceFolder().setName(newPath);
        WebServiceUtils.refreshDatabases(session, projectId);
        return folderInfo;
    }

    @Override
    public boolean deleteConnectionFolder(
        @NotNull WebSession session, @Nullable String projectId, @NotNull String folderPath
    ) throws DBWebException {
        try {
            WebConnectionFolderInfo folderInfo = WebConnectionFolderUtils.getFolderInfo(session, projectId, folderPath);
            DBPDataSourceFolder folder = folderInfo.getDataSourceFolder();
            WebProjectImpl project = getProjectById(session, projectId);
            if (folder.getDataSourceRegistry().getProject() != project) {
                throw new DBWebException("Global folder '" + folderInfo.getId() + "' cannot be deleted");
            }
            session.addInfoMessage("Delete folder");
            DBPDataSourceRegistry sessionRegistry = project.getDataSourceRegistry();
            sessionRegistry.removeFolder(folderInfo.getDataSourceFolder(), false);
            WebServiceUtils.refreshDatabases(session, projectId);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
        return true;
    }

    @Override
    public WebConnectionInfo setConnectionNavigatorSettings(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String id,
        @NotNull DataSourceNavigatorSettings settings
    ) throws DBWebException {
        WebSessionProjectImpl project = webSession.getProjectById(projectId);
        WebConnectionInfo connectionInfo = project != null ? project.getWebConnectionInfo(id) :
            WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, id);
        DataSourceDescriptor dataSourceDescriptor = ((DataSourceDescriptor) connectionInfo.getDataSourceContainer());
        try {
            if (project != null && !project.isPrivateProject() && settings.isUserSettings()) {
                DataSourceNavigatorSettingsUtils.updateCustomNavigatorSettings(dataSourceDescriptor, settings);
            } else {
                // If user has no permissions to save it will cause error
                dataSourceDescriptor.setNavigatorSettings(settings);
                dataSourceDescriptor.persistConfiguration();
            }
        } catch (DBException e) {
            throw new DBWebException("Error saving custom navigator settings", e);
        }
        return connectionInfo;
    }

    @Override
    public WebConnectionInfo clearConnectionNavigatorSettings(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String id
    ) throws DBWebException {
        WebConnectionInfo connectionInfo = WebDataSourceUtils.getWebConnectionInfo(webSession, projectId, id);
        DataSourceDescriptor dataSourceDescriptor = ((DataSourceDescriptor) connectionInfo.getDataSourceContainer());
        try {
            DataSourceNavigatorSettingsUtils.clearCustomNavigatorSettings(dataSourceDescriptor);
        } catch (DBException e) {
            throw new DBWebException("Error deleting custom navigator settings", e);
        }
        return connectionInfo;
    }

    @Override
    @NotNull
    public Map<String, String> setObjectSettingsForDatasource(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String objectId,
        @NotNull Map<String, String> settings
    ) throws DBException {

        WebSessionProjectImpl projectById = webSession.getProjectById(projectId);
        if (projectById == null) {
            throw new DBWebException("Project '" + projectId + "' not found");
        }
        BaseProjectSettings projectSettings = projectById.getProjectSettings();
        projectSettings.setObjectSettings(SMObjectType.datasource, objectId, settings);
        Map<String, String> objectSettings = projectSettings.getObjectSettings(SMObjectType.datasource, objectId);
        return objectSettings == null ? new HashMap<>() : objectSettings;
    }

    @Override
    public WebAsyncTaskInfo getAsyncTaskInfo(WebSession webSession, String taskId, Boolean removeOnFinish)
        throws DBWebException {
        return webSession.asyncTaskStatus(taskId, CommonUtils.toBoolean(removeOnFinish));
    }

    @Override
    public boolean cancelAsyncTask(WebSession webSession, String taskId) throws DBWebException {
        return webSession.asyncTaskCancel(taskId);
    }

    @Override
    public WebGroupPropertiesInfo<ProductSettingDescriptor> getProductSettings(@NotNull WebSession webSession) {
        return new WebGroupPropertiesInfo<>(webSession, ProductSettingsRegistry.getInstance().getSettings());
    }

    @NotNull
    private WebSessionProjectImpl getProjectById(@NotNull WebSession webSession, @Nullable String projectId) throws DBWebException {
        WebSessionProjectImpl project = webSession.getProjectById(projectId);
        if (project == null) {
            throw new DBWebException("Project '" + projectId + "' not found");
        }
        return project;
    }

    @NotNull
    private static WebSessionProjectImpl getConnectionTestProject(
        @NotNull WebSession webSession,
        @Nullable String projectId
    ) throws DBWebException {
        if (projectId == null) {
            WebSessionProjectImpl project = webSession.getProjectById(null);
            if (project != null) {
                return project;
            }
        } else {
            for (WebSessionProjectImpl project : webSession.getAccessibleProjects()) {
                if (projectId.equals(project.getId())) {
                    return project;
                }
            }
        }
        throw new DBWebException("Project '" + projectId + "' not found");
    }

    private void validateDriverLibrariesPresence(@NotNull DBPDataSourceContainer container) throws DBWebException {
        if (!DBWorkbench.isDistributed() && container.getDriver().getDriverLoader(container).needsExternalDependencies()) {
            throwDriverNotFoundException(container);
        }
    }

    private static void throwDriverNotFoundException(@NotNull DBPDataSourceContainer container) throws DBWebException {
        throw new DBWebException("Driver files for %s are not found. Please ask the administrator to download it."
            .formatted(container.getDriver().getName()));
    }
}

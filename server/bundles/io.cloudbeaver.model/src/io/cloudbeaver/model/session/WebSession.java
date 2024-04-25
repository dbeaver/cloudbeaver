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
package io.cloudbeaver.model.session;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.DataSourceFilter;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.app.WebAuthApplication;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.DBWSessionHandler;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.CBModelConstants;
import io.cloudbeaver.utils.WebAppUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.eclipse.core.runtime.IAdaptable;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPEvent;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistryCache;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.fs.DBFFileSystemManager;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.BaseProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.ProxyProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMObjectType;
import org.jkiss.dbeaver.model.security.user.SMObjectPermissions;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.websocket.event.MessageType;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSSessionLogUpdatedEvent;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
/**
 * Web session.
 * Is the main source of data in web application
 */
public class WebSession extends BaseWebSession
    implements SMSessionWithAuth, SMCredentialsProvider, DBACredentialsProvider, IAdaptable {

    private static final Log log = Log.getLog(WebSession.class);

    public static final SMSessionType CB_SESSION_TYPE = new SMSessionType("CloudBeaver");
    private static final String WEB_SESSION_AUTH_CONTEXT_TYPE = "web-session";
    private static final String ATTR_LOCALE = "locale";
    private static final AtomicInteger TASK_ID = new AtomicInteger();

    public static String RUNTIME_PARAM_AUTH_INFOS = "auth-infos";
    private final AtomicInteger taskCount = new AtomicInteger();

    private String lastRemoteAddr;
    private String lastRemoteUserAgent;

    private Set<String> accessibleConnectionIds = Collections.emptySet();

    private String locale;
    private boolean cacheExpired;

    private final Map<String, WebConnectionInfo> connections = new HashMap<>();
    private final List<WebServerMessage> sessionMessages = new ArrayList<>();

    private final Map<String, WebAsyncTaskInfo> asyncTasks = new HashMap<>();
    private final Map<String, Function<Object, Object>> attributeDisposers = new HashMap<>();

    // Map of auth tokens. Key is authentication provider
    private final List<WebAuthInfo> authTokens = new ArrayList<>();

    private DBNModel navigatorModel;
    private final DBRProgressMonitor progressMonitor = new SessionProgressMonitor();
    private final Map<String, DBWSessionHandler> sessionHandlers;

    public WebSession(
        @NotNull HttpServletRequest request,
        @NotNull WebAuthApplication application,
        @NotNull Map<String, DBWSessionHandler> sessionHandlers
    ) throws DBException {
        super(request.getSession().getId(), application);
        this.lastAccessTime = this.createTime;
        setLocale(CommonUtils.toString(request.getSession().getAttribute(ATTR_LOCALE), this.locale));
        this.sessionHandlers = sessionHandlers;
        //force authorization of anonymous session to avoid access error,
        //because before authorization could be called by any request,
        //but now 'updateInfo' is called only in special requests,
        //and the order of requests is not guaranteed.
        //look at CB-4747
        refreshSessionAuth();
        updateSessionParameters(request);
    }

    @Nullable
    @Override
    public SMSessionPrincipal getSessionPrincipal() {
        synchronized (authTokens) {
            if (authTokens.isEmpty()) {
                return null;
            }
            return authTokens.get(0);
        }
    }

    @NotNull
    public DBPProject getSingletonProject() {
        return getWorkspace().getActiveProject();
    }

    @Property
    public String getCreateTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(Instant.ofEpochMilli(createTime));
    }

    @Property
    public synchronized String getLastAccessTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(Instant.ofEpochMilli(lastAccessTime));
    }

    public String getLastRemoteAddr() {
        return lastRemoteAddr;
    }

    public String getLastRemoteUserAgent() {
        return lastRemoteUserAgent;
    }

    // Clear cache when
    @Property
    public boolean isCacheExpired() {
        return cacheExpired;
    }

    public void setCacheExpired(boolean cacheExpired) {
        this.cacheExpired = cacheExpired;
    }

    public synchronized WebUser getUser() {
        return this.userContext.getUser();
    }

    public synchronized Map<String, String> getUserMetaParameters() {
        var user = getUser();
        if (user == null) {
            return Map.of();
        }
        var allMetaParams = new HashMap<>(user.getMetaParameters());

        getAllAuthInfo().forEach(authInfo -> allMetaParams.putAll(authInfo.getUserIdentity().getMetaParameters()));

        return allMetaParams;
    }

    public synchronized String getUserId() {
        return userContext.getUserId();
    }

    public synchronized boolean hasPermission(String perm) {
        return getSessionPermissions().contains(DBWConstants.PERMISSION_ADMIN) ||
            getSessionPermissions().contains(perm);
    }

    public synchronized boolean isAuthorizedInSecurityManager() {
        return userContext.isAuthorizedInSecurityManager();
    }

    public synchronized Set<String> getSessionPermissions() {
        if (userContext.getUserPermissions() == null) {
            refreshSessionAuth();
        }
        return userContext.getUserPermissions();
    }

    @NotNull
    public synchronized SMController getSecurityController() {
        return userContext.getSecurityController();
    }

    @NotNull
    public synchronized SMAdminController getAdminSecurityController() throws DBException {
        if (!hasPermission(DBWConstants.PERMISSION_ADMIN)) {
            throw new DBException("Admin permissions required");
        }
        return userContext.getAdminSecurityController();
    }

    public synchronized RMController getRmController() {
        return userContext.getRmController();
    }

    public synchronized DBFileController getFileController() {
        return userContext.getFileController();
    }

    @Override
    public synchronized void refreshUserData() {
        super.refreshUserData();
        refreshSessionAuth();

        initNavigatorModel();
    }

    /**
     * updates data sources based on event in web session
     *
     * @param project       project of connection
     * @param dataSourceIds list of updated connections
     * @param type          type of event
     */
    public synchronized boolean updateProjectDataSources(
        DBPProject project,
        List<String> dataSourceIds,
        WSEventType type
    ) {
        var sendDataSourceUpdatedEvent = false;
        DBPDataSourceRegistry registry = project.getDataSourceRegistry();
        // save old connections
        var oldDataSources = dataSourceIds.stream()
            .map(registry::getDataSource)
            .filter(Objects::nonNull)
            .collect(Collectors.toMap(
                DBPDataSourceContainer::getId,
                ds -> new DataSourceDescriptor((DataSourceDescriptor) ds, ds.getRegistry())
            ));
        if (type == WSEventType.DATASOURCE_CREATED || type == WSEventType.DATASOURCE_UPDATED) {
            registry.refreshConfig(dataSourceIds);
        }
        for (String dsId : dataSourceIds) {
            DataSourceDescriptor ds = (DataSourceDescriptor) registry.getDataSource(dsId);
            if (ds == null) {
                continue;
            }
            switch (type) {
                case DATASOURCE_CREATED -> {
                    WebConnectionInfo connectionInfo = new WebConnectionInfo(this, ds);
                    this.connections.put(getConnectionId(ds), connectionInfo);
                    sendDataSourceUpdatedEvent = true;
                }
                case DATASOURCE_UPDATED -> // if settings were changed we need to send event
                    sendDataSourceUpdatedEvent |= !ds.equalSettings(oldDataSources.get(dsId));
                case DATASOURCE_DELETED -> {
                    WebDataSourceUtils.disconnectDataSource(this, ds);
                    if (registry instanceof DBPDataSourceRegistryCache dsrc) {
                        dsrc.removeDataSourceFromList(ds);
                    }
                    this.connections.remove(getConnectionId(ds));
                    sendDataSourceUpdatedEvent = true;
                }
                default -> {
                }
            }
        }
        return sendDataSourceUpdatedEvent;
    }

    @NotNull
    private String getConnectionId(@NotNull DBPDataSourceContainer container) {
        return getConnectionId(container.getProject().getId(), container.getId());
    }

    @NotNull
    private String getConnectionId(@NotNull String projectId, @NotNull String dsId) {
        return projectId + ":" + dsId;
    }

    // Note: for admin use only
    public synchronized void resetUserState() throws DBException {
        clearAuthTokens();
        try {
            resetSessionCache();
        } catch (DBCException e) {
            addSessionError(e);
            log.error(e);
        }
        refreshUserData();
        clearSessionContext();
    }

    private void initNavigatorModel() {

        // Cleanup current data
        if (this.navigatorModel != null) {
            this.navigatorModel.dispose();
            this.navigatorModel = null;
        }
        this.connections.clear();

        loadProjects();

        this.navigatorModel = new DBNModel(DBWorkbench.getPlatform(), getWorkspace().getProjects());
        this.navigatorModel.setModelAuthContext(getWorkspace().getAuthContext());
        this.navigatorModel.initialize();

        this.locale = Locale.getDefault().getLanguage();
    }

    private void loadProjects() {
        WebSessionWorkspace workspace = getWorkspace();
        workspace.clearProjects();

        WebUser user = userContext.getUser();
        if (user == null && DBWorkbench.isDistributed()) {
            // No anonymous mode in distributed apps
            return;
        }
        refreshAccessibleConnectionIds();
        try {
            RMController controller = getRmController();
            RMProject[] rmProjects = controller.listAccessibleProjects();
            for (RMProject project : rmProjects) {
                createWebProject(project);
            }
            if (user == null) {
                WebProjectImpl anonymousProject = createWebProject(RMUtils.createAnonymousProject());
                anonymousProject.setInMemory(true);
            }
            if (workspace.getActiveProject() == null && !workspace.getProjects().isEmpty()) {
                workspace.setActiveProject(workspace.getProjects().get(0));
            }
        } catch (DBException e) {
            addSessionError(e);
            log.error("Error getting accessible projects list", e);
        }
    }

    public WebProjectImpl createWebProject(RMProject project) {
        // Do not filter data sources from user project
        DataSourceFilter filter = project.getType() == RMProjectType.GLOBAL
            ? this::isDataSourceAccessible
            : x -> true;
        WebProjectImpl sessionProject = application.createProjectImpl(this, project, filter);
        // do not load data sources for anonymous project
        if (project.getType() == RMProjectType.USER && userContext.getUser() == null) {
            sessionProject.setInMemory(true);
        }
        DBPDataSourceRegistry dataSourceRegistry = sessionProject.getDataSourceRegistry();
        dataSourceRegistry.setAuthCredentialsProvider(this);
        addSessionProject(sessionProject);
        if (!project.isShared() || application.isConfigurationMode()) {
            getWorkspace().setActiveProject(sessionProject);
        }
        for (DBPDataSourceContainer ds : dataSourceRegistry.getDataSources()) {
            addConnection(new WebConnectionInfo(this, ds));
        }
        Throwable lastError = dataSourceRegistry.getLastError();
        if (lastError != null) {
            addSessionError(lastError);
            log.error("Error refreshing connections from project '" + project.getId() + "'", lastError);
        }
        return sessionProject;
    }

    public void filterAccessibleConnections(List<WebConnectionInfo> connections) {
        connections.removeIf(c -> !isDataSourceAccessible(c.getDataSourceContainer()));
    }

    private boolean isDataSourceAccessible(DBPDataSourceContainer dataSource) {
        return dataSource.isExternallyProvided() ||
            dataSource.isTemporary() ||
            this.hasPermission(DBWConstants.PERMISSION_ADMIN) ||
            accessibleConnectionIds.contains(dataSource.getId());
    }

    @NotNull
    private Set<String> readAccessibleConnectionIds() {
        try {
            return getSecurityController()
                .getAllAvailableObjectsPermissions(SMObjectType.datasource)
                .stream()
                .map(SMObjectPermissions::getObjectId)
                .collect(Collectors.toSet());
        } catch (DBException e) {
            addSessionError(e);
            log.error("Error reading connection grants", e);
            return Collections.emptySet();
        }
    }

    private void resetSessionCache() throws DBCException {
        // Clear attributes
        synchronized (attributes) {
            for (Map.Entry<String, Function<Object, Object>> attrDisposer : attributeDisposers.entrySet()) {
                Object attrValue = attributes.get(attrDisposer.getKey());
                attrDisposer.getValue().apply(attrValue);
            }
            attributeDisposers.clear();
            // Remove all non-persistent attributes
            attributes.entrySet().removeIf(
                entry -> !(entry.getValue() instanceof PersistentAttribute));
        }
    }

    private void resetNavigationModel() {
        Map<String, WebConnectionInfo> conCopy;
        synchronized (this.connections) {
            conCopy = new HashMap<>(this.connections);
            this.connections.clear();
        }

        for (WebConnectionInfo connectionInfo : conCopy.values()) {
            if (connectionInfo.isConnected()) {
                new DisconnectJob(connectionInfo.getDataSourceContainer()).schedule();
            }
        }

        if (this.navigatorModel != null) {
            this.navigatorModel.dispose();
            this.navigatorModel = null;
        }
    }

    private synchronized void refreshSessionAuth() {
        try {
            if (!isAuthorizedInSecurityManager()) {
                authAsAnonymousUser();
            } else if (getUserId() != null) {
                userContext.refreshPermissions();
                refreshAccessibleConnectionIds();
            }

        } catch (Exception e) {
            addSessionError(e);
            log.error("Error reading session permissions", e);
        }
    }

    private synchronized void refreshAccessibleConnectionIds() {
        this.accessibleConnectionIds = readAccessibleConnectionIds();
    }

    public synchronized void addAccessibleConnectionToCache(@NotNull String dsId) {
        this.accessibleConnectionIds.add(dsId);
        var registry = getProjectById(WebAppUtils.getGlobalProjectId()).getDataSourceRegistry();
        var dataSource = registry.getDataSource(dsId);
        if (dataSource != null) {
            connections.put(getConnectionId(dataSource), new WebConnectionInfo(this, dataSource));
            // reflect changes is navigator model
            registry.notifyDataSourceListeners(new DBPEvent(DBPEvent.Action.OBJECT_ADD, dataSource, true));
        }
    }

    public synchronized void removeAccessibleConnectionFromCache(@NotNull String dsId) {
        var registry = getProjectById(WebAppUtils.getGlobalProjectId()).getDataSourceRegistry();
        var dataSource = registry.getDataSource(dsId);
        if (dataSource != null) {
            this.accessibleConnectionIds.remove(dsId);
            connections.remove(getConnectionId(dataSource));
            // reflect changes is navigator model
            registry.notifyDataSourceListeners(new DBPEvent(DBPEvent.Action.OBJECT_REMOVE, dataSource));
            dataSource.dispose();
        }
    }

    private synchronized void authAsAnonymousUser() throws DBException {
        if (!application.getAppConfiguration().isAnonymousAccessEnabled()) {
            return;
        }
        SMAuthInfo authInfo = getSecurityController().authenticateAnonymousUser(this.id, getSessionParameters(), CB_SESSION_TYPE);
        updateSMSession(authInfo);
        notifySessionAuthChange();
    }

    @NotNull
    public String getLocale() {
        return locale;
    }

    public void setLocale(@Nullable String locale) {
        this.locale = locale != null ? locale : Locale.getDefault().getLanguage();
    }

    public DBNModel getNavigatorModel() {
        return navigatorModel;
    }

    /**
     * Returns and clears progress messages
     */
    @Association
    public List<WebServerMessage> getSessionMessages() {
        synchronized (sessionMessages) {
            List<WebServerMessage> copy = new ArrayList<>(sessionMessages);
            sessionMessages.clear();
            return copy;
        }
    }

    public synchronized void updateInfo(boolean isOldHttpSessionUsed) {
        log.debug("Update session lifetime " + getSessionId() + " for user " + getUserId());
        touchSession();
        if (isOldHttpSessionUsed) {
            try {
                // Persist session
                if (!isAuthorizedInSecurityManager()) {
                    // Create new record
                    authAsAnonymousUser();
                } else {
                    if (!application.isConfigurationMode()) {
                        // Update record
                        //TODO use generate id from SMController
                        getSecurityController().updateSession(this.userContext.getSmSessionId(), getSessionParameters());
                    }
                }
            } catch (Exception e) {
                addSessionError(e);
                log.error("Error persisting web session", e);
            }
        }
    }

    public synchronized void updateSessionParameters(HttpServletRequest request) {
        this.lastRemoteAddr = request.getRemoteAddr();
        this.lastRemoteUserAgent = request.getHeader("User-Agent");
        this.cacheExpired = false;
    }

    @Association
    public List<WebConnectionInfo> getConnections() {
        synchronized (connections) {
            return new ArrayList<>(connections.values());
        }
    }

    @NotNull
    public WebConnectionInfo getWebConnectionInfo(@Nullable String projectId, String connectionID) throws DBWebException {
        WebConnectionInfo connectionInfo = null;
        synchronized (connections) {
            if (projectId != null) {
                connectionInfo = connections.get(getConnectionId(projectId, connectionID));
            } else {
                addWarningMessage("Project id is not defined in request. Try to find it from connection cache");
                for (Map.Entry<String, WebConnectionInfo> entry : connections.entrySet()) {
                    String k = entry.getKey();
                    WebConnectionInfo v = entry.getValue();
                    if (k.contains(connectionID)) {
                        connectionInfo = v;
                        break;
                    }
                }
            }
        }
        if (connectionInfo == null) {
            WebProjectImpl project = getProjectById(projectId);
            if (project == null) {
                throw new DBWebException("Project '" + projectId + "' not found in web workspace");
            }
            DBPDataSourceContainer dataSource = project.getDataSourceRegistry().getDataSource(connectionID);
            if (dataSource != null) {
                connectionInfo = new WebConnectionInfo(this, dataSource);
                synchronized (connections) {
                    connections.put(getConnectionId(dataSource), connectionInfo);
                }
            } else {
                throw new DBWebException("Connection '" + connectionID + "' not found");
            }
        }
        return connectionInfo;
    }

    @Nullable
    public WebConnectionInfo findWebConnectionInfo(String projectId, String connectionId) {
        synchronized (connections) {
            return connections.get(getConnectionId(projectId, connectionId));
        }
    }

    public void addConnection(WebConnectionInfo connectionInfo) {
        synchronized (connections) {
            connections.put(getConnectionId(connectionInfo.getDataSourceContainer()), connectionInfo);
        }
    }

    public void removeConnection(WebConnectionInfo connectionInfo) {
        connectionInfo.clearCache();
        synchronized (connections) {
            connections.remove(getConnectionId(connectionInfo.getDataSourceContainer()));
        }
    }

    @Override
    public void close() {
        try {
            resetNavigationModel();
            resetSessionCache();
        } catch (Throwable e) {
            log.error(e);
        }
        try {
            clearAuthTokens();
        } catch (Exception e) {
            log.error("Error closing web session tokens");
        }
        this.userContext.setUser(null);
        super.close();
    }

    @Override
    public void close(boolean clearTokens) {
        try {
            resetNavigationModel();
            resetSessionCache();
        } catch (Throwable e) {
            log.error(e);
        }
        if (clearTokens) {
            try {
                clearAuthTokens();
            } catch (Exception e) {
                log.error("Error closing web session tokens");
            }
        }
        this.userContext.setUser(null);
        super.close(clearTokens);
    }

    private List<WebAuthInfo> clearAuthTokens() throws DBException {
        ArrayList<WebAuthInfo> tokensCopy;
        synchronized (authTokens) {
            tokensCopy = new ArrayList<>(this.authTokens);
        }
        for (WebAuthInfo ai : tokensCopy) {
            removeAuthInfo(ai);
        }
        resetAuthToken();
        return tokensCopy;
    }

    public DBRProgressMonitor getProgressMonitor() {
        return progressMonitor;
    }

    ///////////////////////////////////////////////////////
    // Async model

    public WebAsyncTaskInfo getAsyncTask(String taskId, String taskName, boolean create) {
        synchronized (asyncTasks) {
            WebAsyncTaskInfo taskInfo = asyncTasks.get(taskId);
            if (taskInfo == null && create) {
                taskInfo = new WebAsyncTaskInfo(taskId, taskName);
                asyncTasks.put(taskId, taskInfo);
            }
            return taskInfo;
        }
    }

    public WebAsyncTaskInfo asyncTaskStatus(String taskId, boolean removeOnFinish) throws DBWebException {
        synchronized (asyncTasks) {
            WebAsyncTaskInfo taskInfo = asyncTasks.get(taskId);
            if (taskInfo == null) {
                throw new DBWebException("Task '" + taskId + "' not found");
            }
            taskInfo.setRunning(taskInfo.getJob() != null && !taskInfo.getJob().isFinished());
            if (removeOnFinish && !taskInfo.isRunning()) {
                asyncTasks.remove(taskId);
            }
            return taskInfo;
        }
    }

    public boolean asyncTaskCancel(String taskId) throws DBWebException {
        WebAsyncTaskInfo taskInfo;
        synchronized (asyncTasks) {
            taskInfo = asyncTasks.get(taskId);
            if (taskInfo == null) {
                throw new DBWebException("Task '" + taskId + "' not found");
            }
        }
        AbstractJob job = taskInfo.getJob();
        if (job != null) {
            job.cancel();
        }
        return true;
    }

    public WebAsyncTaskInfo createAndRunAsyncTask(String taskName, WebAsyncTaskProcessor<?> runnable) {
        int taskId = TASK_ID.incrementAndGet();
        WebAsyncTaskInfo asyncTask = getAsyncTask(String.valueOf(taskId), taskName, true);

        AbstractJob job = new AbstractJob(taskName) {
            @Override
            protected IStatus run(DBRProgressMonitor monitor) {
                int curTaskCount = taskCount.incrementAndGet();

                TaskProgressMonitor taskMonitor = new TaskProgressMonitor(monitor, asyncTask);
                try {
                    Number queryLimit = application.getAppConfiguration().getResourceQuota(WebSQLConstants.QUOTA_PROP_QUERY_LIMIT);
                    if (queryLimit != null && curTaskCount > queryLimit.intValue()) {
                        throw new DBQuotaException(
                            "Maximum simultaneous queries quota exceeded", WebSQLConstants.QUOTA_PROP_QUERY_LIMIT, queryLimit.intValue(), curTaskCount);
                    }

                    runnable.run(taskMonitor);
                    asyncTask.setResult(runnable.getResult());
                    asyncTask.setExtendedResult(runnable.getExtendedResults());
                    asyncTask.setStatus("Finished");
                    asyncTask.setRunning(false);
                } catch (InvocationTargetException e) {
                    addSessionError(e.getTargetException());
                    asyncTask.setJobError(e.getTargetException());
                } catch (Exception e) {
                    asyncTask.setJobError(e);
                } finally {
                    taskCount.decrementAndGet();
                }
                return Status.OK_STATUS;
            }
        };

        asyncTask.setJob(job);
        asyncTask.setRunning(true);
        job.schedule();
        return asyncTask;
    }

    public void addSessionError(Throwable exception) {
        addSessionMessage(new WebServerMessage(exception));
    }

    public void addSessionMessage(WebServerMessage message) {
        synchronized (sessionMessages) {
            sessionMessages.add(message);
        }
        addSessionEvent(new WSSessionLogUpdatedEvent(
            WSEventType.SESSION_LOG_UPDATED,
            this.userContext.getSmSessionId(),
            this.userContext.getUserId(),
            MessageType.ERROR,
            message.getMessage()));
    }

    public void addInfoMessage(String message) {
        addSessionMessage(new WebServerMessage(MessageType.INFO, message));
    }

    public void addWarningMessage(String message) {
        addSessionMessage(new WebServerMessage(MessageType.WARNING, message));
    }

    public List<WebServerMessage> readLog(Integer maxEntries, Boolean clearLog) {
        synchronized (sessionMessages) {
            List<WebServerMessage> messages = new ArrayList<>();
            int entryCount = CommonUtils.toInt(maxEntries);
            if (entryCount == 0 || entryCount >= sessionMessages.size()) {
                messages.addAll(sessionMessages);
                if (CommonUtils.toBoolean(clearLog)) {
                    sessionMessages.clear();
                }
            } else {
                messages.addAll(sessionMessages.subList(0, maxEntries));
                if (CommonUtils.toBoolean(clearLog)) {
                    sessionMessages.removeAll(messages);
                }
            }
            return messages;
        }
    }

    @Override
    public <T> T getAttribute(String name) {
        synchronized (attributes) {
            Object value = attributes.get(name);
            if (value instanceof PersistentAttribute persistentAttribute) {
                value = persistentAttribute.getValue();
            }
            return (T) value;
        }
    }

    public void setAttribute(String name, Object value, boolean persistent) {
        synchronized (attributes) {
            attributes.put(name, persistent ? new PersistentAttribute(value) : value);
        }
    }

    public <T> T getAttribute(String name, Function<T, T> creator, Function<T, T> disposer) {
        synchronized (attributes) {
            Object value = attributes.get(name);
            if (value instanceof PersistentAttribute persistentAttribute) {
                value = persistentAttribute.getValue();
            }
            if (value == null) {
                value = creator.apply(null);
                if (value != null) {
                    attributes.put(name, value);
                    if (disposer != null) {
                        attributeDisposers.put(name, (Function<Object, Object>) disposer);
                    }
                }
            }
            return (T) value;
        }
    }

    @Property
    public Map<String, Object> getActionParameters() {
        WebActionParameters action = WebActionParameters.fromSession(this, true);
        return action == null ? null : action.getParameters();
    }

    public WebAuthInfo getAuthInfo(@Nullable String providerID) {
        synchronized (authTokens) {

            if (providerID != null) {
                for (WebAuthInfo ai : authTokens) {
                    if (ai.getAuthProvider().equals(providerID)) {
                        return ai;
                    }
                }
                return null;
            }
            return authTokens.isEmpty() ? null : authTokens.get(0);
        }
    }

    @Override
    public List<SMAuthInfo> getAuthInfos() {
        synchronized (authTokens) {
            return authTokens.stream().map(WebAuthInfo::getAuthInfo).toList();
        }
    }


    public List<WebAuthInfo> getAllAuthInfo() {
        synchronized (authTokens) {
            return new ArrayList<>(authTokens);
        }
    }

    public void addAuthInfo(@NotNull WebAuthInfo authInfo) throws DBException {
        addAuthTokens(authInfo);
    }

    public void addAuthTokens(@NotNull WebAuthInfo... tokens) throws DBException {
        WebUser newUser = null;
        for (WebAuthInfo authInfo : tokens) {
            if (newUser != null && newUser != authInfo.getUser()) {
                throw new DBException("Different users specified in auth tokens: " + Arrays.toString(tokens));
            }
            newUser = authInfo.getUser();
        }
        if (application.isConfigurationMode() && this.userContext.getUser() == null && newUser != null) {
            //FIXME hotfix to avoid exception after external auth provider login in easy config
            userContext.setUser(newUser);
            refreshUserData();
        } else if (!CommonUtils.equalObjects(this.userContext.getUser(), newUser)) {
            throw new DBException("Can't authorize different users in the single session");
        }

        for (WebAuthInfo authInfo : tokens) {
            WebAuthInfo oldAuthInfo = getAuthInfo(authInfo.getAuthProviderDescriptor().getId());
            if (oldAuthInfo != null) {
                removeAuthInfo(oldAuthInfo);
            }
            SMSession authSession = authInfo.getAuthSession();
            if (authSession != null) {
                getSessionContext().addSession(authSession);
            }
        }
        synchronized (authTokens) {
            Collections.addAll(authTokens, tokens);
        }

        notifySessionAuthChange();
    }

    public void notifySessionAuthChange() {
        // Notify handlers about auth change
        sessionHandlers.forEach((id, handler) -> {
            try {
                handler.handleSessionAuth(this);
            } catch (Exception e) {
                log.error("Error calling session handler '" + id + "'", e);
            }
        });
    }

    private void removeAuthInfo(WebAuthInfo oldAuthInfo) {
        oldAuthInfo.closeAuth();
        synchronized (authTokens) {
            authTokens.remove(oldAuthInfo);
        }
    }

    public List<WebAuthInfo> removeAuthInfo(String providerId) throws DBException {
        List<WebAuthInfo> oldInfo;
        if (providerId == null) {
            oldInfo = clearAuthTokens();
        } else {
            WebAuthInfo authInfo = getAuthInfo(providerId);
            if (authInfo != null) {
                removeAuthInfo(authInfo);
                oldInfo = List.of(authInfo);
            } else {
                oldInfo = List.of();
            }
        }
        if (authTokens.isEmpty()) {
            resetUserState();
        }
        return oldInfo;
    }

    public List<DBACredentialsProvider> getContextCredentialsProviders() {
        return getAdapters(DBACredentialsProvider.class);
    }

    // Auth credentials provider
    // Adds auth properties passed from web (by user)
    @Override
    public boolean provideAuthParameters(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBPDataSourceContainer dataSourceContainer,
        @NotNull DBPConnectionConfiguration configuration
    ) {
        try {
            // Properties from nested auth sessions
            for (DBACredentialsProvider contextCredentialsProvider : getContextCredentialsProviders()) {
                contextCredentialsProvider.provideAuthParameters(monitor, dataSourceContainer, configuration);
            }
            configuration.setRuntimeAttribute(RUNTIME_PARAM_AUTH_INFOS, getAllAuthInfo());

            WebConnectionInfo webConnectionInfo = findWebConnectionInfo(dataSourceContainer.getProject().getId(), dataSourceContainer.getId());
            if (webConnectionInfo != null) {
                WebDataSourceUtils.saveCredentialsInDataSource(webConnectionInfo, dataSourceContainer, configuration);
            }

            // uncommented because we had the problem with non-native auth models
            // (for example, can't connect to DynamoDB if credentials are not saved)
            DBAAuthCredentials credentials = configuration.getAuthModel().loadCredentials(dataSourceContainer, configuration);

            InstanceCreator<DBAAuthCredentials> credTypeAdapter = type -> credentials;
            Gson credGson = new GsonBuilder()
                .setLenient()
                .registerTypeAdapter(credentials.getClass(), credTypeAdapter)
                .create();

            credGson.fromJson(credGson.toJsonTree(configuration.getAuthProperties()), credentials.getClass());
            configuration.getAuthModel().provideCredentials(dataSourceContainer, configuration, credentials);
        } catch (DBException e) {
            addSessionError(e);
            log.error(e);
        }
        return true;
    }

    @NotNull
    @Override
    public String getAuthContextType() {
        return WEB_SESSION_AUTH_CONTEXT_TYPE;
    }

    // May be called to extract auth information from session
    @Override
    public <T> T getAdapter(Class<T> adapter) {
        synchronized (authTokens) {
            for (WebAuthInfo authInfo : authTokens) {
                if (isAuthInfoInstanceOf(authInfo, adapter)) {
                    return adapter.cast(authInfo.getAuthSession());
                }
            }
        }
        return null;
    }

    @NotNull
    public <T> List<T> getAdapters(Class<T> adapter) {
        synchronized (authTokens) {
            return authTokens.stream()
                .filter(token -> isAuthInfoInstanceOf(token, adapter))
                .map(token -> adapter.cast(token.getAuthSession()))
                .collect(Collectors.toList());
        }
    }

    private <T> boolean isAuthInfoInstanceOf(WebAuthInfo authInfo, Class<T> adapter) {
        if (authInfo != null && authInfo.getAuthSession() != null) {
            return adapter.isInstance(authInfo.getAuthSession());
        }
        return false;
    }

    ///////////////////////////////////////////////////////
    // Utils

    public Map<String, Object> getSessionParameters() {
        var parameters = new HashMap<String, Object>();
        parameters.put(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS, getLastRemoteAddr());
        parameters.put(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT, getLastRemoteUserAgent());
        return parameters;
    }

    public synchronized void resetAuthToken() throws DBException {
        this.userContext.reset();
    }

    public synchronized boolean updateSMSession(SMAuthInfo smAuthInfo) throws DBException {
        boolean contextChanged = super.updateSMSession(smAuthInfo);
        if (contextChanged) {
            refreshUserData();
        }
        return contextChanged;
    }

    @Override
    public SMCredentials getActiveUserCredentials() {
        return userContext.getActiveUserCredentials();
    }

    @Override
    public void refreshSMSession() throws DBException {
        userContext.refreshSMSession();
    }

    @Nullable
    public WebProjectImpl getProjectById(@Nullable String projectId) {
        return getWorkspace().getProjectById(projectId);
    }

    public WebProjectImpl getAccessibleProjectById(@Nullable String projectId) throws DBWebException {
        WebProjectImpl project = null;
        if (projectId != null) {
            project = getWorkspace().getProjectById(projectId);
        }
        if (project == null) {
            throw new DBWebException("Project not found: " + projectId);
        }
        return project;
    }

    public List<WebProjectImpl> getAccessibleProjects() {
        return getWorkspace().getProjects();
    }

    public void addSessionProject(@NotNull WebProjectImpl project) {
        getWorkspace().addProject(project);
        if (navigatorModel != null) {
            navigatorModel.getRoot().addProject(project, false);
        }
    }

    public void deleteSessionProject(@Nullable WebProjectImpl project) {
        if (project != null) {
            project.dispose();
        }
        getWorkspace().removeProject(project);
        if (navigatorModel != null) {
            navigatorModel.getRoot().removeProject(project);
        }
    }

    @Override
    public void addSessionProject(@NotNull String projectId) throws DBException {
        super.addSessionProject(projectId);
        var rmProject = getRmController().getProject(projectId, false, false);
        createWebProject(rmProject);
    }

    @Override
    public void removeSessionProject(@Nullable String projectId) throws DBException {
        super.removeSessionProject(projectId);
        var project = getProjectById(projectId);
        if (project == null) {
            return;
        }
        deleteSessionProject(project);
        var projectConnections = project.getDataSourceRegistry().getDataSources();
        for (DBPDataSourceContainer c : projectConnections) {
            removeConnection(new WebConnectionInfo(this, c));
        }
    }

    @NotNull
    public DBFFileSystemManager getFileSystemManager(String projectId) throws DBException {
        var project = getProjectById(projectId);
        if (project == null) {
            throw new DBException("Project not found: " + projectId);
        }
        return project.getFileSystemManager();
    }

    @NotNull
    public DBPPreferenceStore getUserPreferenceStore() {
        return getUserContext().getPreferenceStore();
    }

    private class SessionProgressMonitor extends BaseProgressMonitor {
        @Override
        public void beginTask(String name, int totalWork) {
            addInfoMessage(name);
        }

        @Override
        public void subTask(String name) {
            addInfoMessage(name);
        }
    }

    private static class TaskProgressMonitor extends ProxyProgressMonitor {

        private final WebAsyncTaskInfo asyncTask;

        public TaskProgressMonitor(DBRProgressMonitor original, WebAsyncTaskInfo asyncTask) {
            super(original);
            this.asyncTask = asyncTask;
        }

        @Override
        public void beginTask(String name, int totalWork) {
            super.beginTask(name, totalWork);
            asyncTask.setStatus(name);
        }

        @Override
        public void subTask(String name) {
            super.subTask(name);
            asyncTask.setStatus(name);
        }
    }

    private static class PersistentAttribute {
        private final Object value;

        public PersistentAttribute(Object value) {
            this.value = value;
        }

        public Object getValue() {
            return value;
        }
    }
}

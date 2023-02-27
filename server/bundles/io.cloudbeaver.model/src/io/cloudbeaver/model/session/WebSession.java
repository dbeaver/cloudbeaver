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
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.rm.RMUtils;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.DBWSessionHandler;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.CBModelConstants;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.eclipse.core.runtime.IAdaptable;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.BaseProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.ProxyProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.SMObjects;
import org.jkiss.dbeaver.model.security.user.SMObjectPermissions;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSSessionLogUpdatedEvent;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Web session.
 * Is the main source of data in web application
 */
public class WebSession extends BaseWebSession
    implements SMSession, SMCredentialsProvider, DBACredentialsProvider, IAdaptable {

    private static final Log log = Log.getLog(WebSession.class);

    public static final SMSessionType CB_SESSION_TYPE = new SMSessionType("CloudBeaver");
    private static final String WEB_SESSION_AUTH_CONTEXT_TYPE = "web-session";
    private static final String ATTR_LOCALE = "locale";

    private static final AtomicInteger TASK_ID = new AtomicInteger();

    private final AtomicInteger taskCount = new AtomicInteger();

    private long maxSessionIdleTime;
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
    private WebProjectImpl defaultProject;
    private final List<WebProjectImpl> accessibleProjects = new ArrayList<>();
    private final Map<String, DBWSessionHandler> sessionHandlers;

    public WebSession(
        @NotNull HttpSession httpSession,
        @NotNull WebApplication application,
        @NotNull Map<String, DBWSessionHandler> sessionHandlers,
        long maxSessionIdleTime
    ) throws DBException {
        super(httpSession.getId(), application);
        this.lastAccessTime = this.createTime;
        setLocale(CommonUtils.toString(httpSession.getAttribute(ATTR_LOCALE), this.locale));
        this.sessionHandlers = sessionHandlers;
        this.maxSessionIdleTime = maxSessionIdleTime;
    }

    @Override
    public SMSessionPrincipal getSessionPrincipal() {
        synchronized (authTokens) {
            if (authTokens.isEmpty()) {
                return null;
            }
            return authTokens.get(0);
        }
    }

    public WebApplication getApplication() {
        return application;
    }

    @NotNull
    public DBPProject getSingletonProject() {
        return defaultProject;
    }

    @Property
    public String getCreateTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(createTime);
    }

    @Property
    public synchronized String getLastAccessTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(lastAccessTime);
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

    public synchronized void refreshUserData() {
        refreshSessionAuth();

        initNavigatorModel();
    }

    /**
     * updates connections based on event in web session
     *
     * @param project       project of connection
     * @param connectionIds list of updated connections
     * @param type          type of event
     */
    public synchronized boolean updateProjectConnection(
        DBPProject project,
        List<String> connectionIds,
        WSEventType type
    ) {
        var sendDataSourceUpdatedEvent = false;
        DBPDataSourceRegistry registry = project.getDataSourceRegistry();
        // save old connections
        var oldDataSources = connectionIds.stream()
            .map(registry::getDataSource)
            .filter(Objects::nonNull)
            .collect(Collectors.toMap(
                DBPDataSourceContainer::getId,
                ds -> new DataSourceDescriptor((DataSourceDescriptor) ds, ds.getRegistry())
            ));
        registry.refreshConfig(connectionIds);
        for (String connectionId : connectionIds) {
            DataSourceDescriptor container = (DataSourceDescriptor) registry.getDataSource(connectionId);
            if (container == null) {
                continue;
            }
            sendDataSourceUpdatedEvent |= isSendDataSourceUpdatedEvent(type, oldDataSources.get(connectionId), container);
        }
        return sendDataSourceUpdatedEvent;
    }

    private boolean isSendDataSourceUpdatedEvent(WSEventType type, DataSourceDescriptor oldDataSource, DataSourceDescriptor newDataSource) {
        if (type == WSEventType.DATASOURCE_CREATED) {
            WebConnectionInfo connectionInfo = new WebConnectionInfo(this, newDataSource);
            this.connections.put(connectionInfo.getId(), connectionInfo);
        } else if (type == WSEventType.DATASOURCE_DELETED) {
            this.connections.remove(newDataSource.getId());
        } else {
            return !newDataSource.equalSettings(oldDataSource);
        }
        return true;
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
    }

    private void initNavigatorModel() {

        // Cleanup current data
        if (this.navigatorModel != null) {
            this.navigatorModel.dispose();
            this.navigatorModel = null;
        }

        if (!this.accessibleProjects.isEmpty()) {
            for (WebProjectImpl project : accessibleProjects) {
                if (project.equals(DBWorkbench.getPlatform().getWorkspace().getActiveProject())) {
                    continue;
                }
                project.dispose();
            }
            this.defaultProject = null;
            this.accessibleProjects.clear();
        }

        loadProjects();

        this.navigatorModel = new DBNModel(DBWorkbench.getPlatform(), this.accessibleProjects);
        this.navigatorModel.setModelAuthContext(sessionAuthContext);
        this.navigatorModel.initialize();

        this.locale = Locale.getDefault().getLanguage();

        try {
            this.refreshConnections();
        } catch (Exception e) {
            addSessionError(e);
            log.error("Error getting connection list", e);
        }
    }

    private void loadProjects() {
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
            if (defaultProject == null && !accessibleProjects.isEmpty()) {
                defaultProject = accessibleProjects.get(0);
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
        DBPDataSourceRegistry dataSourceRegistry = sessionProject.getDataSourceRegistry();
        dataSourceRegistry.setAuthCredentialsProvider(this);
        addSessionProject(sessionProject);
        if (!project.isShared() || application.isConfigurationMode()) {
            this.defaultProject = sessionProject;
        }
        return sessionProject;
    }

    public void refreshConnections() {

        // Add all provided datasources to the session
        List<WebConnectionInfo> connList = new ArrayList<>();
        for (DBPProject project : accessibleProjects) {
            DBPDataSourceRegistry registry = project.getDataSourceRegistry();

            for (DBPDataSourceContainer ds : registry.getDataSources()) {
                connList.add(new WebConnectionInfo(this, ds));
            }
            Throwable lastError = registry.getLastError();
            if (lastError != null) {
                addSessionError(lastError);
                log.error("Error refreshing connections from project '" + project.getId() + "'", lastError);
            }
        }

        // Add all provided datasources to the session
        synchronized (connections) {
            connections.clear();
            for (WebConnectionInfo connectionInfo : connList) {
                connections.put(connectionInfo.getId(), connectionInfo);
            }
        }
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
        WebUser user = getUser();

        try {
            return getSecurityController()
                .getAllAvailableObjectsPermissions(SMObjects.DATASOURCE)
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

    private synchronized void authAsAnonymousUser() throws DBException {
        if (!application.getAppConfiguration().isAnonymousAccessEnabled()) {
            return;
        }
        SMAuthInfo authInfo = getSecurityController().authenticateAnonymousUser(this.id, getSessionParameters(), CB_SESSION_TYPE);
        updateSMSession(authInfo);
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

    public synchronized void updateInfo(
        HttpServletRequest request,
        HttpServletResponse response,
        long maxSessionIdleTime
    ) throws DBWebException {
        touchSession();
        HttpSession httpSession = request.getSession();
        this.lastRemoteAddr = request.getRemoteAddr();
        this.lastRemoteUserAgent = request.getHeader("User-Agent");
        this.maxSessionIdleTime = maxSessionIdleTime;
        this.cacheExpired = false;
        if (!httpSession.isNew()) {
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

    @Association
    public List<WebConnectionInfo> getConnections() {
        synchronized (connections) {
            return new ArrayList<>(connections.values());
        }
    }

    @NotNull
    public WebConnectionInfo getWebConnectionInfo(@Nullable String projectId, String connectionID) throws DBWebException {
        WebConnectionInfo connectionInfo;
        synchronized (connections) {
            connectionInfo = connections.get(connectionID);
        }
        if (connectionInfo == null) {
            DBPDataSourceContainer dataSource = getProjectById(projectId).getDataSourceRegistry().getDataSource(connectionID);
            if (dataSource != null) {
                connectionInfo = new WebConnectionInfo(this, dataSource);
                synchronized (connections) {
                    connections.put(connectionID, connectionInfo);
                }
            } else {
                throw new DBWebException("Connection '" + connectionID + "' not found");
            }
        }
        return connectionInfo;
    }

    @Nullable
    public WebConnectionInfo findWebConnectionInfo(String connectionID) {
        synchronized (connections) {
            return connections.get(connectionID);
        }
    }

    public void addConnection(WebConnectionInfo connectionInfo) {
        synchronized (connections) {
            connections.put(connectionInfo.getId(), connectionInfo);
        }
    }

    public void removeConnection(WebConnectionInfo connectionInfo) {
        synchronized (connections) {
            connections.remove(connectionInfo.getId());
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
        this.sessionAuthContext.close();
        this.userContext.setUser(null);

        if (this.defaultProject != null) {
            this.defaultProject.dispose();
            this.defaultProject = null;
        }

        super.close();
    }

    private void clearAuthTokens() throws DBException {
        ArrayList<WebAuthInfo> tokensCopy;
        synchronized (authTokens) {
            tokensCopy = new ArrayList<>(this.authTokens);
        }
        for (WebAuthInfo ai : tokensCopy) {
            removeAuthInfo(ai);
        }
        resetAuthToken();
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
        addSessionEvent(new WSSessionLogUpdatedEvent());
    }

    public void addInfoMessage(String message) {
        addSessionMessage(new WebServerMessage(WebServerMessage.MessageType.INFO, message));
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
            if (value instanceof PersistentAttribute) {
                value = ((PersistentAttribute) value).getValue();
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
            if (value instanceof PersistentAttribute) {
                value = ((PersistentAttribute) value).getValue();
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

    public void removeAuthInfo(String providerId) throws DBException {
        if (providerId == null) {
            clearAuthTokens();
        } else {
            WebAuthInfo authInfo = getAuthInfo(providerId);
            if (authInfo != null) {
                removeAuthInfo(authInfo);
            }
        }
        if (authTokens.isEmpty()) {
            resetUserState();
        }
    }

    public List<DBACredentialsProvider> getContextCredentialsProviders() {
        return getAdapters(DBACredentialsProvider.class);
    }

    // Auth credentials provider
    // Adds auth properties passed from web (by user)
    @Override
    public boolean provideAuthParameters(@NotNull DBRProgressMonitor monitor, @NotNull DBPDataSourceContainer dataSourceContainer, @NotNull DBPConnectionConfiguration configuration) {
        try {
            // Properties from nested auth sessions
            for (DBACredentialsProvider contextCredentialsProvider : getContextCredentialsProviders()) {
                contextCredentialsProvider.provideAuthParameters(monitor, dataSourceContainer, configuration);
            }

            WebConnectionInfo webConnectionInfo = findWebConnectionInfo(dataSourceContainer.getId());
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
            configuration.getAuthModel().saveCredentials(dataSourceContainer, configuration, credentials);
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
            if (adapter.isInstance(authInfo.getAuthSession())) {
                return true;
            }
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
        if (projectId == null) {
            return defaultProject;
        }
        for (WebProjectImpl project : accessibleProjects) {
            if (project.getId().equals(projectId)) {
                return project;
            }
        }
        return null;
    }

    public List<WebProjectImpl> getAccessibleProjects() {
        return accessibleProjects;
    }

    public void addSessionProject(WebProjectImpl project) {
        synchronized (accessibleProjects) {
            accessibleProjects.add(project);
        }
        if (navigatorModel != null) {
            navigatorModel.getRoot().addProject(project, false);
        }
    }

    public void deleteSessionProject(DBPProject project) {
        synchronized (accessibleProjects) {
            accessibleProjects.remove(project);
        }
        if (navigatorModel != null) {
            navigatorModel.getRoot().removeProject(project);
        }
    }

    @Property
    public boolean isValid() {
        return getSessionActiveTimeLeft() > 0;
    }

    @Property
    public long getRemainingTime() {
        return getSessionActiveTimeLeft();
    }

    private long getSessionActiveTimeLeft() {
        return maxSessionIdleTime + lastAccessTime - System.currentTimeMillis();
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

    private class TaskProgressMonitor extends ProxyProgressMonitor {

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

    private class PersistentAttribute {
        private final Object value;

        public PersistentAttribute(Object value) {
            this.value = value;
        }

        public Object getValue() {
            return value;
        }
    }
}

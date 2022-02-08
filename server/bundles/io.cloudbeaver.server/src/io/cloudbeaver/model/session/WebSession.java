/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import io.cloudbeaver.*;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.sql.WebSQLConstants;
import org.eclipse.core.runtime.IAdaptable;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNativeCredentials;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.BaseProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.ProxyProgressMonitor;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.registry.ProjectMetadata;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Web session.
 * Is the main source of data in web application
 */
public class WebSession extends AbstractDBASessionPersistent implements DBASession, DBAAuthCredentialsProvider, IAdaptable {

    private static final Log log = Log.getLog(WebSession.class);

    private static final String ATTR_LOCALE = "locale";
    public static final String USER_PROJECTS_FOLDER = "user-projects";

    private static final AtomicInteger TASK_ID = new AtomicInteger();

    private final AtomicInteger taskCount = new AtomicInteger();

    private final String id;
    private final long createTime;
    private long lastAccessTime;
    private String lastRemoteAddr;
    private String lastRemoteUserAgent;
    private boolean persisted;

    private WebUser user;
    private Set<String> sessionPermissions = null;
    private Set<String> accessibleConnectionIds = Collections.emptySet();

    private String locale;
    private boolean cacheExpired;

    private final Map<String, WebConnectionInfo> connections = new HashMap<>();
    private final List<WebServerMessage> sessionMessages = new ArrayList<>();

    private final Map<String, WebAsyncTaskInfo> asyncTasks = new HashMap<>();
    private final Map<String, Function<Object, Object>> attributeDisposers = new HashMap<>();

    // Map of auth tokens. Key is authentication provdier
    private final List<WebAuthInfo> authTokens = new ArrayList<>();

    private DBNModel navigatorModel;
    private final DBRProgressMonitor progressMonitor = new SessionProgressMonitor();
    private ProjectMetadata sessionProject;
    private final SessionContextImpl sessionAuthContext;

    @NotNull
    public static Path getUserProjectsFolder() {
        return CBPlatform.getInstance().getWorkspace().getAbsolutePath().resolve(USER_PROJECTS_FOLDER);
    }

    public WebSession(HttpSession httpSession) {
        this.id = httpSession.getId();
        this.createTime = System.currentTimeMillis();
        this.lastAccessTime = this.createTime;
        this.locale = CommonUtils.toString(httpSession.getAttribute(ATTR_LOCALE), this.locale);
        this.sessionAuthContext = new SessionContextImpl(null);
        this.sessionAuthContext.addSession(this);

        try {
            // Check persistent state
            this.persisted = DBWSecurityController.getInstance().isSessionPersisted(this.id);
        } catch (Exception e) {
            log.error("Error checking session state,", e);
        }

        initNavigatorModel();
    }

    @NotNull
    @Override
    public DBAAuthSpace getSessionSpace() {
        return sessionProject;
    }

    @Override
    public DBASessionPrincipal getSessionPrincipal() {
        synchronized (authTokens) {
            if (authTokens.isEmpty()) {
                return null;
            }
            return authTokens.get(0);
        }
    }

    @NotNull
    @Property
    public String getSessionId() {
        return id;
    }

    @Override
    public boolean isApplicationSession() {
        return false;
    }

    @NotNull
    @Override
    public DBPProject getSingletonProject() {
        return sessionProject;
    }

    @NotNull
    public DBASessionContext getSessionContext() {
        return sessionProject.getSessionContext();
    }

    @Property
    public String getCreateTime() {
        return CBConstants.ISO_DATE_FORMAT.format(createTime);
    }

    @Property
    public synchronized String getLastAccessTime() {
        return CBConstants.ISO_DATE_FORMAT.format(lastAccessTime);
    }

    synchronized long getLastAccessTimeMillis() {
        return lastAccessTime;
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
        return user;
    }

    public synchronized boolean hasPermission(String perm) {
        return getSessionPermissions().contains(perm);
    }

    public synchronized Set<String> getSessionPermissions() {
        if (sessionPermissions == null) {
            refreshSessionAuth();
        }
        return sessionPermissions;
    }

    // Note: for admin use only
    public void forceUserRefresh(WebUser user) {
        if (!CommonUtils.equalObjects(this.user, user)) {
            // User has changed. We need to reset all session attributes
            clearAuthTokens();
            try {
                resetSessionCache();
            } catch (DBCException e) {
                addSessionError(e);
                log.error(e);
            }
        }

        this.user = user;

        refreshSessionAuth();

        initNavigatorModel();
    }

    private void initNavigatorModel() {
        CBPlatform platform = CBPlatform.getInstance();
        DBPProject globalProject = platform.getWorkspace().getActiveProject();

        String projectName;
        Path projectPath;
        if (user != null) {
            projectName = CommonUtils.escapeFileName(user.getUserId());
            projectPath = getUserProjectsFolder().resolve(projectName);
        } else {
            projectName = CommonUtils.escapeFileName(getSessionId());
            // For anonymous sessions use path of global project
            projectPath = globalProject.getAbsolutePath();
        }

        // Cleanup current data
        if (this.navigatorModel != null) {
            this.navigatorModel.dispose();
            this.navigatorModel = null;
        }

        if (this.sessionProject != null) {
            this.sessionProject.dispose();
            this.sessionProject = null;
        }

        this.sessionProject = new ProjectMetadata(
            platform.getWorkspace(),
            projectName,
            projectPath,
            sessionAuthContext);
        if (user == null) {
            sessionProject.setInMemory(true);
        }
        this.navigatorModel = new DBNModel(platform, this.sessionProject);
        this.navigatorModel.initialize();

        DBPDataSourceRegistry dataSourceRegistry = sessionProject.getDataSourceRegistry();
        ((DataSourceRegistry)dataSourceRegistry).setAuthCredentialsProvider(this);
        {
            // Copy global datasources.
            for (DBPDataSourceContainer ds : globalProject.getDataSourceRegistry().getDataSources()) {
                if (!ds.isTemplate() && isDataSourceAccessible(ds)) {
                    DataSourceDescriptor dsCopy = new DataSourceDescriptor((DataSourceDescriptor) ds, dataSourceRegistry, false);
                    dsCopy.setTemporary(true);
                    dataSourceRegistry.addDataSource(dsCopy);
                }
            }
        }

        this.locale = Locale.getDefault().getLanguage();

        try {
            this.refreshConnections();
        } catch (Exception e) {
            addSessionError(e);
            log.error("Error getting connection list", e);
        }
    }

    public void refreshConnections() {

        // Add all provided datasources to the session
        List<WebConnectionInfo> connList = new ArrayList<>();
        DBPDataSourceRegistry registry = sessionProject.getDataSourceRegistry();

        for (DBPDataSourceContainer ds : registry.getDataSources()) {
            WebConnectionInfo connectionInfo = new WebConnectionInfo(this, ds);
            connList.add(connectionInfo);
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
        CBApplication application = CBApplication.getInstance();
        String subjectId = user == null ?
            application.getAppConfiguration().getAnonymousUserRole() : user.getUserId();

        try {
            return Arrays.stream(application.getSecurityController()
                .getSubjectConnectionAccess(new String[]{subjectId}))
                .map(DBWConnectionGrant::getConnectionId).collect(Collectors.toSet());
        } catch (DBCException e) {
            addSessionError(e);
            log.error("Error reading connection grants", e);
            return Collections.emptySet();
        }
    }

    private void resetSessionCache() throws DBCException {
        // Clear attributes
        synchronized (attributes) {
            for (Map.Entry<String, Function<Object,Object>> attrDisposer : attributeDisposers.entrySet()) {
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

    private void refreshSessionAuth() {
        try {
            CBApplication application = CBPlatform.getInstance().getApplication();

            if (this.user == null) {
                if (application.getAppConfiguration().isAnonymousAccessEnabled()) {
                    sessionPermissions = application.getSecurityController().getSubjectPermissions(
                        application.getAppConfiguration().getAnonymousUserRole());
                } else {
                    sessionPermissions = Collections.emptySet();
                }
            } else {
                sessionPermissions = application.getSecurityController().getUserPermissions(this.user.getUserId());
            }

            accessibleConnectionIds = readAccessibleConnectionIds();

        } catch (Exception e) {
            addSessionError(e);
            log.error("Error reading session permissions", e);
        }
    }

    @NotNull
    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
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

    synchronized void updateInfo(HttpServletRequest request, HttpServletResponse response) {
        HttpSession httpSession = request.getSession();
        this.lastAccessTime = System.currentTimeMillis();
        this.lastRemoteAddr = request.getRemoteAddr();
        this.lastRemoteUserAgent = request.getHeader("User-Agent");
        this.cacheExpired = false;
        if (!httpSession.isNew()) {
            try {
                // Persist session
                if (!this.persisted) {
                    // Create new record
                    DBWSecurityController.getInstance().createSession(this);
                    this.persisted = true;
                } else {
                    if (!CBApplication.getInstance().isConfigurationMode()) {
                        // Update record
                        DBWSecurityController.getInstance().updateSession(this);
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
    public WebConnectionInfo getWebConnectionInfo(String connectionID) throws DBWebException {
        WebConnectionInfo connectionInfo;
        synchronized (connections) {
            connectionInfo = connections.get(connectionID);
        }
        if (connectionInfo == null) {
            DBPDataSourceContainer dataSource = WebServiceUtils.getLocalOrGlobalDataSource(this, connectionID);
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

    void close() {
        try {
            resetNavigationModel();
            resetSessionCache();
        } catch (Throwable e) {
            log.error(e);
        }
        clearAuthTokens();
        this.sessionAuthContext.close();
        this.user = null;

        if (this.sessionProject != null) {
            this.sessionProject.dispose();
            this.sessionProject = null;
        }
    }

    private void clearAuthTokens() {
        ArrayList<WebAuthInfo> tokensCopy;
        synchronized (authTokens) {
            tokensCopy = new ArrayList<>(this.authTokens);
        }
        for (WebAuthInfo ai : tokensCopy) {
            removeAuthInfo(ai);
        }
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
                    Number queryLimit = CBApplication.getInstance().getAppConfiguration().getResourceQuota(WebSQLConstants.QUOTA_PROP_QUERY_LIMIT);
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
        synchronized (sessionMessages) {
            sessionMessages.add(new WebServerMessage(exception));
        }
    }

    public void addSessionMessage(WebServerMessage message) {
        synchronized (sessionMessages) {
            sessionMessages.add(message);
        }
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

    public void addAuthTokens(@NotNull WebAuthInfo ... tokens) throws DBException {
        WebUser newUser = null;
        for (WebAuthInfo authInfo : tokens) {
            if (newUser != null && newUser != authInfo.getUser()) {
                throw new DBException("Different users specified in auth tokens: " + Arrays.toString(tokens));
            }
            newUser = authInfo.getUser();
        }
        if (this.user == null && newUser != null) {
            forceUserRefresh(newUser);
        } else if (!CommonUtils.equalObjects(this.user, newUser)) {
            throw new DBException("Can't authorize different users in the single session");
        }

        for (WebAuthInfo authInfo : tokens) {
            WebAuthInfo oldAuthInfo = getAuthInfo(authInfo.getAuthProviderDescriptor().getId());
            if (oldAuthInfo != null) {
                removeAuthInfo(oldAuthInfo);
            }
            DBASession authSession = authInfo.getAuthSession();
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
        for (WebSessionHandlerDescriptor hd : WebHandlerRegistry.getInstance().getSessionHandlers()) {
            try {
                hd.getInstance().handleSessionAuth(this);
            } catch (Exception e) {
                log.error("Error calling session handler '" + hd.getId() + "'", e);
            }
        }
    }

    private void removeAuthInfo(WebAuthInfo oldAuthInfo) {
        oldAuthInfo.closeAuth();
        synchronized (authTokens) {
            authTokens.remove(oldAuthInfo);
        }
    }

    public void removeAuthInfo(String providerId) {
        if (providerId == null) {
            clearAuthTokens();
        } else {
            removeAuthInfo(getAuthInfo(providerId));
        }
        if (authTokens.isEmpty()) {
            forceUserRefresh(null);
        }
    }

    public boolean hasContextCredentials() {
        return getAdapter(DBAAuthCredentialsProvider.class) != null;
    }

    // Auth credentials provider
    // Adds auth properties passed from web (by user)
    @Override
    public boolean provideAuthParameters(@NotNull DBRProgressMonitor monitor, @NotNull DBPDataSourceContainer dataSourceContainer, @NotNull DBPConnectionConfiguration configuration) {
        try {
            // Properties from nested auth sessions
            // FIXME: we need to support multiple credential providers (e.g. multiple clouds).
            DBAAuthCredentialsProvider nestedProvider = getAdapter(DBAAuthCredentialsProvider.class);
            if (nestedProvider != null) {
                if (!nestedProvider.provideAuthParameters(monitor, dataSourceContainer, configuration)) {
                    return false;
                }
            }
            WebConnectionInfo webConnectionInfo = findWebConnectionInfo(dataSourceContainer.getId());
            if (webConnectionInfo != null) {
                WebServiceUtils.saveCredentialsInDataSource(webConnectionInfo, dataSourceContainer, configuration);
            }

            // Save auth credentials in connection config (e.g. sets user name and password in DBPConnectionConfiguration)
            // FIXME: get rid of this. It is a hack because native auth model keeps settings in special props
            //DBAAuthCredentials credentials = configuration.getAuthModel().loadCredentials(dataSourceContainer, configuration);
            if (configuration.getAuthModel() instanceof AuthModelDatabaseNative) {
                String userName = configuration.getAuthProperty(AuthModelDatabaseNativeCredentials.PROP_USER_NAME);
                if (userName != null) {
                    configuration.setUserName(userName);
                }
                String userPassword = configuration.getAuthProperty(AuthModelDatabaseNativeCredentials.PROP_USER_PASSWORD);
                if (userPassword != null) {
                    configuration.setUserPassword(userPassword);
                }
            }
            //WebServiceUtils.saveAuthProperties(dataSourceContainer, configuration, null);

//            DBAAuthCredentials credentials = configuration.getAuthModel().loadCredentials(dataSourceContainer, configuration);
//
//            InstanceCreator<DBAAuthCredentials> credTypeAdapter = type -> credentials;
//            Gson credGson = new GsonBuilder()
//                .setLenient()
//                .registerTypeAdapter(credentials.getClass(), credTypeAdapter)
//                .create();
//
//            credGson.fromJson(credGson.toJsonTree(authProperties), credentials.getClass());
//            configuration.getAuthModel().saveCredentials(dataSourceContainer, configuration, credentials);
        } catch (DBException e) {
            addSessionError(e);
            log.error(e);
        }
        return true;
    }

    // May be called to extract auth information from session
    @Override
    public <T> T getAdapter(Class<T> adapter) {
        synchronized (authTokens) {
            for (WebAuthInfo authInfo : authTokens) {
                if (authInfo != null && authInfo.getAuthSession() != null) {
                    if (adapter.isInstance(authInfo.getAuthSession())) {
                        return adapter.cast(authInfo.getAuthSession());
                    }
                }
            }
        }
        return null;
    }

    ///////////////////////////////////////////////////////
    // Utils

    private class SessionProgressMonitor extends BaseProgressMonitor {
        @Override
        public void beginTask(String name, int totalWork) {
            synchronized (sessionMessages) {
                sessionMessages.add(new WebServerMessage(WebServerMessage.MessageType.INFO, name));
            }
        }

        @Override
        public void subTask(String name) {
            synchronized (sessionMessages) {
                sessionMessages.add(new WebServerMessage(WebServerMessage.MessageType.INFO, name));
            }
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

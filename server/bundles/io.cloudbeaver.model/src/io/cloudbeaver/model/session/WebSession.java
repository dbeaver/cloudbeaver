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

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.app.WebApplication;
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
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.auth.impl.AbstractSessionPersistent;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNative;
import org.jkiss.dbeaver.model.impl.auth.AuthModelDatabaseNativeCredentials;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.BaseProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.ProxyProgressMonitor;
import org.jkiss.dbeaver.model.security.*;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.registry.ProjectMetadata;
import org.jkiss.dbeaver.runtime.DBWorkbench;
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
public class WebSession extends AbstractSessionPersistent implements SMSession, SMCredentialsProvider, DBACredentialsProvider, IAdaptable {

    private static final Log log = Log.getLog(WebSession.class);

    public static final SMSessionType CB_SESSION_TYPE = new SMSessionType("CloudBeaver");

    private static final String ATTR_LOCALE = "locale";

    private static final AtomicInteger TASK_ID = new AtomicInteger();

    private final AtomicInteger taskCount = new AtomicInteger();

    private final String id;
    private final long createTime;
    private long lastAccessTime;
    private String lastRemoteAddr;
    private String lastRemoteUserAgent;

    private WebUser user;
    private Set<String> sessionPermissions = null;
    private Set<String> accessibleConnectionIds = Collections.emptySet();
    private SMCredentials smCredentials = null;

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
    private SMController securityController;
    private SMAdminController adminSecurityController;
    private RMController rmController;
    private final WebApplication application;
    private final Map<String, DBWSessionHandler> sessionHandlers;

    @NotNull
    public static Path getUserProjectsFolder() {
        return DBWorkbench.getPlatform().getWorkspace().getAbsolutePath().resolve(DBWConstants.USER_PROJECTS_FOLDER);
    }

    public WebSession(HttpSession httpSession,
                      WebApplication application,
                      Map<String, DBWSessionHandler> sessionHandlers) {
        this.id = httpSession.getId();
        this.createTime = System.currentTimeMillis();
        this.lastAccessTime = this.createTime;
        this.locale = CommonUtils.toString(httpSession.getAttribute(ATTR_LOCALE), this.locale);
        this.sessionAuthContext = new SessionContextImpl(null);
        this.sessionAuthContext.addSession(this);
        this.application = application;
        this.sessionHandlers = sessionHandlers;
        this.securityController = application.getSecurityController(this);

        initNavigatorModel();
    }

    @NotNull
    @Override
    public SMAuthSpace getSessionSpace() {
        return sessionProject;
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
    public SMSessionContext getSessionContext() {
        return sessionProject.getSessionContext();
    }

    @Property
    public String getCreateTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(createTime);
    }

    @Property
    public synchronized String getLastAccessTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(lastAccessTime);
    }

    public synchronized long getLastAccessTimeMillis() {
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

    public synchronized Map<String, String> getUserMetaParameters() {
        if (user == null) {
            return Map.of();
        }
        var allMetaParams = new HashMap<>(user.getMetaParameters());

        getAllAuthInfo().forEach(authInfo -> allMetaParams.putAll(authInfo.getUserIdentity().getMetaParameters()));

        return allMetaParams;
    }

    public synchronized String getUserId() {
        return user == null ? null : user.getUserId();
    }

    public synchronized boolean hasPermission(String perm) {
        return getSessionPermissions().contains(perm);
    }

    public synchronized boolean isAuthorizedInSecurityManager() {
        return smCredentials != null;
    }

    public synchronized Set<String> getSessionPermissions() {
        if (sessionPermissions == null) {
            refreshSessionAuth();
        }
        return sessionPermissions;
    }

    @NotNull
    public synchronized SMController getSecurityController() {
        return securityController;
    }

    @Nullable
    public synchronized SMAdminController getAdminSecurityController() {
        if (!hasPermission(DBWConstants.PERMISSION_ADMIN)) {
            return null;
        }
        return adminSecurityController;
    }

    public synchronized RMController getRmController() {
        return rmController;
    }

    public synchronized void refreshUserData() {
        refreshSessionAuth();

        initNavigatorModel();
    }

    // Note: for admin use only
    public synchronized void resetUserState() {
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
        DBPPlatform platform = DBWorkbench.getPlatform();
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
        ((DataSourceRegistry) dataSourceRegistry).setAuthCredentialsProvider(this);
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
        String subjectId = user == null ?
            application.getAppConfiguration().getAnonymousUserRole() : user.getUserId();

        try {
            return Arrays.stream(securityController
                    .getSubjectConnectionAccess(new String[]{subjectId}))
                .map(SMDataSourceGrant::getDataSourceId).collect(Collectors.toSet());
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
                sessionPermissions = securityController.getUserPermissions(getUserId());
            }
            refreshAccessibleConnectionIds();

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
            this.sessionPermissions = Collections.emptySet();
            return;
        }
        SMAuthInfo authInfo = securityController.authenticateAnonymousUser(this.id, getSessionParameters(), CB_SESSION_TYPE);
        updateSMAuthInfo(authInfo);
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

    public synchronized void updateInfo(HttpServletRequest request, HttpServletResponse response) throws DBWebException {
        HttpSession httpSession = request.getSession();
        this.lastAccessTime = System.currentTimeMillis();
        this.lastRemoteAddr = request.getRemoteAddr();
        this.lastRemoteUserAgent = request.getHeader("User-Agent");
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
                        securityController.updateSession(this.id, getUserId(), getSessionParameters());
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
            DBPDataSourceContainer dataSource = WebDataSourceUtils.getLocalOrGlobalDataSource(application, this, connectionID);
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

    public void close() {
        try {
            resetNavigationModel();
            resetSessionCache();
        } catch (Throwable e) {
            log.error(e);
        }
        clearAuthTokens();
        this.sessionAuthContext.close();
        setUser(null);

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

    public void addAuthTokens(@NotNull WebAuthInfo... tokens) throws DBException {
        WebUser newUser = null;
        for (WebAuthInfo authInfo : tokens) {
            if (newUser != null && newUser != authInfo.getUser()) {
                throw new DBException("Different users specified in auth tokens: " + Arrays.toString(tokens));
            }
            newUser = authInfo.getUser();
        }
        if (application.isConfigurationMode() && this.user == null && newUser != null) {
            //FIXME hotfix to avoid exception after external auth provider login in easy config
            setUser(newUser);
            refreshUserData();
        } else if (!CommonUtils.equalObjects(this.user, newUser)) {
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

    public void removeAuthInfo(String providerId) {
        if (providerId == null) {
            clearAuthTokens();
        } else {
            removeAuthInfo(getAuthInfo(providerId));
        }
        if (authTokens.isEmpty()) {
            resetUserState();
        }
    }

    public boolean hasContextCredentials() {
        return getAdapter(DBACredentialsProvider.class) != null;
    }

    // Auth credentials provider
    // Adds auth properties passed from web (by user)
    @Override
    public boolean provideAuthParameters(@NotNull DBRProgressMonitor monitor, @NotNull DBPDataSourceContainer dataSourceContainer, @NotNull DBPConnectionConfiguration configuration) {
        try {
            // Properties from nested auth sessions
            // FIXME: we need to support multiple credential providers (e.g. multiple clouds).
            DBACredentialsProvider nestedProvider = getAdapter(DBACredentialsProvider.class);
            if (nestedProvider != null) {
                if (!nestedProvider.provideAuthParameters(monitor, dataSourceContainer, configuration)) {
                    return false;
                }
            }
            WebConnectionInfo webConnectionInfo = findWebConnectionInfo(dataSourceContainer.getId());
            if (webConnectionInfo != null) {
                WebDataSourceUtils.saveCredentialsInDataSource(webConnectionInfo, dataSourceContainer, configuration);
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

    public Map<String, Object> getSessionParameters() {
        var parameters = new HashMap<String, Object>();
        parameters.put(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS, getLastRemoteAddr());
        parameters.put(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT, getLastRemoteUserAgent());
        return parameters;
    }

    public synchronized void resetAuthToken() {
        this.sessionPermissions = null;
        this.smCredentials = null;
        this.user = null;
        this.securityController = application.getSecurityController(this);
        this.adminSecurityController = null;
        this.rmController = application.getResourceController(this);
    }

    public synchronized void updateSMAuthInfo(SMAuthInfo smAuthInfo) throws DBException {
        var isNonAnonymousUserAuthorized = isAuthorizedInSecurityManager() && getUser() != null;
        var tokenInfo = smAuthInfo.getUserInfo();
        if (isNonAnonymousUserAuthorized && !Objects.equals(getUserId(), tokenInfo.getUserId())) {
            throw new DBCException("Another user is already logged in");
        }
        this.smCredentials = new SMCredentials(smAuthInfo.getAuthToken(), tokenInfo.getUserId());
        this.sessionPermissions = tokenInfo.getPermissions();
        this.securityController = application.getSecurityController(this);
        this.adminSecurityController = application.getAdminSecurityController(this);
        this.rmController = application.getResourceController(this);

        setUser(tokenInfo.getUserId() == null ? null : new WebUser(securityController.getUserById(tokenInfo.getUserId())));
        refreshUserData();
    }

    private synchronized void setUser(@Nullable WebUser user) {
        this.user = user;
    }

    @Override
    public SMCredentials getActiveUserCredentials() {
        return smCredentials;
    }

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

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
package io.cloudbeaver.model.session;

import io.cloudbeaver.*;
import io.cloudbeaver.model.CustomCancelableJob;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletAuthApplication;
import io.cloudbeaver.model.session.monitor.TaskProgressMonitor;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.DBWSessionHandler;
import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.utils.CBModelConstants;
import io.cloudbeaver.utils.WebDataSourceUtils;
import io.cloudbeaver.utils.WebEventUtils;
import org.eclipse.core.runtime.IAdaptable;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPEventListener;
import org.jkiss.dbeaver.model.access.DBAAuthCredentials;
import org.jkiss.dbeaver.model.access.DBACredentialsProvider;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.connection.DBPConnectionConfiguration;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.fs.DBFFileSystemManager;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.BaseProgressMonitor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.websocket.event.MessageType;
import org.jkiss.dbeaver.model.websocket.event.WSSessionLogUpdatedEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
/**
 * Web session.
 * Is the main source of data in web application
 */
//TODO: split to authenticated and non authenticated context
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

    private String locale;
    private boolean cacheExpired;

    protected WebSessionGlobalProjectImpl globalProject;
    private final List<WebServerMessage> sessionMessages = new ArrayList<>();

    private final Map<String, WebAsyncTaskInfo> asyncTasks = new HashMap<>();
    private final Map<String, Function<Object, Object>> attributeDisposers = new HashMap<>();

    // Map of auth tokens. Key is authentication provider
    private final List<WebAuthInfo> authTokens = new ArrayList<>();

    private DBNModel navigatorModel;
    private final DBRProgressMonitor progressMonitor = new SessionProgressMonitor();
    private final Map<String, DBWSessionHandler> sessionHandlers;
    private final WebDataSourceConnectEventListener connectListener = new WebDataSourceConnectEventListener(this);

    public WebSession(
        @NotNull WebHttpRequestInfo requestInfo,
        @NotNull ServletAuthApplication application,
        @NotNull Map<String, DBWSessionHandler> sessionHandlers
    ) throws DBException {
        this(requestInfo.getId(),
            CommonUtils.toString(requestInfo.getLocale()),
            application,
            sessionHandlers
        );
        updateSessionParameters(requestInfo);
    }

    protected WebSession(
        @NotNull String id,
        @Nullable String locale,
        @NotNull ServletApplication application,
        @NotNull Map<String, DBWSessionHandler> sessionHandlers
    ) throws DBException {
        super(id, application);
        this.lastAccessTime = this.createTime;
        this.sessionHandlers = sessionHandlers;
        setLocale(CommonUtils.toString(locale, this.locale));
        //force authorization of anonymous session to avoid access error,
        //because before authorization could be called by any request,
        //but now 'updateInfo' is called only in special requests,
        //and the order of requests is not guaranteed.
        //look at CB-4747
        refreshSessionAuth();
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

    @Nullable
    public WebSessionProjectImpl getSingletonProject() {
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

    @NotNull
    public DBPEventListener getDataSourceConnectListener() {
        return connectListener;
    }

    private void initNavigatorModel() {

        // Cleanup current data
        if (this.navigatorModel != null) {
            this.navigatorModel.dispose();
            this.navigatorModel = null;
        }
        this.globalProject = null;

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
        try {
            RMController controller = getRmController();
            RMProject[] rmProjects = controller.listAccessibleProjects();
            for (RMProject project : rmProjects) {
                createWebProject(project);
            }
            if (user == null && application.getAppConfiguration().isAnonymousAccessEnabled()) {
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

    private WebSessionProjectImpl createWebProject(RMProject project) throws DBException {
        WebSessionProjectImpl sessionProject;
        if (project.isGlobal()) {
            sessionProject = createGlobalProject(project);
        } else {
            sessionProject = createSessionProject(project);
        }
        // do not load data sources for anonymous project
        if (project.getType() == RMProjectType.USER && userContext.getUser() == null) {
            sessionProject.setInMemory(true);
        }
        addSessionProject(sessionProject);
        if (!project.isShared() || application.isConfigurationMode()) {
            getWorkspace().setActiveProject(sessionProject);
        }
        log.info(String.format(
            "Project created: [ID=%s, Name=%s, Type=%s, Creator=%s]",
            project.getId(), project.getName(), project.getType(), project.getCreator()
        ));
        return sessionProject;
    }

    protected WebSessionProjectImpl createSessionProject(@NotNull RMProject project) throws DBException {
        return new WebSessionProjectImpl(this, project, getProjectPath(project));
    }

    @NotNull
    protected Path getProjectPath(@NotNull RMProject project) throws DBException {
        return RMUtils.getProjectPath(project);
    }

    protected WebSessionProjectImpl createGlobalProject(RMProject project) {
        globalProject = new WebSessionGlobalProjectImpl(this, project);
        globalProject.refreshAccessibleConnectionIds();
        return globalProject;
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
        getWorkspace().getProjects().forEach(WebSessionProjectImpl::dispose);

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
                if (globalProject != null) {
                    globalProject.refreshAccessibleConnectionIds();
                }
            }

        } catch (Exception e) {
            addSessionError(e);
            log.error("Error reading session permissions", e);
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

    @Nullable
    public DBNModel getNavigatorModel() {
        return navigatorModel;
    }

    @NotNull
    public DBNModel getNavigatorModelOrThrow() throws DBWebException {
        if (navigatorModel != null) {
            return navigatorModel;
        }
        throw new DBWebException("Navigator model is not found in session");
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

    public synchronized void updateSessionParameters(WebHttpRequestInfo requestInfo) {
        this.lastRemoteAddr = requestInfo.getLastRemoteAddress();
        this.lastRemoteUserAgent = requestInfo.getLastRemoteUserAgent();
        this.cacheExpired = false;
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
    public void close(boolean clearTokens, boolean sendSessionExpiredEvent) {
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
        super.close(clearTokens, sendSessionExpiredEvent);
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

    public WebAsyncTaskInfo getAsyncTask(@NotNull String taskId, @NotNull String taskName, boolean create) {
        synchronized (asyncTasks) {
            WebAsyncTaskInfo taskInfo = asyncTasks.get(taskId);
            if (taskInfo == null && create) {
                taskInfo = new WebAsyncTaskInfo(taskId, taskName);
                asyncTasks.put(taskId, taskInfo);
            }
            return taskInfo;
        }
    }

    @NotNull
    public WebAsyncTaskInfo asyncTaskStatus(String taskId, boolean removeOnFinish) throws DBWebException {
        synchronized (asyncTasks) {
            WebAsyncTaskInfo taskInfo = asyncTasks.get(taskId);
            if (taskInfo == null) {
                throw new DBWebException("Task '" + taskId + "' not found");
            }
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
        if (job instanceof CustomCancelableJob cancelableJob) {
            cancelableJob.cancelJob(this, taskInfo);
        }
        if (job != null) {
            job.cancel();
        }
        return true;
    }


    public WebAsyncTaskInfo createAsyncTask(@NotNull String taskName) {
        int taskId = TASK_ID.incrementAndGet();
        WebAsyncTaskInfo asyncTask = getAsyncTask(String.valueOf(taskId), taskName, true);
        return asyncTask;
    }

    public List<WebAsyncTaskInfo> findTasksByJob(@NotNull Class<? extends AbstractJob> jobClass) {
        synchronized (asyncTasks) {
            List<WebAsyncTaskInfo> result = new ArrayList<>();
            for (WebAsyncTaskInfo task : asyncTasks.values()) {
                if (task.getJob() != null && jobClass.isAssignableFrom(task.getJob().getClass())) {
                    result.add(task);
                }
            }
            return result;
        }
    }

    public WebAsyncTaskInfo createAndRunAsyncTask(@NotNull String taskName, @NotNull WebAsyncTaskProcessor<?> runnable) {
        WebAsyncTaskInfo asyncTask = createAsyncTask(taskName);

        AbstractJob job = new AbstractJob(taskName) {
            @Override
            protected IStatus run(DBRProgressMonitor monitor) {
                int curTaskCount = taskCount.incrementAndGet();

                DBRProgressMonitor taskMonitor = new TaskProgressMonitor(monitor, WebSession.this, asyncTask);

                try {
                    Number queryLimit = application.getAppConfiguration().getResourceQuota(WebSQLConstants.QUOTA_PROP_QUERY_LIMIT);
                    if (queryLimit != null && curTaskCount > queryLimit.intValue()) {
                        throw new DBQuotaException(
                            "Maximum simultaneous queries quota exceeded", WebSQLConstants.QUOTA_PROP_QUERY_LIMIT, queryLimit.intValue(), curTaskCount);
                    }

                    runnable.run(taskMonitor);
                    asyncTask.setResult(runnable.getResult());
                    asyncTask.setExtendedResult(runnable.getExtendedResults());
                    asyncTask.setStatus(DBWConstants.TASK_STATUS_FINISHED);
                } catch (InvocationTargetException e) {
                    addSessionError(e.getTargetException());
                    asyncTask.setJobError(e.getTargetException());
                } catch (Exception e) {
                    asyncTask.setJobError(e);
                } finally {
                    taskCount.decrementAndGet();
                    asyncTask.setRunning(false);
                    WebEventUtils.sendAsyncTaskEvent(WebSession.this, asyncTask);
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
            this.userContext.getSmSessionId(),
            this.userContext.getUserId(),
            message.getType(),
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
                value = persistentAttribute.value();
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
                value = persistentAttribute.value();
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

            WebSessionProjectImpl project = getProjectById(dataSourceContainer.getProject().getId());
            if (project != null) {
                WebConnectionInfo webConnectionInfo = project.findWebConnectionInfo(dataSourceContainer.getId());
                if (webConnectionInfo != null) {
                    WebDataSourceUtils.saveCredentialsInDataSource(webConnectionInfo, dataSourceContainer, configuration);
                }
            }

            // uncommented because we had the problem with non-native auth models
            // (for example, can't connect to DynamoDB if credentials are not saved)
            DBAAuthCredentials credentials = configuration.getAuthModel().loadCredentials(dataSourceContainer, configuration);
            WebDataSourceUtils.updateCredentialsFromProperties(credentials, configuration.getAuthProperties());

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
    public WebSessionProjectImpl getProjectById(@Nullable String projectId) {
        return getWorkspace().getProjectById(projectId);
    }

    /**
     * Returns project info from session cache.
     *
     * @throws DBWebException if project with provided id is not found.
     */
    public WebSessionProjectImpl getAccessibleProjectById(@Nullable String projectId) throws DBWebException {
        WebSessionProjectImpl project = null;
        if (projectId != null) {
            project = getWorkspace().getProjectById(projectId);
        }
        if (project == null) {
            throw new DBWebException("Project not found: " + projectId);
        }
        return project;
    }

    public List<WebSessionProjectImpl> getAccessibleProjects() {
        return getWorkspace().getProjects();
    }

    /**
     * Adds project to session cache and navigator tree.
     */
    public void addSessionProject(@NotNull WebSessionProjectImpl project) {
        getWorkspace().addProject(project);
        if (navigatorModel != null) {
            navigatorModel.getRoot().addProject(project, false);
        }
    }

    /**
     * Removes project from session cache and navigator tree.
     */
    public void deleteSessionProject(@Nullable WebSessionProjectImpl project) {
        if (project != null) {
            RMProject rmProject = project.getRMProject();
            log.info(String.format(
                "Project deleted: [ID=%s, Name=%s, Type=%s, Creator=%s]",
                rmProject.getId(), rmProject.getName(), rmProject.getType(), rmProject.getCreator()
            ));
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
    public WebSessionPreferenceStore getUserPreferenceStore() {
        return getUserContext().getPreferenceStore();
    }

    @Nullable
    public WebSessionGlobalProjectImpl getGlobalProject() {
        return globalProject;
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


    private record PersistentAttribute(Object value) {
    }
}

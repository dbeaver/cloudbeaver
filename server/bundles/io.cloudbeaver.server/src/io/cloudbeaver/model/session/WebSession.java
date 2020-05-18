/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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

import io.cloudbeaver.DBWSecurityController;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNProject;
import org.jkiss.dbeaver.model.navigator.DBNProjectDatabases;
import org.jkiss.dbeaver.model.runtime.*;
import org.jkiss.dbeaver.runtime.jobs.DisconnectJob;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

/**
 * Web session.
 * Is the main source of data in web application
 */
public class WebSession {

    private static final Log log = Log.getLog(WebSession.class);

    private static final String ATTR_LOCALE = "locale";

    private static final AtomicInteger TASK_ID = new AtomicInteger();

    private final String id;
    private final long createTime;
    private long lastAccessTime;
    private String lastRemoteAddr;
    private String lastRemoteUserAgent;
    private boolean persisted;

    private WebUser user;
    private Set<String> sessionPermissions = null;
    private String locale;
    private boolean cacheExpired;

    private final List<WebConnectionInfo> connections = new ArrayList<>();
    private final List<WebServerMessage> progressMessages = new ArrayList<>();

    private final Map<String, WebAsyncTaskInfo> asyncTasks = new HashMap<>();
    private final Map<String, Object> attributes = new HashMap<>();
    private final Map<String, Function<Object,Object>> attributeDisposers = new HashMap<>();

    private DBNModel navigatorModel;
    private DBNProjectDatabases databases;
    private DBRProgressMonitor progressMonitor = new SessionProgressMonitor();

    public WebSession(HttpSession httpSession) {
        this.id = httpSession.getId();
        this.createTime = System.currentTimeMillis();
        this.lastAccessTime = this.createTime;
        this.locale = CommonUtils.toString(httpSession.getAttribute(ATTR_LOCALE), this.locale);

        if (!httpSession.isNew()) {
            try {
                // Check persistent state
                this.persisted = DBWSecurityController.getInstance().isSessionPersisted(this.id);
            } catch (Exception e) {
                log.error("Error checking session state,", e);
            }
        }

        initNavigatorModel();
    }

    @Property
    public String getId() {
        return id;
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

    public synchronized Set<String> getSessionPermissions() throws DBCException {
        if (sessionPermissions == null) {
            refreshSessionAuth();
        }
        return sessionPermissions;
    }

    public synchronized void setUser(WebUser user) {
        if (CommonUtils.equalObjects(this.user, user)) {
            return;
        }
        this.user = user;

        try {
            resetSessionCache();
            initNavigatorModel();
        } catch (DBCException e) {
            log.error(e);
        }
        try {
            refreshSessionAuth();
        } catch (DBCException e) {
            log.error(e);
        }
    }

    private void initNavigatorModel() {
        CBPlatform platform = CBPlatform.getInstance();
        this.navigatorModel = new DBNModel(platform, false);
        this.navigatorModel.initialize();

        DBPProject project = platform.getWorkspace().getActiveProject();
        DBNProject projectNode = this.navigatorModel.getRoot().getProjectNode(project);
        this.databases = projectNode.getDatabases();
        this.locale = Locale.getDefault().getLanguage();

        // Add all provided datasources to the session
        synchronized (connections) {
            for (DBPDataSourceContainer ds : databases.getDataSourceRegistry().getDataSources()) {
                if (ds.isProvided()) {
                    WebConnectionInfo connectionInfo = new WebConnectionInfo(this, ds);
                    connections.add(connectionInfo);
                }
            }
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
            attributes.clear();
        }

        List<WebConnectionInfo> conCopy;
        synchronized (this.connections) {
            conCopy = new ArrayList<>(this.connections);
            this.connections.clear();
        }

        for (WebConnectionInfo connectionInfo : conCopy) {
            if (connectionInfo.isConnected()) {
                new DisconnectJob(connectionInfo.getDataSourceContainer()).schedule();
            }
        }

        if (this.navigatorModel != null) {
            this.navigatorModel.dispose();
            this.navigatorModel = null;
        }
        this.databases = null;
    }

    private void refreshSessionAuth() throws DBCException {
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

    public DBNProjectDatabases getDatabases() {
        return databases;
    }

    public DBNNode getNavigatorNodes() {
        return databases;
    }

    /**
     * Returns and clears progress messages
     */
    @Association
    public List<WebServerMessage> getProgressMessages() {
        synchronized (progressMessages) {
            List<WebServerMessage> copy = new ArrayList<>(progressMessages);
            progressMessages.clear();
            return copy;
        }
    }

    synchronized void updateInfo(HttpServletRequest request) {
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
                    // Update record
                    DBWSecurityController.getInstance().updateSession(this);
                }
            } catch (Exception e) {
                log.error("Error persisting web session", e);
            }
        }
    }

    @Association
    public List<WebConnectionInfo> getConnections() {
        synchronized (connections) {
            return new ArrayList<>(connections);
        }
    }

    @NotNull
    public WebConnectionInfo getWebConnectionInfo(String connectionID) throws DBWebException {
        WebConnectionInfo connectionInfo = null;
        synchronized (connections) {
            for (WebConnectionInfo ci : connections) {
                if (ci.getId().equals(connectionID)) {
                    connectionInfo = ci;
                    break;
                }
            }
        }
        if (connectionInfo == null) {
            throw new DBWebException("Connection '" + connectionID + "' not found");
        }
        return connectionInfo;
    }


    public void addConnection(WebConnectionInfo connectionInfo) {
        synchronized (connections) {
            connections.add(connectionInfo);
        }
    }

    public void removeConnection(WebConnectionInfo connectionInfo) {
        synchronized (connections) {
            connections.remove(connectionInfo);
        }
    }

    void close() {
        try {
            resetSessionCache();
        } catch (Throwable e) {
            log.error(e);
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

    public WebAsyncTaskInfo asyncTaskStatus(String taskId) throws DBWebException {
        synchronized (asyncTasks) {
            WebAsyncTaskInfo taskInfo = asyncTasks.get(taskId);
            if (taskInfo == null) {
                throw new DBWebException("Task '" + taskId + "' not found");
            }
            taskInfo.setRunning(taskInfo.getJob() != null && !taskInfo.getJob().isFinished());
            if (!taskInfo.isRunning()) {
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

    public WebAsyncTaskInfo createAndRunAsyncTask(String taskName, DBRRunnableWithResult runnable) {
        int taskId = TASK_ID.incrementAndGet();
        WebAsyncTaskInfo asyncTask = getAsyncTask(String.valueOf(taskId), taskName, true);

        AbstractJob job = new AbstractJob(taskName) {
            @Override
            protected IStatus run(DBRProgressMonitor monitor) {
                TaskProgressMonitor taskMonitor = new TaskProgressMonitor(monitor, asyncTask);
                try {
                    runnable.run(taskMonitor);
                    asyncTask.setResult(runnable.getResult());
                    asyncTask.setStatus("Finished");
                    asyncTask.setRunning(false);
                } catch (InvocationTargetException e) {
                    asyncTask.setJobError(e.getTargetException());
                } catch (InterruptedException e) {
                    asyncTask.setJobError(e);
                }
                return Status.OK_STATUS;
            }
        };

        asyncTask.setJob(job);
        asyncTask.setRunning(true);
        job.schedule();
        return asyncTask;
    }

    public List<WebServerMessage> readLog(Integer maxEntries, Boolean clearLog) {
        synchronized (progressMessages) {
            List<WebServerMessage> messages = new ArrayList<>();
            int entryCount = CommonUtils.toInt(maxEntries);
            if (entryCount == 0 || entryCount >= progressMessages.size()) {
                messages.addAll(progressMessages);
                if (CommonUtils.toBoolean(clearLog)) {
                    progressMessages.clear();
                }
            } else {
                messages.addAll(progressMessages.subList(0, maxEntries));
                if (CommonUtils.toBoolean(clearLog)) {
                    progressMessages.removeAll(messages);
                }
            }
            return messages;
        }
    }

    ///////////////////////////////////////////////////////
    // Attributes

    public Map<String, Object> getAttributes() {
        synchronized (attributes) {
            return new HashMap<>(attributes);
        }
    }

    @SuppressWarnings("unchecked")
    public <T> T getAttribute(String name) {
        synchronized (attributes) {
            return (T) attributes.get(name);
        }
    }

    public <T> T getAttribute(String name, Function<T, T> creator, Function<T, T> disposer) {
        synchronized (attributes) {
            T value = (T) attributes.get(name);
            if (value == null) {
                value = creator.apply(null);
                if (value != null) {
                    attributes.put(name, value);
                    if (disposer != null) {
                        attributeDisposers.put(name, (Function<Object, Object>) disposer);
                    }
                }
            }
            return value;
        }
    }

    public void setAttribute(String name, Object value) {
        synchronized (attributes) {
            attributes.put(name, value);
        }
    }

    ///////////////////////////////////////////////////////
    // Utils

    private class SessionProgressMonitor extends BaseProgressMonitor {
        @Override
        public void beginTask(String name, int totalWork) {
            synchronized (progressMessages) {
                progressMessages.add(new WebServerMessage(WebServerMessage.MessageType.INFO, name));
            }
        }

        @Override
        public void subTask(String name) {
            synchronized (progressMessages) {
                progressMessages.add(new WebServerMessage(WebServerMessage.MessageType.INFO, name));
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
}

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

import io.cloudbeaver.model.WebServerMessage;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletAuthApplication;
import io.cloudbeaver.websocket.CBWebSessionEventHandler;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthSpace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.auth.impl.AbstractSessionPersistent;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.WSEventDeleteTempFile;
import org.jkiss.dbeaver.model.websocket.event.session.WSSessionExpiredEvent;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Base CB web session
 */
public abstract class BaseWebSession extends AbstractSessionPersistent {
    private static final Log log = Log.getLog(BaseWebSession.class);

    @NotNull
    protected final String id;
    protected final long createTime;
    @NotNull
    protected final WebUserContext userContext;
    @NotNull
    protected final ServletApplication application;
    protected volatile long lastAccessTime;

    private final List<CBWebSessionEventHandler> sessionEventHandlers = new CopyOnWriteArrayList<>();
    private WebSessionEventsFilter eventsFilter = new WebSessionEventsFilter();
    private final WebSessionWorkspace workspace;

    public BaseWebSession(@NotNull String id, @NotNull ServletApplication application) throws DBException {
        this.id = id;
        this.application = application;
        this.createTime = System.currentTimeMillis();
        this.lastAccessTime = this.createTime;
        this.workspace = createWebWorkspace();
        this.workspace.getAuthContext().addSession(this);
        this.userContext = createUserContext();
    }

    @NotNull
    protected WebSessionWorkspace createWebWorkspace() {
        return new WebSessionWorkspace(this);
    }

    protected WebUserContext createUserContext() throws DBException {
        return new WebUserContext(this.application, this.workspace);
    }

    @NotNull
    public WebSessionWorkspace getWorkspace() {
        return workspace;
    }

    public void addSessionEvent(WSEvent event) {
        boolean eventAllowedByFilter = eventsFilter.isEventAllowed(event);
        if (!eventAllowedByFilter) {
            return;
        }
        synchronized (sessionEventHandlers) {
            for (CBWebSessionEventHandler eventHandler : sessionEventHandlers) {
                try {
                    eventHandler.handleWebSessionEvent(event);
                } catch (DBException e) {
                    log.error(e.getMessage(), e);
                    addSessionError(e);
                }
            }
        }
    }

    public abstract void addSessionError(Throwable exception);

    public void addEventHandler(@NotNull CBWebSessionEventHandler handler) {
        synchronized (sessionEventHandlers) {
            sessionEventHandlers.add(handler);
        }
    }

    public void removeEventHandler(@NotNull CBWebSessionEventHandler handler) {
        synchronized (sessionEventHandlers) {
            sessionEventHandlers.remove(handler);
        }
    }

    public synchronized boolean updateSMSession(SMAuthInfo smAuthInfo) throws DBException {
        return userContext.refresh(smAuthInfo);
    }

    public synchronized void refreshUserData() {
        try {
            userContext.refreshPermissions();
            if (userContext.isAuthorizedInSecurityManager()) {
                userContext.refreshAccessibleProjects();
            }
        } catch (DBException e) {
            addSessionError(e);
            log.error("Error refreshing accessible projects", e);
        }
    }

    @NotNull
    @Override
    public SMAuthSpace getSessionSpace() {
        return workspace;
    }

    @NotNull
    @Override
    public SMSessionContext getSessionContext() {
        return workspace.getAuthContext();
    }

    protected void clearSessionContext() {
        this.workspace.getAuthContext().clear();
        this.workspace.getAuthContext().addSession(this);
    }

    @NotNull
    @Property
    public String getSessionId() {
        return id;
    }

    @NotNull
    public ServletApplication getApplication() {
        return application;
    }

    @NotNull
    @Override
    public LocalDateTime getSessionStart() {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(createTime), ZoneId.systemDefault());
    }

    public long getLastAccessTimeMillis() {
        return lastAccessTime;
    }

    public synchronized void touchSession() {
        this.lastAccessTime = System.currentTimeMillis();
    }

    @NotNull
    public synchronized WebUserContext getUserContext() {
        return userContext;
    }

    @Override
    public void close() {
        super.close();
        cleanUpSession(true);
    }

    public void close(boolean clearTokens, boolean sendSessionExpiredEvent) {
        cleanUpSession(sendSessionExpiredEvent);
    }

    private void cleanUpSession(boolean sendSessionExpiredEvent) {
        application.getEventController().addEvent(new WSEventDeleteTempFile(getSessionId()));
        synchronized (sessionEventHandlers) {
            var sessionExpiredEvent = new WSSessionExpiredEvent();
            for (CBWebSessionEventHandler sessionEventHandler : sessionEventHandlers) {
                if (sendSessionExpiredEvent) {
                    try {
                        sessionEventHandler.handleWebSessionEvent(sessionExpiredEvent);
                    } catch (DBException e) {
                        log.warn("Failed to send session expiration event", e);
                    }
                }
                sessionEventHandler.close();
            }
            sessionEventHandlers.clear();

            workspace.dispose();

            clearSessionContext();
        }
    }

    @NotNull
    public WebSessionEventsFilter getEventsFilter() {
        return eventsFilter;
    }

    public void setEventsFilter(@NotNull WebSessionEventsFilter eventsFilter) {
        this.eventsFilter = eventsFilter;
    }

    public boolean isProjectAccessible(String projectId) {
        return userContext.getAccessibleProjectIds().contains(projectId);
    }

    public void addSessionProject(@NotNull String projectId) throws DBException {
        userContext.getAccessibleProjectIds().add(projectId);
    }

    public void removeSessionProject(@Nullable String projectId) throws DBException {
        userContext.getAccessibleProjectIds().remove(projectId);
    }

    public abstract void addSessionMessage(WebServerMessage message);

    @Property
    public boolean isValid() {
        return getRemainingTime() > 0;
    }

    @Property
    public long getRemainingTime() {
        if (application instanceof ServletAuthApplication authApplication) {
            return authApplication.getMaxSessionIdleTime() + lastAccessTime - System.currentTimeMillis();
        }
        return Integer.MAX_VALUE;
    }
}

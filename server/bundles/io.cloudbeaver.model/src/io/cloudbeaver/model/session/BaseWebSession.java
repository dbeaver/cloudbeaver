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

import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.websocket.CBWebSessionEventHandler;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthSpace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.auth.impl.AbstractSessionPersistent;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;

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

    protected final SessionContextImpl sessionAuthContext;
    @NotNull
    protected final String id;
    protected final long createTime;
    @NotNull
    protected final WebUserContext userContext;
    @NotNull
    protected final WebApplication application;
    protected volatile long lastAccessTime;

    private final List<CBWebSessionEventHandler> sessionEventHandlers = new CopyOnWriteArrayList<>();
    private WebSessionEventsFilter eventsFilter = new WebSessionEventsFilter();

    public BaseWebSession(@NotNull String id, @NotNull WebApplication application) throws DBException {
        this.id = id;
        this.application = application;
        this.createTime = System.currentTimeMillis();
        this.lastAccessTime = this.createTime;
        this.sessionAuthContext = new SessionContextImpl(null);
        this.sessionAuthContext.addSession(this);
        this.userContext = new WebUserContext(this.application);
    }

    public void addSessionEvent(WSEvent event) {
        boolean eventAllowedByFilter = eventsFilter.isEventAllowed(event);
        if (!eventAllowedByFilter) {
            return;
        }
        synchronized (sessionEventHandlers) {
            for (CBWebSessionEventHandler eventHandler : sessionEventHandlers) {
                try {
                    eventHandler.handeWebSessionEvent(event);
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

    @NotNull
    @Override
    public SMAuthSpace getSessionSpace() {
        return DBWorkbench.getPlatform().getWorkspace();
    }

    @NotNull
    @Override
    public SMSessionContext getSessionContext() {
        return sessionAuthContext;
    }

    @NotNull
    @Property
    public String getSessionId() {
        return id;
    }

    @NotNull
    public WebApplication getApplication() {
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
        synchronized (sessionEventHandlers) {
            for (CBWebSessionEventHandler sessionEventHandler : sessionEventHandlers) {
                sessionEventHandler.close();
            }
            sessionEventHandlers.clear();
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
}

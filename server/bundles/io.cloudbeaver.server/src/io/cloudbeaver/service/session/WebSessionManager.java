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
package io.cloudbeaver.service.session;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.DBWSessionHandler;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Web session manager
 */
public class WebSessionManager {

    private static final Log log = Log.getLog(WebSessionManager.class);

    private final CBApplication application;
    private final Map<String, WebSession> sessionMap = new HashMap<>();
    private final ThreadLocal<String> activeWebSession = new ThreadLocal<>();

    public WebSessionManager(CBApplication application) {
        this.application = application;
    }

    public WebSession closeSession(@NotNull HttpServletRequest request) throws DBException {
        HttpSession session = request.getSession();
        if (session != null) {
            WebSession webSession;
            synchronized (sessionMap) {
                webSession = sessionMap.remove(session.getId());
            }
            if (webSession != null) {
                log.debug("> Close session '" + session.getId() + "'");
                webSession.close();
                return webSession;
            }
        }
        return null;
    }

    protected CBApplication getApplication() {
        return application;
    }

    public boolean touchSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException {
        WebSession webSession = getWebSession(request, response, false);
        long maxSessionIdleTime = CBApplication.getInstance().getMaxSessionIdleTime();
        webSession.updateInfo(request, response, maxSessionIdleTime);
        return true;
    }

    @NotNull
    public WebSession getWebSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException {
        return getWebSession(request, response, true);
    }

    @NotNull
    public WebSession getWebSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response, boolean errorOnNoFound) throws DBWebException {
        return getWebSession(request, response, true, errorOnNoFound);
    }

    @NotNull
    public WebSession getWebSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response, boolean updateInfo, boolean errorOnNoFound) throws DBWebException {
        HttpSession httpSession = request.getSession(true);
        String sessionId = httpSession.getId();
        WebSession webSession;
        synchronized (sessionMap) {
            webSession = sessionMap.get(sessionId);
            if (webSession == null) {
                try {
                    webSession = createWebSessionImpl(httpSession);
                } catch (DBException e) {
                    throw new DBWebException("Failed to create web session", e);
                }
                sessionMap.put(sessionId, webSession);

                if (!CBApplication.getInstance().isConfigurationMode()) {
                    if (!httpSession.isNew()) {
                        webSession.setCacheExpired(true);
                        if (errorOnNoFound) {
                            throw new DBWebException("Session has expired", DBWebException.ERROR_CODE_SESSION_EXPIRED);
                        }
                    }

                    log.debug("> New web session '" + webSession.getSessionId() + "'");
                }
            } else {
                if (updateInfo) {
                    // Update only once per request
                    if (!CommonUtils.toBoolean(request.getAttribute("sessionUpdated"))) {
                        webSession.updateInfo(request, response, application.getMaxSessionIdleTime());
                        request.setAttribute("sessionUpdated", true);
                    }
                }
            }
        }
        // Set active session ID
        activeWebSession.set(webSession.getSessionId());

        return webSession;
    }

    @NotNull
    protected WebSession createWebSessionImpl(@NotNull HttpSession httpSession) throws DBException {
        return new WebSession(httpSession, application, getSessionHandlers(), application.getMaxSessionIdleTime());
    }

    @NotNull
    protected Map<String, DBWSessionHandler> getSessionHandlers() {
        return WebHandlerRegistry.getInstance().getSessionHandlers()
            .stream()
            .collect(Collectors.toMap(WebSessionHandlerDescriptor::getId, WebSessionHandlerDescriptor::getInstance));
    }

    @Nullable
    public WebSession getWebSession(@NotNull String sessionId) {
        synchronized (sessionMap) {
            return sessionMap.get(sessionId);
        }
    }

    @Nullable
    public WebSession findWebSession(HttpServletRequest request) {
        String sessionId = request.getSession().getId();
        synchronized (sessionMap) {
            WebSession webSession = sessionMap.get(sessionId);
            if (webSession != null) {
                activeWebSession.set(sessionId);
            }
            return webSession;
        }
    }

    public WebSession findWebSession(HttpServletRequest request, boolean errorOnNoFound) throws DBWebException {
        WebSession webSession = findWebSession(request);
        if (webSession != null) {
            return webSession;
        }
        if (errorOnNoFound) {
            throw new DBWebException("Session has expired", DBWebException.ERROR_CODE_SESSION_EXPIRED);
        }
        return null;
    }

    public void expireIdleSessions() {
        long maxSessionIdleTime = DBWorkbench.getPlatform(CBPlatform.class).getApplication().getMaxSessionIdleTime();
        if (CBApplication.getInstance().isConfigurationMode()) {
            // In configuration mode sessions expire after a week
            maxSessionIdleTime = 60 * 60 * 1000 * 24 * 7;
        }

        List<WebSession> expiredList = new ArrayList<>();
        synchronized (sessionMap) {
            for (Iterator<WebSession> iterator = sessionMap.values().iterator(); iterator.hasNext(); ) {
                WebSession session = iterator.next();
                long idleMillis = System.currentTimeMillis() - session.getLastAccessTimeMillis();
                if (idleMillis >= maxSessionIdleTime) {
                    iterator.remove();
                    expiredList.add(session);
                }
            }
        }

        for (WebSession session : expiredList) {
            log.debug("> Expire session '" + session.getSessionId() + "'");
            session.close();
        }
    }

    public Collection<WebSession> getAllActiveSessions() {
        synchronized (sessionMap) {
            return sessionMap.values();
        }
    }

    public WebSession getActiveWebSession() {
        String sessionId = activeWebSession.get();
        return sessionId == null ? null : getWebSession(sessionId);
    }
}

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
package io.cloudbeaver.service.session;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.SMTokenCredentialProvider;
import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionAuthProcessor;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWSessionHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.security.user.SMAuthPermissions;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.session.WSSessionStateEvent;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Web session manager
 */
public class WebSessionManager {

    private static final Log log = Log.getLog(WebSessionManager.class);

    private final CBApplication application;
    private final Map<String, BaseWebSession> sessionMap = new HashMap<>();

    public WebSessionManager(CBApplication application) {
        this.application = application;
    }

    /**
     * Closes Web Session, associated to HttpSession from {@code request}
     */
    public BaseWebSession closeSession(@NotNull HttpServletRequest request) {
        HttpSession session = request.getSession();
        if (session != null) {
            BaseWebSession webSession;
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

    @Deprecated
    public boolean touchSession(@NotNull HttpServletRequest request,
                                @NotNull HttpServletResponse response) throws DBWebException {
        WebSession webSession = getWebSession(request, response, false);
        webSession.updateSessionParameters(request);
        webSession.updateInfo(!request.getSession().isNew());
        return true;
    }

    @NotNull
    public WebSession getWebSession(@NotNull HttpServletRequest request,
                                    @NotNull HttpServletResponse response) throws DBWebException {
        return getWebSession(request, response, true);
    }

    @NotNull
    public WebSession getWebSession(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response,
        boolean errorOnNoFound
    ) throws DBWebException {
        HttpSession httpSession = request.getSession(true);
        String sessionId = httpSession.getId();
        WebSession webSession;
        synchronized (sessionMap) {
            var baseWebSession = sessionMap.get(sessionId);
            if (baseWebSession == null && CBApplication.getInstance().isConfigurationMode()) {
                try {
                    webSession = createWebSessionImpl(request);
                } catch (DBException e) {
                    throw new DBWebException("Failed to create web session", e);
                }
                sessionMap.put(sessionId, webSession);
            } else if (baseWebSession == null) {
                try {
                    webSession = createWebSessionImpl(request);
                } catch (DBException e) {
                    throw new DBWebException("Failed to create web session", e);
                }

                boolean restored = false;
                try {
                    restored = restorePreviousUserSession(webSession);
                } catch (DBException e) {
                    log.error("Failed to restore previous user session", e);
                }

                if (!restored && errorOnNoFound && !httpSession.isNew()) {
                    throw new DBWebException("Session has expired", DBWebException.ERROR_CODE_SESSION_EXPIRED);
                }

                log.debug((restored ? "Restored " : "New ") + "web session '" + webSession.getSessionId() + "'");

                webSession.setCacheExpired(!httpSession.isNew());

                sessionMap.put(sessionId, webSession);
            } else {
                if (!(baseWebSession instanceof WebSession)) {
                    throw new DBWebException("Unexpected session type: " + baseWebSession.getClass().getName());
                }
                webSession = (WebSession) baseWebSession;
            }
        }

        return webSession;
    }

    /**
     * Returns not expired session from cache, or restore it.
     *
     * @return WebSession object or null, if session expired or invalid
     */
    @Nullable
    public WebSession getOrRestoreSession(@NotNull HttpServletRequest request) {
        var httpSession = request.getSession();
        if (httpSession == null) {
            log.debug("Http session is null. No Web Session returned");
            return null;
        }
        var sessionId = httpSession.getId();
        WebSession webSession;
        synchronized (sessionMap) {
            if (sessionMap.containsKey(sessionId)) {
                var cachedWebSession = sessionMap.get(sessionId);
                if (!(cachedWebSession instanceof WebSession)) {
                    log.warn("Unexpected session type: " + cachedWebSession.getClass().getName());
                    return null;
                }
                return (WebSession) cachedWebSession;
            } else {
                try {
                    var oldAuthInfo = getApplication().getSecurityController().restoreUserSession(sessionId);
                    if (oldAuthInfo == null) {
                        log.debug("Couldn't restore previous user session '" + sessionId + "'");
                        return null;
                    }

                    webSession = createWebSessionImpl(request);
                    restorePreviousUserSession(webSession, oldAuthInfo);

                    sessionMap.put(sessionId, webSession);
                    log.debug("Web session restored");
                    return webSession;
                } catch (DBException e) {
                    log.error("Failed to restore previous user session", e);
                    return null;
                }
            }
        }
    }

    private boolean restorePreviousUserSession(@NotNull WebSession webSession) throws DBException {
        var oldAuthInfo = webSession.getSecurityController().restoreUserSession(webSession.getSessionId());
        if (oldAuthInfo == null) {
            return false;
        }

        restorePreviousUserSession(webSession, oldAuthInfo);
        return true;
    }

    private void restorePreviousUserSession(
        @NotNull WebSession webSession,
        @NotNull SMAuthInfo authInfo
    ) throws DBException {
        var linkWithActiveUser = false; // because its old credentials and should already be linked if needed
        new WebSessionAuthProcessor(webSession, authInfo, linkWithActiveUser)
            .authenticateSession();
    }

    @NotNull
    protected WebSession createWebSessionImpl(@NotNull HttpServletRequest request) throws DBException {
        return new WebSession(request, application, getSessionHandlers());
    }

    @NotNull
    protected Map<String, DBWSessionHandler> getSessionHandlers() {
        return WebHandlerRegistry.getInstance().getSessionHandlers()
            .stream()
            .collect(Collectors.toMap(WebSessionHandlerDescriptor::getId, WebSessionHandlerDescriptor::getInstance));
    }

    @Nullable
    public BaseWebSession getSession(@NotNull String sessionId) {
        synchronized (sessionMap) {
            return sessionMap.get(sessionId);
        }
    }

    @Nullable
    public WebSession findWebSession(HttpServletRequest request) {
        String sessionId = request.getSession().getId();
        synchronized (sessionMap) {
            var session = sessionMap.get(sessionId);
            if (session instanceof WebSession) {
                return (WebSession) session;
            }
            return null;
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
        long maxSessionIdleTime = application.getMaxSessionIdleTime();

        List<BaseWebSession> expiredList = new ArrayList<>();
        synchronized (sessionMap) {
            for (Iterator<BaseWebSession> iterator = sessionMap.values().iterator(); iterator.hasNext(); ) {
                var session = iterator.next();
                long idleMillis = System.currentTimeMillis() - session.getLastAccessTimeMillis();
                if (idleMillis >= maxSessionIdleTime) {
                    iterator.remove();
                    expiredList.add(session);
                }
            }
        }

        for (var session : expiredList) {
            log.debug("> Expire session '" + session.getSessionId() + "'");
            session.close();
        }
    }

    public Collection<BaseWebSession> getAllActiveSessions() {
        synchronized (sessionMap) {
            return sessionMap.values();
        }
    }

    @Nullable
    public WebHeadlessSession getHeadlessSession(HttpServletRequest request, boolean create) throws DBException {
        String smAccessToken = request.getHeader(WSConstants.WS_AUTH_HEADER);
        if (CommonUtils.isEmpty(smAccessToken)) {
            return null;
        }
        synchronized (sessionMap) {
            var httpSession = request.getSession();
            var tempCredProvider = new SMTokenCredentialProvider(smAccessToken);
            SMAuthPermissions authPermissions = application.createSecurityController(tempCredProvider).getTokenPermissions();
            var sessionId = httpSession != null ? httpSession.getId()
                : authPermissions.getSessionId();

            var existSession = sessionMap.get(sessionId);

            if (existSession instanceof WebHeadlessSession) {
                return (WebHeadlessSession) existSession;
            }
            if (existSession != null) {
                //session exist but it not headless session
                return null;
            }
            if (!create) {
                return null;
            }
            var headlessSession = new WebHeadlessSession(
                sessionId,
                application
            );
            headlessSession.getUserContext().refresh(
                smAccessToken,
                null,
                authPermissions
            );
            sessionMap.put(sessionId, headlessSession);
            return headlessSession;
        }
    }

    /**
     * Send session state with remaining alive time to all cached session
     */
    public void sendSessionsStates() {
        synchronized (sessionMap) {
            sessionMap.values()
                .parallelStream()
                .filter(session -> {
                    if (session instanceof WebSession webSession) {
                        return webSession.isAuthorizedInSecurityManager();
                    }
                    return false;
                })
                .forEach(session -> {
                    try {
                        session.addSessionEvent(new WSSessionStateEvent(
                            session.getLastAccessTimeMillis(),
                            session.getRemainingTime(),
                            session.isValid(),
                            ((WebSession) session).isCacheExpired(),
                            ((WebSession) session).getLocale(),
                            ((WebSession) session).getActionParameters()));
                    } catch (Exception e) {
                        log.error("Failed to refresh session state: " + session.getSessionId(), e);
                    }
                });
        }
    }

    public void closeUserSessions(@NotNull String userId) {
        synchronized (sessionMap) {
            for (Iterator<BaseWebSession> iterator = sessionMap.values().iterator(); iterator.hasNext(); ) {
                var session = iterator.next();
                if (CommonUtils.equalObjects(session.getUserContext().getUserId(), userId)) {
                    iterator.remove();
                    session.close();
                }
            }
        }
    }
}

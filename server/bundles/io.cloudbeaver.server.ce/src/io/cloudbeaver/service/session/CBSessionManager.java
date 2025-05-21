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
import io.cloudbeaver.model.session.*;
import io.cloudbeaver.registry.WebHandlerRegistry;
import io.cloudbeaver.registry.WebSessionHandlerDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.events.WSWebUtils;
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
import org.jkiss.dbeaver.model.websocket.event.WSUserDeletedEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSSessionStateEvent;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Web session manager
 */
public class CBSessionManager implements WebAppSessionManager {

    private static final Log log = Log.getLog(CBSessionManager.class);

    private final CBApplication application;
    private final Map<String, BaseWebSession> sessionMap = new HashMap<>();

    public CBSessionManager(CBApplication application) {
        this.application = application;
    }

    /**
     * Closes Web Session, associated to HttpSession from {@code request}
     */
    @Override
    public BaseWebSession closeSession(@NotNull HttpServletRequest request) {
        HttpSession session = request.getSession();
        if (session != null) {
            return closeSession(getSessionId(request));
        }
        return null;
    }

    @Override
    public BaseWebSession closeSession(@NotNull String sessionId) {
        BaseWebSession webSession;
        synchronized (sessionMap) {
            webSession = sessionMap.remove(sessionId);
        }
        if (webSession != null) {
            log.debug("> Close session '" + sessionId + "'");
            webSession.close();
            return webSession;
        }
        return null;
    }

    protected CBApplication getApplication() {
        return application;
    }

    @Deprecated
    public boolean touchSession(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response
    ) throws DBWebException {
        WebSession webSession = getWebSession(request, response, false);
        var requestInfo = new WebHttpRequestInfo(request);
        webSession.updateSessionParameters(requestInfo);
        webSession.updateInfo(!request.getSession().isNew());
        return true;
    }

    @Override
    @NotNull
    public WebSession getWebSession(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response
    ) throws DBWebException {
        return getWebSession(request, response, true);
    }

    @Override
    @NotNull
    public WebSession getWebSession(
        @NotNull HttpServletRequest request,
        @NotNull HttpServletResponse response,
        boolean errorOnNoFound
    ) throws DBWebException {
        String sessionId = getSessionId(request);
        WebSession webSession;
        synchronized (sessionMap) {
            var baseWebSession = sessionMap.get(sessionId);
            if (baseWebSession == null && CBApplication.getInstance().isConfigurationMode()) {
                try {
                    webSession = createWebSessionImpl(new WebHttpRequestInfo(request));
                } catch (DBException e) {
                    throw new DBWebException("Failed to create web session", e);
                }
                sessionMap.put(sessionId, webSession);
            } else if (baseWebSession == null) {
                try {
                    webSession = createWebSessionImpl(new WebHttpRequestInfo(request));
                } catch (DBException e) {
                    throw new DBWebException("Failed to create web session", e);
                }

                boolean restored = false;
                try {
                    restored = restorePreviousUserSession(webSession);
                } catch (DBException e) {
                    log.error("Failed to restore previous user session", e);
                }

                HttpSession httpSession = request.getSession(false);
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

    @NotNull
    protected String getSessionId(@NotNull HttpServletRequest request) {
        HttpSession httpSession = request.getSession(true);
        return httpSession.getId();
    }

    /**
     * Returns not expired session from cache, or restore it.
     *
     * @return WebSession object or null, if session expired or invalid
     */
    @Nullable
    public WebSession getOrRestoreWebSession(@NotNull WebHttpRequestInfo requestInfo) {
        final var sessionId = requestInfo.getId();
        if (sessionId == null) {
            log.debug("Http session is null. No Web Session returned");
            return null;
        }
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

                    webSession = createWebSessionImpl(requestInfo);
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
    protected WebSession createWebSessionImpl(@NotNull WebHttpRequestInfo request) throws DBException {
        return new WebSession(request, application, getSessionHandlers());
    }

    @NotNull
    protected Map<String, DBWSessionHandler> getSessionHandlers() {
        return WebHandlerRegistry.getInstance().getSessionHandlers()
            .stream()
            .collect(Collectors.toMap(WebSessionHandlerDescriptor::getId, WebSessionHandlerDescriptor::getInstance));
    }

    @Override
    @Nullable
    public BaseWebSession getSession(@NotNull String sessionId) {
        synchronized (sessionMap) {
            return sessionMap.get(sessionId);
        }
    }

    @Override
    @Nullable
    public WebSession findWebSession(HttpServletRequest request) {
        String sessionId = getSessionId(request);
        synchronized (sessionMap) {
            var session = sessionMap.get(sessionId);
            if (session instanceof WebSession) {
                return (WebSession) session;
            }
            return null;
        }
    }

    @Override
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
            closeExpiredSession(session);
        }
    }

    @Override
    public Collection<BaseWebSession> getAllActiveSessions() {
        synchronized (sessionMap) {
            return new ArrayList<>(sessionMap.values());
        }
    }

    @Nullable
    public WebHeadlessSession getHeadlessSession(
        @Nullable String smAccessToken,
        @NotNull WebHttpRequestInfo requestInfo,
        boolean create
    ) throws DBException {
        if (CommonUtils.isEmpty(smAccessToken)) {
            return null;
        }
        synchronized (sessionMap) {
            var tempCredProvider = new SMTokenCredentialProvider(smAccessToken);
            SMAuthPermissions authPermissions = application.createSecurityController(tempCredProvider).getTokenPermissions();
            var sessionId = requestInfo.getId() != null ? requestInfo.getId()
                : authPermissions.getSessionId();

            var existSession = sessionMap.get(sessionId);

            if (existSession instanceof WebHeadlessSession) {
                var creds = existSession.getUserContext().getActiveUserCredentials();
                if (creds == null || !smAccessToken.equals(creds.getSmAccessToken())) {
                    existSession.getUserContext().refresh(
                        smAccessToken,
                        null,
                        authPermissions
                    );
                }
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

    public void closeUserSession(@NotNull WSUserDeletedEvent userDeletedEvent) {
        synchronized (sessionMap) {
            for (Iterator<BaseWebSession> iterator = sessionMap.values().iterator(); iterator.hasNext(); ) {
                var session = iterator.next();
                if (CommonUtils.equalObjects(session.getUserContext().getUserId(),
                    userDeletedEvent.getDeletedUserId())) {
                    if (session instanceof WebHeadlessSession headlessSession) {
                        headlessSession.addSessionEvent(userDeletedEvent);
                    }
                    iterator.remove();
                    session.close();
                }
            }
        }
    }

    public void closeSessions(@NotNull List<String> smSessionsId) {
        synchronized (sessionMap) {
            for (Iterator<BaseWebSession> iterator = sessionMap.values().iterator(); iterator.hasNext(); ) {
                var session = iterator.next();
                if (smSessionsId.contains(session.getUserContext().getSmSessionId())) {
                    iterator.remove();
                    session.close(false, true);
                }
            }
        }
    }

    /**
     * Closes all sessions in session manager.
     */
    public void closeAllSessions(@Nullable String initiatorSessionId) {
        synchronized (sessionMap) {
            for (Iterator<BaseWebSession> iterator = sessionMap.values().iterator(); iterator.hasNext(); ) {
                var session = iterator.next();
                iterator.remove();
                session.close(false, !WSWebUtils.isSessionIdEquals(session, initiatorSessionId));
            }
        }
    }

    /**
     * Creates new web session or returns existing one.
     */
    public WebSession createWebSession(WebHttpRequestInfo requestInfo) throws DBException {
        String id = requestInfo.getId();
        synchronized (sessionMap) {
            BaseWebSession baseWebSession = sessionMap.get(id);
            if (baseWebSession instanceof WebSession) {
                return (WebSession) baseWebSession;
            } else {
                WebSession webSessionImpl = createWebSessionImpl(requestInfo);
                sessionMap.put(id, webSessionImpl);
                return webSessionImpl;
            }
        }
    }

    protected void closeExpiredSession(@NotNull BaseWebSession session) {
        log.debug("> Expire session '" + session.getSessionId() + "'");
        session.close();
    }
}

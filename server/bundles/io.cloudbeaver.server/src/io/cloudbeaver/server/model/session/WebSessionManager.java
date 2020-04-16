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
package io.cloudbeaver.server.model.session;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CloudbeaverPlatform;
import io.cloudbeaver.server.model.WebConnectionConfig;
import io.cloudbeaver.server.model.WebConnectionInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.*;

/**
 * Various constants
 */
public class WebSessionManager {

    private static final Log log = Log.getLog(WebSessionManager.class);

    private static WebSessionManager instance;

    public synchronized static WebSessionManager getInstance() {
        if (instance == null) {
            instance = new WebSessionManager();
        }
        return instance;
    }

    private final Map<String, WebSession> sessionMap = new HashMap<>();

    public WebSessionManager() {
    }

    public WebSession openSession(@NotNull HttpServletRequest request, boolean errorOnNoFound) throws DBWebException {
        HttpSession session = getOrCreateHttpSession(request);
        return getWebSession(session, errorOnNoFound);
    }

    public boolean closeSession(@NotNull HttpServletRequest request) {
        HttpSession session = request.getSession();
        if (session != null) {
            WebSession webSession;
            synchronized (sessionMap) {
                webSession = sessionMap.remove(session.getId());
            }
            if (webSession != null) {
                log.debug("> Close session '" + session.getId() + "'");
                webSession.close();
                return true;
            }
        }
        return false;
    }

    public boolean touchSession(@NotNull HttpServletRequest request) throws DBWebException {
        WebSession webSession = openSession(request, false);
        webSession.updateInfo(request.getSession());
        return true;
    }

    public WebSession getWebSession(@NotNull HttpServletRequest request) throws DBWebException {
        return openSession(request, true);
    }

    private HttpSession getOrCreateHttpSession(@NotNull HttpServletRequest request) {
        HttpSession session = request.getSession();
        if (session == null) {
            session = request.getSession(true);
            log.debug("New session: " + session.getId());
        }
        return session;
    }

    public WebSession getWebSession(HttpSession httpSession, boolean errorOnNoFound) throws DBWebException {
        String sessionId = httpSession.getId();
        WebSession webSession;
        synchronized (sessionMap) {
            webSession = sessionMap.get(sessionId);
            if (webSession == null) {
                webSession = new WebSession(httpSession);
                sessionMap.put(sessionId, webSession);

                if (!httpSession.isNew() && errorOnNoFound) {
                    throw new DBWebException("Session has expired", DBWebException.ERROR_CODE_SESSION_EXPIRED);
                }

                log.debug("> New web session '" + webSession.getId() + "'");
            } else {
                webSession.updateInfo(httpSession);
            }
        }
        return  webSession;
    }

    public WebConnectionInfo openConnection(HttpServletRequest servletRequest, Map<String, Object> config) throws DBWebException {
        return getWebSession(servletRequest).openConnectionFromTemplate(new WebConnectionConfig(config));
    }

    public WebConnectionInfo createConnection(HttpServletRequest servletRequest, Map<String, Object> config) throws DBWebException {
        return getWebSession(servletRequest).createConnection(new WebConnectionConfig(config));
    }

    public WebConnectionInfo testConnection(HttpServletRequest servletRequest, Map<String, Object> config) throws DBWebException {
        return getWebSession(servletRequest).testConnection(new WebConnectionConfig(config));
    }

    public boolean closeConnection(HttpServletRequest servletRequest, String connectionId) throws DBWebException {
        return getWebSession(servletRequest).closeConnection(connectionId);
    }

    public void expireIdleSessions() {
        long maxSessionIdleTime = DBWorkbench.getPlatform(CloudbeaverPlatform.class).getApplication().getMaxSessionIdleTime();

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
            log.debug("> Expire session '" + session.getId() + "'");
            session.close();
        }
    }
}

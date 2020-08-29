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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

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
        WebSession webSession = getWebSession(request, false);
        webSession.updateInfo(request);
        return true;
    }

    public WebSession getWebSession(@NotNull HttpServletRequest request) throws DBWebException {
        return getWebSession(request, true);
    }

    public WebSession getWebSession(@NotNull HttpServletRequest request, boolean errorOnNoFound) throws DBWebException {
        return getWebSession(request, true, errorOnNoFound);
    }

    public WebSession getWebSession(HttpServletRequest request, boolean updateInfo, boolean errorOnNoFound) throws DBWebException {
        HttpSession httpSession = request.getSession(true);
        String sessionId = httpSession.getId();
        WebSession webSession;
        synchronized (sessionMap) {
            webSession = sessionMap.get(sessionId);
            if (webSession == null) {
                webSession = new WebSession(httpSession);
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
                        webSession.updateInfo(request);
                        request.setAttribute("sessionUpdated", true);
                    }
                }
            }
        }
        return webSession;
    }

    public WebSession findWebSession(HttpServletRequest request) {
        String sessionId = request.getSession().getId();
        synchronized (sessionMap) {
            return sessionMap.get(sessionId);
        }
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

}

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
package io.cloudbeaver.server.websockets;

import io.cloudbeaver.model.session.BaseWebSession;
import io.cloudbeaver.model.session.WebHeadlessSession;
import io.cloudbeaver.model.session.WebHttpRequestInfo;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.http.BadMessageException;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.WSUtils;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.client.WSSessionPingClientEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSSocketConnectedEvent;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.HttpConstants;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CBEventsLongPollingServlet extends HttpServlet {

    private static final Log log = Log.getLog(CBEventsLongPollingServlet.class);

    private static final String PING = WSUtils.clientGson.toJson(new WSSessionPingClientEvent("cb_session"));
    private static final long POLL_TIMEOUT_SEC = 25;
    private static final long SESSION_IDLE_TIMEOUT_SEC = 60;

    private volatile boolean running = false;
    private final Map<String, CBEventsLongPolling> sessions = new ConcurrentHashMap<>();

    @Override
    public void init() throws ServletException {
        super.init();
        running = true;
        new LongPollingMonitorJob(DBWorkbench.getPlatform(), this).scheduleMonitor();
    }

    @Override
    protected void doOptions(@NotNull HttpServletRequest req, @NotNull HttpServletResponse resp) {
        addCorsHeaders(req, resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(@NotNull HttpServletRequest req, @NotNull HttpServletResponse resp) throws IOException {
        addCorsHeaders(req, resp);

        BaseWebSession ws = resolveSession(req);
        resp.setHeader(WSConstants.WS_SESSION_HEADER, ws.getSessionId());

        CBEventsLongPolling ps = getOrCreatePollSession(ws);
        ps.onMessage(PING);

        try {
            List<WSEvent> events = ps.pollEvents(POLL_TIMEOUT_SEC);

            if (events.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
                return;
            }

            resp.setContentType(CBConstants.APPLICATION_JSON);
            WSUtils.clientGson.toJson(Map.of("events", events), resp.getWriter());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("Long-poll interrupted (likely client disconnected)", e);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        }
    }

    @Override
    protected void doPost(@NotNull HttpServletRequest req, @NotNull HttpServletResponse resp) throws IOException {
        addCorsHeaders(req, resp);

        BaseWebSession ws = resolveSession(req);
        resp.setHeader(WSConstants.WS_SESSION_HEADER, ws.getSessionId());

        CBEventsLongPolling ps = getOrCreatePollSession(ws);

        String json = new String(req.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (CommonUtils.isEmpty(json)) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Empty payload");
            return;
        }

        ps.onMessage(json);

        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    public void destroy() {
        super.destroy();
        running = false;
        sessions.clear();
        log.debug("HTTP Long-Polling transport stopped");
    }

    public void cleanupIdleSessions() {
        long now = System.currentTimeMillis();

        sessions.entrySet().removeIf(entry -> {
            CBEventsLongPolling ps = entry.getValue();
            long idleMillis = now - ps.lastPoll();
            if (idleMillis > SESSION_IDLE_TIMEOUT_SEC * 1000L) {
                try {
                    ps.close();
                } catch (Exception e) {
                    log.debug("Failed to remove event handler for " + entry.getKey(), e);
                }
                return true;
            }
            return false;
        });
    }

    public boolean isRunning() {
        return running;
    }

    private void addCorsHeaders(@NotNull HttpServletRequest req, @NotNull HttpServletResponse resp) {
        String origin = req.getHeader("Origin");
        boolean develMode = ServletAppUtils.getServletApplication().getServerConfiguration().isDevelMode();
        if (!develMode || origin == null) {
            return;
        }

        resp.setHeader("Access-Control-Allow-Origin", origin);
        resp.setHeader("Access-Control-Allow-Credentials", "true");

        String reqHeaders = req.getHeader("Access-Control-Request-Headers");
        if (reqHeaders != null) {
            resp.setHeader("Access-Control-Allow-Headers", reqHeaders);
        }

        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }

    @NotNull
    protected BaseWebSession resolveSession(@NotNull HttpServletRequest req) {

        String sid = getSessionId(req);

        WebHttpRequestInfo info = new WebHttpRequestInfo(
            sid,
            req.getAttribute("locale"),
            req.getRemoteAddr(),
            req.getHeader(HttpConstants.HEADER_USER_AGENT)
        );

        try {

            String token = req.getHeader(WSConstants.WS_AUTH_HEADER);

            WebHeadlessSession headless = getHeadlessSession(token, info);
            if (headless != null) {
                return headless;
            } else  {
                log.trace("Couldn't create headless session");
            }
        } catch (Exception e) {
            log.error("Error resolving headless session", e);
        }

        throw new BadMessageException("No web session found for long-poll request");
    }

    protected WebHeadlessSession getHeadlessSession(String token, WebHttpRequestInfo info) throws DBException {
        WebAppSessionManager sm = WebAppUtils.getWebApplication().getSessionManager();
        return sm.getHeadlessSession(token, info, true);
    }

    @Nullable
    private String getSessionId(@NotNull HttpServletRequest req) {
        return req.getHeader(WSConstants.WS_SESSION_HEADER);
    }


    @NotNull
    private CBEventsLongPolling getOrCreatePollSession(@NotNull BaseWebSession ws) {
        final String sid = ws.getSessionId();

        return sessions.compute(sid, (key, existing) -> {
            if (existing != null) {
                existing.touch();
                return existing;
            }

            CBEventsLongPolling ps = new CBEventsLongPolling(ws);

            ps.handleWebSessionEvent(new WSSocketConnectedEvent(ws.getApplication().getApplicationRunId()));
            log.debug("HTTP Long-Poll channel opened for session " + sid);

            return ps;
        });
    }

}
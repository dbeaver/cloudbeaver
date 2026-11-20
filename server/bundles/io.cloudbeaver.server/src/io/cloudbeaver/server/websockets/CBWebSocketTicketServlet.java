/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.jkiss.code.NotNull;
import org.jkiss.utils.HttpConstants;

import java.io.IOException;
import java.time.Clock;

public class CBWebSocketTicketServlet extends HttpServlet {
    @Override
    protected void doPost(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws IOException {
        response.setHeader(HttpConstants.HEADER_CACHE_CONTROL, HttpConstants.CACHE_CONTROL_NO_STORE);
        response.setHeader("X-Content-Type-Options", "nosniff");
        // A custom header requires a CORS preflight. This endpoint must never allow CORS,
        // even when a proxy replaces Origin and Fetch Metadata is unavailable.
        if (!CBWebSocketTickets.REQUEST_HEADER_VALUE.equals(request.getHeader(CBWebSocketTickets.REQUEST_HEADER))
            || !CBEventOriginFilter.isAllowedOrigin(request)
        ) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        HttpSession session = request.getSession(false);
        if (session == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        CBWebSocketTickets tickets;
        synchronized (session) {
            tickets = (CBWebSocketTickets) session.getAttribute(CBWebSocketTickets.SESSION_ATTRIBUTE);
            if (tickets == null) {
                tickets = new CBWebSocketTickets(Clock.systemUTC());
                session.setAttribute(CBWebSocketTickets.SESSION_ATTRIBUTE, tickets);
            }
        }
        response.setContentType(HttpConstants.CONTENT_TYPE_TEXT_PLAIN);
        response.getWriter().write(tickets.issue());
    }

    @Override
    protected void doOptions(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws IOException {
        response.sendError(HttpServletResponse.SC_FORBIDDEN);
    }
}

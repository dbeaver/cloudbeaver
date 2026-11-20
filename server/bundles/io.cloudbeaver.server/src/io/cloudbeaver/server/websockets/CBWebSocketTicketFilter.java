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

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.utils.HttpConstants;

import java.io.IOException;

public class CBWebSocketTicketFilter implements Filter {
    @Override
    public void doFilter(
        @NotNull ServletRequest request,
        @NotNull ServletResponse response,
        @NotNull FilterChain chain
    ) throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest
            && response instanceof HttpServletResponse httpResponse
        ) {
            // Browser WebSocket APIs cannot set authentication headers. Native clients
            // still authenticate these credentials in CBWebSocketServerConfigurator.
            String authorization = httpRequest.getHeader(HttpConstants.HEADER_AUTHORIZATION);
            boolean explicitCredentials = httpRequest.getHeader(WSConstants.WS_AUTH_HEADER) != null
                || (authorization != null && authorization.startsWith(HttpConstants.BEARER_PREFIX));
            if (!explicitCredentials) {
                HttpSession session = httpRequest.getSession(false);
                Object store = session == null ? null : session.getAttribute(CBWebSocketTickets.SESSION_ATTRIBUTE);
                String[] tickets = httpRequest.getParameterValues(CBWebSocketTickets.TICKET_PARAMETER);
                if (!(store instanceof CBWebSocketTickets sessionTickets)
                    || tickets == null
                    || tickets.length != 1
                    || !sessionTickets.consume(tickets[0])
                ) {
                    httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }
}

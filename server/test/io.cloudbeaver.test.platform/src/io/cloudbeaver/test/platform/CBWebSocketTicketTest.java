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
package io.cloudbeaver.test.platform;

import io.cloudbeaver.server.websockets.CBWebSocketTicketFilter;
import io.cloudbeaver.server.websockets.CBWebSocketTicketServlet;
import io.cloudbeaver.server.websockets.CBWebSocketTickets;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Clock;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class CBWebSocketTicketTest {
    private HttpServletRequest request;
    private HttpServletResponse response;
    private HttpSession session;
    private FilterChain chain;
    private CBWebSocketTickets tickets;
    private Clock clock;

    @BeforeEach
    public void setUp() {
        request = Mockito.mock(HttpServletRequest.class);
        response = Mockito.mock(HttpServletResponse.class);
        session = Mockito.mock(HttpSession.class);
        chain = Mockito.mock(FilterChain.class);
        clock = Mockito.mock(Clock.class);
        when(clock.millis()).thenReturn(1000L);
        tickets = new CBWebSocketTickets(clock);
        when(request.getMethod()).thenReturn("POST");
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("app.example.com");
        when(request.getServerPort()).thenReturn(80);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(CBWebSocketTickets.SESSION_ATTRIBUTE)).thenReturn(tickets);
    }

    @Test
    public void testTicketIsOneUse() {
        String ticket = tickets.issue();
        assertTrue(ticket.matches("[A-Za-z0-9_-]{43}"));
        assertTrue(tickets.consume(ticket));
        assertFalse(tickets.consume(ticket));
        assertFalse(tickets.consume(null));
        assertFalse(tickets.consume("unknown"));
    }

    @Test
    public void testTicketExpires() {
        String ticket = tickets.issue();
        when(clock.millis()).thenReturn(31000L);
        assertFalse(tickets.consume(ticket));
    }

    @Test
    public void testConcurrentConsumption() {
        String ticket = tickets.issue();
        assertEquals(1, IntStream.range(0, 16).parallel().filter(i -> tickets.consume(ticket)).count());
    }

    @Test
    public void testBoundedTicketsAndMultipleTabs() {
        String oldest = tickets.issue();
        String latest = oldest;
        for (int i = 0; i < 8; i++) {
            latest = tickets.issue();
        }
        assertFalse(tickets.consume(oldest));
        assertTrue(tickets.consume(latest));
    }

    @Test
    public void testIssueTicketWithoutFetchMetadata() throws Exception {
        when(request.getHeader(CBWebSocketTickets.REQUEST_HEADER)).thenReturn(CBWebSocketTickets.REQUEST_HEADER_VALUE);
        // A TLS-terminating proxy may rewrite Origin; issuing still requires a non-simple request.
        when(request.getHeader("Origin")).thenReturn("https://app.example.com");
        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        new CBWebSocketTicketServlet().service(request, response);

        assertTrue(tickets.consume(body.toString()));
        verify(response).setHeader("Cache-Control", "no-store");
        verify(response, never()).setHeader(eq("Access-Control-Allow-Origin"), anyString());
    }

    @Test
    public void testSimpleCrossOriginRequestCannotIssueTicket() throws Exception {
        // Even when Origin has been rewritten to the application origin.
        when(request.getHeader("Origin")).thenReturn("https://app.example.com");
        new CBWebSocketTicketServlet().service(request, response);
        verify(response).sendError(403);
        verify(response, never()).getWriter();
    }

    @Test
    public void testPreflightIsRejected() throws Exception {
        when(request.getMethod()).thenReturn("OPTIONS");
        new CBWebSocketTicketServlet().service(request, response);
        verify(response).sendError(403);
        verify(response, never()).setHeader(eq("Access-Control-Allow-Origin"), anyString());
        verify(response, never()).setHeader(eq("Access-Control-Allow-Headers"), anyString());
    }

    @Test
    public void testNoSessionCannotIssueTicket() throws Exception {
        when(request.getHeader(CBWebSocketTickets.REQUEST_HEADER)).thenReturn(CBWebSocketTickets.REQUEST_HEADER_VALUE);
        when(request.getSession(false)).thenReturn(null);
        new CBWebSocketTicketServlet().service(request, response);
        verify(response).sendError(401);
    }

    @Test
    public void testUpgradeConsumesTicket() throws Exception {
        String ticket = tickets.issue();
        when(request.getParameterValues("ticket")).thenReturn(new String[] { ticket });
        CBWebSocketTicketFilter filter = new CBWebSocketTicketFilter();
        filter.doFilter(request, response, chain);
        filter.doFilter(request, response, chain);
        verify(chain, times(1)).doFilter(request, response);
        verify(response).sendError(403);
    }

    @Test
    public void testOtherSessionTicketIsRejected() throws Exception {
        String ticket = new CBWebSocketTickets(clock).issue();
        when(request.getParameterValues("ticket")).thenReturn(new String[] { ticket });
        new CBWebSocketTicketFilter().doFilter(request, response, chain);
        verify(response).sendError(403);
        verifyNoInteractions(chain);
    }

    @Test
    public void testMissingTicketIsRejectedEvenWithoutOrigin() throws Exception {
        new CBWebSocketTicketFilter().doFilter(request, response, chain);
        verify(response).sendError(403);
        verifyNoInteractions(chain);
    }

    @Test
    public void testDuplicateTicketsAreRejected() throws Exception {
        String ticket = tickets.issue();
        when(request.getParameterValues("ticket")).thenReturn(new String[] { ticket, ticket });
        new CBWebSocketTicketFilter().doFilter(request, response, chain);
        verify(response).sendError(403);
        verifyNoInteractions(chain);
        assertTrue(tickets.consume(ticket));
    }

    @Test
    public void testNativeTokenAuthenticationDoesNotRequireTicket() throws Exception {
        when(request.getHeader(WSConstants.WS_AUTH_HEADER)).thenReturn("native-access-token");
        new CBWebSocketTicketFilter().doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
        verifyNoInteractions(response);
    }
}

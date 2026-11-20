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

import io.cloudbeaver.server.websockets.CBEventOriginFilter;
import io.cloudbeaver.server.websockets.CBWebSocketTicketFilter;
import io.cloudbeaver.server.websockets.CBWebSocketTicketServlet;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.websocket.Endpoint;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpointConfig;
import org.eclipse.jetty.ee11.servlet.FilterHolder;
import org.eclipse.jetty.ee11.servlet.FilterMapping;
import org.eclipse.jetty.ee11.servlet.ServletContextHandler;
import org.eclipse.jetty.ee11.servlet.ServletHolder;
import org.eclipse.jetty.ee11.websocket.jakarta.server.config.JakartaWebSocketServletContainerInitializer;
import org.eclipse.jetty.ee11.websocket.servlet.WebSocketUpgradeFilter;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.jkiss.code.NotNull;
import org.junit.jupiter.api.Test;

import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.net.http.WebSocketHandshakeException;
import java.util.EnumSet;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

public class CBWebSocketTicketIntegrationTest {
    private static final String PUBLIC_ORIGIN = "https://public.example";
    private static final AtomicInteger UPGRADED = new AtomicInteger();
    private static CountDownLatch opened = new CountDownLatch(1);

    @Test
    public void testTicketGateBeforeRealJettyUpgradeBehindRewritingProxy() throws Exception {
        UPGRADED.set(0);
        opened = new CountDownLatch(1);
        Server server = new Server(0);
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        context.addServlet(new ServletHolder(new HttpServlet() {
            @Override
            protected void doGet(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) {
                request.getSession(true);
                response.setStatus(204);
            }
        }), "/session");
        context.addServlet(new ServletHolder(new CBWebSocketTicketServlet()), "/api/ws-ticket");
        WebSocketUpgradeFilter.ensureFilter(context.getServletContext());
        prependFilter(context, new FilterHolder(new CBWebSocketTicketFilter()), "ticket");
        prependFilter(context, new FilterHolder(new CBEventOriginFilter()), "origin");
        JakartaWebSocketServletContainerInitializer.configure(context, (servletContext, container) ->
            container.addEndpoint(ServerEndpointConfig.Builder.create(TestEndpoint.class, "/api/ws").build())
        );
        server.setHandler(context);
        server.start();
        String base = "http://localhost:" + ((ServerConnector) server.getConnectors()[0]).getLocalPort();
        try (HttpClient client = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
             HttpClient otherSession = HttpClient.newBuilder().cookieHandler(new CookieManager()).build()
        ) {
            client.send(HttpRequest.newBuilder(URI.create(base + "/session")).build(), HttpResponse.BodyHandlers.discarding());
            otherSession.send(HttpRequest.newBuilder(URI.create(base + "/session")).build(), HttpResponse.BodyHandlers.discarding());
            URI socket = URI.create(base.replace("http:", "ws:") + "/api/ws");
            // All requests simulate the same rewritten Origin. Fetch Metadata is deliberately absent.
            assertRejected(client, socket);
            assertEquals(0, UPGRADED.get());

            HttpResponse<String> response = client.send(
                HttpRequest.newBuilder(URI.create(base + "/api/ws-ticket"))
                    .header("Origin", PUBLIC_ORIGIN)
                    .header("X-Origin", PUBLIC_ORIGIN)
                    .header("X-CB-WebSocket-Ticket", "request")
                    .POST(HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofString()
            );
            assertEquals(200, response.statusCode());
            assertTrue(response.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
            URI ticketSocket = URI.create(socket + "?ticket=" + response.body());
            assertRejected(otherSession, ticketSocket);
            WebSocket connected = connect(client, ticketSocket).join();
            try {
                // Receiving 101 on the client does not imply that Jetty has finished onOpen.
                assertTrue(opened.await(5, TimeUnit.SECONDS), "Jetty did not invoke WebSocket onOpen");
                assertEquals(1, UPGRADED.get());
            } finally {
                connected.abort();
            }
            assertRejected(client, ticketSocket);
            assertEquals(1, UPGRADED.get());

            HttpResponse<Void> preflight = client.send(
                HttpRequest.newBuilder(URI.create(base + "/api/ws-ticket"))
                    .header("Origin", PUBLIC_ORIGIN)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "X-CB-WebSocket-Ticket")
                    .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.discarding()
            );
            assertEquals(403, preflight.statusCode());
            assertTrue(preflight.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
        } finally {
            server.stop();
        }
    }

    private static void prependFilter(
        @NotNull ServletContextHandler context,
        @NotNull FilterHolder holder,
        @NotNull String name
    ) {
        holder.setName(name);
        FilterMapping mapping = new FilterMapping();
        mapping.setFilterName(name);
        mapping.setPathSpec("/api/ws");
        mapping.setDispatcherTypes(EnumSet.of(DispatcherType.REQUEST));
        context.getServletHandler().prependFilter(holder);
        context.getServletHandler().prependFilterMapping(mapping);
    }

    private static void assertRejected(@NotNull HttpClient client, @NotNull URI uri) {
        CompletionException error = assertThrows(CompletionException.class, () -> connect(client, uri).join());
        WebSocketHandshakeException handshake = assertInstanceOf(WebSocketHandshakeException.class, error.getCause());
        assertEquals(403, handshake.getResponse().statusCode());
    }

    @NotNull
    private static CompletableFuture<WebSocket> connect(@NotNull HttpClient client, @NotNull URI uri) {
        return client.newWebSocketBuilder()
            .header("Origin", PUBLIC_ORIGIN)
            .header("X-Origin", PUBLIC_ORIGIN)
            .buildAsync(uri, new WebSocket.Listener() {});
    }

    public static class TestEndpoint extends Endpoint {
        @Override
        public void onOpen(@NotNull Session session, @NotNull EndpointConfig config) {
            UPGRADED.incrementAndGet();
            opened.countDown();
        }
    }
}

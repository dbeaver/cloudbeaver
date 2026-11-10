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
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CBEventOriginFilterTest {
    private HttpServletRequest request;

    @BeforeEach
    public void setUp() {
        request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getScheme()).thenReturn("http");
        Mockito.when(request.getServerName()).thenReturn("app.example.com");
        Mockito.when(request.getServerPort()).thenReturn(8080);
    }

    @Test
    public void testSameOrigin() {
        Mockito.when(request.getHeader("Origin")).thenReturn("http://app.example.com:8080");
        assertTrue(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testDifferentHost() {
        Mockito.when(request.getHeader("Origin")).thenReturn("http://other.example.com:8080");
        assertFalse(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testDifferentPort() {
        Mockito.when(request.getHeader("Origin")).thenReturn("http://app.example.com:8081");
        assertFalse(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testDifferentScheme() {
        Mockito.when(request.getHeader("Origin")).thenReturn("https://app.example.com:8080");
        assertFalse(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testOpaqueAndMalformedOrigins() {
        Mockito.when(request.getHeader("Origin")).thenReturn("null", "http://app.example.com:8080, http://other.example.com");
        assertFalse(CBEventOriginFilter.isAllowedOrigin(request));
        assertFalse(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testNoOriginForNonBrowserClients() {
        assertTrue(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testDefaultHttpsPort() {
        Mockito.when(request.getScheme()).thenReturn("https");
        Mockito.when(request.getServerPort()).thenReturn(443);
        Mockito.when(request.getHeader("Origin")).thenReturn("https://app.example.com");
        assertTrue(CBEventOriginFilter.isAllowedOrigin(request));
    }

    @Test
    public void testRejectedBeforeReachingEventHandler() throws Exception {
        Mockito.when(request.getHeader("Origin")).thenReturn("http://other.example.com:8080");
        HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
        FilterChain chain = Mockito.mock(FilterChain.class);

        new CBEventOriginFilter().doFilter(request, response, chain);

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verifyNoInteractions(chain);
    }
}

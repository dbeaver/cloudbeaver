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
package io.cloudbeaver.server.jetty;

import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.CBApplication;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Set;

public class RequestHostFilterTest {
    private CBServerConfig serverConfig;
    private RequestHostFilter filter;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    public void setUp() {
        serverConfig = new CBServerConfig();
        CBApplication<?> application = Mockito.mock(CBApplication.class);
        Mockito.doReturn(serverConfig).when(application).getServerConfiguration();
        Mockito.when(application.getRootURI()).thenReturn("");
        filter = new RequestHostFilter(application, Set.of(), Set.of());
        request = Mockito.mock(HttpServletRequest.class);
        response = Mockito.mock(HttpServletResponse.class);
        filterChain = Mockito.mock(FilterChain.class);
        Mockito.when(request.getRequestURI()).thenReturn("/editor/script%20one");
        Mockito.when(request.getQueryString()).thenReturn("connection=main");
    }

    @Test
    public void redirectsHttpRequestToTrustedHttpsHost() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:8443"));

        filterRequest("http://cloudbeaver.example:8443");

        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example:8443/editor/script%20one?connection=main"
        );
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsHttpsRedirectWithoutTrustedHosts() throws Exception {
        serverConfig.setForceHttps(true);

        filterRequest("http://malicious.example");

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void redirectsUntrustedRequestToTrustedDefaultHost() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));

        filterRequest("http://malicious.example");

        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example/editor/script%20one?connection=main"
        );
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsAuthorityInRequestPath() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getRequestURI()).thenReturn("//malicious.example");

        filterRequest("http://cloudbeaver.example");

        Mockito.verify(response).sendError(HttpServletResponse.SC_BAD_REQUEST);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsUntrustedAuthority() throws Exception {
        CBServerConfig unsafeServerConfig = Mockito.mock(CBServerConfig.class);
        Mockito.when(unsafeServerConfig.isForceHttps()).thenReturn(true);
        Mockito.when(unsafeServerConfig.getSupportedHosts())
            .thenReturn(List.of("cloudbeaver.example@malicious.example"));
        CBApplication<?> application = Mockito.mock(CBApplication.class);
        Mockito.doReturn(unsafeServerConfig).when(application).getServerConfiguration();
        Mockito.when(application.getRootURI()).thenReturn("");
        filter = new RequestHostFilter(application, Set.of(), Set.of());

        filterRequest("http://malicious.example");

        Mockito.verify(response).sendError(HttpServletResponse.SC_BAD_REQUEST);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    private void filterRequest(String origin) throws Exception {
        Mockito.when(request.getHeader("Origin")).thenReturn(origin);
        filter.doFilter(request, response, filterChain);
    }
}

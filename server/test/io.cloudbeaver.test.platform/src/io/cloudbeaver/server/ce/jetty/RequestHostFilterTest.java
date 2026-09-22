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
package io.cloudbeaver.server.ce.jetty;

import io.cloudbeaver.model.config.CBAppConfig;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.CBApplication;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Set;

public class RequestHostFilterTest {
    private CBServerConfig serverConfig;
    private CBAppConfig appConfig;
    private RequestHostFilter filter;
    private CBApplication<?> application;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    public void setUp() {
        serverConfig = new CBServerConfig();
        appConfig = Mockito.mock(CBAppConfig.class);
        application = Mockito.mock(CBApplication.class);
        Mockito.doReturn(serverConfig).when(application).getServerConfiguration();
        Mockito.doReturn(appConfig).when(application).getAppConfiguration();
        Mockito.when(appConfig.isEnabledForwardProxy()).thenReturn(true);
        Mockito.when(application.getRootURI()).thenReturn("");
        filter = new RequestHostFilter(application, Set.of(), Set.of());
        request = Mockito.mock(HttpServletRequest.class);
        response = Mockito.mock(HttpServletResponse.class);
        filterChain = Mockito.mock(FilterChain.class);
        Mockito.when(request.getRequestURI()).thenReturn("/editor/script%20one");
        Mockito.when(request.getQueryString()).thenReturn("connection=main");
        Mockito.when(request.getRequestURL()).thenReturn(
            new StringBuffer("https://cloudbeaver.example/editor/script%20one")
        );
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
    public void redirectsDefaultHttpPortToConfiguredHttpsPort() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:443"));

        filterRequest("http://cloudbeaver.example");

        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example:443/editor/script%20one?connection=main"
        );
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void prefersDefaultHttpsPortForRedirect() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:80", "cloudbeaver.example:443"));

        filterRequest("http://cloudbeaver.example");

        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example:443/editor/script%20one?connection=main"
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
    public void rejectsUntrustedRequestHost() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:8978"));
        Mockito.when(request.getHeader("X-Forwarded-Proto")).thenReturn("http");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("malicious.example:8978");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void preservesNonDefaultForwardedPort() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:8443"));
        Mockito.when(request.getHeader("X-Forwarded-Proto")).thenReturn("https");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("cloudbeaver.example");
        Mockito.when(request.getHeader("X-Forwarded-Port")).thenReturn("8443");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void ignoresForwardedSchemeWhenProxySupportIsDisabled() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(appConfig.isEnabledForwardProxy()).thenReturn(false);
        Mockito.when(request.getRequestURL()).thenReturn(
            new StringBuffer("http://cloudbeaver.example/editor/script%20one")
        );
        Mockito.when(request.getHeader("X-Forwarded-Proto")).thenReturn("https");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("malicious.example");
        Mockito.when(request.getHeader("X-Forwarded-Port")).thenReturn("8443");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example/editor/script%20one?connection=main"
        );
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void doesNotUseClientOriginForHttpsEnforcement() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getHeader("Origin")).thenReturn("https://cloudbeaver.example");
        Mockito.when(request.getRequestURL()).thenReturn(
            new StringBuffer("http://cloudbeaver.example/editor/script%20one")
        );

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example/editor/script%20one?connection=main"
        );
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsUntrustedRequestHostWithTrustedOrigin() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getHeader("Origin")).thenReturn("https://cloudbeaver.example");
        Mockito.when(request.getRequestURL()).thenReturn(
            new StringBuffer("https://malicious.example/editor/script%20one")
        );

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsUntrustedOriginWithTrustedForwardedHost() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getHeader("Origin")).thenReturn("https://malicious.example");
        Mockito.when(request.getHeader("X-Forwarded-Proto")).thenReturn("https");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("cloudbeaver.example");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void validatesRequestHostForExcludedPath() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        filter = new RequestHostFilter(application, Set.of("/api/openid/*"), Set.of());
        Mockito.when(request.getServletPath()).thenReturn("/api/openid/config/signon");
        Mockito.when(request.getHeader("Origin")).thenReturn("https://identity.example");
        Mockito.when(request.getRequestURL()).thenReturn(
            new StringBuffer("https://malicious.example/api/openid/config/signon")
        );

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void allowsTrustedRequestHostForExcludedPath() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        filter = new RequestHostFilter(application, Set.of("/api/openid/*"), Set.of());
        Mockito.when(request.getServletPath()).thenReturn("/api/openid/config/callback");
        Mockito.when(request.getHeader("Origin")).thenReturn("https://identity.example");
        Mockito.when(request.getRequestURL()).thenReturn(
            new StringBuffer("https://cloudbeaver.example/api/openid/config/callback")
        );

        filter.doFilter(request, response, filterChain);

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void rejectsUntrustedForwardedHostWithPort() throws Exception {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getHeader("Origin")).thenReturn("http://cloudbeaver.example");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("malicious.example:8978");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void ignoresForwardedHostWithPath() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getHeader("Origin")).thenReturn("https://cloudbeaver.example");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("malicious.example/path");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void ignoresMalformedForwardedHost() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));
        Mockito.when(request.getHeader("Origin")).thenReturn("https://cloudbeaver.example");
        Mockito.when(request.getHeader("X-Forwarded-Host")).thenReturn("[");

        filter.doFilter(request, response, filterChain);

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void rejectsMalformedOrigin() throws Exception {
        filterRequest("http://[");

        Mockito.verify(response).sendError(HttpServletResponse.SC_BAD_REQUEST);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsOriginWithoutHost() throws Exception {
        filterRequest("not-an-origin");

        Mockito.verify(response).sendError(HttpServletResponse.SC_BAD_REQUEST);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void rejectsUnsupportedOriginScheme() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));

        filterRequest("ftp://cloudbeaver.example");

        Mockito.verify(response).sendError(HttpServletResponse.SC_BAD_REQUEST);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    @Test
    public void allowsEquivalentHttpsDefaultPort() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:443"));

        filterRequest("https://cloudbeaver.example");

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void allowsCaseInsensitiveHttpsDefaultPort() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:443"));

        filterRequest("HTTPS://cloudbeaver.example");

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void allowsEquivalentHttpDefaultPort() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:80"));

        filterRequest("http://cloudbeaver.example");

        Mockito.verify(filterChain).doFilter(request, response);
        Mockito.verify(response, Mockito.never()).sendError(Mockito.anyInt());
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void rejectsNonDefaultPortForScheme() throws Exception {
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));

        filterRequest("http://cloudbeaver.example:443");

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
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
    public void rejectsMalformedSupportedHost() throws Exception {
        CBServerConfig unsafeServerConfig = Mockito.mock(CBServerConfig.class);
        Mockito.when(unsafeServerConfig.isForceHttps()).thenReturn(true);
        Mockito.when(unsafeServerConfig.getSupportedHosts())
            .thenReturn(List.of("cloudbeaver.example@malicious.example"));
        CBApplication<?> application = Mockito.mock(CBApplication.class);
        Mockito.doReturn(unsafeServerConfig).when(application).getServerConfiguration();
        Mockito.doReturn(appConfig).when(application).getAppConfiguration();
        Mockito.when(application.getRootURI()).thenReturn("");
        filter = new RequestHostFilter(application, Set.of(), Set.of());

        filterRequest("http://malicious.example");

        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
        Mockito.verify(filterChain, Mockito.never()).doFilter(request, response);
    }

    private void filterRequest(@NotNull String origin) throws Exception {
        Mockito.when(request.getHeader("Origin")).thenReturn(origin);
        Mockito.when(request.getRequestURL()).thenReturn(new StringBuffer(origin + "/editor/script%20one"));
        filter.doFilter(request, response, filterChain);
    }
}

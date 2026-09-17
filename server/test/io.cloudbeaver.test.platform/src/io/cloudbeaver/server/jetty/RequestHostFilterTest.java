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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Set;

public class RequestHostFilterTest {
    private CBServerConfig serverConfig;
    private TestRequestHostFilter filter;
    private HttpServletRequest request;
    private HttpServletResponse response;

    @BeforeEach
    public void setUp() {
        serverConfig = new CBServerConfig();
        CBApplication<?> application = Mockito.mock(CBApplication.class);
        Mockito.doReturn(serverConfig).when(application).getServerConfiguration();
        filter = new TestRequestHostFilter(application);
        request = Mockito.mock(HttpServletRequest.class);
        response = Mockito.mock(HttpServletResponse.class);
        Mockito.when(request.getRequestURI()).thenReturn("/editor/script%20one");
        Mockito.when(request.getQueryString()).thenReturn("connection=main");
    }

    @Test
    public void redirectsHttpRequestToTrustedHttpsHost() throws IOException {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example:8443"));

        boolean requestAllowed = filter.validateSchemaForTest(
            serverConfig,
            request,
            response,
            URI.create("http://cloudbeaver.example:8443")
        );

        Assertions.assertFalse(requestAllowed);
        Mockito.verify(response).sendRedirect(
            "https://cloudbeaver.example:8443/editor/script%20one?connection=main"
        );
    }

    @Test
    public void rejectsHttpsRedirectWithoutTrustedHosts() throws IOException {
        serverConfig.setForceHttps(true);

        boolean requestAllowed = filter.validateSchemaForTest(
            serverConfig,
            request,
            response,
            URI.create("http://malicious.example")
        );

        Assertions.assertFalse(requestAllowed);
        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void rejectsHttpsRedirectToUntrustedHost() throws IOException {
        serverConfig.setForceHttps(true);
        serverConfig.setSupportedHosts(List.of("cloudbeaver.example"));

        boolean requestAllowed = filter.validateSchemaForTest(
            serverConfig,
            request,
            response,
            URI.create("http://malicious.example")
        );

        Assertions.assertFalse(requestAllowed);
        Mockito.verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
        Mockito.verify(response, Mockito.never()).sendRedirect(Mockito.anyString());
    }

    @Test
    public void rejectsAuthorityInRequestPath() {
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> TestRequestHostFilter.createHttpRedirectUriForTest(
                "https",
                "cloudbeaver.example",
                "//malicious.example",
                null
            )
        );
    }

    @Test
    public void rejectsUntrustedAuthority() {
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> TestRequestHostFilter.createHttpRedirectUriForTest(
                "https",
                "cloudbeaver.example@malicious.example",
                "/",
                null
            )
        );
    }

    private static final class TestRequestHostFilter extends RequestHostFilter {
        private TestRequestHostFilter(@NotNull CBApplication<?> application) {
            super(application, Set.of(), Set.of());
        }

        private boolean validateSchemaForTest(
            @NotNull CBServerConfig serverConfig,
            @NotNull HttpServletRequest request,
            @NotNull HttpServletResponse response,
            @NotNull URI originUri
        ) throws IOException {
            return validateSchema(serverConfig, request, response, originUri);
        }

        @NotNull
        private static URI createHttpRedirectUriForTest(
            @NotNull String scheme,
            @NotNull String authority,
            @NotNull String requestUri,
            @Nullable String query
        ) {
            return createHttpRedirectUri(scheme, authority, requestUri, query);
        }
    }
}

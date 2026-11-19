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

import io.cloudbeaver.server.CBConstants;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.http.HttpScheme;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;

/**
 * Rejects browser event connections from origins other than the effective request origin.
 */
public class CBEventOriginFilter implements Filter {
    @Override
    public void doFilter(
        @NotNull ServletRequest request,
        @NotNull ServletResponse response,
        @NotNull FilterChain chain
    ) throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest
            && response instanceof HttpServletResponse httpResponse
            && !isAllowedOrigin(httpRequest)
        ) {
            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        chain.doFilter(request, response);
    }

    public static boolean isAllowedOrigin(@NotNull HttpServletRequest request) {
        String origin = request.getHeader(CBConstants.HEADER_ORIGIN);
        if (origin == null) {
            // Non-browser clients do not necessarily send an Origin header.
            return true;
        }

        try {
            Origin browserOrigin = parseOrigin(origin);
            Origin requestOrigin = getRequestOrigin(request);
            return browserOrigin != null && browserOrigin.equals(requestOrigin);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Nullable
    private static Origin getRequestOrigin(@NotNull HttpServletRequest request) {
        // Bundled Nginx and HAProxy overwrite X-Origin with the public request origin.
        // Keep supporting it for compatibility with existing proxy deployments.
        String proxyOrigin = request.getHeader(CBConstants.HEADER_X_ORIGIN);
        Origin parsedProxyOrigin = proxyOrigin == null ? null : parseOrigin(proxyOrigin);
        if (proxyOrigin != null && parsedProxyOrigin == null) {
            return null;
        }

        Origin forwardedOrigin = getForwardedOrigin(request);
        if (parsedProxyOrigin != null && forwardedOrigin != null && !parsedProxyOrigin.equals(forwardedOrigin)) {
            return null;
        }
        if (parsedProxyOrigin != null) {
            return parsedProxyOrigin;
        }
        if (forwardedOrigin != null) {
            return forwardedOrigin;
        }
        return createOrigin(request.getScheme(), request.getServerName(), request.getServerPort());
    }

    @Nullable
    private static Origin getForwardedOrigin(@NotNull HttpServletRequest request) {
        String scheme = request.getHeader(CBConstants.HEADER_X_FORWARDED_SCHEME);
        if (isBlank(scheme)) {
            scheme = request.getHeader(CBConstants.HEADER_X_FORWARDED_PROTO);
        }
        String host = request.getHeader(CBConstants.HEADER_X_FORWARDED_HOST);
        if (!hasForwardedOrigin(scheme, host)) {
            return null;
        }

        Origin origin = parseOrigin(scheme + "://" + host);
        if (origin == null) {
            return null;
        }
        String port = request.getHeader(CBConstants.HEADER_X_FORWARDED_PORT);
        if (isBlank(port)) {
            return origin;
        }
        int parsedPort = Integer.parseInt(port);
        if (!isValidPort(parsedPort)) {
            return null;
        }
        return new Origin(origin.scheme(), origin.host(), parsedPort);
    }

    private static boolean hasForwardedOrigin(@Nullable String scheme, @Nullable String host) {
        return !isBlank(scheme) && !isBlank(host);
    }

    private static boolean isBlank(@Nullable String value) {
        return value == null || value.isBlank();
    }

    private static boolean isValidPort(int port) {
        return port >= 1 && port <= 65535;
    }

    @Nullable
    private static Origin parseOrigin(@NotNull String value) {
        URI uri = URI.create(value);
        if (uri.getHost() == null
            || uri.getRawUserInfo() != null
            || !uri.getRawPath().isEmpty()
            || uri.getRawQuery() != null
            || uri.getRawFragment() != null
        ) {
            return null;
        }
        return createOrigin(uri.getScheme(), uri.getHost(), uri.getPort());
    }

    @Nullable
    private static Origin createOrigin(@Nullable String scheme, @Nullable String host, int port) {
        HttpScheme httpScheme;
        if (HttpScheme.HTTP.is(scheme)) {
            httpScheme = HttpScheme.HTTP;
        } else if (HttpScheme.HTTPS.is(scheme)) {
            httpScheme = HttpScheme.HTTPS;
        } else {
            return null;
        }
        if (host == null) {
            return null;
        }
        return new Origin(
            httpScheme.asString(),
            host.toLowerCase(Locale.ENGLISH),
            port == -1 ? httpScheme.getDefaultPort() : port
        );
    }

    private record Origin(@NotNull String scheme, @NotNull String host, int port) {
    }
}

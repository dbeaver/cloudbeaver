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

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import java.io.IOException;
import java.net.URI;

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
        String origin = request.getHeader("Origin");
        if (origin == null) {
            // Non-browser clients do not necessarily send an Origin header.
            return true;
        }

        try {
            URI uri = URI.create(origin);
            String scheme = uri.getScheme();
            return uri.getHost() != null
                && uri.getRawUserInfo() == null
                && uri.getRawPath().isEmpty()
                && uri.getRawQuery() == null
                && uri.getRawFragment() == null
                && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                && scheme.equalsIgnoreCase(request.getScheme())
                && uri.getHost().equalsIgnoreCase(request.getServerName())
                && effectivePort(scheme, uri.getPort()) == effectivePort(request.getScheme(), request.getServerPort());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static int effectivePort(@Nullable String scheme, int port) {
        if (port != -1) {
            return port;
        }
        return "https".equalsIgnoreCase(scheme) ? 443 : 80;
    }
}

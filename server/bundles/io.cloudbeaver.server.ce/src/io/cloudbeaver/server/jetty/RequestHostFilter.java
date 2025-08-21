/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

import com.google.common.net.InetAddresses;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.net.URI;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class RequestHostFilter implements Filter {
    private static final Log log = Log.getLog(RequestHostFilter.class);

    @NotNull
    private final CBApplication<?> application;
    private final Set<String> excludedPaths = new HashSet<>();
    private final Set<String> errorPaths = new HashSet<>();

    public RequestHostFilter(
        @NotNull CBApplication<?> application,
        @NotNull Set<String> excludedPaths,
        @NotNull Set<String> errorPaths
    ) {
        this.application = application;
        this.excludedPaths.addAll(
            excludedPaths.stream()
                .map(path -> ServletAppUtils.removeSideSlashes(path.replace("*", "")))
                .toList()
        );
        this.errorPaths.addAll(
            errorPaths.stream()
                .map(path -> ServletAppUtils.removeSideSlashes(path.replace("*", "")))
                .toList()
        );
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        boolean requestAllowed = true;

        if (request instanceof HttpServletRequest httpRequest) {
            CBServerConfig serverConfig = application.getServerConfiguration();
            URI originUri;
            try {
                String origin = ServletAppUtils.getOriginFromRequestOrThrow(httpRequest);
                originUri = URI.create(origin);
            } catch (Exception e) {
                log.error("Failed to get origin from request", e);
                chain.doFilter(request, response);
                return;
            }
            boolean isIpAddress = InetAddresses.isInetAddress(originUri.getHost());
            String servletPath = httpRequest.getServletPath();
            requestAllowed = isIpAddress;
            if (!requestAllowed) {
                if (CommonUtils.isNotEmpty(servletPath)) {
                    for (String excludedPath : excludedPaths) {
                        if (servletPath.contains(excludedPath)) {
                            chain.doFilter(request, response);
                            return;
                        }
                    }
                }
                requestAllowed = validateHosts(serverConfig, httpRequest, (HttpServletResponse) response, originUri);
            }
            if (requestAllowed) {
                requestAllowed = validateSchema(serverConfig, httpRequest, (HttpServletResponse) response, originUri);
            }
        }
        if (requestAllowed) {
            chain.doFilter(request, response);
        }
    }

    private boolean validateSchema(
        @NotNull CBServerConfig serverConfig,
        @NotNull HttpServletRequest httpRequest,
        @NotNull HttpServletResponse response,
        @NotNull URI originUri
    ) {
        boolean httpsExpected = serverConfig.isForceHttps();
        try {
            if ("http".equals(originUri.getScheme()) && httpsExpected) {
                log.warn("Request schema is 'http' but 'forceHttps' is enabled. Redirecting to 'https'.");
                StringBuilder redirectUrlBuilder = new StringBuilder("https://")
                    .append(originUri.getHost());
                if (originUri.getPort() > -1) {
                    redirectUrlBuilder.append(':').append(originUri.getPort());
                }
                redirectUrlBuilder.append(httpRequest.getRequestURI());
                if (httpRequest.getQueryString() != null) {
                    redirectUrlBuilder.append("?")
                        .append(httpRequest.getQueryString());
                }
                response.sendRedirect(redirectUrlBuilder.toString());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to redirect to HTTPS", e);
        }
        return true;
    }

    private boolean validateHosts(
        @NotNull CBServerConfig serverConfig,
        @NotNull HttpServletRequest httpRequest,
        @NotNull HttpServletResponse response,
        URI originUri
    ) throws IOException {
        List<String> availableHosts = serverConfig.getSupportedHosts();
        if (CommonUtils.isEmpty(availableHosts)) {
            return true;
        }
        try {
            var requestHostBuilder = new StringBuilder(originUri.getHost());
            if (originUri.getPort() > -1) {
                requestHostBuilder.append(':').append(originUri.getPort());
            }
            String requestHost = requestHostBuilder.toString();
            if (!availableHosts.contains(requestHost)) {
                for (String errorPath : errorPaths) {
                    if (httpRequest.getServletPath().contains(errorPath)) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.getWriter().write(
                            "Request host '" + requestHost + "' is not allowed. Available hosts: " + availableHosts
                        );
                        return false;
                    }
                }
                log.warn("Request host '" + requestHost + "' is not allowed. Redirect to default: " + availableHosts);
                redirectToDefaultHost(response, httpRequest, availableHosts);
                return false;
            }
        } catch (Throwable e) {
            log.error(e.getMessage(), e);
            redirectToDefaultHost(response, httpRequest, availableHosts);
            return false;
        }
        return true;
    }

    private void redirectToDefaultHost(
        @NotNull HttpServletResponse response,
        @NotNull HttpServletRequest httpRequest,
        @NotNull List<String> availableHosts
    ) throws IOException {
        boolean https = application.getServerConfiguration().isForceHttps();
        String redirectUrl = (https ? "https://" : "http://") + getDefaultHost(availableHosts) + httpRequest.getRequestURI();
        if (httpRequest.getQueryString() != null) {
            redirectUrl += "?" + httpRequest.getQueryString();
        }
        response.sendRedirect(redirectUrl);
    }

    @NotNull
    private String getDefaultHost(@NotNull List<String> availableHosts) {
        return availableHosts.getFirst();
    }
}

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
import java.util.List;

public class RequestHostFilter implements Filter {
    private static final Log log = Log.getLog(RequestHostFilter.class);

    @NotNull
    private final CBApplication<?> application;

    public RequestHostFilter(@NotNull CBApplication<?> application) {
        this.application = application;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest) {
            CBServerConfig serverConfig = application.getServerConfiguration();
            validateHosts(serverConfig, httpRequest, response);
            validateSchema(serverConfig, httpRequest, response);

        }
        chain.doFilter(request, response);
    }

    private void validateSchema(CBServerConfig serverConfig, HttpServletRequest httpRequest, ServletResponse response) throws IOException {
        boolean httpsExpected = serverConfig.isForceHttps();
        if ("http".equals(httpRequest.getScheme()) && httpsExpected) {
            try {
                log.warn("Request schema is 'http' but 'forceHttps' is enabled. Redirecting to 'https'.");
                String origin = ServletAppUtils.getOriginFromRequestOrThrow(httpRequest);
                URI originUri = URI.create(origin);
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
                ((HttpServletResponse) response).sendRedirect(redirectUrlBuilder.toString());
            } catch (Exception e) {
                log.error("Failed to redirect to HTTPS", e);
            }
        }
    }

    private void validateHosts(
        @NotNull CBServerConfig serverConfig,
        @NotNull HttpServletRequest httpRequest,
        @NotNull ServletResponse response
    ) throws IOException {
        List<String> availableHosts = serverConfig.getSupportedHosts();
        if (CommonUtils.isEmpty(availableHosts)) {
            return;
        }
        try {
            String origin = ServletAppUtils.getOriginFromRequestOrThrow(httpRequest);
            URI originUri = URI.create(origin);
            String requestHost = originUri.getHost();
            if (!availableHosts.contains(requestHost)) {
                log.warn("Request host '" + requestHost + "' is not allowed. Redirect to default: " + availableHosts);
                redirectToDefaultHost((HttpServletResponse) response, httpRequest, availableHosts);
            }
        } catch (Throwable e) {
            log.error(e.getMessage(), e);
            redirectToDefaultHost((HttpServletResponse) response, httpRequest, availableHosts);
        }
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

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

import com.google.common.net.InetAddresses;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
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
            boolean excludedPath = isExcludedPath(httpRequest.getServletPath());
            URI requestOriginUri;
            URI clientOriginUri = null;
            try {
                requestOriginUri = URI.create(ServletAppUtils.getRequestOriginFromRequest(
                    httpRequest,
                    application,
                    application.getAppConfiguration().isEnabledForwardProxy()
                ));
                if (!excludedPath) {
                    String clientOrigin = ServletAppUtils.getClientOriginFromRequest(httpRequest);
                    if (CommonUtils.isNotEmpty(clientOrigin)) {
                        clientOriginUri = URI.create(clientOrigin);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to get origin from request", e);
                ((HttpServletResponse) response).sendError(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (!isValidOrigin(requestOriginUri) || (clientOriginUri != null && !isValidOrigin(clientOriginUri))) {
                log.warn("Invalid request origin");
                ((HttpServletResponse) response).sendError(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }
            requestAllowed = validateSchema(serverConfig, httpRequest, (HttpServletResponse) response, requestOriginUri);
            if (requestAllowed && !InetAddresses.isInetAddress(requestOriginUri.getHost())) {
                requestAllowed = validateHosts(serverConfig, httpRequest, (HttpServletResponse) response, requestOriginUri);
            }
            if (requestAllowed && clientOriginUri != null && !InetAddresses.isInetAddress(clientOriginUri.getHost())) {
                requestAllowed = validateHosts(serverConfig, httpRequest, (HttpServletResponse) response, clientOriginUri);
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
    ) throws IOException {
        boolean httpsExpected = serverConfig.isForceHttps();
        if ("http".equalsIgnoreCase(originUri.getScheme()) && httpsExpected) {
            String redirectHost = getHttpsRedirectHost(originUri, serverConfig.getSupportedHosts());
            if (redirectHost == null) {
                log.warn("Unable to redirect request to HTTPS because its host is not configured in 'supportedHosts'");
                response.sendError(HttpServletResponse.SC_FORBIDDEN);
                return false;
            }
            log.warn("Request schema is 'http' but 'forceHttps' is enabled. Redirecting to 'https'.");
            redirectToHost(response, httpRequest, "https", redirectHost);
            return false;
        }
        return true;
    }

    private boolean isExcludedPath(@Nullable String servletPath) {
        if (CommonUtils.isEmpty(servletPath)) {
            return false;
        }
        return excludedPaths.stream().anyMatch(servletPath::contains);
    }

    private boolean validateHosts(
        @NotNull CBServerConfig serverConfig,
        @NotNull HttpServletRequest httpRequest,
        @NotNull HttpServletResponse response,
        @NotNull URI originUri
    ) throws IOException {
        List<String> availableHosts = serverConfig.getSupportedHosts();
        if (CommonUtils.isEmpty(availableHosts)) {
            return true;
        }
        try {
            String requestHost = getRequestHost(originUri);
            if (getAllowedHost(originUri, availableHosts) == null) {
                for (String errorPath : errorPaths) {
                    if (httpRequest.getServletPath().contains(errorPath)) {
                        log.warn("Request host '" + requestHost + "' is not allowed. Available hosts: " + availableHosts);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("text/plain;charset=UTF-8");
                        response.getWriter().write("Request host is not allowed. Available hosts: " + availableHosts);
                        return false;
                    }
                }
                log.warn("Request host '" + requestHost + "' is not allowed. Available hosts: " + availableHosts);
                response.sendError(HttpServletResponse.SC_FORBIDDEN);
                return false;
            }
        } catch (RuntimeException e) {
            log.error(e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return false;
        }
        return true;
    }

    private void redirectToHost(
        @NotNull HttpServletResponse response,
        @NotNull HttpServletRequest httpRequest,
        @NotNull String scheme,
        @NotNull String host
    ) throws IOException {
        try {
            URI redirectUri = createHttpRedirectUri(
                scheme,
                host,
                httpRequest.getRequestURI(),
                httpRequest.getQueryString()
            );
            response.sendRedirect(redirectUri.toString());
        } catch (IllegalArgumentException e) {
            log.warn("Unable to construct a safe redirect URI", e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
        }
    }

    @NotNull
    private static URI createHttpRedirectUri(
        @NotNull String scheme,
        @NotNull String authority,
        @NotNull String requestUri,
        @Nullable String query
    ) {
        if (!"http".equals(scheme) && !"https".equals(scheme)) {
            throw new IllegalArgumentException("Unsupported redirect scheme: " + scheme);
        }

        URI baseUri = validateRedirectAuthority(scheme, authority);
        validateRedirectPath(requestUri);

        URI redirectUri = URI.create(baseUri + requestUri + (query == null ? "" : "?" + query));
        validateRedirectUri(scheme, authority, baseUri, redirectUri);
        return redirectUri;
    }

    @NotNull
    private static URI validateRedirectAuthority(@NotNull String scheme, @NotNull String authority) {
        URI baseUri = URI.create(scheme + "://" + authority);
        if (baseUri.getHost() == null ||
            baseUri.getUserInfo() != null ||
            !authority.equals(baseUri.getRawAuthority())) {
            throw new IllegalArgumentException("Invalid redirect authority");
        }
        return baseUri;
    }

    private static void validateRedirectPath(@NotNull String requestUri) {
        URI pathUri = URI.create(requestUri);
        if (!requestUri.startsWith("/") || pathUri.isAbsolute() || pathUri.getRawAuthority() != null ||
            pathUri.getRawQuery() != null || pathUri.getRawFragment() != null) {
            throw new IllegalArgumentException("Invalid redirect path");
        }
    }

    private static void validateRedirectUri(
        @NotNull String scheme,
        @NotNull String authority,
        @NotNull URI baseUri,
        @NotNull URI redirectUri
    ) {
        if (!scheme.equals(redirectUri.getScheme()) ||
            !authority.equals(redirectUri.getRawAuthority()) ||
            !baseUri.getHost().equals(redirectUri.getHost()) ||
            baseUri.getPort() != redirectUri.getPort() ||
            redirectUri.getRawFragment() != null) {
            throw new IllegalArgumentException("Invalid redirect URI");
        }
    }

    @Nullable
    private String getAllowedHost(@NotNull URI originUri, @NotNull List<String> availableHosts) {
        return availableHosts.stream()
            .filter(host -> isSameAuthority(originUri, host))
            .findFirst()
            .orElse(null);
    }

    @Nullable
    private String getHttpsRedirectHost(@NotNull URI originUri, @NotNull List<String> availableHosts) {
        List<String> sameHostAuthorities = availableHosts.stream()
            .filter(host -> isSameHost(originUri, host, "https"))
            .toList();
        if (getEffectivePort(originUri) == 80) {
            String defaultHttpsAuthority = sameHostAuthorities.stream()
                .filter(host -> getEffectivePort("https", host) == 443)
                .findFirst()
                .orElse(null);
            if (defaultHttpsAuthority != null) {
                return defaultHttpsAuthority;
            }
        }
        int originPort = getEffectivePort(originUri);
        return sameHostAuthorities.stream()
            .filter(host -> getEffectivePort("https", host) == originPort)
            .findFirst()
            .orElse(null);
    }

    private static boolean isSameHost(@NotNull URI originUri, @NotNull String authority, @NotNull String scheme) {
        try {
            URI allowedUri = validateRedirectAuthority(scheme, authority);
            return originUri.getHost().equalsIgnoreCase(allowedUri.getHost());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static int getEffectivePort(@NotNull String scheme, @NotNull String authority) {
        try {
            return getEffectivePort(validateRedirectAuthority(scheme, authority));
        } catch (IllegalArgumentException e) {
            return -1;
        }
    }

    private static boolean isSameAuthority(@NotNull URI originUri, @NotNull String authority) {
        try {
            URI allowedUri = validateRedirectAuthority(originUri.getScheme(), authority);
            return originUri.getHost() != null && originUri.getHost().equalsIgnoreCase(allowedUri.getHost()) &&
                getEffectivePort(originUri) == getEffectivePort(allowedUri);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static int getEffectivePort(@NotNull URI uri) {
        if (uri.getPort() > -1) {
            return uri.getPort();
        }
        if ("http".equalsIgnoreCase(uri.getScheme())) {
            return 80;
        }
        if ("https".equalsIgnoreCase(uri.getScheme())) {
            return 443;
        }
        return -1;
    }

    private static boolean isHttpScheme(@Nullable String scheme) {
        return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
    }

    private static boolean isValidOrigin(@NotNull URI originUri) {
        return isHttpScheme(originUri.getScheme()) && CommonUtils.isNotEmpty(originUri.getHost());
    }

    @Nullable
    private String getRequestHost(@NotNull URI originUri) {
        if (originUri.getHost() == null) {
            return null;
        }
        var requestHostBuilder = new StringBuilder(originUri.getHost());
        if (originUri.getPort() > -1) {
            requestHostBuilder.append(':').append(originUri.getPort());
        }
        return requestHostBuilder.toString();
    }

}

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
package io.cloudbeaver.utils;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.app.ServletAuthApplication;
import io.cloudbeaver.model.session.WebSession;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMAuthenticationManager;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.net.URI;
import java.nio.file.Path;
import java.util.*;

public class ServletAppUtils {
    private static final String HEADER_ORIGIN = "Origin";
    private static final String HEADER_REFERER = "Referer";

    private static final String HEADER_FORWARDED_SCHEME = "X-Forwarded-Scheme";
    private static final String HEADER_FORWARDED_HOST = "X-Forwarded-Host";

    private static final Log log = Log.getLog(ServletAppUtils.class);

    public static String getRelativePath(String path, String curDir) {
        return getRelativePath(path, Path.of(curDir));
    }

    public static String getRelativePath(String path, Path curDir) {
        if (path.startsWith("/") || path.length() > 2 && path.charAt(1) == ':') {
            return path;
        }
        return curDir.resolve(path).toAbsolutePath().toString();
    }

    public static ServletApplication getServletApplication() {
        return (ServletApplication) DBWorkbench.getPlatform().getApplication();
    }

    public static ServletAuthApplication getAuthApplication() throws DBException {
        ServletApplication application = getServletApplication();
        if (!ServletAuthApplication.class.isAssignableFrom(application.getClass())) {
            throw new DBException("The current application doesn't contain authorization configuration");
        }
        return (ServletAuthApplication) application;
    }

    public static SMAuthenticationManager getAuthManager(ServletApplication application) throws DBException {
        var smController = application.createSecurityController(new NoAuthCredentialsProvider());
        if (!SMAuthenticationManager.class.isAssignableFrom(smController.getClass())) {
            throw new DBException("The current application cannot be used for authorization");
        }
        return (SMAuthenticationManager) smController;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> mergeConfigurations(
        Map<String, Object> priorityConfiguration,
        Map<String, Object> additional
    ) {
        var resultConfig = new HashMap<String, Object>();
        Set<String> rootKeys = new HashSet<>(priorityConfiguration.keySet());
        rootKeys.addAll(additional.keySet());

        for (var rootKey : rootKeys) {
            var originValue = priorityConfiguration.get(rootKey);
            var additionalValue = additional.get(rootKey);

            if (originValue == null || additionalValue == null) {
                if (additional.containsKey(rootKey)) {
                    if (additionalValue != null) {
                        resultConfig.put(rootKey, additionalValue);
                    }
                } else if (originValue != null) {
                    resultConfig.put(rootKey, originValue);
                }
                continue;
            }

            if (originValue instanceof Map) {
                var resultValue = mergeConfigurations((Map<String, Object>) originValue, (Map<String, Object>) additionalValue);
                resultConfig.put(rootKey, resultValue);
            } else {
                resultConfig.put(rootKey, additionalValue);
            }

        }

        return resultConfig;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> mergeConfigurationsWithVariables(Map<String, Object> origin, Map<String, Object> additional) {
        var resultConfig = new HashMap<String, Object>();
        Set<String> rootKeys = new HashSet<>(additional.keySet());

        for (var rootKey : rootKeys) {
            var originValue = origin.get(rootKey);
            var additionalValue = additional.get(rootKey);

            if (additionalValue == null) {
                continue;
            }

            if (originValue instanceof Map) {
                var resultValue = mergeConfigurationsWithVariables((Map<String, Object>) originValue, (Map<String, Object>) additionalValue);
                resultConfig.put(rootKey, resultValue);
            } else {
                resultConfig.put(rootKey, getExtractedValue(originValue, additionalValue));
            }

        }

        return resultConfig;
    }

    public static Object getExtractedValue(Object oldValue, Object newValue) {
        if (!(oldValue instanceof String)) {
            return newValue;
        }
        //new value already contains variable pattern
        if (newValue instanceof String newStringValue && GeneralUtils.isVariablePattern(newStringValue)) {
            return newValue;
        }
        String value = (String) oldValue;
        if (!GeneralUtils.isVariablePattern(value)) {
            return newValue;
        }
        String extractedVariable = GeneralUtils.extractVariableName(value);
        if (extractedVariable != null) {
            return GeneralUtils.variablePattern(extractedVariable + ":" + newValue);
        } else {
            return newValue;
        }
    }


    @NotNull
    public static String removeSideSlashes(String action) {
        if (CommonUtils.isEmpty(action)) {
            return action;
        }
        while (action.startsWith("/")) action = action.substring(1);
        while (action.endsWith("/")) action = action.substring(0, action.length() - 1);
        return action;
    }

    @NotNull
    public static StringBuilder getAuthApiUri(@NotNull String serviceId, @NotNull String origin) throws DBException {
        return getAuthApiUri(getAuthApplication(), serviceId, origin);
    }

    @NotNull
    public static StringBuilder getAuthApiUri(
        @NotNull ServletAuthApplication webAuthApplication,
        @NotNull String serviceId,
        @NotNull String origin
    ) throws DBException {
        String finalOrigin =  webAuthApplication.modifyOrigin(origin);
        StringBuilder authUriBuilder = new StringBuilder(removeSideSlashes(finalOrigin));
        String serviceUriSegment = removeSideSlashes(webAuthApplication.getAuthServiceUriSegment());
        if (CommonUtils.isNotEmpty(serviceUriSegment)) {
            authUriBuilder.append("/").append(serviceUriSegment);
        }
        authUriBuilder.append("/").append(serviceId).append("/");
        return authUriBuilder;
    }

    public static void addResponseCookie(HttpServletRequest request, HttpServletResponse response, String cookieName, String cookieValue, long maxSessionIdleTime) {
        addResponseCookie(request, response, cookieName, cookieValue, maxSessionIdleTime, null);
    }

    public static void addResponseCookie(HttpServletRequest request, HttpServletResponse response, String cookieName, String cookieValue, long maxSessionIdleTime, @Nullable String sameSite) {
        Cookie sessionCookie = new Cookie(cookieName, cookieValue);
        if (maxSessionIdleTime > 0) {
            sessionCookie.setMaxAge((int) (maxSessionIdleTime / 1000));
        }

        String path = getServletApplication().getServerConfiguration().getRootURI();

        if (sameSite != null) {
            if (!request.isSecure()) {
                log.debug("Attempt to set Cookie `" + cookieName + "` with `SameSite=" + sameSite + "` failed, it " +
                    "require a secure context/HTTPS");
            } else {
                sessionCookie.setSecure(true);
                path = path.concat("; SameSite=" + sameSite);
            }
        }
        sessionCookie.setHttpOnly(true);
        sessionCookie.setPath(path);
        response.addCookie(sessionCookie);
    }

    public static String getRequestCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(cookieName)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public static boolean isGlobalProject(DBPProject project) {
        return project.getId().equals(getGlobalProjectId());
    }

    public static String getGlobalProjectId() {
        String globalConfigurationName = getServletApplication().getDefaultProjectName();
        return RMProjectType.GLOBAL.getPrefix() + "_" + globalConfigurationName;
    }

    public static WebProjectImpl getProjectById(WebSession webSession, String projectId) throws DBWebException {
        WebProjectImpl project = webSession.getProjectById(projectId);
        if (project == null) {
            throw new DBWebException("Project '" + projectId + "' not found");
        }
        return project;
    }

    public static Map<String, Object> flattenMap(Map<String, Object> nestedMap) {
        Map<String, Object> result = new LinkedHashMap<>();
        flattenMapHelper(nestedMap, result, "");
        return result;
    }

    private static void flattenMapHelper(Map<String, Object> nestedMap, Map<String, Object> result, String prefix) {
        for (Map.Entry<String, Object> entry : nestedMap.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            flattenResult(result, prefix, key, value);
        }
    }

    private static void flattenResult(Map<String, Object> result, String prefix, String key, Object value) {
        if (value instanceof Map) {
            flattenMapHelper((Map<String, Object>) value, result, prefix + key + ".");
        } else if (value instanceof Object[]) {
            flattenArray((Object[]) value, result, prefix + key + ".");
        } else {
            String fullKey = prefix + key;
            if (!result.containsKey(fullKey)) {
                result.put(fullKey, value);
            }
        }
    }

    private static void flattenArray(Object[] array, Map<String, Object> result, String prefix) {
        for (int i = 0; i < array.length; i++) {
            String key = String.valueOf(i);
            Object value = array[i];

            flattenResult(result, prefix, key, value);
        }
    }

    @NotNull
    public static String getOriginFromRequestOrThrow(HttpServletRequest request) throws DBWebException {
        String origin = request.getHeader(HEADER_ORIGIN);
        if (CommonUtils.isEmpty(origin)) {
            origin = request.getHeader(HEADER_REFERER);
        }
        String forwardedScheme = request.getHeader(HEADER_FORWARDED_SCHEME);
        String forwardedHost = request.getHeader(HEADER_FORWARDED_HOST);
        if (CommonUtils.isNotEmpty(forwardedScheme) && CommonUtils.isNotEmpty(forwardedHost)) {
            origin = forwardedScheme + "://" + forwardedHost;
        }
        if (CommonUtils.isEmpty(origin)) {
            URI requestUrl = URI.create(request.getRequestURL().toString());
            origin = getRootUrlFromUri(requestUrl) + "/";
        }
        origin = removeSideSlashes(origin);
        var app = ServletAppUtils.getServletApplication();
        String rootUri = removeSideSlashes(app.getRootURI());
        if (!origin.endsWith(rootUri)) {
            origin = origin + "/" + rootUri + "/";
        }
        return removeSideSlashes(origin);
    }

    public static String getRootUrlFromUri(@NotNull URI uri) {
        var builder = new StringBuilder()
            .append(uri.getScheme())
            .append("://")
            .append(uri.getHost());
        if (uri.getPort() > 0) {
            builder.append(":").append(uri.getPort());
        }
        return removeSideSlashes(substringBeforeRootURI(builder.toString()));
    }

    public static String substringBeforeRootURI(@NotNull String uri) {
        String rootUri = removeSideSlashes(getServletApplication().getRootURI());
        if (CommonUtils.isEmpty(rootUri)) {
            return uri;
        }
        String[] split = uri.split(rootUri);
        return split[0];
    }
}

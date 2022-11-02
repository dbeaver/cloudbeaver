/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.events.CBEvent;
import io.cloudbeaver.events.CBEventConstants;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.app.WebAuthApplication;
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

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class WebAppUtils {
    private static final Log log = Log.getLog(WebAppUtils.class);

    public static String getRelativePath(String path, String curDir) {
        return getRelativePath(path, Path.of(curDir));
    }

    public static String getRelativePath(String path, Path curDir) {
        if (path.startsWith("/") || path.length() > 2 && path.charAt(1) == ':') {
            return path;
        }
        return curDir.resolve(path).toAbsolutePath().toString();
    }

    public static WebApplication getWebApplication() {
        return (WebApplication) DBWorkbench.getPlatform().getApplication();
    }

    public static SMAuthenticationManager getAuthManager(WebApplication application) throws DBException {
        var smController = application.createSecurityController(new NoAuthCredentialsProvider());
        if (!SMAuthenticationManager.class.isAssignableFrom(smController.getClass())) {
            throw new DBException("The current application cannot be used for authorization");
        }
        return (SMAuthenticationManager) smController;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> mergeConfigurations(Map<String, Object> origin, Map<String, Object> additional) {
        var resultConfig = new HashMap<String, Object>();
        Set<String> rootKeys = new HashSet<>(origin.keySet());
        rootKeys.addAll(additional.keySet());

        for (var rootKey : rootKeys) {
            var originValue = origin.get(rootKey);
            var additionalValue = additional.get(rootKey);

            if (originValue == null || additionalValue == null) {
                var resultValue = originValue != null ? originValue : additionalValue;
                resultConfig.put(rootKey, resultValue);
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
    public static StringBuilder getAuthApiPrefix(String serviceId) throws DBException {
        WebApplication application = getWebApplication();
        if (!WebAuthApplication.class.isAssignableFrom(application.getClass())) {
            throw new DBException("The current application doesn't contain authorization configuration");
        }
        WebAuthApplication webAuthApplication = (WebAuthApplication) application;
        return getAuthApiPrefix(webAuthApplication, serviceId);
    }

    @NotNull
    public static StringBuilder getAuthApiPrefix(WebAuthApplication webAuthApplication, String serviceId) {
        String authUrl = removeSideSlashes(webAuthApplication.getAuthServiceURL());
        StringBuilder apiPrefix = new StringBuilder(authUrl);
        apiPrefix.append("/").append(serviceId).append("/");
        return apiPrefix;
    }

    public static void addResponseCookie(HttpServletRequest request, HttpServletResponse response, String cookieName, String cookieValue, long maxSessionIdleTime) {
        addResponseCookie(request, response, cookieName, cookieValue, maxSessionIdleTime, null);
    }

    public static void addResponseCookie(HttpServletRequest request, HttpServletResponse response, String cookieName, String cookieValue, long maxSessionIdleTime, @Nullable String sameSite) {
        Cookie sessionCookie = new Cookie(cookieName, cookieValue);
        if (maxSessionIdleTime > 0) {
            sessionCookie.setMaxAge((int) (maxSessionIdleTime / 1000));
        }

        String path = getWebApplication().getRootURI();

        if (sameSite != null) {
            if (sameSite.toLowerCase() == "none" && request.isSecure() == false) {
                log.debug("Attempt to set Cookie `" + cookieName + "` with `SameSite=None` failed, it require a secure context/HTTPS");
            } else {
                sessionCookie.setSecure(true);
                path = path.concat("; SameSite=" + sameSite);
            }
        }

        sessionCookie.setPath(path);
        response.addCookie(sessionCookie);
    }

    public static String getRequestCookie(HttpServletRequest request, String cookieName) {
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(cookieName)) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public static boolean isGlobalProject(DBPProject project) {
        return project.getId().equals(getGlobalProjectId());
    }

    public static String getGlobalProjectId() {
        String globalConfigurationName = getWebApplication().getDefaultProjectName();
        return RMProjectType.GLOBAL.getPrefix() + "_" + globalConfigurationName;
    }

    public static void addDataSourceUpdatedEvent(DBPProject project, String datasourceId, CBEventConstants.EventType eventType) {
        if (project == null) {
            return;
        }
        getWebApplication().getEventController().addEvent(
            new CBEvent(
                CBEventConstants.CLOUDBEAVER_DATASOURCE_UPDATED,
                Map.of("projectId", project.getId(),
                    "dataSourceIds", List.of(datasourceId),
                    "eventType", eventType)
            )
        );
    }

    public static void addRmResourceUpdatedEvent(String eventId, String projectId, String resourcePath) {
        getWebApplication().getEventController().addEvent(
            new CBEvent(eventId,
                Map.of(
                    "projectId", projectId,
                    "resourcePath", resourcePath
                )
            )
        );
    }
}

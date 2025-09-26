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
package io.cloudbeaver;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.app.WebAppConfiguration;
import io.cloudbeaver.model.rm.DBNResourceManagerResource;
import io.cloudbeaver.model.session.WebActionParameters;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.utils.ConfigurationUtils;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.navigator.WebPropertyFilter;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebCommonUtils;
import io.cloudbeaver.utils.WebDataSourceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;
import org.jkiss.utils.CommonUtils;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Various constants
 */
public class WebServiceUtils extends WebCommonUtils {

    private static final Log log = Log.getLog(WebServiceUtils.class);

    private static final Gson gson = new GsonBuilder().create();

    @NotNull
    public static DBPDataSourceRegistry getGlobalDataSourceRegistry() throws DBWebException {
        return WebDataSourceUtils.getGlobalDataSourceRegistry();
    }

    public static InputStream openStaticResource(String path) {
        return WebServiceUtils.class.getClassLoader().getResourceAsStream(path);
    }

    public static DBNBrowseSettings parseNavigatorSettings(Map<String, Object> settingsMap) {
        return gson.fromJson(
            gson.toJsonTree(settingsMap), DataSourceNavigatorSettings.class);
    }

    public static void fireActionParametersOpenEditor(WebSession webSession, DBPDataSourceContainer dataSource, boolean addEditorName) {
        Map<String, Object> actionParameters = new HashMap<>();
        actionParameters.put("action", "open-sql-editor");
        actionParameters.put("connection-id", dataSource.getId());
        actionParameters.put("project-id", dataSource.getProject().getId());
        if (addEditorName) {
            actionParameters.put("editor-name", dataSource.getName() + "-sql");
        }
        WebActionParameters.saveToSession(webSession, actionParameters);
    }

    public static void refreshDatabases(WebSession session, String projectId) throws DBWebException {
        DBNProject projectNode = session.getNavigatorModelOrThrow().getRoot().getProjectNode(session.getProjectById(projectId));
        if (projectNode != null) {
            projectNode.getDatabases().refreshChildren();
        }
    }

    public static boolean isGlobalProject(DBPProject project) {
        return project.getId()
            .equals(RMProjectType.GLOBAL.getPrefix() + "_" + ServletAppUtils.getServletApplication()
                .getDefaultProjectName());
    }

    public static List<WebAuthProviderDescriptor> getEnabledAuthProviders() {
        List<WebAuthProviderDescriptor> result = new ArrayList<>();
        String[] authProviders = null;
        try {
            authProviders = ServletAppUtils.getAuthApplication().getAuthConfiguration().getEnabledAuthProviders();
        } catch (DBException e) {
            log.error(e.getMessage(), e);
            return List.of();
        }
        for (String apId : authProviders) {
            WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(apId);
            if (authProvider != null) {
                result.add(authProvider);
            }
        }
        return result;
    }

    /**
     * Returns set of applicable ids of drivers.
     */
    @NotNull
    public static Set<String> getApplicableDriversIds() {
        return WebAppUtils.getWebApplication().getDriverRegistry().getApplicableDrivers().stream()
            .map(DBPDriver::getId)
            .collect(Collectors.toSet());
    }

    /**
     * Returns filtered properties collected from object.
     */
    @NotNull
    public static WebPropertyInfo[] getObjectFilteredProperties(
        @NotNull WebSession session,
        @NotNull Object object,
        @Nullable WebPropertyFilter filter
    ) {
        PropertyCollector propertyCollector = new PropertyCollector(object, true);
        propertyCollector.setLocale(session.getLocale());
        propertyCollector.collectProperties();
        List<WebPropertyInfo> webProps = new ArrayList<>();
        for (DBPPropertyDescriptor prop : propertyCollector.getProperties()) {
            if (filter != null && !CommonUtils.isEmpty(filter.getIds()) && !filter.getIds().contains(CommonUtils.toString(prop.getId()))) {
                continue;
            }
            WebPropertyInfo webProperty = new WebPropertyInfo(session, prop, propertyCollector);
            if (filter != null) {
                if (!CommonUtils.isEmpty(filter.getFeatures()) && !webProperty.hasAnyFeature(filter.getFeatures())) {
                    continue;
                }
                if (!CommonUtils.isEmpty(filter.getCategories()) && !filter.getCategories().contains(webProperty.getCategory())) {
                    continue;
                }
            }
            boolean propertyAcceptable = true;
            if (prop.getRequiredFeatures() != null) {
                for (String feature : prop.getRequiredFeatures()) {
                    propertyAcceptable = session.getApplication().getAppConfiguration().isFeatureEnabled(feature);
                    if (!propertyAcceptable) {
                        break;
                    }
                }
            }
            if (propertyAcceptable) {
                webProps.add(webProperty);
            }
        }
        return webProps.toArray(new WebPropertyInfo[0]);
    }

    /**
     * Check whether driver is enabled
     *
     * @param driver driver
     * @return true if driver is enabled
     */
    public static boolean isDriverEnabled(@NotNull DBPDriver driver) {
        WebAppConfiguration config = WebAppUtils.getWebApplication().getAppConfiguration();
        return ConfigurationUtils.isDriverEnabled(
            driver,
            config.getEnabledDrivers(),
            config.getDisabledDrivers()
        );
    }

    public static boolean isFolder(@NotNull DBNNode node) {
        return (node instanceof DBNContainer && !(node instanceof DBNDataSource))
            || (node instanceof DBNResourceManagerResource
            && ((DBNResourceManagerResource) node).getResource().isFolder());
    }
}

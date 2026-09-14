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
package io.cloudbeaver.registry;

import io.cloudbeaver.DBWebException;
import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.meta.ForTest;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class WebConnectionTestConfiguratorRegistry {
    private static final Log log = Log.getLog(WebConnectionTestConfiguratorRegistry.class);
    private static final String TAG_CONFIGURATOR = "configurator";

    private static WebConnectionTestConfiguratorRegistry instance;

    private final Map<String, WebConnectionTestConfiguratorDescriptor> configurators = new LinkedHashMap<>();

    @NotNull
    public static synchronized WebConnectionTestConfiguratorRegistry getInstance() {
        if (instance == null) {
            instance = new WebConnectionTestConfiguratorRegistry(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private WebConnectionTestConfiguratorRegistry(@NotNull IExtensionRegistry extensionRegistry) {
        for (IConfigurationElement configuration : extensionRegistry.getConfigurationElementsFor(
            WebConnectionTestConfiguratorDescriptor.EXTENSION_ID
        )) {
            if (!TAG_CONFIGURATOR.equals(configuration.getName())) {
                continue;
            }
            var descriptor = new WebConnectionTestConfiguratorDescriptor(configuration);
            if (configurators.putIfAbsent(descriptor.getId(), descriptor) != null) {
                log.error("Duplicate connection test configurator '" + descriptor.getId() + "'");
            }
        }
    }

    @ForTest
    public WebConnectionTestConfiguratorRegistry(
        @NotNull List<WebConnectionTestConfiguratorDescriptor> descriptors
    ) {
        for (WebConnectionTestConfiguratorDescriptor descriptor : descriptors) {
            configurators.put(descriptor.getId(), descriptor);
        }
    }

    @NotNull
    public List<ResolvedConfiguration> resolveConfigurations(
        @Nullable List<Map<String, Object>> extensions
    ) throws DBWebException {
        if (CommonUtils.isEmpty(extensions)) {
            return List.of();
        }

        Set<String> ids = new HashSet<>();
        List<ResolvedConfiguration> resolved = new ArrayList<>(extensions.size());
        for (Map<String, Object> extension : extensions) {
            if (extension == null) {
                throw new DBWebException("Connection test extension must be an object");
            }
            Object idValue = extension.get("id");
            if (!(idValue instanceof String id) || CommonUtils.isEmpty(id)) {
                throw new DBWebException("Connection test extension ID must be specified");
            }
            if (!ids.add(id)) {
                throw new DBWebException("Duplicate connection test extension '" + id + "'");
            }
            WebConnectionTestConfiguratorDescriptor descriptor = configurators.get(id);
            if (descriptor == null) {
                throw new DBWebException("Unknown connection test extension '" + id + "'");
            }
            Object configurationValue = extension.get("configuration");
            if (!(configurationValue instanceof Map<?, ?> configuration)) {
                throw new DBWebException("Configuration for connection test extension '" + id + "' must be an object");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> typedConfiguration = (Map<String, Object>) configuration;
            resolved.add(new ResolvedConfiguration(descriptor, typedConfiguration));
        }
        return resolved;
    }

    public void configure(
        @NotNull List<ResolvedConfiguration> configurations,
        @NotNull DBPProject project,
        @Nullable DataSourceDescriptor originalDataSource,
        @NotNull DataSourceDescriptor testDataSource
    ) throws DBWebException {
        for (ResolvedConfiguration configuration : configurations) {
            DBWConnectionTestConfigurator configurator;
            try {
                configurator = configuration.descriptor.getInstance();
            } catch (DBException | RuntimeException | LinkageError e) {
                throw new DBWebException(
                    "Cannot initialize connection test extension '" + configuration.descriptor.getId() + "'",
                    e
                );
            }
            configurator.configure(project, originalDataSource, testDataSource, configuration.configuration);
        }
    }

    public static final class ResolvedConfiguration {
        private final WebConnectionTestConfiguratorDescriptor descriptor;
        private final Map<String, Object> configuration;

        private ResolvedConfiguration(
            @NotNull WebConnectionTestConfiguratorDescriptor descriptor,
            @NotNull Map<String, Object> configuration
        ) {
            this.descriptor = descriptor;
            this.configuration = configuration;
        }
    }
}

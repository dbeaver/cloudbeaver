/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import io.cloudbeaver.model.rm.RMUtils;
import org.eclipse.core.resources.IProject;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.registry.BaseProjectImpl;
import org.jkiss.dbeaver.registry.DataSourceRegistryRM;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.Pair;

import java.nio.file.Path;
import java.util.Collection;

public class WebProjectImpl extends BaseProjectImpl {

    @NotNull
    private final RMProject project;

    @NotNull
    private final Path path;
    @NotNull
    protected final DataSourceFilter dataSourceFilter;
    private final RMController resourceController;

    public WebProjectImpl(
        @NotNull DBPWorkspace workspace,
        @NotNull RMController resourceController,
        @NotNull SMSessionContext sessionContext,
        @NotNull RMProject project,
        @NotNull DataSourceFilter dataSourceFilter
    ) {
        super(workspace, sessionContext);
        this.resourceController = resourceController;
        this.path = RMUtils.getProjectPath(project);
        this.project = project;
        this.dataSourceFilter = dataSourceFilter;
    }

    @NotNull
    public RMController getResourceController() {
        return resourceController;
    }

    @Override
    public boolean isVirtual() {
        return true;
    }

    @NotNull
    @Override
    public String getName() {
        return project.getDisplayName();
    }

    @NotNull
    @Override
    public String getId() {
        return project.getId();
    }

    @NotNull
    @Override
    public Path getAbsolutePath() {
        return path;
    }

    @Nullable
    @Override
    public IProject getEclipseProject() {
        return null;
    }

    @Override
    public boolean isOpen() {
        return true;
    }

    @Override
    public void ensureOpen() {

    }

    @Override
    public boolean isUseSecretStorage() {
        return false;
    }

    @NotNull
    public RMProject getRmProject() {
        return this.project;
    }

    @NotNull
    @Override
    protected DBPDataSourceRegistry createDataSourceRegistry() {
        return new WebDataSourceRegistryProxy(
            new DataSourceRegistryRM(this, getResourceController()),
            dataSourceFilter
        );
    }

    /**
     * Method for Bulk Update of resources properties paths
     *
     * @param oldToNewPaths collection of OldPath to NewPath pairs
     */
    public void moveResourcePropertiesBatch(@NotNull Collection<Pair<String, String>> oldToNewPaths) {
        loadMetadata();
        synchronized (metadataSync) {
            for (var pathsPair : oldToNewPaths) {
                final var oldResourcePath = CommonUtils.normalizeResourcePath(pathsPair.getFirst());
                final var newResourcePath = CommonUtils.normalizeResourcePath(pathsPair.getSecond());
                final var resProps = resourceProperties.remove(oldResourcePath);
                if (resProps != null) {
                    resourceProperties.put(newResourcePath, resProps);
                }
            }
        }
        flushMetadata();
    }

    /**
     * Method for Bulk Remove of resources properties
     */
    public boolean resetResourcesPropertiesBatch(@NotNull Collection<String> resourcesPaths) {
        loadMetadata();
        boolean propertiesChanged = false;
        synchronized (metadataSync) {
            for (var resourcePath : resourcesPaths) {
                var removedProperties = resourceProperties.remove(CommonUtils.normalizeResourcePath(resourcePath));
                if (removedProperties != null) {
                    propertiesChanged = true;
                }
            }
        }
        if (propertiesChanged) {
            flushMetadata();
        }
        return propertiesChanged;
    }
}

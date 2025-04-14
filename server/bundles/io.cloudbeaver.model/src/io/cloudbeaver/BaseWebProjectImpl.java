/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.impl.app.BaseProjectImpl;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMControllerProvider;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.Pair;

import java.nio.file.Path;
import java.util.Collection;

public abstract class BaseWebProjectImpl extends BaseProjectImpl implements RMControllerProvider {

    @NotNull
    private final RMProject project;

    @NotNull
    private final Path path;
    @NotNull
    private final RMController resourceController;

    public BaseWebProjectImpl(
        @NotNull DBPWorkspace workspace,
        @NotNull RMController resourceController,
        @NotNull SMSessionContext sessionContext,
        @NotNull RMProject project,
        @NotNull Path path
    ) {
        super(workspace, sessionContext);
        this.resourceController = resourceController;
        this.path = path;
        this.project = project;
    }

    @NotNull
    public RMController getResourceController() {
        return resourceController;
    }

    @NotNull
    @Override
    public RMProject getRMProject() {
        return project;
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

    public Path getMetadataFilePath() {
        return getMetadataPath().resolve(METADATA_STORAGE_FILE);
    }

    @Override
    public boolean isPrivateProject() {
        return RMProjectType.USER.equals(getRMProject().getType());
    }
}

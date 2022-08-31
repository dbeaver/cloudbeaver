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
package io.cloudbeaver;

import io.cloudbeaver.model.rm.RMUtils;
import org.eclipse.core.resources.IProject;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.registry.BaseProjectImpl;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.nio.file.Path;

public class VirtualProjectImpl extends BaseProjectImpl {

    @NotNull
    private final RMProject project;

    @NotNull
    private final Path path;
    @NotNull
    protected final DataSourceFilter dataSourceFilter;

    public VirtualProjectImpl(@NotNull RMProject project,
                              @Nullable SMSessionContext sessionContext,
                              @NotNull DataSourceFilter dataSourceFilter) {
        super(DBWorkbench.getPlatform().getWorkspace(), sessionContext);
        this.path = RMUtils.getProjectPath(project);
        this.project = project;
        this.dataSourceFilter = dataSourceFilter;
    }

    @Override
    public boolean isVirtual() {
        return true;
    }

    @NotNull
    @Override
    public String getName() {
        return project.getName();
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

    @NotNull
    public RMProject getRmProject() {
        return this.project;
    }

    @NotNull
    @Override
    protected DBPDataSourceRegistry createDataSourceRegistry() {
        return new WebDataSourceRegistryProxy(new DataSourceRegistry(this), dataSourceFilter);
    }
}

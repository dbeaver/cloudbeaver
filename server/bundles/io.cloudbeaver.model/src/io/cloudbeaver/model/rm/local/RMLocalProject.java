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
package io.cloudbeaver.model.rm.local;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.rm.RMProjectInfo;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.dbeaver.registry.project.LocalProjectImpl;

import java.nio.file.Path;

public class RMLocalProject extends LocalProjectImpl {
    @NotNull
    private final RMProjectType projectType;
    @Nullable
    private RMProjectInfo projectInfo;

    public RMLocalProject(
        @NotNull DBPWorkspace workspace,
        @Nullable SMSessionContext sessionContext,
        @NotNull Path projectPath,
        @NotNull RMProjectType type
    ) {
        super(workspace, sessionContext, projectPath);
        this.projectType = type;
    }

    @Override
    public boolean isVirtual() {
        return true;
    }

    @NotNull
    @Override
    public String getId() {
        return RMUtils.makeProjectIdFromPath(projectPath, projectType);
    }

    @Nullable
    @Override
    public String getDescription() {
        if (projectInfo == null) {
            return null;
        }
        return projectInfo.getDescription();
    }

    @NotNull
    @Override
    public String getName() {
        if (projectInfo == null || projectInfo.getName() == null) {
            return projectPath.getFileName().toString();
        }
        return projectInfo.getName();
    }

    @NotNull
    public RMProjectType getProjectType() {
        return projectType;
    }

    @Override
    public void updateProject(@Nullable String newName, @Nullable String description) throws DBException {
        this.projectInfo = new RMProjectInfo();
        projectInfo.setName(newName);
        projectInfo.setDescription(description);
    }

    public void setProjectInfo(@NotNull RMProjectInfo projectInfo) {
        this.projectInfo = projectInfo;
    }

    public boolean canUpdateProjectName() {
        return RMProjectType.SHARED.equals(projectType);
    }
}

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
package io.cloudbeaver.server;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.model.app.ServletApplication;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.impl.app.BaseProjectImpl;
import org.jkiss.dbeaver.model.impl.app.BaseWorkspaceImpl;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Web global workspace.
 */
public class ServerGlobalWorkspace extends BaseWorkspaceImpl {

    private static final Log log = Log.getLog(ServerGlobalWorkspace.class);

    protected final Map<String, WebProjectImpl> projects = new LinkedHashMap<>();
    private WebGlobalProject globalProject;

    private final ServletApplication application;

    public ServerGlobalWorkspace(
        @NotNull DBPPlatform platform,
        @NotNull ServletApplication application
    ) {
        super(platform, application.getWorkspaceDirectory());
        this.application = application;
    }

    @Override
    public void initializeProjects() {
        initializeWorkspaceSession();

        // Load global project
        String defaultProjectName = application.getDefaultProjectName();
        if (CommonUtils.isNotEmpty(defaultProjectName)) {
            Path globalProjectPath = getAbsolutePath().resolve(defaultProjectName);
            if (!Files.exists(globalProjectPath)) {
                try {
                    Files.createDirectories(globalProjectPath);
                } catch (IOException e) {
                    log.error("Error creating global project path: " + globalProject, e);
                }
            }
        }

        globalProject = new WebGlobalProject(
            this,
            getAuthContext(),
            CommonUtils.notEmpty(defaultProjectName)
        );
        activeProject = globalProject;
    }

    @NotNull
    @Override
    public String getWorkspaceId() {
        return readWorkspaceIdProperty();
    }

    @Nullable
    @Override
    public DBPProject getActiveProject() {
        return super.getActiveProject();
    }

    @NotNull
    @Override
    public List<BaseProjectImpl> getProjects() {
        return Collections.singletonList(globalProject);
    }

    @Nullable
    @Override
    public BaseProjectImpl getProject(@NotNull String projectName) {
        if (globalProject != null && globalProject.getId().equals(projectName)) {
            return globalProject;
        }
        return null;
    }
}
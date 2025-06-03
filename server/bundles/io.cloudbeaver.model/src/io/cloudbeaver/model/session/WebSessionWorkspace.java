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
package io.cloudbeaver.model.session;

import io.cloudbeaver.WebSessionProjectImpl;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPAdaptable;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.impl.auth.SessionContextImpl;
import org.jkiss.dbeaver.model.rm.RMUtils;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Web workspace
 */
public class WebSessionWorkspace implements DBPWorkspace {

    private final BaseWebSession session;
    private final SessionContextImpl workspaceAuthContext;
    private final List<WebSessionProjectImpl> accessibleProjects = new ArrayList<>();
    private WebSessionProjectImpl activeProject;

    public WebSessionWorkspace(BaseWebSession session) {
        this.session = session;
        this.workspaceAuthContext = new SessionContextImpl(null);
    }

    public BaseWebSession getWebSession() {
        return session;
    }

    @NotNull
    @Override
    public DBPPlatform getPlatform() {
        return DBWorkbench.getPlatform();
    }

    @NotNull
    @Override
    public String getWorkspaceId() {
        String userId = session.getUserContext().getUserId();
        if (CommonUtils.isEmpty(userId)) {
            userId = "anonymous";
        }
        return userId;
    }

    @Override
    public boolean isActive() {
        return true;
    }

    @NotNull
    @Override
    public Path getAbsolutePath() {
        return RMUtils.getUserProjectsPath().resolve(getWorkspaceId());
    }

    @NotNull
    @Override
    public Path getMetadataFolder() {
        return getAbsolutePath().resolve(DBPWorkspace.METADATA_FOLDER);
    }

    @NotNull
    @Override
    public List<WebSessionProjectImpl> getProjects() {
        return accessibleProjects;
    }

    @Nullable
    @Override
    public WebSessionProjectImpl getActiveProject() {
        return activeProject;
    }

    @Nullable
    @Override
    public WebSessionProjectImpl getProject(@NotNull String projectName) {
        for (WebSessionProjectImpl project : accessibleProjects) {
            if (project.getName().equals(projectName)) {
                return project;
            }
        }
        return null;
    }

    @Nullable
    @Override
    public WebSessionProjectImpl getProjectById(@NotNull String projectId) {
        if (projectId == null) {
            return activeProject;
        }
        for (WebSessionProjectImpl project : accessibleProjects) {
            if (project.getId().equals(projectId)) {
                return project;
            }
        }
        return null;
    }

    @NotNull
    @Override
    public SessionContextImpl getAuthContext() {
        return workspaceAuthContext;
    }

    @Override
    public void initializeProjects() {
        // noop
    }

    @Override
    public void dispose() {
        clearProjects();
    }

    @Override
    public DBPImage getResourceIcon(DBPAdaptable resourceAdapter) {
        return null;
    }

    public void setActiveProject(WebSessionProjectImpl activeProject) {
        this.activeProject = activeProject;
    }

    void addProject(WebSessionProjectImpl project) {
        accessibleProjects.add(project);
    }

    void removeProject(WebSessionProjectImpl project) {
        accessibleProjects.remove(project);
    }

    void clearProjects() {
        if (!this.accessibleProjects.isEmpty()) {
            for (WebSessionProjectImpl project : accessibleProjects) {
                project.dispose();
            }
            this.activeProject = null;
            this.accessibleProjects.clear();
        }
    }

    @Override
    public boolean hasRealmPermission(@NotNull String permission) {
        return false;
    }

    @Override
    public boolean supportsRealmFeature(@NotNull String feature) {
        return false;
    }

}

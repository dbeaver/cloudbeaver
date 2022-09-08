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
package io.cloudbeaver.service.rm.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebProjectInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.rm.DBWServiceRM;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;

import java.nio.charset.StandardCharsets;

/**
 * Web service implementation
 */
public class WebServiceRM implements DBWServiceRM {

    @Override
    public RMProject[] listProjects(WebSession webSession) throws DBWebException {
        try {
            return getResourceController(webSession).listAccessibleProjects();
        } catch (DBException e) {
            throw new DBWebException("Error reading list of accessible projects", e);
        }
    }

    @Override
    public RMProject[] listSharedProjects(@NotNull WebSession webSession) throws DBWebException {
        try {
            return getResourceController(webSession).listAllSharedProjects();
        } catch (DBException e) {
            throw new DBWebException("Error reading list of accessible projects", e);
        }
    }

    @Override
    public RMProject getProject(@NotNull WebSession webSession, @NotNull String projectId) throws DBWebException {
        try {
            return getResourceController(webSession).getProject(projectId, false, false);
        } catch (DBException e) {
            throw new DBWebException("Error reading list of accessible projects", e);
        }
    }

    @NotNull
    @Override
    public RMResource[] listResources(WebSession webSession, @NotNull String projectId, @Nullable String folder, @Nullable String nameMask, boolean readProperties, boolean readHistory) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            return getResourceController(webSession).listResources(projectId, folder, nameMask, readProperties, readHistory, false);
        } catch (DBException e) {
            throw new DBWebException("Error reading list of resources", e);
        }
    }

    @Override
    public String readResourceAsString(@NotNull WebSession webSession, @NotNull String projectId, @NotNull String resourcePath) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            byte[] data = getResourceController(webSession).getResourceContents(projectId, resourcePath);
            return new String(data, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new DBWebException("Error reading resource '" + resourcePath + "' data", e);
        }
    }

    @Override
    public String createResource(@NotNull WebSession webSession, @NotNull String projectId, @NotNull String resourcePath, boolean isFolder) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            return getResourceController(webSession).createResource(projectId, resourcePath, isFolder);
        } catch (Exception e) {
            throw new DBWebException("Error creating resource " + resourcePath, e);
        }
    }

    @Override
    public boolean deleteResource(@NotNull WebSession webSession, @NotNull String projectId, @NotNull String resourcePath) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            getResourceController(webSession).deleteResource(projectId, resourcePath, false);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting resource " + resourcePath, e);
        }
    }

    @NotNull
    @Override
    public String writeResourceStringContent(
        @NotNull WebSession webSession,
        @NotNull String projectId,
        @NotNull String resourcePath,
        @NotNull String data,
        boolean forceOverwrite
    ) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
            return getResourceController(webSession).setResourceContents(projectId, resourcePath, bytes, forceOverwrite);
        } catch (Exception e) {
            throw new DBWebException("Error writing resource '" + resourcePath + "' data", e);
        }
    }

    @Override
    public RMProject createProject(
        @NotNull WebSession session, @NotNull String name, @Nullable String description
    ) throws DBWebException {
        try {
            return getResourceController(session).createProject(name, description);
        } catch (DBException e) {
            throw new DBWebException("Error creating project", e);
        }
    }

    @Override
    public boolean deleteProject(@NotNull WebSession session, @NotNull String projectId) throws DBWebException {
        try {
            DBPProject project = session.getProjectById(projectId);
            getResourceController(session).deleteProject(projectId);
            session.deleteSessionProject(project);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error deleting project", e);
        }
    }

    private RMController getResourceController(WebSession webSession) {
        return webSession.getRmController();
    }

    private void checkIsRmEnabled(WebSession session) throws DBException {
        if (!session.getApplication().getAppConfiguration().isResourceManagerEnabled()) {
            throw new DBException("Resource Manager disabled");
        }
    }
}

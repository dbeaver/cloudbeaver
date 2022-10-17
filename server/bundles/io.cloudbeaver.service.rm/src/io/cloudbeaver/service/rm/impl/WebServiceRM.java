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
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import io.cloudbeaver.service.rm.DBWServiceRM;
import io.cloudbeaver.service.rm.model.RMProjectPermissions;
import io.cloudbeaver.service.rm.model.RMSubjectProjectPermissions;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.security.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Web service implementation
 */
public class WebServiceRM implements DBWServiceRM {

    @Override
    public RMProject[] listProjects(@NotNull WebSession webSession) throws DBWebException {
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
    public RMResource[] listResources(@NotNull WebSession webSession,
                                      @NotNull String projectId,
                                      @Nullable String folder,
                                      @Nullable String nameMask,
                                      boolean readProperties,
                                      boolean readHistory
    ) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            return getResourceController(webSession).listResources(projectId, folder, nameMask, readProperties, readHistory, false);
        } catch (DBException e) {
            throw new DBWebException("Error reading list of resources", e);
        }
    }

    /**
     * Sets resource property.
     *
     * @param webSession    the web session
     * @param projectId     the project id
     * @param resourcePath  the resource path
     * @param propertyName  the property name
     * @param propertyValue the property value
     * @return the resource property
     * @throws DBException the db exception
     */
    @NotNull
    @Override
    public String setResourceProperty(@NotNull WebSession webSession,
                                      @NotNull String projectId,
                                      @NotNull String resourcePath,
                                      @NotNull String propertyName,
                                      @Nullable Object propertyValue
    ) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            getResourceController(webSession).setResourceProperty(projectId, resourcePath, propertyName, propertyValue);
            return Boolean.TRUE.toString();
        } catch (DBException e) {
            String message = String.format("Error setting property [%s] for the the resource: [%s]", resourcePath, propertyName);
            throw new DBWebException(message, e);
        }
    }

    @Override
    public String readResourceAsString(@NotNull WebSession webSession,
                                       @NotNull String projectId,
                                       @NotNull String resourcePath
    ) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            byte[] data = getResourceController(webSession).getResourceContents(projectId, resourcePath);
            return new String(data, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new DBWebException("Error reading resource '" + resourcePath + "' data", e);
        }
    }

    @Override
    public String createResource(@NotNull WebSession webSession,
                                 @NotNull String projectId,
                                 @NotNull String resourcePath,
                                 boolean isFolder
    ) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            return getResourceController(webSession).createResource(projectId, resourcePath, isFolder);
        } catch (Exception e) {
            throw new DBWebException("Error creating resource " + resourcePath, e);
        }
    }

    @Override
    public boolean deleteResource(@NotNull WebSession webSession,
                                  @NotNull String projectId,
                                  @NotNull String resourcePath
    ) throws DBException {
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
            RMProject rmProject = getResourceController(session).createProject(name, description);
            session.createVirtualProject(rmProject);
            return rmProject;
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

    @Override
    public List<AdminPermissionInfo> listProjectPermissions() throws DBWebException {
        try {
            return SMUtils.findPermissions(SMConstants.PROJECT_PERMISSION_SCOPE);
        } catch (Exception e) {
            throw new DBWebException("Error reading project permissions", e);
        }
    }

    @Override
    public boolean setProjectPermissions(@NotNull WebSession webSession,
                                         @NotNull String projectId,
                                         @NotNull RMSubjectProjectPermissions projectPermissions
    ) throws DBWebException {
        try {
            SMController sm = webSession.getSecurityController();
            sm.deleteAllObjectPermissions(projectId, SMObjects.PROJECT);
            for (Map.Entry<String, Set<String>> entry : projectPermissions.getSubjectPermissions().entrySet()) {
                String subjectId = entry.getKey();
                Set<String> permissions = entry.getValue();
                sm.setObjectPermissions(
                    Set.of(projectId),
                    SMObjects.PROJECT,
                    Set.of(subjectId),
                    permissions,
                    webSession.getUserId()
                );
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting project permissions", e);
        }
    }

    @Override
    public boolean setSubjectProjectPermissions(
        @NotNull WebSession webSession,
        @NotNull String subjectId,
        @NotNull RMProjectPermissions projectPermissions
    ) throws DBWebException {
        try {
            SMController sm = webSession.getSecurityController();
            for (Map.Entry<String, Set<String>> entry : projectPermissions.getProjectPermissions().entrySet()) {
                String projectId = entry.getKey();
                Set<String> permissions = entry.getValue();
                sm.setObjectPermissions(
                    Set.of(projectId),
                    SMObjects.PROJECT,
                    Set.of(subjectId),
                    permissions,
                    webSession.getUserId()
                );
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting project permissions", e);
        }
    }

    @Override
    public List<SMObjectPermissionsGrant> listProjectGrantedPermissions(@NotNull WebSession webSession,
                                                                        @NotNull String projectId
    ) throws DBWebException {
        SMController sm = webSession.getSecurityController();
        try {
            return sm.getObjectPermissionGrants(projectId, SMObjects.PROJECT);
        } catch (DBException e) {
            throw new DBWebException("Error reading project permission grants", e);
        }
    }

    @Override
    public List<SMObjectPermissionsGrant> listSubjectProjectsPermissionGrants(@NotNull WebSession webSession,
                                                                              @NotNull String subjectId
    ) throws DBWebException {
        try {
            SMAdminController sm = webSession.getAdminSecurityController();
            return sm.getSubjectObjectPermissionGrants(subjectId, SMObjects.PROJECT);
        } catch (DBException e) {
            throw new DBWebException("Error reading project permission grants", e);
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

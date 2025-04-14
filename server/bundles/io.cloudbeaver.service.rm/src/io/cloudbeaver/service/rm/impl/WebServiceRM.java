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
package io.cloudbeaver.service.rm.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import io.cloudbeaver.service.rm.DBWServiceRM;
import io.cloudbeaver.service.rm.model.RMProjectPermissions;
import io.cloudbeaver.service.rm.model.RMSubjectProjectPermissions;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.security.*;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.WSProjectUpdateEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSObjectPermissionEvent;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceProperty;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Web service implementation
 */
public class WebServiceRM implements DBWServiceRM {

    private static final Log log = Log.getLog(WebServiceRM.class);

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
            var project = getResourceController(webSession).getProject(projectId, false, false);
            if (project == null) {
                throw new DBWebException("Project not found " + projectId);
            }
            return project;
        } catch (DBException e) {
            throw new DBWebException("Error reading project", e);
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
     * @return true on success
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

            WebEventUtils.addRmResourceUpdatedEvent(
                projectId,
                webSession,
                resourcePath,
                WSConstants.EventAction.UPDATE,
                WSResourceProperty.PROPERTY,
                propertyName);
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
            String result = getResourceController(webSession).createResource(projectId, resourcePath, isFolder);
            WebEventUtils.addRmResourceUpdatedEvent(
                projectId,
                webSession,
                resourcePath,
                WSConstants.EventAction.CREATE,
                WSResourceProperty.NAME);
            return result;
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
            WebEventUtils.addRmResourceUpdatedEvent(
                projectId,
                webSession,
                resourcePath,
                WSConstants.EventAction.DELETE,
                WSResourceProperty.NAME);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting resource " + resourcePath, e);
        }
    }

    @Override
    public boolean moveResource(@NotNull WebSession webSession,
                                @NotNull String projectId,
                                @NotNull String oldResourcePath,
                                @NotNull String newResourcePath
    ) throws DBException {
        checkIsRmEnabled(webSession);
        try {
            var resourceController = getResourceController(webSession);
            resourceController.moveResource(projectId, oldResourcePath, newResourcePath);

            WebEventUtils.addRmResourceUpdatedEvent(
                projectId,
                webSession,
                oldResourcePath,
                WSConstants.EventAction.DELETE,
                WSResourceProperty.NAME);
            WebEventUtils.addRmResourceUpdatedEvent(
                projectId,
                webSession,
                newResourcePath,
                WSConstants.EventAction.CREATE,
                WSResourceProperty.NAME);
            return true;
        } catch (Exception e) {
            throw new DBWebException(e.getMessage(), e);
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
            String content = getResourceController(webSession).setResourceContents(projectId, resourcePath, bytes, forceOverwrite);
            var eventType = WSConstants.EventAction.UPDATE;
            if (!forceOverwrite) {
                eventType = WSConstants.EventAction.CREATE;
            }
            WebEventUtils.addRmResourceUpdatedEvent(
                projectId,
                webSession,
                resourcePath,
                eventType,
                WSResourceProperty.CONTENT);
            return content;
        } catch (Exception e) {
            throw new DBWebException("Error writing resource data", e);
        }
    }

    @Override
    public RMProject createProject(
        @NotNull WebSession session, @NotNull String name, @Nullable String description
    ) throws DBWebException {
        try {
            RMProject rmProject = getResourceController(session).createProject(name, description);
            session.addSessionProject(rmProject.getId());
            ServletAppUtils.getServletApplication().getEventController().addEvent(
                WSProjectUpdateEvent.create(session.getSessionId(), session.getUserId(), rmProject.getId())
            );
            return rmProject;
        } catch (DBException e) {
            throw new DBWebException("Error creating project", e);
        }
    }

    @Override
    public boolean deleteProject(@NotNull WebSession session, @NotNull String projectId) throws DBWebException {
        try {
            var project = session.getProjectById(projectId);
            if (project == null) {
                throw new DBException("Project not found: " + projectId);
            }
            if (project.isUseSecretStorage()) {
                var secretController = DBSSecretController.getProjectSecretController(project);
                secretController.deleteProjectSecrets(project.getId());
            }
            getResourceController(session).deleteProject(projectId);
            session.removeSessionProject(projectId);
            ServletAppUtils.getServletApplication().getEventController().addEvent(
                WSProjectUpdateEvent.delete(session.getSessionId(), session.getUserId(), projectId)
            );
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
            sm.deleteAllObjectPermissions(projectId, SMObjectType.project);
            for (Map.Entry<String, Set<String>> entry : projectPermissions.getSubjectPermissions().entrySet()) {
                String subjectId = entry.getKey();
                Set<String> permissions = entry.getValue();
                sm.setObjectPermissions(
                    Set.of(projectId),
                    SMObjectType.project,
                    Set.of(subjectId),
                    permissions,
                    webSession.getUserId()
                );
            }
            addProjectPermissionsUpdatedEvent(webSession, projectId);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting project permissions", e);
        }
    }

    private void addProjectPermissionsUpdatedEvent(
        @NotNull WebSession webSession,
        @NotNull String projectId
    ) {
        var event = WSObjectPermissionEvent.update(
            webSession.getUserContext().getSmSessionId(),
            webSession.getUserId(),
            SMObjectType.project,
            projectId
        );
        webSession.getApplication().getEventController().addEvent(event);
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
                    SMObjectType.project,
                    Set.of(subjectId),
                    permissions,
                    webSession.getUserId()
                );
                addProjectPermissionsUpdatedEvent(webSession, projectId);
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting project permissions", e);
        }
    }

    @Override
    public boolean deleteProjectsPermissions(
        @NotNull WebSession webSession,
        @NotNull List<String> projectIds,
        @NotNull List<String> subjectIds,
        @NotNull List<String> permissions
    ) throws DBWebException {
        try {
            SMAdminController smAdminController = webSession.getAdminSecurityController();
            smAdminController.deleteObjectPermissions(
                new HashSet<>(projectIds),
                SMObjectType.project,
                new HashSet<>(subjectIds),
                new HashSet<>(permissions)
            );
            log.info("Project permissions deleted: [projectIds=%s, subjectIds=%s, permissions=%s, madeBy=%s]"
                .formatted(
                    String.join(",", projectIds),
                    String.join(",", subjectIds),
                    String.join(",", permissions),
                    webSession.getUserId()
                ));
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting project permissions", e);
        }
    }

    @Override
    public boolean addProjectsPermissions(
        @NotNull WebSession webSession,
        @NotNull List<String> projectIds,
        @NotNull List<String> subjectIds,
        @NotNull List<String> permissions
    ) throws DBWebException {
        try {
            SMAdminController smAdminController = webSession.getAdminSecurityController();
            smAdminController.addObjectPermissions(
                new HashSet<>(projectIds),
                SMObjectType.project,
                new HashSet<>(subjectIds),
                new HashSet<>(permissions),
                webSession.getUserId()
            );
            log.info("Project permissions added: [projectIds=%s, subjectIds=%s, permissions=%s, madeBy=%s]"
                .formatted(
                    String.join(",", projectIds),
                    String.join(",", subjectIds),
                    String.join(",", permissions),
                    webSession.getUserId()
                ));
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error adding project permissions", e);
        }
    }

    @Override
    public List<SMObjectPermissionsGrant> listProjectGrantedPermissions(@NotNull WebSession webSession,
                                                                        @NotNull String projectId
    ) throws DBWebException {
        SMController sm = webSession.getSecurityController();
        try {
            return sm.getObjectPermissionGrants(projectId, SMObjectType.project);
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
            return sm.getSubjectObjectPermissionGrants(subjectId, SMObjectType.project);
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

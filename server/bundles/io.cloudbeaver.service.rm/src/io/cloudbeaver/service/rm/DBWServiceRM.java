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
package io.cloudbeaver.service.rm;

import io.cloudbeaver.*;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import io.cloudbeaver.service.rm.model.RMProjectPermissions;
import io.cloudbeaver.service.rm.model.RMSubjectProjectPermissions;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.rm.RMConstants;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.security.SMObjectPermissionsGrant;

import java.util.List;

/**
 * Web service API
 */
public interface DBWServiceRM extends DBWService {

    @WebAction()
    RMProject[] listProjects(@NotNull WebSession webSession) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    RMProject[] listSharedProjects(@NotNull WebSession webSession) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    RMProject getProject(@NotNull WebSession webSession, @NotNull String projectId) throws DBWebException;

    @NotNull
    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_VIEW
    )
    RMResource[] listResources(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @Nullable String folder,
        @Nullable String nameMask,
        boolean readProperties,
        boolean readHistory) throws DBException;

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
    @WebProjectAction(requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_EDIT)
    String setResourceProperty(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull String resourcePath,
        @NotNull String propertyName,
        @Nullable Object propertyValue) throws DBException;

    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_VIEW
    )
    String readResourceAsString(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull String resourcePath) throws DBException;

    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_EDIT
    )
    String createResource(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull String resourcePath,
        boolean isFolder) throws DBException;

    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_EDIT
    )
    boolean moveResource(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull String oldResourcePath,
        @NotNull String newResourcePath) throws DBException;

    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_EDIT
    )
    boolean deleteResource(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull String resourcePath) throws DBException;

    @NotNull
    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_RESOURCE_EDIT
    )
    String writeResourceStringContent(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull String resourcePath,
        @NotNull String data,
        boolean forceOverwrite) throws DBException;

    @WebAction(requirePermissions = {RMConstants.PERMISSION_RM_ADMIN})
    RMProject createProject(
        @NotNull WebSession session,
        @NotNull String name,
        @Nullable String description) throws DBWebException;

    @WebAction(requirePermissions = {RMConstants.PERMISSION_RM_ADMIN})
    boolean deleteProject(
        @NotNull WebSession session,
        @NotNull @WebObjectId String projectId) throws DBWebException;

    @WebAction(requirePermissions = {RMConstants.PERMISSION_RM_ADMIN})
    List<AdminPermissionInfo> listProjectPermissions() throws DBWebException;

    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_ADMIN
    )
    boolean setProjectPermissions(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId,
        @NotNull RMSubjectProjectPermissions projectPermissions
    ) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setSubjectProjectPermissions(
        @NotNull WebSession webSession,
        @NotNull String subjectId,
        @NotNull RMProjectPermissions projectPermissions
    ) throws DBWebException;

    @WebProjectAction(
        requireProjectPermissions = RMConstants.PERMISSION_PROJECT_ADMIN
    )
    List<SMObjectPermissionsGrant> listProjectGrantedPermissions(
        @NotNull WebSession webSession,
        @NotNull @WebObjectId String projectId
    ) throws DBWebException;

    @WebAction(requirePermissions = {RMConstants.PERMISSION_RM_ADMIN})
    List<SMObjectPermissionsGrant> listSubjectProjectsPermissionGrants(
        @NotNull WebSession webSession,
        @NotNull String subjectId
    ) throws DBWebException;
}

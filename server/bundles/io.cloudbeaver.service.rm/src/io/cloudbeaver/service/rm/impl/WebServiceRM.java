/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
import io.cloudbeaver.service.rm.DBWServiceRM;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceProperty;

import java.nio.charset.StandardCharsets;

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
                                      @Nullable String propertyValue
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

    private RMController getResourceController(WebSession webSession) {
        return webSession.getRmController();
    }

    private void checkIsRmEnabled(WebSession session) throws DBException {
        if (!session.getApplication().getAppConfiguration().isResourceManagerEnabled()) {
            throw new DBException("Resource Manager disabled");
        }
    }
}

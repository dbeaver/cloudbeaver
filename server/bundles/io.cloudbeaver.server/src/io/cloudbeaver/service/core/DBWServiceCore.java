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
package io.cloudbeaver.service.core;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.WebObjectId;
import io.cloudbeaver.WebProjectAction;
import io.cloudbeaver.model.*;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.rm.RMConstants;

import java.util.List;
import java.util.Map;

/**
 * Web service API
 */
public interface DBWServiceCore extends DBWService {

    @WebAction(authRequired = false, initializationRequired = false)
    WebServerConfig getServerConfig(@Nullable WebSession webSession) throws DBWebException;

    /**
     * Returns information of system.
     */
    @WebAction
    WebPropertyInfo[] getSystemInformationProperties(@NotNull WebSession webSession);

    @WebAction
    WebProductSettings getProductSettings(@NotNull WebSession webSession);

    @WebAction
    List<WebDatabaseDriverInfo> getDriverList(@NotNull WebSession webSession, String driverId) throws DBWebException;

    @WebAction
    List<WebDatabaseAuthModel> getAuthModels(@NotNull WebSession webSession);

    @WebAction
    List<WebNetworkHandlerDescriptor> getNetworkHandlers(@NotNull WebSession webSession);

    @WebAction(authRequired = false)
    List<WebConnectionInfo> getUserConnections(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @Nullable String id,
        @Nullable List<String> projectIds) throws DBWebException;

    @WebAction(authRequired = false)
    List<WebConnectionFolderInfo> getConnectionFolders(
        @NotNull WebSession webSession, @Nullable String projectId, @Nullable String id) throws DBWebException;

    @WebAction(authRequired = false)
    String[] getSessionPermissions(@NotNull WebSession webSession) throws DBWebException;

    ///////////////////////////////////////////
    // Session

    @WebAction(authRequired = false)
    WebSession openSession(
        @NotNull WebSession webSession,
        @Nullable String defaultLocale,
        @NotNull HttpServletRequest servletRequest,
        @NotNull HttpServletResponse servletResponse) throws DBWebException;

    @WebAction(authRequired = false)
    WebSession getSessionState(@NotNull WebSession webSession) throws DBWebException;

    @WebAction
    List<WebServerMessage> readSessionLog(@NotNull WebSession webSession, Integer maxEntries, Boolean clearEntries) throws DBWebException;

    @WebAction(authRequired = false)
    boolean closeSession(HttpServletRequest request) throws DBWebException;

    @Deprecated
    @WebAction(authRequired = false)
    boolean touchSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse servletResponse) throws DBWebException;

    @Deprecated
    @WebAction(authRequired = false)
    WebSession updateSession(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response)
        throws DBWebException;

    @WebAction(authRequired = false)
    boolean refreshSessionConnections(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response) throws DBWebException;

    @WebAction
    boolean changeSessionLanguage(@NotNull WebSession webSession, String locale) throws DBWebException;

    ///////////////////////////////////////////
    // Connections

    @WebAction
    WebConnectionInfo getConnectionState(WebSession webSession, @Nullable String projectId, String connectionId) throws DBWebException;

    @WebAction
    WebConnectionInfo initConnection(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId,
        @NotNull Map<String, Object> authProperties,
        @Nullable List<WebNetworkHandlerConfigInput> networkCredentials,
        boolean saveCredentials,
        boolean sharedCredentials,
        @Nullable String selectedCredentials
    ) throws DBWebException;

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    WebConnectionInfo createConnection(
        @NotNull WebSession webSession,
        @Nullable @WebObjectId String projectId,
        @NotNull WebConnectionConfig connectionConfig
    ) throws DBWebException;

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    WebConnectionInfo updateConnection(
        @NotNull WebSession webSession,
        @Nullable @WebObjectId String projectId,
        @NotNull WebConnectionConfig connectionConfig) throws DBWebException;

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    boolean deleteConnection(
        @NotNull WebSession webSession,
        @Nullable @WebObjectId String projectId,
        @NotNull String connectionId) throws DBWebException;

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    WebConnectionInfo copyConnectionFromNode(
        @NotNull WebSession webSession,
        @Nullable @WebObjectId String projectId,
        @NotNull String nodePath,
        @NotNull WebConnectionConfig config) throws DBWebException;

    @WebAction
    WebConnectionInfo testConnection(
        @NotNull WebSession webSession, @Nullable String projectId, @NotNull WebConnectionConfig connectionConfig) throws DBWebException;

    @WebAction
    WebNetworkEndpointInfo testNetworkHandler(@NotNull WebSession webSession, @NotNull WebNetworkHandlerConfigInput nhConfig) throws DBWebException;

    @WebAction
    WebConnectionInfo closeConnection(@NotNull WebSession webSession, @Nullable String projectId, @NotNull String connectionId) throws DBWebException;

    ///////////////////////////////////////////
    // Projects

    @WebAction
    List<WebProjectInfo> getProjects(@NotNull WebSession session);

    ///////////////////////////////////////////
    // Folders

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    WebConnectionFolderInfo createConnectionFolder(
        @NotNull WebSession session,
        @Nullable @WebObjectId String projectId,
        @NotNull String parentNodePath,
        @NotNull String newName) throws DBWebException;

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    WebConnectionFolderInfo renameConnectionFolder(
        @NotNull WebSession session,
        @Nullable @WebObjectId
        String projectId,
        @NotNull String folderPath,
        @NotNull String newName) throws DBWebException;

    @WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
    boolean deleteConnectionFolder(
        @NotNull WebSession session,
        @Nullable @WebObjectId String projectId,
        @NotNull String nodePath) throws DBWebException;

    ///////////////////////////////////////////
    // Navigator settings

    @WebAction
    WebConnectionInfo setConnectionNavigatorSettings(
        WebSession webSession, @Nullable String projectId, String id, DBNBrowseSettings settings) throws DBWebException;

    ///////////////////////////////////////////
    // Async tasks

    @WebAction(authRequired = false)
    WebAsyncTaskInfo getAsyncTaskInfo(WebSession webSession, String taskId, Boolean removeOnFinish) throws DBWebException;

    @WebAction(authRequired = false)
    boolean cancelAsyncTask(WebSession webSession, String taskId) throws DBWebException;

}

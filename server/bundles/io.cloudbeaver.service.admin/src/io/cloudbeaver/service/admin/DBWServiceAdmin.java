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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.DBWFeatureSet;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderConfiguration;
import io.cloudbeaver.service.DBWService;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;

import java.util.List;
import java.util.Map;

/**
 * Web service API
 */
public interface DBWServiceAdmin extends DBWService {

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminUserInfo getUserById(@NotNull WebSession webSession, @NotNull String userId) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    List<AdminUserInfo> listUsers(@NotNull WebSession webSession, AdminUserInfoFilter filter)
        throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    List<AdminTeamInfo> listTeams(@NotNull WebSession webSession, @Nullable String teamName) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    List<AdminPermissionInfo> listPermissions(@NotNull WebSession webSession) throws DBWebException;

    @WebAction()
    WebPropertyInfo[] listTeamMetaParameters(@NotNull WebSession webSession);

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminUserInfo createUser(
        @NotNull WebSession webSession,
        String userName,
        @NotNull Boolean enabled,
        @Nullable String authRole
    ) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<String> listAuthRoles();

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<String> listTeamRoles();

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteUser(@NotNull WebSession webSession, String userName) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminTeamInfo createTeam(@NotNull WebSession webSession, String teamId, String teamName, String description) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminTeamInfo updateTeam(@NotNull WebSession webSession, String teamId, String teamName, String description) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteTeam(@NotNull WebSession webSession, String teamId, boolean force) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean grantUserTeam(@NotNull WebSession webSession, String user, String team) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean revokeUserTeam(@NotNull WebSession webSession, String user, String team) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<AdminPermissionInfo> setSubjectPermissions(@NotNull WebSession webSession, String subjectID, List<String> permissions) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setUserCredentials(@NotNull WebSession webSession, @NotNull String userID, @NotNull String providerId, @NotNull Map<String, Object> credentials) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteUserCredentials(@NotNull WebSession webSession, @NotNull String userId, @NotNull String providerId) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Connection management

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<AdminConnectionSearchInfo> searchConnections(WebSession webSession, List<String> hostNames) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Features

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<DBWFeatureSet> listFeatureSets(@NotNull WebSession webSession) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Auth providers

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<WebPropertyInfo> listAuthProviderConfigurationParameters(@NotNull WebSession webSession, @NotNull String providerId) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<WebAuthProviderConfiguration> listAuthProviderConfigurations(@NotNull HttpServletRequest request, @NotNull WebSession webSession, @Nullable String providerId) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebAuthProviderConfiguration saveAuthProviderConfiguration(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @NotNull String id,
        @NotNull String displayName,
        boolean disabled, @Nullable String iconURL,
        @Nullable String description,
        @Nullable Map<String, Object> parameters) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteAuthProviderConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Server configuration

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean configureServer(WebSession webSession, Map<String, Object> params) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setDefaultNavigatorSettings(WebSession webSession, DBNBrowseSettings settings) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean updateProductConfiguration(WebSession webSession, Map<String, Object> productConfiguration) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Permissions

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    SMDataSourceGrant[] getConnectionSubjectAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        String connectionId) throws DBWebException;

    @Deprecated
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setConnectionSubjectAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId,
        @NotNull List<String> subjects) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean addConnectionsAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull List<String> connectionIds,
        @NotNull List<String> subjects
    ) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteConnectionsAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull List<String> connectionIds,
        @NotNull List<String> subjects
    ) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId, @NotNull List<String> connections) throws
        DBWebException;

    ////////////////////////////////////////////////////////////////////

    // User meta parameters

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebPropertyInfo saveUserMetaParameter(WebSession webSession, String id, String displayName, String description, Boolean required) throws
        DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean deleteUserMetaParameter(WebSession webSession, String id) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean setUserMetaParameterValues(WebSession webSession, String userId, Map<String, String> parameters) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean setTeamMetaParameterValues(WebSession webSession, String teamId, Map<String, String> parameters) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean enableUser(WebSession webSession, String userId, Boolean enabled) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean setUserAuthRole(WebSession webSession, String userId, String authRole) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean setUserTeamRole(
        @NotNull WebSession webSession, @NotNull String userId,
        @NotNull String teamId, @Nullable String teamRole
    ) throws DBWebException;

}

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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.*;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebAuthProviderConfiguration;
import io.cloudbeaver.service.DBWService;
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
    List<AdminUserInfo> listUsers(@NotNull WebSession webSession, @Nullable String userName) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    List<AdminRoleInfo> listRoles(@NotNull WebSession webSession, @Nullable String roleName) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    List<AdminPermissionInfo> listPermissions(@NotNull WebSession webSession) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminUserInfo createUser(@NotNull WebSession webSession, String userName) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteUser(@NotNull WebSession webSession, String userName) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminRoleInfo createRole(@NotNull WebSession webSession, String roleId, String roleName, String description) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    @NotNull
    AdminRoleInfo updateRole(@NotNull WebSession webSession, String roleId, String roleName, String description) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteRole(@NotNull WebSession webSession, String roleId) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean grantUserRole(@NotNull WebSession webSession, String user, String role) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean revokeUserRole(@NotNull WebSession webSession, String user, String role) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setSubjectPermissions(@NotNull WebSession webSession, String roleID, List<String> permissions) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setUserCredentials(@NotNull WebSession webSession, @NotNull String userID, @NotNull String providerId, @NotNull Map<String, Object> credentials) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Connection management

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<WebConnectionInfo> getAllConnections(@NotNull WebSession webSession, @Nullable String id) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<AdminConnectionSearchInfo> searchConnections(WebSession webSession, List<String> hostNames) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebConnectionInfo createConnectionConfiguration(@NotNull WebSession webSession, @NotNull WebConnectionConfig config) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebConnectionInfo copyConnectionConfiguration(@NotNull WebSession webSession, @NotNull String nodePath, @NotNull WebConnectionConfig config) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebConnectionInfo updateConnectionConfiguration(@NotNull WebSession webSession, @NotNull String id, @NotNull WebConnectionConfig config) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean deleteConnectionConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Features

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<DBWFeatureSet> listFeatureSets(@NotNull WebSession webSession) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Auth providers

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<WebPropertyInfo> listAuthProviderConfigurationParameters(@NotNull WebSession webSession, @NotNull String providerId) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    List<WebAuthProviderConfiguration> listAuthProviderConfigurations(@NotNull WebSession webSession, @Nullable String providerId) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebAuthProviderConfiguration saveAuthProviderConfiguration(
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
    boolean configureServer(WebSession webSession, AdminServerConfig config) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setDefaultNavigatorSettings(WebSession webSession, DBNBrowseSettings settings) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // Permissions

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    SMDataSourceGrant[] getConnectionSubjectAccess(WebSession webSession, String connectionId) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setConnectionSubjectAccess(@NotNull WebSession webSession, @NotNull String connectionId, @NotNull List<String> subjects) throws DBWebException;

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    boolean setSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId, @NotNull List<String> connections) throws DBWebException;

    ////////////////////////////////////////////////////////////////////
    // User meta parameters

    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    WebPropertyInfo saveUserMetaParameter(WebSession webSession, String id, String displayName, String description, Boolean required) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean deleteUserMetaParameter(WebSession webSession, String id) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean setUserMetaParameterValues(WebSession webSession, String userId, Map<String, Object> parameters) throws DBWebException;
    @WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)
    Boolean enableUser(WebSession webSession, String userId, Boolean enabled) throws DBWebException;
}

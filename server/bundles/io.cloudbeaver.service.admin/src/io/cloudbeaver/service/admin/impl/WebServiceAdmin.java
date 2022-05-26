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
package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.DBWFeatureSet;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.provider.AuthProviderConfig;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebAuthProviderConfiguration;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebFeatureRegistry;
import io.cloudbeaver.registry.WebPermissionDescriptor;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import io.cloudbeaver.service.admin.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;
import org.jkiss.dbeaver.model.security.user.SMRole;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceAdmin implements DBWServiceAdmin {

    private static final Log log = Log.getLog(WebServiceAdmin.class);

    @NotNull
    @Override
    public List<AdminUserInfo> listUsers(@NotNull WebSession webSession, String userName) throws DBWebException {
        try {
            List<AdminUserInfo> webUsers = new ArrayList<>();
            for (SMUser smUser : webSession.getAdminSecurityController().findUsers(userName)) {
                webUsers.add(new AdminUserInfo(webSession, new WebUser(smUser)));
            }
            return webUsers;
        } catch (Exception e) {
            throw new DBWebException("Error reading users", e);
        }
    }

    @NotNull
    @Override
    public List<AdminRoleInfo> listRoles(@NotNull WebSession webSession, String roleId) throws DBWebException {
        try {
            List<AdminRoleInfo> roles = new ArrayList<>();
            if (CommonUtils.isEmpty(roleId)) {
                for (SMRole role : webSession.getAdminSecurityController().readAllRoles()) {
                    roles.add(new AdminRoleInfo(webSession, role));
                }
            } else {
                SMRole role = webSession.getAdminSecurityController().findRole(roleId);
                if (role != null) {
                    roles.add(new AdminRoleInfo(webSession, role));
                }
            }
            return roles;
        } catch (Exception e) {
            throw new DBWebException("Error reading roles", e);
        }
    }

    @NotNull
    @Override
    public List<AdminPermissionInfo> listPermissions(@NotNull WebSession webSession) throws DBWebException {
        try {
            List<AdminPermissionInfo> permissionInfos = new ArrayList<>();
            for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
                for (WebPermissionDescriptor pd : wsd.getPermissions()) {
                    permissionInfos.add(new AdminPermissionInfo(pd));
                }
            }
            return permissionInfos;
        } catch (Exception e) {
            throw new DBWebException("Error reading users", e);
        }
    }

    @NotNull
    @Override
    public AdminUserInfo createUser(@NotNull WebSession webSession, String userName) throws DBWebException {
        if (userName.isEmpty()) {
            throw new DBWebException("Empty user name");
        }
        try {
            var securityController = webSession.getAdminSecurityController();
            securityController.createUser(userName, Map.of());
            var smUser = securityController.getUserById(userName);
            return new AdminUserInfo(webSession, new WebUser(smUser));
        } catch (Exception e) {
            throw new DBWebException("Error creating new user", e);
        }
    }

    @Override
    public boolean deleteUser(@NotNull WebSession webSession, String userName) throws DBWebException {
        if (CommonUtils.equalObjects(userName, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot delete yourself");
        }
        try {
            webSession.getAdminSecurityController().deleteUser(userName);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting user", e);
        }
    }

    @NotNull
    @Override
    public AdminRoleInfo createRole(@NotNull WebSession webSession, String roleId, String roleName, String description) throws DBWebException {
        if (roleId.isEmpty()) {
            throw new DBWebException("Empty role ID");
        }
        try {
            webSession.getAdminSecurityController().createRole(roleId, roleName, description, webSession.getUser().getUserId());
            SMRole newRole = webSession.getAdminSecurityController().findRole(roleId);
            return new AdminRoleInfo(webSession, newRole);
        } catch (Exception e) {
            throw new DBWebException("Error creating new role", e);
        }
    }

    @NotNull
    @Override
    public AdminRoleInfo updateRole(@NotNull WebSession webSession, String roleId, String roleName, String description) throws DBWebException {
        if (roleId.isEmpty()) {
            throw new DBWebException("Empty role ID");
        }
        try {
            webSession.getAdminSecurityController().updateRole(roleId, roleName, description);
            SMRole newRole = webSession.getAdminSecurityController().findRole(roleId);
            return new AdminRoleInfo(webSession, newRole);
        } catch (Exception e) {
            throw new DBWebException("Error updating role " + roleId, e);
        }
    }

    @Override
    public boolean deleteRole(@NotNull WebSession webSession, String roleId) throws DBWebException {
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            SMRole[] userRoles = adminSecurityController.getUserRoles(webSession.getUser().getUserId());
            if (Arrays.stream(userRoles).anyMatch(DBRole -> DBRole.getRoleId().equals(roleId))) {
                throw new DBWebException("You can not delete your own role");
            }
            adminSecurityController.deleteRole(roleId);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting role", e);
        }
    }

    @Override
    public boolean grantUserRole(@NotNull WebSession webSession, String user, String role) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant role in anonymous mode");
        }
        if (CommonUtils.equalObjects(user, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            SMRole[] userRoles = adminSecurityController.getUserRoles(user);
            List<String> roleIds = Arrays.stream(userRoles).map(SMRole::getRoleId).collect(Collectors.toList());
            if (!roleIds.contains(role)) {
                roleIds.add(role);
                adminSecurityController.setUserRoles(user, roleIds.toArray(new String[0]), grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' already has role '" + role + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting role", e);
        }
    }

    @Override
    public boolean revokeUserRole(@NotNull WebSession webSession, String user, String role) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant role in anonymous mode");
        }
        if (CommonUtils.equalObjects(user, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            SMRole[] userRoles = adminSecurityController.getUserRoles(user);
            List<String> roleIds = Arrays.stream(userRoles).map(SMRole::getRoleId).collect(Collectors.toList());
            if (roleIds.contains(role)) {
                roleIds.remove(role);
                adminSecurityController.setUserRoles(user, roleIds.toArray(new String[0]), grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' doesn't have role '" + role + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error revoking role", e);
        }
    }

    @Override
    public boolean setSubjectPermissions(@NotNull WebSession webSession, String roleID, List<String> permissions) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot change permissions in anonymous mode");
        }
        try {
            webSession.getAdminSecurityController().setSubjectPermissions(roleID, permissions, grantor.getUserId());
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error setting role permissions", e);
        }
    }

    @Override
    public boolean setUserCredentials(@NotNull WebSession webSession, @NotNull String userID, @NotNull String providerId, @NotNull Map<String, Object> credentials) throws DBWebException {
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        // Check userId credential.
        // FIXME: It is actually a hack. All crdentials must be passed from client
        if (LocalAuthProvider.PROVIDER_ID.equals(providerId)) {
            credentials.put(LocalAuthProvider.CRED_USER, userID);
        }
        try {
            webSession.getAdminSecurityController().setUserCredentials(userID, authProvider.getId(), credentials);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error setting user credentials", e);
        }
    }

    @Override
    public Boolean enableUser(@NotNull WebSession webSession, @NotNull String userID, @NotNull Boolean enabled) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot activate user in anonymous mode");
        }
        if (CommonUtils.equalObjects(userID, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            webSession.getAdminSecurityController().enableUser(userID, enabled);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error activating user", e);
        }
    }

    ////////////////////////////////////////////////////////////////////
    // Connection management

    @Override
    public List<WebConnectionInfo> getAllConnections(@NotNull WebSession webSession, @Nullable String id) throws DBWebException {
        // Get all connections from global configuration
        List<WebConnectionInfo> result = new ArrayList<>();
        for (DBPDataSourceContainer ds : WebServiceUtils.getGlobalDataSourceRegistry().getDataSources()) {
            if (id != null && !id.equals(ds.getId())) {
                continue;
            }
            if (CBPlatform.getInstance().getApplicableDrivers().contains(ds.getDriver())) {
                result.add(new WebConnectionInfo(webSession, ds));
            }
        }

        return result;
    }

    @Override
    public List<AdminConnectionSearchInfo> searchConnections(@NotNull WebSession webSession, @NotNull List<String> hostNames) throws DBWebException {
        ConnectionSearcher searcher = new ConnectionSearcher(webSession, hostNames.toArray(new String[0]));
        searcher.run(webSession.getProgressMonitor());
        return searcher.getFoundConnections();
    }

    @Override
    public WebConnectionInfo createConnectionConfiguration(@NotNull WebSession webSession, @NotNull WebConnectionConfig config) throws DBWebException {
        DBPDataSourceRegistry registry = WebServiceUtils.getGlobalDataSourceRegistry();
        DBPDataSourceContainer dataSource = WebServiceUtils.createConnectionFromConfig(config, registry);
        registry.addDataSource(dataSource);
        registry.flushConfig();

        return new WebConnectionInfo(webSession, dataSource);
    }

    @Override
    public WebConnectionInfo copyConnectionConfiguration(@NotNull WebSession webSession, @NotNull String nodePath, @NotNull WebConnectionConfig config) throws DBWebException {
        try {
            DBNModel globalNavigatorModel = webSession.getNavigatorModel();
            DBPDataSourceRegistry globalDataSourceRegistry = WebServiceUtils.getGlobalDataSourceRegistry();

            DBNNode srcNode = globalNavigatorModel.getNodeByPath(webSession.getProgressMonitor(), nodePath);
            if (srcNode == null) {
                throw new DBException("Node '" + nodePath + "' not found");
            }
            if (!(srcNode instanceof DBNDataSource)) {
                throw new DBException("Node '" + nodePath + "' is not a datasource node");
            }
            DBPDataSourceContainer dataSourceTemplate = ((DBNDataSource)srcNode).getDataSourceContainer();

            DBPDataSourceContainer newDataSource = globalDataSourceRegistry.createDataSource(dataSourceTemplate);
            // Copy props from config
            if (!CommonUtils.isEmpty(config.getName())) {
                newDataSource.setName(config.getName());
            }
            if (!CommonUtils.isEmpty(config.getDescription())) {
                newDataSource.setDescription(config.getDescription());
            }

            ((DataSourceDescriptor) newDataSource).setNavigatorSettings(CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());
            globalDataSourceRegistry.addDataSource(newDataSource);

            return new WebConnectionInfo(webSession, newDataSource);
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    public WebConnectionInfo updateConnectionConfiguration(@NotNull WebSession webSession, @NotNull String id, @NotNull WebConnectionConfig config) throws DBWebException {
        DBPDataSourceContainer dataSource = WebServiceUtils.getGlobalDataSourceRegistry().getDataSource(id);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + id + "' not found");
        }
        WebServiceUtils.updateConnectionFromConfig(dataSource, config);
        dataSource.persistConfiguration();
        // Update local datasource as well. We use it for connection tests
        // It may be null if this connection was just created
        DBPDataSourceContainer localDS = webSession.getSingletonProject().getDataSourceRegistry().getDataSource(id);
        if (localDS != null) {
            WebServiceUtils.updateConnectionFromConfig(localDS, config);
            // We don't need to save it in local registry (because in fact it is stored in the global registry)
        }
        return new WebConnectionInfo(webSession, dataSource);
    }

    @Override
    public boolean deleteConnectionConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException {
        DBPDataSourceContainer dataSource = WebServiceUtils.getGlobalDataSourceRegistry().getDataSource(id);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + id + "' not found");
        }
        WebServiceUtils.getGlobalDataSourceRegistry().removeDataSource(dataSource);
        WebServiceUtils.getGlobalDataSourceRegistry().flushConfig();

        try {
            webSession.getSecurityController().setConnectionSubjectAccess(id, null, null);
        } catch (DBException e) {
            log.error(e);
        }
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // Features

    @Override
    public List<DBWFeatureSet> listFeatureSets(@NotNull WebSession webSession) throws DBWebException {
        return WebFeatureRegistry.getInstance().getWebFeatures();
    }

    ////////////////////////////////////////////////////////////////////
    // Auth providers

    @Override
    public List<WebPropertyInfo> listAuthProviderConfigurationParameters(@NotNull WebSession webSession, @NotNull String providerId) throws DBWebException {
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid provider ID " + providerId);
        }
        return authProvider.getConfigurationParameters().stream().map(p -> new WebPropertyInfo(webSession, p)).collect(Collectors.toList());
    }

    @Override
    public List<WebAuthProviderConfiguration> listAuthProviderConfigurations(@NotNull WebSession webSession, @Nullable String providerId) throws DBWebException {
        List<WebAuthProviderConfiguration> result = new ArrayList<>();
        for (Map.Entry<String, AuthProviderConfig> cfg : CBApplication.getInstance().getAppConfiguration().getAuthProviderConfigurations().entrySet()) {
            if (providerId != null && !providerId.equals(cfg.getValue().getProvider())) {
                continue;
            }
            AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(cfg.getValue().getProvider());
            if (authProvider != null) {
                result.add(new WebAuthProviderConfiguration(authProvider, cfg.getKey(), cfg.getValue()));
            }
        }
        return result;
    }

    @Override
    public WebAuthProviderConfiguration saveAuthProviderConfiguration(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @NotNull String id,
        @NotNull String displayName,
        boolean disabled,
        @Nullable String iconURL,
        @Nullable String description,
        @Nullable Map<String, Object> parameters) throws DBWebException {
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Auth provider '" + providerId + "' not found");
        }

        AuthProviderConfig providerConfig = new AuthProviderConfig();
        providerConfig.setProvider(providerId);
        providerConfig.setDisplayName(displayName);
        providerConfig.setDisabled(disabled);
        providerConfig.setIconURL(iconURL);
        providerConfig.setDescription(description);
        providerConfig.setParameters(parameters);
        CBApplication.getInstance().getAppConfiguration().setAuthProviderConfiguration(id, providerConfig);
        try {
            CBApplication.getInstance().flushConfiguration();
        } catch (DBException e) {
            throw new DBWebException("Error saving server configuration", e);
        }
        return new WebAuthProviderConfiguration(authProvider, id, providerConfig);
    }

    @Override
    public boolean deleteAuthProviderConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException {
        if (CBApplication.getInstance().getAppConfiguration().deleteAuthProviderConfiguration(id)) {
            try {
                CBApplication.getInstance().flushConfiguration();
            } catch (DBException e) {
                throw new DBWebException("Error saving server configuration", e);
            }
            return true;
        }
        return false;
    }

    ////////////////////////////////////////////////////////////////////
    // Server configuration


    @Override
    public boolean configureServer(WebSession webSession, AdminServerConfig config) throws DBWebException {
        try {
            CBAppConfig appConfig = new CBAppConfig(CBApplication.getInstance().getAppConfiguration());
            appConfig.setAnonymousAccessEnabled(config.isAnonymousAccessEnabled());
            appConfig.setSupportsCustomConnections(config.isCustomConnectionsEnabled());
            appConfig.setPublicCredentialsSaveEnabled(config.isPublicCredentialsSaveEnabled());
            appConfig.setAdminCredentialsSaveEnabled(config.isAdminCredentialsSaveEnabled());
            appConfig.setEnabledFeatures(config.getEnabledFeatures().toArray(new String[0]));
            appConfig.setEnabledDrivers(config.getEnabledDrivers());
            appConfig.setDisabledDrivers(config.getDisabledDrivers());
            appConfig.setResourceManagerEnabled(config.isResourceManagerEnabled());

            if (CommonUtils.isEmpty(config.getEnabledAuthProviders())) {
                // All of them
                appConfig.setEnabledAuthProviders(new String[0]);
            } else {
                appConfig.setEnabledAuthProviders(config.getEnabledAuthProviders().toArray(new String[0]));
            }

            appConfig.setDefaultNavigatorSettings(
                CBApplication.getInstance().getAppConfiguration().getDefaultNavigatorSettings());

            List<WebAuthInfo> authInfoList = webSession.getAllAuthInfo();

            String adminName = config.getAdminName();
            String adminPassword = config.getAdminPassword();
            if (CommonUtils.isEmpty(adminName)) {
                // Grant admin permissions to the current user
                WebUser curUser = webSession.getUser();
                adminName = curUser == null ? null : curUser.getUserId();
                adminPassword = null;
            }
            if (CommonUtils.isEmpty(adminName)) {
                // Try to get admin name from existing authentications (first one)
                if (!authInfoList.isEmpty()) {
                    adminName = authInfoList.get(0).getUserId();
                }
            }
            if (CommonUtils.isEmpty(adminName)) {
                adminName = CBConstants.DEFAULT_ADMIN_NAME;
            }

            // Patch configuration by services
            for (DBWServiceServerConfigurator wsc : WebServiceRegistry.getInstance().getWebServices(DBWServiceServerConfigurator.class)) {
                try {
                    wsc.configureServer(CBApplication.getInstance(), webSession, appConfig);
                } catch (Exception e) {
                    log.warn("Error configuring server by web service " + wsc.getClass().getName(), e);
                }
            }

            boolean configurationMode = CBApplication.getInstance().isConfigurationMode();

            CBApplication.getInstance().finishConfiguration(
                config.getServerName(),
                config.getServerURL(),
                adminName,
                adminPassword,
                authInfoList,
                config.getSessionExpireTime(),
                appConfig);

            // Refresh active session
            if (configurationMode) {
                // In config mode we always refresh because admin user doesn't exist yet
                webSession.resetUserState();
            } else {
                // Just reload session state
                webSession.refreshUserData();
            }
            CBPlatform.getInstance().refreshApplicableDrivers();
        } catch (Throwable e) {
            throw new DBWebException("Error configuring server", e);
        }
        return true;
    }

    @Override
    public boolean setDefaultNavigatorSettings(WebSession webSession, DBNBrowseSettings settings) throws DBWebException {
        CBApplication.getInstance().getAppConfiguration().setDefaultNavigatorSettings(settings);
//        try {
//            CBApplication.getInstance().flushConfiguration();
//        } catch (DBException e) {
//            throw new DBWebException("Error saving server configuration", e);
//        }
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // Access management

    @Override
    public SMDataSourceGrant[] getConnectionSubjectAccess(WebSession webSession, String connectionId) throws DBWebException {
        try {
            return webSession.getSecurityController().getConnectionSubjectAccess(connectionId);
        } catch (DBException e) {
            throw new DBWebException("Error getting connection access info", e);
        }
    }

    @Override
    public boolean setConnectionSubjectAccess(@NotNull WebSession webSession, @NotNull String connectionId, @NotNull List<String> subjects) throws DBWebException {
        DBPDataSourceContainer dataSource = WebServiceUtils.getGlobalDataSourceRegistry().getDataSource(connectionId);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + connectionId + "' not found");
        }
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant role in anonymous mode");
        }
        try {
            webSession.getSecurityController().setConnectionSubjectAccess(connectionId, subjects.toArray(new String[0]), grantor.getUserId());
        } catch (DBException e) {
            throw new DBWebException("Error setting connection subject access", e);
        }
        return true;
    }

    @Override
    public SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId) throws DBWebException {
        try {
            return webSession.getSecurityController().getSubjectConnectionAccess(new String[]{subjectId});
        } catch (DBException e) {
            throw new DBWebException("Error getting connection access info", e);
        }
    }

    @Override
    public boolean setSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId, @NotNull List<String> connections) throws DBWebException {
        for (String connectionId : connections) {
            if (WebServiceUtils.getGlobalDataSourceRegistry().getDataSource(connectionId) == null) {
                throw new DBWebException("Connection '" + connectionId + "' not found");
            }
        }
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant access in anonymous mode");
        }
        try {
            webSession.getAdminSecurityController().setSubjectConnectionAccess(subjectId, connections, grantor.getUserId());
        } catch (DBException e) {
            throw new DBWebException("Error setting subject connection access", e);
        }
        return true;
    }

    @Override
    public WebPropertyInfo saveUserMetaParameter(WebSession webSession, String id, String displayName, String description, Boolean required) throws DBWebException {
        throw new DBWebException("Not implemented");
    }

    @Override
    public Boolean deleteUserMetaParameter(WebSession webSession, String id) throws DBWebException {
        throw new DBWebException("Not implemented");
    }

    @Override
    public Boolean setUserMetaParameterValues(WebSession webSession, String userId, Map<String, Object> parameters) throws DBWebException {
        try {
            webSession.getAdminSecurityController().setUserMeta(userId, parameters);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error changing user '" + userId + "' meta parameters", e);
        }
    }

}

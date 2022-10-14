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
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.*;
import io.cloudbeaver.server.CBAppConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import io.cloudbeaver.service.admin.*;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNModel;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.SMConstants;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;
import org.jkiss.dbeaver.model.security.SMObjects;
import org.jkiss.dbeaver.model.security.user.SMTeam;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.registry.DataSourceDescriptor;
import org.jkiss.utils.CommonUtils;

import java.text.MessageFormat;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceAdmin implements DBWServiceAdmin {

    private static final Log log = Log.getLog(WebServiceAdmin.class);

    private final Map<String, WebPermissionDescriptor> permissionDescriptorByName = WebServiceRegistry.getInstance()
        .getWebServices()
        .stream()
        .flatMap(service -> service.getPermissions().stream())
        .collect(Collectors.toMap(WebPermissionDescriptor::getId, Function.identity()));


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
    public List<AdminTeamInfo> listTeams(@NotNull WebSession webSession, String teamName) throws DBWebException {
        try {
            List<AdminTeamInfo> teams = new ArrayList<>();
            if (CommonUtils.isEmpty(teamName)) {
                for (SMTeam team : webSession.getAdminSecurityController().readAllTeams()) {
                    teams.add(new AdminTeamInfo(webSession, team));
                }
            } else {
                SMTeam team = webSession.getAdminSecurityController().findTeam(teamName);
                if (team != null) {
                    teams.add(new AdminTeamInfo(webSession, team));
                }
            }
            return teams;
        } catch (Exception e) {
            throw new DBWebException("Error reading teams", e);
        }
    }

    @NotNull
    @Override
    public List<AdminPermissionInfo> listPermissions(@NotNull WebSession webSession) throws DBWebException {
        try {
            return SMUtils.findPermissions(SMConstants.SUBJECT_PERMISSION_SCOPE);
        } catch (Exception e) {
            throw new DBWebException("Error reading permissions", e);
        }
    }

    @NotNull
    @Override
    public AdminUserInfo createUser(@NotNull WebSession webSession, String userName, @NotNull Boolean enabled) throws DBWebException {
        if (userName.isEmpty()) {
            throw new DBWebException("Empty user name");
        }
        webSession.addInfoMessage("Create new user - " + userName);

        try {
            var securityController = webSession.getAdminSecurityController();
            securityController.createUser(userName, Map.of(), enabled);
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
        webSession.addInfoMessage("Delete user - " + userName);
        try {
            webSession.getAdminSecurityController().deleteUser(userName);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting user", e);
        }
    }

    @NotNull
    @Override
    public AdminTeamInfo createTeam(@NotNull WebSession webSession, String teamId, String teamName, String description) throws DBWebException {
        if (teamId.isEmpty()) {
            throw new DBWebException("Empty team ID");
        }
        webSession.addInfoMessage("Create new team - " + teamId);
        try {
            webSession.getAdminSecurityController().createTeam(teamId, teamName, description, webSession.getUser().getUserId());
            SMTeam newTeam = webSession.getAdminSecurityController().findTeam(teamId);
            return new AdminTeamInfo(webSession, newTeam);
        } catch (Exception e) {
            throw new DBWebException("Error creating new team", e);
        }
    }

    @NotNull
    @Override
    public AdminTeamInfo updateTeam(@NotNull WebSession webSession, String teamId, String teamName, String description) throws DBWebException {
        if (teamId.isEmpty()) {
            throw new DBWebException("Empty team ID");
        }

        webSession.addInfoMessage("Update team - " + teamId);

        try {
            webSession.getAdminSecurityController().updateTeam(teamId, teamName, description);
            SMTeam newTeam = webSession.getAdminSecurityController().findTeam(teamId);
            return new AdminTeamInfo(webSession, newTeam);
        } catch (Exception e) {
            throw new DBWebException("Error updating team " + teamId, e);
        }
    }

    @Override
    public boolean deleteTeam(@NotNull WebSession webSession, String teamId) throws DBWebException {
        try {
            webSession.addInfoMessage("Delete team - " + teamId);

            var adminSecurityController = webSession.getAdminSecurityController();
            SMTeam[] userTeams = adminSecurityController.getUserTeams(webSession.getUser().getUserId());
            if (Arrays.stream(userTeams).anyMatch(team -> team.getTeamId().equals(teamId))) {
                throw new DBWebException("You can not delete your own team");
            }
            adminSecurityController.deleteTeam(teamId);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error deleting team", e);
        }
    }

    @Override
    public boolean grantUserTeam(@NotNull WebSession webSession, String user, String team) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant team in anonymous mode");
        }
        if (CommonUtils.equalObjects(user, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            SMTeam[] userTeams = adminSecurityController.getUserTeams(user);
            List<String> teamIds = Arrays.stream(userTeams).map(SMTeam::getTeamId).collect(Collectors.toList());
            if (!teamIds.contains(team)) {
                teamIds.add(team);
                adminSecurityController.setUserTeams(user, teamIds.toArray(new String[0]), grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' already has team '" + team + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error granting team", e);
        }
    }

    @Override
    public boolean revokeUserTeam(@NotNull WebSession webSession, String user, String team) throws DBWebException {
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot revoke team in anonymous mode");
        }
        if (CommonUtils.equalObjects(user, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            SMTeam[] userTeams = adminSecurityController.getUserTeams(user);
            List<String> teamIds = Arrays.stream(userTeams).map(SMTeam::getTeamId).collect(Collectors.toList());
            if (teamIds.contains(team)) {
                teamIds.remove(team);
                adminSecurityController.setUserTeams(user, teamIds.toArray(new String[0]), grantor.getUserId());
            } else {
                throw new DBWebException("User '" + user + "' doesn't have team '" + team + "'");
            }
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error revoking team", e);
        }
    }

    @Override
    public List<AdminPermissionInfo> setSubjectPermissions(@NotNull WebSession webSession, String subjectID, List<String> permissions) throws DBWebException {
        validatePermissions(SMConstants.SUBJECT_PERMISSION_SCOPE, permissions);
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot change permissions in anonymous mode");
        }
        if (CommonUtils.equalObjects(subjectID, CBConstants.DEFAULT_ADMIN_TEAM)) {
            throw new DBWebException("Cannot change permissions for team '" + subjectID + "'");
        }
        webSession.addInfoMessage("Set permissions to subject - " + subjectID);

        try {
            webSession.getAdminSecurityController().setSubjectPermissions(subjectID, permissions, grantor.getUserId());
            Set<String> subjectPermissions = webSession.getAdminSecurityController().getSubjectPermissions(subjectID);
            webSession.refreshUserData();
            return listPermissions(webSession).stream()
                .filter(p -> subjectPermissions.contains(p.getId()))
                .collect(Collectors.toList());
        } catch (Exception e) {
            throw new DBWebException("Error setting subject permissions", e);
        }
    }

    @Override
    public boolean setUserCredentials(@NotNull WebSession webSession, @NotNull String userID, @NotNull String providerId, @NotNull Map<String, Object> credentials) throws DBWebException {
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        webSession.addInfoMessage("Set credentials for user - " + userID);

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
        webSession.addInfoMessage("Enable user - " + userID);
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
        for (DBPDataSourceContainer ds : getGlobalRegistry(webSession).getDataSources()) {
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
    public WebConnectionInfo createConnectionConfiguration(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull WebConnectionConfig config
    ) throws DBWebException {

        webSession.addInfoMessage("Create new connection");
        DBPDataSourceRegistry registry = getGlobalRegistry(webSession);
        DBPDataSourceContainer dataSource = WebServiceUtils.createConnectionFromConfig(config, registry);
        try {
            registry.addDataSource(dataSource);
        } catch (DBException e) {
            throw new DBWebException("Error adding datasource", e);
        }

        webSession.addInfoMessage(
            "New connection was created - " + WebServiceUtils.getConnectionContainerInfo(dataSource)
        );

        return new WebConnectionInfo(webSession, dataSource);
    }

    @Override
    public WebConnectionInfo copyConnectionConfiguration(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String nodePath,
        @NotNull WebConnectionConfig config
    ) throws DBWebException {
        try {
            DBNModel globalNavigatorModel = webSession.getNavigatorModel();
            DBPDataSourceRegistry globalDataSourceRegistry = getGlobalRegistry(webSession);

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
            WebConnectionInfo connectionInfo = new WebConnectionInfo(webSession, newDataSource);
            webSession.addConnection(connectionInfo);
            return connectionInfo;
        } catch (DBException e) {
            throw new DBWebException("Error copying connection", e);
        }
    }

    @Override
    public WebConnectionInfo updateConnectionConfiguration(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String id,
        @NotNull WebConnectionConfig config
    ) throws DBWebException {
        DBPDataSourceContainer dataSource = getGlobalRegistry(webSession).getDataSource(id);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + id + "' not found");
        }
        webSession.addInfoMessage(
            "Update connection - " + WebServiceUtils.getConnectionContainerInfo(dataSource)
        );
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
    public boolean deleteConnectionConfiguration(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String id
    ) throws DBWebException {
        DBPDataSourceContainer dataSource = getGlobalRegistry(webSession).getDataSource(id);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + id + "' not found");
        }

        webSession.addInfoMessage(
            "Delete connection - " + WebServiceUtils.getConnectionContainerInfo(dataSource)
        );
        getGlobalRegistry(webSession).removeDataSource(dataSource);

        try {
            webSession.getAdminSecurityController()
                .deleteAllObjectPermissions(id, SMObjects.DATASOURCE);
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
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid provider ID " + providerId);
        }
        return authProvider.getConfigurationParameters().stream().map(p -> new WebPropertyInfo(webSession, p)).collect(Collectors.toList());
    }

    @Override
    public List<WebAuthProviderConfiguration> listAuthProviderConfigurations(@NotNull WebSession webSession, @Nullable String providerId) throws DBWebException {
        List<WebAuthProviderConfiguration> result = new ArrayList<>();
        for (SMAuthProviderCustomConfiguration cfg : CBApplication.getInstance().getAppConfiguration().getAuthCustomConfigurations()) {
            if (providerId != null && !providerId.equals(cfg.getProvider())) {
                continue;
            }
            WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(cfg.getProvider());
            if (authProvider != null) {
                result.add(new WebAuthProviderConfiguration(authProvider, cfg));
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
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Auth provider '" + providerId + "' not found");
        }
        webSession.addInfoMessage("Save configuration for auth provider - " + providerId);

        SMAuthProviderCustomConfiguration providerConfig = new SMAuthProviderCustomConfiguration(id);
        providerConfig.setProvider(providerId);
        providerConfig.setDisplayName(displayName);
        providerConfig.setDisabled(disabled);
        providerConfig.setIconURL(iconURL);
        providerConfig.setDescription(description);
        providerConfig.setParameters(parameters);
        CBApplication.getInstance().getAppConfiguration().addAuthProviderConfiguration(providerConfig);
        try {
            CBApplication.getInstance().flushConfiguration();
        } catch (DBException e) {
            throw new DBWebException("Error saving server configuration", e);
        }
        return new WebAuthProviderConfiguration(authProvider, providerConfig);
    }

    @Override
    public boolean deleteAuthProviderConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException {
        webSession.addInfoMessage("Delete configuration for auth provider - " + id);

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
    public boolean configureServer(WebSession webSession, Map<String, Object> params) throws DBWebException {
        try {
            CBAppConfig appConfig = new CBAppConfig(CBApplication.getInstance().getAppConfiguration());
            String adminName = null;
            String adminPassword = null;
            String serverName = CBApplication.getInstance().getServerName();
            String serverURL = CBApplication.getInstance().getServerURL();
            long sessionExpireTime = CBApplication.getInstance().getMaxSessionIdleTime();

            if (!params.isEmpty()) {    // FE can send an empty configuration
                var config = new AdminServerConfig(params);
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

                adminName = config.getAdminName();
                adminPassword = config.getAdminPassword();
                serverName = config.getServerName();
                serverURL = config.getServerURL();
                sessionExpireTime = config.getSessionExpireTime();
            }

            if (CommonUtils.isEmpty(adminName)) {
                // Grant admin permissions to the current user
                WebUser curUser = webSession.getUser();
                adminName = curUser == null ? null : curUser.getUserId();
                adminPassword = null;
            }
            List<WebAuthInfo> authInfoList = webSession.getAllAuthInfo();
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
                serverName,
                serverURL,
                adminName,
                adminPassword,
                authInfoList,
                sessionExpireTime,
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
    public SMDataSourceGrant[] getConnectionSubjectAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        String connectionId
    ) throws DBWebException {
        DBPProject globalProject = webSession.getProjectById(projectId);
        if (!WebServiceUtils.isGlobalProject(globalProject)) {
            throw new DBWebException("Project '" + projectId + "'is not global");
        }
        try {
            return webSession.getAdminSecurityController().getObjectPermissionGrants(connectionId, SMObjects.DATASOURCE)
                .stream()
                .map(objectPermissionGrant -> new SMDataSourceGrant(
                    objectPermissionGrant.getObjectPermissions().getObjectId(),
                    objectPermissionGrant.getSubjectId(),
                    objectPermissionGrant.getSubjectType()
                ))
                .toArray(SMDataSourceGrant[]::new);
        } catch (DBException e) {
            throw new DBWebException("Error getting connection access info", e);
        }
    }

    @Override
    public boolean setConnectionSubjectAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull String connectionId,
        @NotNull List<String> subjects
    ) throws DBWebException {
        DBPProject globalProject = webSession.getProjectById(projectId);
        if (!WebServiceUtils.isGlobalProject(globalProject)) {
            throw new DBWebException("Project '" + projectId + "'is not global");
        }
        DBPDataSourceContainer dataSource = getGlobalRegistry(webSession).getDataSource(connectionId);
        if (dataSource == null) {
            throw new DBWebException("Connection '" + connectionId + "' not found");
        }
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant connection access in anonymous mode");
        }
        try {
            var adminSM = webSession.getAdminSecurityController();
            adminSM.deleteAllObjectPermissions(connectionId, SMObjects.DATASOURCE);
            webSession.getAdminSecurityController()
                .setObjectPermissions(Set.of(connectionId), SMObjects.DATASOURCE,
                    new HashSet<>(subjects),
                    Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION), grantor.getUserId());
        } catch (DBException e) {
            throw new DBWebException("Error setting connection subject access", e);
        }
        return true;
    }

    @Override
    public SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId) throws DBWebException {
        try {
            return webSession.getAdminSecurityController().getSubjectObjectPermissionGrants(subjectId, SMObjects.DATASOURCE)
                .stream()
                .map(objectPermissionsGrant ->
                    new SMDataSourceGrant(
                        objectPermissionsGrant.getObjectPermissions().getObjectId(),
                        objectPermissionsGrant.getSubjectId(),
                        objectPermissionsGrant.getSubjectType()
                    ))
                .toArray(SMDataSourceGrant[]::new);
        } catch (DBException e) {
            throw new DBWebException("Error getting connection access info", e);
        }
    }

    @Override
    public boolean setSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId, @NotNull List<String> connections) throws DBWebException {
        for (String connectionId : connections) {
            if (getGlobalRegistry(webSession).getDataSource(connectionId) == null) {
                throw new DBWebException("Connection '" + connectionId + "' not found");
            }
        }
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant access in anonymous mode");
        }
        try {
            webSession.getAdminSecurityController().deleteAllSubjectObjectPermissions(subjectId, SMObjects.DATASOURCE);
            webSession.getAdminSecurityController()
                .setObjectPermissions(
                    new HashSet<>(connections),
                    SMObjects.DATASOURCE,
                    Set.of(subjectId),
                    Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION),
                    grantor.getUserId());
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
    public Boolean setUserMetaParameterValues(WebSession webSession, String userId, Map<String, String> parameters) throws DBWebException {
        try {
            webSession.getAdminSecurityController().setSubjectMetas(userId, parameters);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error changing user '" + userId + "' meta parameters", e);
        }
    }

    private DBPDataSourceRegistry getGlobalRegistry(WebSession session) {
        String globalConfigurationName = CBApplication.getInstance().getDefaultProjectName();
        return session.getProjectById(RMProjectType.GLOBAL.getPrefix() + "_" + globalConfigurationName).getDataSourceRegistry();
    }

    private void validatePermissions(@NotNull String expectedScope, @NotNull Collection<String> permissions) throws DBWebException {
        for (String permission : permissions) {
            var permissionDescriptor = permissionDescriptorByName.get(permission);
            if (permissionDescriptor == null) {
                throw new DBWebException("Unknown permission: " + permission);
            }
            if (!expectedScope.equals(permissionDescriptor.getScope())) {
                throw new DBWebException(MessageFormat.format(
                    "Unexpected permission scope, expected [{}] but was [{}]",
                    expectedScope, permissionDescriptor.getScope()
                ));
            }
        }
    }
}

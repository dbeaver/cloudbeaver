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
package io.cloudbeaver.service.admin.impl;

import io.cloudbeaver.DBWFeatureSet;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.config.CBAppConfig;
import io.cloudbeaver.model.config.CBServerConfig;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.*;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.DBWServiceServerConfigurator;
import io.cloudbeaver.service.admin.*;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.AuthInfo;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.security.*;
import org.jkiss.dbeaver.model.security.user.SMTeam;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.text.MessageFormat;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    public AdminUserInfo getUserById(@NotNull WebSession webSession, @NotNull String userId) throws DBWebException {
        try {
            SMUser smUser = webSession.getAdminSecurityController().getUserById(userId);
            if (smUser == null) {
                throw new DBException("User '" + userId + "' not found");
            }
            return new AdminUserInfo(webSession, new WebUser(smUser));
        } catch (Exception e) {
            throw new DBWebException("Error getting user - " + userId, e);
        }
    }

    @NotNull
    @Override
    public List<AdminUserInfo> listUsers(@NotNull WebSession webSession, @NotNull AdminUserInfoFilter adminFilter) throws DBWebException {
        try {
            List<AdminUserInfo> users = new ArrayList<>();
            for (SMUser smUser : webSession.getAdminSecurityController().findUsers(adminFilter.getFilter())) {
                users.add(new AdminUserInfo(webSession, new WebUser(smUser)));
            }
            return users;
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

    @Override
    public WebPropertyInfo[] listTeamMetaParameters(@NotNull WebSession webSession) {
        // First add user profile properties
        List<DBPPropertyDescriptor> props = new ArrayList<>(
            WebMetaParametersRegistry.getInstance().getTeamParameters());

        // Add metas from enabled auth providers
        for (WebAuthProviderDescriptor ap : WebServiceUtils.getEnabledAuthProviders()) {
            List<DBPPropertyDescriptor> metaProps = ap.getMetaParameters(SMSubjectType.team);
            if (!CommonUtils.isEmpty(metaProps)) {
                props.addAll(metaProps);
            }
        }

        return props.stream()
            .map(p -> new WebPropertyInfo(webSession, p, null))
            .toArray(WebPropertyInfo[]::new);
    }

    @NotNull
    @Override
    public AdminUserInfo createUser(
        @NotNull WebSession webSession,
        String userName,
        @NotNull Boolean enabled,
        @Nullable String authRole
    ) throws DBWebException {
        if (userName.isEmpty()) {
            throw new DBWebException("Empty user name");
        }
        String userId = userName.toLowerCase();
        try {
            GeneralUtils.validateResourceNameUnconditionally(userId);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }
        webSession.addInfoMessage("Create new user - " + userId);

        try {
            var securityController = webSession.getAdminSecurityController();
            securityController.createUser(userId, Map.of(), enabled, authRole);
            var smUser = securityController.getUserById(userId);
            return new AdminUserInfo(webSession, new WebUser(smUser));
        } catch (Exception e) {
            throw new DBWebException("Error creating new user", e);
        }
    }

    @Override
    public List<String> listAuthRoles() {
        return CBApplication.getInstance().getAvailableAuthRoles();
    }

    @Override
    public List<String> listTeamRoles() {
        return CBApplication.getInstance().getAvailableTeamRoles();
    }

    @Override
    public boolean deleteUser(@NotNull WebSession webSession, String userName) throws DBWebException {
        if (CommonUtils.equalObjects(userName, webSession.getUser().getUserId())) {
            throw new DBWebException("You cannot delete yourself");
        }
        webSession.addInfoMessage("Delete user - " + userName);
        try {
            var secretController = DBSSecretController.getSessionSecretControllerOrNull(webSession);
            if (secretController != null) {
                secretController.deleteSubjectSecrets(userName);
            }
            webSession.getAdminSecurityController().deleteUser(userName);
        } catch (Exception e) {
            throw new DBWebException("Error deleting user", e);
        }
        try {
            webSession.getRmController().deleteProject(RMProjectType.USER + "_" + userName);
        } catch (DBException e) {
            log.error("Error deleting user project", e);
            webSession.addSessionError(e);
        }
        return true;
    }

    @NotNull
    @Override
    public AdminTeamInfo createTeam(
        @NotNull WebSession webSession,
        @NotNull String teamId,
        @Nullable String teamName,
        @Nullable String description
    ) throws DBWebException {
        if (teamId.isEmpty()) {
            throw new DBWebException("Empty team ID");
        }
        WebUser user = webSession.getUser();
        if (user == null) {
            throw new DBWebException("Admin user is not found");
        }
        try {
            GeneralUtils.validateResourceNameUnconditionally(teamId);
        } catch (DBException e) {
            throw new DBWebException(e.getMessage(), e);
        }

        webSession.addInfoMessage("Create new team - " + teamId);
        try {
            SMTeam newTeam = webSession.getAdminSecurityController().createTeam(
                teamId,
                teamName,
                description,
                user.getUserId()
            );
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
    public boolean deleteTeam(@NotNull WebSession webSession, String teamId, boolean force) throws DBWebException {
        try {
            webSession.addInfoMessage("Delete team - " + teamId);

            var adminSecurityController = webSession.getAdminSecurityController();
            SMTeam[] userTeams = adminSecurityController.getUserTeams(webSession.getUser().getUserId());
            if (Arrays.stream(userTeams).anyMatch(team -> team.getTeamId().equals(teamId))) {
                throw new DBWebException("You can not delete your own team");
            }
            var secretController = DBSSecretController.getSessionSecretControllerOrNull(webSession);
            if (secretController != null) {
                secretController.deleteSubjectSecrets(teamId);
            }
            adminSecurityController.deleteTeam(teamId, force);
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
        if (!ServletAppUtils.getServletApplication().isDistributed()
            && CommonUtils.equalObjects(user, webSession.getUser().getUserId())
        ) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            adminSecurityController.addUserTeams(user, new String[]{team}, grantor.getUserId());

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
        if (!ServletAppUtils.getServletApplication().isDistributed() &&
            CommonUtils.equalObjects(user, webSession.getUser().getUserId())
        ) {
            throw new DBWebException("You cannot edit your own permissions");
        }
        try {
            var adminSecurityController = webSession.getAdminSecurityController();
            SMTeam[] userTeams = adminSecurityController.getUserTeams(user);
            List<String> teamIds = Arrays.stream(userTeams).map(SMTeam::getTeamId).collect(Collectors.toList());
            if (teamIds.contains(team)) {
                adminSecurityController.deleteUserTeams(user, new String[]{team});
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
    public boolean deleteUserCredentials(
        @NotNull WebSession webSession,
        @NotNull String userId,
        @NotNull String providerId
    ) throws DBWebException {
        try {
            webSession.getAdminSecurityController().deleteUserCredentials(userId, providerId);
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
            webSession.getAdminSecurityController().enableUser(userID, enabled, grantor.getUserId(), "Disabled manually");
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error activating user", e);
        }
    }

    @Override
    public Boolean setUserAuthRole(WebSession webSession, String userId, String authRole) throws DBWebException {
        try {
            log.info(String.format("User set auth role: [grantorUserId=%s]", webSession.getUserId()));
            webSession.getAdminSecurityController().setUserAuthRole(userId, authRole);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error updating user auth role", e);
        }
    }

    @Override
    public Boolean setUserTeamRole(
        @NotNull WebSession webSession,
        @NotNull String userId,
        @NotNull String teamId,
        @Nullable String teamRole
    ) throws DBWebException {
        try {
            webSession.getAdminSecurityController().setUserTeamRole(userId, teamId, teamRole);
            return true;
        } catch (Exception e) {
            throw new DBWebException("Error updating user auth role", e);
        }
    }

    ////////////////////////////////////////////////////////////////////
    // Connection management

    @Override
    public List<AdminConnectionSearchInfo> searchConnections(@NotNull WebSession webSession, @NotNull List<String> hostNames) throws DBWebException {
        ConnectionSearcher searcher = new ConnectionSearcher(webSession, hostNames.toArray(new String[0]));
        searcher.run(webSession.getProgressMonitor());
        return searcher.getFoundConnections();
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
        var application = CBApplication.getInstance();


        Stream<WebAuthProviderProperty> commonPropertiesStream = WebAuthProviderRegistry.getInstance()
            .getCommonProperties()
            .stream()
            .filter(commonProperties -> commonProperties.isApplicableFor(authProvider))
            .flatMap(commonProperties -> commonProperties.getConfigurationParameters().stream());

        return Stream.concat(authProvider.getConfigurationParameters().stream(), commonPropertiesStream)
            .filter(p -> {
                boolean allFeaturesEnabled = true;
                for (String feature : p.getRequiredFeatures()) {
                    allFeaturesEnabled = application.getAppConfiguration().isFeatureEnabled(feature);
                    if (!allFeaturesEnabled) {
                        break;
                    }
                }
                return allFeaturesEnabled;
            }).map(p -> new WebPropertyInfo(webSession, p)).collect(Collectors.toList());
    }

    @Override
    public List<WebAuthProviderConfiguration> listAuthProviderConfigurations(
        @NotNull HttpServletRequest request,
        @NotNull WebSession webSession,
        @Nullable String providerId
    ) throws DBWebException {
        String origin = ServletAppUtils.getOriginFromRequestOrThrow(request);
        List<WebAuthProviderConfiguration> result = new ArrayList<>();
        for (SMAuthProviderCustomConfiguration cfg : CBApplication.getInstance().getAppConfiguration().getAuthCustomConfigurations()) {
            if (providerId != null && !providerId.equals(cfg.getProvider())) {
                continue;
            }
            WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(cfg.getProvider());
            if (authProvider != null) {
                result.add(new WebAuthProviderConfiguration(authProvider, cfg, origin));
            }
        }
        return result;
    }

    @Override
    public WebAuthProviderConfiguration saveAuthProviderConfiguration(
        @NotNull HttpServletRequest request,
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
            CBApplication.getInstance().flushConfiguration(webSession);
        } catch (DBException e) {
            throw new DBWebException("Error saving server configuration", e);
        }
        log.info(String.format(
            "Auth provider configuration created: [id=%s, provider=%s, userId=%s]",
            providerConfig.getId(),
            providerConfig.getProvider(),
            webSession.getUserId()
        ));
        return new WebAuthProviderConfiguration(authProvider, providerConfig, ServletAppUtils.getOriginFromRequestOrThrow(request));
    }

    @Override
    public boolean deleteAuthProviderConfiguration(@NotNull WebSession webSession, @NotNull String id) throws DBWebException {
        webSession.addInfoMessage("Delete configuration for auth provider - " + id);

        if (CBApplication.getInstance().getAppConfiguration().deleteAuthProviderConfiguration(id)) {
            try {
                CBApplication.getInstance().flushConfiguration(webSession);
            } catch (DBException e) {
                throw new DBWebException("Error saving server configuration", e);
            }
            log.info(String.format("Auth provider configuration deleted: [id=%s, userId=%s]", id, webSession.getUserId()));
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
            CBServerConfig serverConfig = new CBServerConfig();
            serverConfig.setServerName(CBApplication.getInstance().getServerName());
            serverConfig.setServerURL(CBApplication.getInstance().getServerURL());
            serverConfig.setMaxSessionIdleTime(CBApplication.getInstance().getMaxSessionIdleTime());
            String adminName = null;
            String adminPassword = null;

            if (!params.isEmpty()) {    // FE can send an empty configuration
                var config = new AdminServerConfig(params);
                appConfig.setAnonymousAccessEnabled(config.isAnonymousAccessEnabled());
                appConfig.setSupportsCustomConnections(config.isCustomConnectionsEnabled());
                appConfig.setPublicCredentialsSaveEnabled(config.isPublicCredentialsSaveEnabled());
                appConfig.setAdminCredentialsSaveEnabled(config.isAdminCredentialsSaveEnabled());
                appConfig.setEnabledFeatures(config.getEnabledFeatures().toArray(new String[0]));
                // custom logic for enabling embedded drivers
                updateDisabledDriversConfig(appConfig, config.getDisabledDrivers());
                appConfig.setResourceManagerEnabled(config.isResourceManagerEnabled());
                appConfig.setSecretManagerEnabled(config.isSecretManagerEnabled());

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
                serverConfig.setServerName(config.getServerName());
                serverConfig.setServerURL(config.getServerURL());
                serverConfig.setMaxSessionIdleTime(config.getSessionExpireTime());
            }

            if (CommonUtils.isEmpty(adminName)) {
                // Grant admin permissions to the current user
                WebUser curUser = webSession.getUser();
                adminName = curUser == null ? null : curUser.getUserId();
                adminPassword = null;
            }
            List<AuthInfo> authInfos = new ArrayList<>();
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
            for (WebAuthInfo webAuthInfo : authInfoList) {
                authInfos.add(new AuthInfo(
                    webAuthInfo.getAuthProviderDescriptor().getId(),
                    webAuthInfo.getUserCredentials()));
            }

            // Patch configuration by services
            for (DBWServiceServerConfigurator wsc : WebServiceRegistry.getInstance().getWebServices(DBWServiceServerConfigurator.class)) {
                try {
                    wsc.configureServer(CBApplication.getInstance(), webSession, serverConfig, appConfig);
                } catch (Exception e) {
                    log.warn("Error configuring server by web service " + wsc.getClass().getName(), e);
                }
            }

            boolean configurationMode = CBApplication.getInstance().isConfigurationMode();

            CBApplication.getInstance().finishConfiguration(
                adminName,
                adminPassword,
                authInfos,
                serverConfig,
                appConfig,
                webSession
            );

            // Refresh active session
            if (configurationMode) {
                // In config mode we always refresh because admin user doesn't exist yet
                webSession.resetUserState();
            } else {
                // Just reload session state
                webSession.refreshUserData();
            }
            WebAppUtils.getWebApplication().getDriverRegistry().refreshApplicableDrivers();
        } catch (Throwable e) {
            throw new DBWebException("Error configuring server", e);
        }
        return true;
    }

    // we disable embedded drivers by default and enable it in enabled drivers list
    // that's why we need so complicated logic for disabling drivers
    private void updateDisabledDriversConfig(CBAppConfig appConfig, String[] disabledDriversConfig) {
        Set<String> disabledIds = new LinkedHashSet<>(Arrays.asList(disabledDriversConfig));
        Set<String> enabledIds = new LinkedHashSet<>(Arrays.asList(appConfig.getEnabledDrivers()));

        // remove all disabled embedded drivers from enabled drivers list
        enabledIds.removeAll(disabledIds);

        // enable embedded driver if it is not in disabled drivers list
        for (String driverId : appConfig.getDisabledDrivers()) {
            if (disabledIds.contains(driverId)) {
                // driver is also disabled
                continue;
            }
            // driver is removed from disabled list
            // we need to enable if it is embedded
            try {
                DBPDriver driver = WebServiceUtils.getDriverById(driverId);
                if (driver.isEmbedded()) {
                    enabledIds.add(driverId);
                }
            } catch (DBWebException e) {
                log.error("Failed to find driver by id", e);
            }
        }
        appConfig.setDisabledDrivers(disabledDriversConfig);
        appConfig.setEnabledDrivers(enabledIds.toArray(String[]::new));
    }

    @Override
    public boolean setDefaultNavigatorSettings(WebSession webSession, DBNBrowseSettings settings) throws DBWebException {
        CBApplication.getInstance().getAppConfiguration().setDefaultNavigatorSettings(settings);
        if (CBApplication.getInstance().isConfigurationMode()) {
            return true;
        }
        try {
            CBApplication.getInstance().flushConfiguration(webSession);
        } catch (DBException e) {
            throw new DBWebException("Error saving server configuration", e);
        }
        return true;
    }


    @Override
    public boolean updateProductConfiguration(WebSession webSession, Map<String, Object> productConfiguration) throws DBWebException {
        try {
            CBApplication.getInstance().saveProductConfiguration(webSession, productConfiguration);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error updating product configuration", e);
        }
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
            return webSession.getAdminSecurityController().getObjectPermissionGrants(connectionId, SMObjectType.datasource)
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
        validateThatConnectionGlobal(webSession, projectId, List.of(connectionId));
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant connection access in anonymous mode");
        }
        try {
            var adminSM = webSession.getAdminSecurityController();
            adminSM.deleteAllObjectPermissions(connectionId, SMObjectType.datasource);
            webSession.getAdminSecurityController()
                .setObjectPermissions(Set.of(connectionId), SMObjectType.datasource,
                    new HashSet<>(subjects),
                    Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION), grantor.getUserId());
        } catch (DBException e) {
            throw new DBWebException("Error setting connection subject access", e);
        }
        return true;
    }

    void validateThatConnectionGlobal(WebSession webSession, String projectId, Collection<String> connectionIds) throws DBWebException {
        DBPProject globalProject = webSession.getProjectById(projectId);
        if (!WebServiceUtils.isGlobalProject(globalProject)) {
            throw new DBWebException("Project '" + projectId + "'is not global");
        }
        for (String connectionId : connectionIds) {
            DBPDataSourceContainer dataSource = getDataSourceRegistry(webSession, projectId).getDataSource(connectionId);
            if (dataSource == null) {
                throw new DBWebException("Connection '" + connectionId + "' not found");
            }
        }
    }

    @Override
    public boolean addConnectionsAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull List<String> connectionIds,
        @NotNull List<String> subjects
    ) throws DBWebException {
        validateThatConnectionGlobal(webSession, projectId, connectionIds);
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant connection access in anonymous mode");
        }
        try {
            var adminSM = webSession.getAdminSecurityController();
            adminSM.addObjectPermissions(
                new HashSet<>(connectionIds),
                SMObjectType.datasource,
                new HashSet<>(subjects),
                Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION),
                grantor.getUserId()
            );
        } catch (DBException e) {
            throw new DBWebException("Error adding connection subject access", e);
        }
        return true;
    }

    @Override
    public boolean deleteConnectionsAccess(
        @NotNull WebSession webSession,
        @Nullable String projectId,
        @NotNull List<String> connectionIds,
        @NotNull List<String> subjects
    ) throws DBWebException {
        validateThatConnectionGlobal(webSession, projectId, connectionIds);
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant connection access in anonymous mode");
        }
        try {
            var adminSM = webSession.getAdminSecurityController();
            adminSM.deleteObjectPermissions(
                new HashSet<>(connectionIds),
                SMObjectType.datasource,
                new HashSet<>(subjects),
                Set.of(SMConstants.DATA_SOURCE_ACCESS_PERMISSION)
            );
        } catch (DBException e) {
            throw new DBWebException("Error adding connection subject access", e);
        }
        return true;
    }

    @Override
    public SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull WebSession webSession, @NotNull String subjectId) throws DBWebException {
        try {
            return webSession.getAdminSecurityController().getSubjectObjectPermissionGrants(subjectId, SMObjectType.datasource)
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
/*
        for (String connectionId : connections) {
            if (getGlobalRegistry(webSession).getDataSource(connectionId) == null) {
                throw new DBWebException("Connection '" + connectionId + "' not found");
            }
        }
*/
        WebUser grantor = webSession.getUser();
        if (grantor == null) {
            throw new DBWebException("Cannot grant access in anonymous mode");
        }
        try {
            webSession.getAdminSecurityController().deleteAllSubjectObjectPermissions(subjectId, SMObjectType.datasource);
            webSession.getAdminSecurityController()
                .setObjectPermissions(
                    new HashSet<>(connections),
                    SMObjectType.datasource,
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

    @Override
    public Boolean setTeamMetaParameterValues(WebSession webSession, String teamId, Map<String, String> parameters) throws DBWebException {
        try {
            webSession.getAdminSecurityController().setSubjectMetas(teamId, parameters);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error changing team '" + teamId + "' meta parameters", e);
        }
    }

    private DBPDataSourceRegistry getDataSourceRegistry(WebSession session, String projectId) throws DBWebException {
        WebProjectImpl project = session.getProjectById(projectId);
        if (project == null) {
            throw new DBWebException("Project '" + projectId + "' not found");
        }
        return project.getDataSourceRegistry();
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

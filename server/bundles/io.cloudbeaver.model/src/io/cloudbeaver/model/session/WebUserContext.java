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

package io.cloudbeaver.model.session;

import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.dbeaver.model.security.user.SMAuthPermissions;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Web user context.
 * Contains user state and services based on available permissions
 */
//TODO: split to authenticated and non authenticated context
public class WebUserContext implements SMCredentialsProvider {
    private static final Log log = Log.getLog(WebUserContext.class);

    private final ServletApplication application;
    private final DBPWorkspace workspace;

    private WebUser user;
    private Set<String> userPermissions;
    private SMCredentials smCredentials = null;
    private String smSessionId;
    private String refreshToken;

    private SMController securityController;
    private SMAdminController adminSecurityController;
    private DBSSecretController secretController;
    private RMController rmController;
    private DBFileController fileController;
    private Set<String> accessibleProjectIds = new HashSet<>();
    private final WebSessionPreferenceStore preferenceStore;

    public WebUserContext(ServletApplication application, DBPWorkspace workspace) throws DBException {
        this.application = application;
        this.workspace = workspace;
        this.securityController = application.createSecurityController(this);
        this.rmController = application.createResourceController(this, workspace);
        this.fileController = application.createFileController(this);
        this.preferenceStore = new WebSessionPreferenceStore(this, DBWorkbench.getPlatform().getPreferenceStore());
        setUserPermissions(getDefaultPermissions());
    }

    /**
     * refresh context state based on new token from security manager
     *
     * @param smAuthInfo - auth info from security manager
     * @return - true if context changed
     * @throws DBException - if user already authorized and new token come from another user
     */
    public synchronized boolean refresh(SMAuthInfo smAuthInfo) throws DBException {
        if (smAuthInfo.getAuthPermissions() == null && !isAuthorizedInSecurityManager()) {
            throw new DBCException("Required information about session permissions is missing");
        }
        boolean sessionChanged = !CommonUtils.equalObjects(smSessionId, smAuthInfo.getAuthPermissions().getSessionId());
        if (smAuthInfo.getAuthStatus() != SMAuthStatus.SUCCESS || (sessionChanged && smAuthInfo.getSmAccessToken() == null)) {
            throw new DBCException("Authorization did not complete successfully");
        }
        if (sessionChanged) {
            return refresh(smAuthInfo.getSmAccessToken(), smAuthInfo.getSmRefreshToken(), smAuthInfo.getAuthPermissions());
        }
        return false;
    }

    public synchronized boolean refresh(
        @NotNull String smAccessToken,
        @Nullable String smRefreshToken,
        @NotNull SMAuthPermissions smAuthPermissions
    ) throws DBException {
        var isNonAnonymousUserAuthorized = isNonAnonymousUserAuthorizedInSM();
        var isSessionChanged = !CommonUtils.equalObjects(smSessionId, smAuthPermissions.getSessionId());
        if (isNonAnonymousUserAuthorized && isSessionChanged && !Objects.equals(getUserId(), smAuthPermissions.getUserId())) {
            throw new DBCException("Another user is already logged in");
        }
        this.smCredentials = new SMCredentials(
            smAccessToken,
            smAuthPermissions.getUserId(),
            smAuthPermissions.getSessionId(),
            smAuthPermissions.getPermissions()
        );
        setRefreshToken(smRefreshToken);
        setUserPermissions(smAuthPermissions.getPermissions());
        this.adminSecurityController = application.getAdminSecurityController(this);
        this.rmController = application.createResourceController(this, workspace);
        if (isSessionChanged) {
            if (smAuthPermissions.getUserId() != null) {
                this.preferenceStore.updateAllUserPreferences(securityController.getCurrentUserParameters());
            } else {
                this.preferenceStore.updateAllUserPreferences(Map.of());
            }
            this.smSessionId = smAuthPermissions.getSessionId();
            setUser(smAuthPermissions.getUserId() == null ? null : new WebUser(securityController.getCurrentUser()));
            refreshAccessibleProjects();
        }
        return isSessionChanged;
    }

    public synchronized void refreshAccessibleProjects() throws DBException {
        this.accessibleProjectIds.clear();
        this.accessibleProjectIds.addAll(
            Arrays.stream(rmController.listAccessibleProjects()).map(RMProject::getId).collect(Collectors.toSet())
        );
    }

    public synchronized void refreshSMSession() throws DBException {
        if (smCredentials == null || refreshToken == null) {
            return;
        }
        var newTokens = securityController.refreshSession(refreshToken);
        setRefreshToken(newTokens.getSmRefreshToken());
        this.smCredentials = new SMCredentials(
            newTokens.getSmAccessToken(),
            smCredentials.getUserId(),
            smCredentials.getSmSessionId(),
            smCredentials.getPermissions()
        );
    }

    /**
     * reset the state as if the user is not logged in
     */
    public synchronized void reset() throws DBException {
        try {
            if (this.smCredentials != null) {
                this.securityController.logout();
            }
        } catch (Exception e) {
            log.error("Error logging out user", e);
        }
        setUserPermissions(getDefaultPermissions());
        this.smCredentials = null;
        this.user = null;
        this.securityController = application.createSecurityController(this);
        this.adminSecurityController = null;
        this.secretController = null;
    }

    @NotNull
    public synchronized SMController getSecurityController() {
        return securityController;
    }

    @Nullable
    @Override
    public synchronized SMCredentials getActiveUserCredentials() {
        return smCredentials;
    }

    public synchronized boolean isAuthorizedInSecurityManager() {
        return smCredentials != null;
    }

    public synchronized boolean isNonAnonymousUserAuthorizedInSM() {
        return isAuthorizedInSecurityManager() && getUser() != null;
    }

    @Nullable
    public synchronized WebUser getUser() {
        return user;
    }

    public synchronized String getUserId() {
        return user == null ? null : user.getUserId();
    }

    protected synchronized void setUser(@Nullable WebUser user) {
        this.user = user;
    }

    public synchronized SMAdminController getAdminSecurityController() {
        return adminSecurityController;
    }

    public synchronized Set<String> getUserPermissions() {
        return userPermissions;
    }

    /**
     * reread the current user's permissions
     */
    public synchronized void refreshPermissions() throws DBException {
        if (isAuthorizedInSecurityManager()) {
            log.debug("refresh permissions " + getUserId() + " " + getSmSessionId());
            setUserPermissions(securityController.getTokenPermissions().getPermissions());
        } else {
            setUserPermissions(getDefaultPermissions());
        }
    }

    private void setUserPermissions(Set<String> permissions) {
        this.userPermissions = permissions;
    }

    public DBSSecretController getSecretController() throws DBException {
        if (this.securityController == null) {
            this.secretController = application.getSecretController(this, workspace.getAuthContext());
        }
        return secretController;
    }

    public synchronized String getSmSessionId() {
        return smSessionId;
    }

    private Set<String> getDefaultPermissions() {
        return application.getAppConfiguration().isAnonymousAccessEnabled() ? null : Set.of();
    }

    public RMController getRmController() {
        return rmController;
    }

    public DBFileController getFileController() {
        return fileController;
    }

    @NotNull
    public Set<String> getAccessibleProjectIds() {
        return accessibleProjectIds;
    }

    private void setRefreshToken(@Nullable String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public WebSessionPreferenceStore getPreferenceStore() {
        return preferenceStore;
    }
}

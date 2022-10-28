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

package io.cloudbeaver.model.session;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.utils.CommonUtils;

import java.util.Objects;
import java.util.Set;

/**
 * Web user context.
 * Contains user state and services based on available permissions
 */
public class WebUserContext implements SMCredentialsProvider {
    private final WebApplication application;

    private WebUser user;
    private Set<String> userPermissions;
    private SMCredentials smCredentials = null;
    private String smSessionId;
    private String refreshToken;

    private SMController securityController;
    private SMAdminController adminSecurityController;
    private RMController rmController;

    public WebUserContext(WebApplication application) throws DBException {
        this.application = application;
        this.securityController = application.getSecurityController(this);
        this.userPermissions = getDefaultPermissions();
    }

    /**
     * refresh context state based on new token from security manager
     *
     * @param smAuthInfo - auth info from security manager
     * @throws DBException - if user already authorized and new token come from another user
     */
    public synchronized boolean refresh(SMAuthInfo smAuthInfo) throws DBException {
        if (smAuthInfo.getAuthStatus() != SMAuthStatus.SUCCESS) {
            throw new DBCException("Authorization did not complete successfully");
        }
        var isNonAnonymousUserAuthorized = isAuthorizedInSecurityManager() && getUser() != null;
        var authPermissions = smAuthInfo.getAuthPermissions();
        if (authPermissions == null) {
            throw new DBCException("Required information about session permissions is missing");
        }
        var isSessionChanged = !CommonUtils.equalObjects(smSessionId, authPermissions.getSessionId());
        if (isNonAnonymousUserAuthorized && isSessionChanged && !Objects.equals(getUserId(), authPermissions.getUserId())) {
            throw new DBCException("Another user is already logged in");
        }
        this.smCredentials = new SMCredentials(
            smAuthInfo.getSmAuthToken(),
            authPermissions.getUserId(),
            authPermissions.getPermissions()
        );
        this.refreshToken = smAuthInfo.getSmRefreshToken();
        this.userPermissions = authPermissions.getPermissions();
        this.securityController = application.getSecurityController(this);
        this.adminSecurityController = application.getAdminSecurityController(this);
        this.rmController = application.getResourceController(this, this.securityController);
        if (isSessionChanged) {
            this.smSessionId = smAuthInfo.getAuthPermissions().getSessionId();
            setUser(authPermissions.getUserId() == null ? null : new WebUser(securityController.getCurrentUser()));
        }
        return isSessionChanged;
    }

    public synchronized void refreshSMSession() throws DBException {
        if (smCredentials == null || refreshToken == null) {
            return;
        }
        var newTokens = securityController.refreshSession(refreshToken);
        this.refreshToken = newTokens.getSmRefreshToken();
        this.smCredentials = new SMCredentials(
            newTokens.getSmAccessToken(),
            smCredentials.getUserId(),
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
        }
        this.userPermissions = getDefaultPermissions();
        this.smCredentials = null;
        this.user = null;
        this.securityController = application.getSecurityController(this);
        this.adminSecurityController = null;
        this.rmController = application.getResourceController(this, this.securityController);
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

    public synchronized RMController getRmController() {
        return rmController;
    }

    public synchronized Set<String> getUserPermissions() {
        return userPermissions;
    }

    /**
     * reread the current user's permissions
     */
    public synchronized void refreshPermissions() throws DBException {
        if (isAuthorizedInSecurityManager()) {
            this.userPermissions = securityController.getTokenPermissions().getPermissions();
        } else {
            this.userPermissions = getDefaultPermissions();
        }
        if (userPermissions != null &&
            !userPermissions.isEmpty() &&
            !userPermissions.contains(DBWConstants.PERMISSION_PUBLIC)
        ) {
            userPermissions.add(DBWConstants.PERMISSION_PUBLIC);
        }
    }

    public synchronized String getSmSessionId() {
        return smSessionId;
    }

    private Set<String> getDefaultPermissions() {
        return application.getAppConfiguration().isAnonymousAccessEnabled() ? null : Set.of();
    }
}

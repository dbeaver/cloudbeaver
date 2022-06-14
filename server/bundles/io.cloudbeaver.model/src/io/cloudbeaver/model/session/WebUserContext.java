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

import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMCredentials;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMController;

import java.util.Objects;
import java.util.Set;

public class WebUserContext implements SMCredentialsProvider {
    private final WebApplication application;

    private WebUser user;
    private Set<String> userPermissions;
    private SMCredentials smCredentials = null;
    private String smSessionId;

    private SMController securityController;
    private SMAdminController adminSecurityController;
    private RMController rmController;


    public WebUserContext(WebApplication application) {
        this.application = application;
        this.securityController = application.getSecurityController(this);
        this.userPermissions = getDefaultPermissions();
    }

    public void refresh(SMAuthInfo smAuthInfo) throws DBException {
        var isNonAnonymousUserAuthorized = isAuthorizedInSecurityManager() && getUser() != null;
        var tokenInfo = smAuthInfo.getAuthPermissions();
        if (isNonAnonymousUserAuthorized && !Objects.equals(getUserId(), tokenInfo.getUserId())) {
            throw new DBCException("Another user is already logged in");
        }
        this.smCredentials = new SMCredentials(smAuthInfo.getAuthToken(), tokenInfo.getUserId());
        this.userPermissions = tokenInfo.getPermissions();
        this.securityController = application.getSecurityController(this);
        this.adminSecurityController = application.getAdminSecurityController(this);
        this.rmController = application.getResourceController(this);
        this.smSessionId = smAuthInfo.getAuthPermissions().getSessionId();
        setUser(tokenInfo.getUserId() == null ? null : new WebUser(securityController.getUserById(tokenInfo.getUserId())));

    }

    public void reset() {
        this.userPermissions = getDefaultPermissions();
        this.smCredentials = null;
        this.user = null;
        this.securityController = application.getSecurityController(this);
        this.adminSecurityController = null;
        this.rmController = application.getResourceController(this);
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

    public synchronized void refreshPermissions() throws DBException {
        if (isAuthorizedInSecurityManager()) {
            this.userPermissions = securityController.getTokenPermissions(smCredentials.getSmToken()).getPermissions();
        } else {
            this.userPermissions = getDefaultPermissions();
        }
    }

    public synchronized String getSmSessionId() {
        return smSessionId;
    }

    private Set<String> getDefaultPermissions() {
        return application.getAppConfiguration().isAnonymousAccessEnabled() ? null : Set.of();
    }
}

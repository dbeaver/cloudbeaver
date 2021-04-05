/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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

import io.cloudbeaver.DBWAuthProvider;
import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.model.user.WebUserOriginInfo;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.access.DBASession;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * WebAuthInfo
 */
public class WebAuthInfo {

    private static final Log log = Log.getLog(WebAuthInfo.class);

    private final WebSession session;
    private final WebUser user;
    private WebAuthProviderDescriptor authProvider;
    private DBASession authSession;
    private OffsetDateTime loginTime;
    private DBWUserIdentity userIdentity;
    private String message;

    private transient Map<String, Object> userCredentials;

    public WebAuthInfo(
        @NotNull WebSession session,
        @NotNull WebUser user,
        @NotNull WebAuthProviderDescriptor authProvider,
        @NotNull DBWUserIdentity userIdentity,
        @NotNull DBASession authSession,
        @NotNull OffsetDateTime loginTime)
    {
        this.session = session;
        this.user = user;
        this.authProvider = authProvider;
        this.userIdentity = userIdentity;
        this.authSession = authSession;
        this.loginTime = loginTime;
    }

    public WebUser getUser() {
        return user;
    }

    public DBWUserIdentity getUserIdentity() {
        return userIdentity;
    }

    public String getUserId() {
        return userIdentity.getId();
    }

    public String getDisplayName() {
        return userIdentity.getDisplayName();
    }

    public String getAuthProvider() {
        return authProvider.getId();
    }

    public WebAuthProviderDescriptor getAuthProviderDescriptor() {
        return authProvider;
    }

    public DBASession getAuthSession() {
        return authSession;
    }

    public OffsetDateTime getLoginTime() {
        return loginTime;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public WebUserOriginInfo getOrigin() {
        return new WebUserOriginInfo(session, user, authProvider);
    }

    void closeAuth() {
        if (authProvider != null && authSession != null) {
            try {
                DBWAuthProvider authProviderInstance = this.authProvider.getInstance();
                authProviderInstance.closeSession(authSession);
            } catch (Exception e) {
                log.error(e);
            } finally {
                authSession = null;
            }
        }
    }

    // Used to keep user credentials during server configuration
    public Map<String, Object> getUserCredentials() {
        return userCredentials;
    }

    public void setUserCredentials(Map<String, Object> userCredentials) {
        this.userCredentials = userCredentials;
    }
}

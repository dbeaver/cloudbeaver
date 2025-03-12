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
package io.cloudbeaver.model.session;

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.model.user.WebUserOriginInfo;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.auth.SMSessionPrincipal;
import org.jkiss.dbeaver.model.meta.Property;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * WebAuthInfo
 */
public class WebAuthInfo implements SMSessionPrincipal, WebUserAuthToken {

    private static final Log log = Log.getLog(WebAuthInfo.class);

    private final WebSession session;
    private final WebUser user;
    private final WebAuthProviderDescriptor authProvider;
    private String authProviderConfigurationId;
    @NotNull
    private final SMAuthInfo authInfo;
    @NotNull
    private final SMSession authSession;
    private final OffsetDateTime loginTime;
    private final DBWUserIdentity userIdentity;
    private String message;

    private transient Map<String, Object> userCredentials;

    public WebAuthInfo(
        @NotNull WebSession session,
        @NotNull WebUser user,
        @NotNull WebAuthProviderDescriptor authProvider,
        @NotNull DBWUserIdentity userIdentity,
        @NotNull SMSession authSession,
        @NotNull SMAuthInfo authInfo,
        @NotNull OffsetDateTime loginTime
    ) {
        this.session = session;
        this.user = user;
        this.authProvider = authProvider;
        this.userIdentity = userIdentity;
        this.authInfo = authInfo;
        this.authSession = authSession;
        this.loginTime = loginTime;
    }

    @Property
    public OffsetDateTime getLoginTime() {
        return loginTime;
    }

    @Property
    public String getMessage() {
        return message;
    }

    @Property
    public void setMessage(String message) {
        this.message = message;
    }

    @Property
    public WebUserOriginInfo getOrigin() {
        return new WebUserOriginInfo(session, user, authProvider);
    }

    @Property
    public String getUserId() {
        return userIdentity.getId();
    }

    @Property
    public String getDisplayName() {
        return userIdentity.getDisplayName();
    }

    @Property
    public String getAuthProvider() {
        return authProvider.getId();
    }

    @Property
    public String getAuthConfiguration() {
        return authProviderConfigurationId;
    }

    public void setAuthProviderConfigurationId(String authProviderConfigurationId) {
        this.authProviderConfigurationId = authProviderConfigurationId;
    }

    public WebUser getUser() {
        return user;
    }

    public DBWUserIdentity getUserIdentity() {
        return userIdentity;
    }

    public WebAuthProviderDescriptor getAuthProviderDescriptor() {
        return authProvider;
    }

    @NotNull
    public SMSession getAuthSession() {
        return authSession;
    }

    @NotNull
    public SMAuthInfo getAuthInfo() {
        return authInfo;
    }

    void closeAuth() {
        if (authProvider != null && authSession != null) {
            try {
                SMAuthProvider authProviderInstance = this.authProvider.getInstance();
                authProviderInstance.closeSession(session, authSession);
            } catch (Exception e) {
                log.error(e);
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

    //////////////////////////////////////
    // Principal

    @Override
    public String getUserDomain() {
        return authProvider.getId();
    }

    @Override
    public String getUserName() {
        return user.getUserId();
    }
}

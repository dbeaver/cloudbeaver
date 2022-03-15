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

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.model.user.WebAuthProviderConfiguration;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.model.user.WebUserOriginInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.auth.SMSessionPrincipal;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * WebAuthInfo
 */
public class WebAuthInfo implements SMSessionPrincipal {

    private static final Log log = Log.getLog(WebAuthInfo.class);

    private final WebSession session;
    private final WebUser user;
    private final AuthProviderDescriptor authProvider;
    private WebAuthProviderConfiguration authProviderConfiguration;
    private SMSession authSession;
    private final OffsetDateTime loginTime;
    private final DBWUserIdentity userIdentity;
    private String message;

    private transient Map<String, Object> userCredentials;

    public WebAuthInfo(
        @NotNull WebSession session,
        @NotNull WebUser user,
        @NotNull AuthProviderDescriptor authProvider,
        @NotNull DBWUserIdentity userIdentity,
        @NotNull SMSession authSession,
        @NotNull OffsetDateTime loginTime)
    {
        this.session = session;
        this.user = user;
        this.authProvider = authProvider;
        this.userIdentity = userIdentity;
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
        return new WebUserOriginInfo(session, user, authProvider, true);
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
        return authProviderConfiguration == null ? null : authProviderConfiguration.getId();
    }

    public WebUser getUser() {
        return user;
    }

    public DBWUserIdentity getUserIdentity() {
        return userIdentity;
    }

    public AuthProviderDescriptor getAuthProviderDescriptor() {
        return authProvider;
    }

    public WebAuthProviderConfiguration getAuthProviderConfiguration() {
        return authProviderConfiguration;
    }

    public void setAuthProviderConfiguration(WebAuthProviderConfiguration authProviderConfiguration) {
        this.authProviderConfiguration = authProviderConfiguration;
    }

    public SMSession getAuthSession() {
        return authSession;
    }

    void closeAuth() {
        if (authProvider != null && authSession != null) {
            try {
                SMAuthProvider authProviderInstance = this.authProvider.getInstance();
                authProviderInstance.closeSession(session, authSession);
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

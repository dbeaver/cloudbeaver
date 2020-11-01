/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.model.user.WebUserOriginInfo;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.access.DBASession;

import java.time.OffsetDateTime;

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
    private String message;

    public WebAuthInfo(WebSession session, WebUser user) {
        this.session = session;
        this.user = user;
    }

    public WebUser getUser() {
        return user;
    }

    public String getUserId() {
        return user.getUserId();
    }

    public String getDisplayName() {
        return user.getDisplayName();
    }

    public WebAuthProviderDescriptor getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(WebAuthProviderDescriptor authProvider) {
        this.authProvider = authProvider;
    }

    public DBASession getAuthSession() {
        return authSession;
    }

    public void setAuthSession(DBASession authSession) {
        this.authSession = authSession;
    }

    public OffsetDateTime getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(OffsetDateTime loginTime) {
        this.loginTime = loginTime;
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
}

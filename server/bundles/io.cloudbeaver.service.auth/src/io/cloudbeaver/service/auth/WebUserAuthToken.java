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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.model.user.WebUserOriginInfo;

import java.time.OffsetDateTime;

/**
 * WebUserInfo
 */
public class WebUserAuthToken {

    private final WebSession session;
    private final WebUser user;
    private final WebAuthInfo authInfo;

    public WebUserAuthToken(WebSession session, WebUser user, WebAuthInfo authInfo) {
        this.session = session;
        this.user = user;
        this.authInfo = authInfo;
    }

    public String getAuthProvider() {
        return authInfo.getAuthProvider().getId();
    }

    public OffsetDateTime getLoginTime() {
        return authInfo.getLoginTime();
    }

    public String getMessage() {
        return authInfo.getMessage();
    }

    public WebUserOriginInfo getOrigin() {
        return new WebUserOriginInfo(session, user, authInfo.getAuthProvider());
    }

}

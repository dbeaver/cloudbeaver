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
import org.jkiss.dbeaver.Log;

import java.util.List;

/**
 * WebUserInfo
 */
public class WebUserInfo {

    private static final Log log = Log.getLog(WebUserInfo.class);

    private final WebSession session;
    private final WebUser user;

    public WebUserInfo(WebSession session, WebUser user) {
        this.session = session;
        this.user = user;
    }

    public String getUserId() {
        return user.getUserId();
    }

    public String getDisplayName() {
        return user.getDisplayName();
    }

    public List<WebAuthInfo> getAuthTokens() {
        return session.getAllAuthInfo();
    }

}

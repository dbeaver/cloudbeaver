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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * WebUserInfo
 */
public class WebUserInfo {

    private static final Log log = Log.getLog(WebUserInfo.class);

    private final WebSession session;
    private final WebUser user;
    private String[] linkedProviders;

    public WebUserInfo(WebSession session, WebUser user) {
        this.session = session;
        this.user = user;
    }

    @Property
    public String getUserId() {
        return user == null ? null : user.getUserId();
    }

    @Property
    public String getDisplayName() {
        return user == null ? null : user.getDisplayName();
    }

    @Property
    public List<WebUserAuthToken> getAuthTokens() {
        return session.getAllAuthInfo().stream()
            .map(ai -> new WebUserAuthToken(session, user, ai))
            .collect(Collectors.toList());
    }

    @Property
    public List<String> getLinkedAuthProviders() throws DBWebException {
        if (linkedProviders == null) {
            try {
                linkedProviders = session.getSecurityController().getUserLinkedProviders(session.getUser().getUserId());
            } catch (DBException e) {
                throw new DBWebException("Error reading user linked providers", e);
            }
        }
        return Arrays.asList(linkedProviders);
    }

    @Property
    public Map<String, String> getMetaParameters() {
        return session.getUserMetaParameters();
    }

    @Property
    public Map<String, Object> getConfigurationParameters() throws DBWebException {
        try {
            return session.getSecurityController().getUserParameters(user.getUserId());
        } catch (DBException e) {
            throw new DBWebException("Error reading user parameters", e);
        }
    }

}

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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.model.user.WebUserOriginInfo;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;
import org.jkiss.dbeaver.model.security.user.SMRole;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Admin user info
 */
public class AdminUserInfo {

    private static final Log log = Log.getLog(AdminUserInfo.class);

    private final WebSession session;
    private final WebUser user;
    private String[] userLinkedProviders;


    public AdminUserInfo(WebSession session, WebUser user) {
        this.session = session;
        this.user = user;
    }

    @Property
    public String getUserId() {
        return user.getUserId();
    }

    @Property
    public Map<String, String> getMetaParameters() {
        return user.getMetaParameters();
    }

    @Property
    public boolean getEnabled() {
        return user.getEnabled();
    }

    @Property
    public Map<String, Object> getConfigurationParameters() {
        return user.getConfigurationParameters();
    }

    @Property
    public String[] getGrantedRoles() throws DBException {
        if (user.getRoles() == null) {
            SMRole[] userRoles = session.getSecurityController().getUserRoles(getUserId());
            user.setRoles(userRoles);
        }
        return user.getGrantedRoles();
    }

    @Property
    public SMDataSourceGrant[] getGrantedConnections() throws DBException {
        return session.getSecurityController().getSubjectConnectionAccess(new String[]{getUserId()});
    }

    @Property
    public WebUserOriginInfo[] getOrigins() throws DBWebException {
        List<WebUserOriginInfo> result = new ArrayList<>();
        for (String provider : getUserLinkedProviders()) {
            AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(provider);
            if (authProvider == null) {
                log.error("Auth provider '" + provider + "' not found");
            } else {
                result.add(new WebUserOriginInfo(session, user, authProvider, false));
            }
        }
        return result.toArray(new WebUserOriginInfo[0]);
    }

    @Property
    public String[] getLinkedAuthProviders() throws DBWebException {
        return getUserLinkedProviders();
    }

    private String[] getUserLinkedProviders() throws DBWebException {
        if (userLinkedProviders != null) {
            return userLinkedProviders;
        }
        try {
            userLinkedProviders = session.getSecurityController().getUserLinkedProviders(user.getUserId());
        } catch (DBException e) {
            throw new DBWebException("Error reading user linked providers", e);
        }
        return userLinkedProviders;
    }

}

/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.utils.CBModelConstants;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;
import org.jkiss.dbeaver.model.security.SMObjectType;

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
    public String getAuthRole() {
        return user.getAuthRole();
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
    public String[] getGrantedTeams() {
        return user.getTeams();
    }

    @Property
    public SMDataSourceGrant[] getGrantedConnections() throws DBException {
        return session.getAdminSecurityController()
            .getSubjectObjectPermissionGrants(getUserId(), SMObjectType.datasource)
            .stream()
            .map(objectPermission -> new SMDataSourceGrant(
                objectPermission.getObjectPermissions().getObjectId(),
                getUserId(),
                objectPermission.getSubjectType()
            ))
            .toArray(SMDataSourceGrant[]::new);
    }

    @Property
    public WebUserOriginInfo[] getOrigins() throws DBWebException {
        List<AdminOriginInfo> result = new ArrayList<>();
        for (String provider : getUserLinkedProviders()) {
            WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(provider);
            if (authProvider == null) {
                log.error("Auth provider '" + provider + "' not found");
            } else {
                result.add(new AdminOriginInfo(session, user, authProvider));
            }
        }
        return result.toArray(new AdminOriginInfo[0]);
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
            String userId = user.getUserId();
            userLinkedProviders = session.getAdminSecurityController().getUserLinkedProviders(userId);
        } catch (DBException e) {
            throw new DBWebException("Error reading user linked providers", e);
        }
        return userLinkedProviders;
    }

    @Nullable
    public String getDisableDate() {
        return user.getDisableDate() == null ? null : CBModelConstants.ISO_DATE_FORMAT.format(user.getDisableDate());
    }


    @Nullable
    public String getDisabledBy() {
        return user.getDisabledBy();
    }

    @Nullable
    public String getDisableReason() {
        return user.getDisableReason();
    }
}

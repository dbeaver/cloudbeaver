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
package io.cloudbeaver.model.user;

import io.cloudbeaver.DBWAuthProvider;
import io.cloudbeaver.DBWAuthProviderExternal;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebObjectOrigin;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.access.DBASession;
import org.jkiss.dbeaver.model.meta.Property;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.Collections;
import java.util.Map;

/**
 * Web connection origin info
 */
public class WebUserOriginInfo implements WebObjectOrigin {

    private static final Log log = Log.getLog(WebUserOriginInfo.class);

    private final WebSession session;
    private final WebUser user;
    private final WebAuthProviderDescriptor authProvider;

    public WebUserOriginInfo(WebSession session, WebUser user, WebAuthProviderDescriptor authProvider) {
        this.session = session;
        this.user = user;
        this.authProvider = authProvider;
    }

    @NotNull
    @Override
    public String getType() {
        return authProvider == null ? LocalAuthProvider.PROVIDER_ID : authProvider.getId();
    }

    @Nullable
    @Override
    public String getSubType() {
        return null;
    }

    @NotNull
    @Override
    public String getDisplayName() {
        return authProvider == null ? "N/A" : authProvider.getLabel();
    }

    @Nullable
    @Override
    public String getIcon() {
        return authProvider == null ? null : WebServiceUtils.makeIconId(authProvider.getIcon());
    }

    @NotNull
    @Override
    public Map<String, Object> getConfiguration() {
        return Collections.emptyMap();
    }

    @Property
    @Override
    public WebPropertyInfo[] getDetails() throws DBWebException {
        if (user == null || authProvider == null) {
            return new WebPropertyInfo[0];
        }
        try {
            DBASession authSession = session.getAuthInfo().getAuthSession();
            DBWAuthProvider<?> authProvider = this.authProvider.getInstance();
            if (authSession != null && authProvider instanceof DBWAuthProviderExternal) {
                if (!isValidSessionType(authSession, authProvider)) {
                    return new WebPropertyInfo[0];
                }
                DBPObject userDetails = ((DBWAuthProviderExternal) authProvider).getUserDetails(session.getProgressMonitor(), authSession, user);
                if (userDetails != null) {
                    return WebServiceUtils.getObjectProperties(session, userDetails);
                }
            }
        } catch (Exception e) {
            log.error(e);
        }
        return new WebPropertyInfo[0];
    }

    private static boolean isValidSessionType(DBASession authSession, DBWAuthProvider<?> authProvider) {
        Type providerSuperClass = authProvider.getClass().getGenericSuperclass();
        if (providerSuperClass instanceof ParameterizedType) {
            Type[] typeArguments = ((ParameterizedType) providerSuperClass).getActualTypeArguments();
            if (typeArguments.length == 1 && typeArguments[0] instanceof Class) {
                // Wrong session type for this auth provider
                return ((Class) typeArguments[0]).isInstance(authSession);
            }
        }
        return true;
    }

}

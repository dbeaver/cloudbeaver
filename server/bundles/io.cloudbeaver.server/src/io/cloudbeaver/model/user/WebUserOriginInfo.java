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
package io.cloudbeaver.model.user;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.DBAAuthProviderExternal;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.WebObjectOrigin;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.DBAAuthProvider;
import org.jkiss.dbeaver.model.auth.DBASession;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;

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
    private final AuthProviderDescriptor authProvider;
    private boolean selfIdentity;

    public WebUserOriginInfo(WebSession session, WebUser user, AuthProviderDescriptor authProvider, boolean selfIdentity) {
        this.session = session;
        this.user = user;
        this.authProvider = authProvider;
        this.selfIdentity = selfIdentity;
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
            WebAuthInfo authInfo = session.getAuthInfo(
                LocalAuthProvider.PROVIDER_ID.equals(authProvider.getId()) ? null : authProvider.getId());
            if (authInfo == null) {
                throw new DBException("Session not authorized in auth provider '" + authProvider.getId() + "'");
            }
            DBASession authSession = authInfo.getAuthSession();
            DBAAuthProvider<?> authProvider = this.authProvider.getInstance();
            if (authSession != null && authProvider instanceof DBAAuthProviderExternal) {
                if (!isValidSessionType(authSession, authProvider)) {
                    return new WebPropertyInfo[0];
                }
                DBPObject userDetails = ((DBAAuthProviderExternal) authProvider).getUserDetails(
                    session.getProgressMonitor(),
                    session,
                    authSession,
                    user,
                    selfIdentity);
                if (userDetails != null) {
                    return WebServiceUtils.getObjectProperties(session, userDetails);
                }
            }
        } catch (Exception e) {
            log.error(e);
        }
        return new WebPropertyInfo[0];
    }

    private static boolean isValidSessionType(DBASession authSession, DBAAuthProvider<?> authProvider) {
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

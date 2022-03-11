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
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.model.WebObjectOrigin;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.WebCommonUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.auth.SMSession;
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
    @NotNull
    private final AuthProviderDescriptor authProvider;
    private boolean selfIdentity;

    public WebUserOriginInfo(WebSession session, WebUser user, @NotNull AuthProviderDescriptor authProvider, boolean selfIdentity) {
        this.session = session;
        this.user = user;
        this.authProvider = authProvider;
        this.selfIdentity = selfIdentity;
    }

    @NotNull
    @Override
    public String getType() {
        return authProvider.getId();
    }

    @Nullable
    @Override
    public String getSubType() {
        return null;
    }

    @NotNull
    @Override
    public String getDisplayName() {
        return authProvider.getLabel();
    }

    @Nullable
    @Override
    public String getIcon() {
        return WebCommonUtils.makeIconId(authProvider.getIcon());
    }

    @NotNull
    @Override
    public Map<String, Object> getConfiguration() {
        return Collections.emptyMap();
    }

    @Property
    @Override
    public WebPropertyInfo[] getDetails() throws DBWebException {
        if (user == null) {
            return new WebPropertyInfo[0];
        }
        try {
            WebAuthInfo authInfo = session.getAuthInfo(authProvider.getId());
            if (authInfo == null) {
                throw new DBException("Session not authorized in auth provider '" + authProvider.getId() + "'");
            }
            SMSession authSession = authInfo.getAuthSession();
            SMAuthProvider<?> authProvider = this.authProvider.getInstance();
            if (authSession != null && authProvider instanceof SMAuthProviderExternal) {
                if (!isValidSessionType(authSession, authProvider)) {
                    return new WebPropertyInfo[0];
                }
                DBPObject userDetails = ((SMAuthProviderExternal) authProvider).getUserDetails(
                    session.getProgressMonitor(),
                    session,
                    authSession,
                    user,
                    selfIdentity);
                if (userDetails != null) {
                    return WebCommonUtils.getObjectProperties(session, userDetails);
                }
            }
        } catch (Exception e) {
            log.error(e);
        }
        return new WebPropertyInfo[0];
    }

    private static boolean isValidSessionType(SMSession authSession, SMAuthProvider<?> authProvider) {
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

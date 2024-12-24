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
package io.cloudbeaver.model.user;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.model.WebObjectOrigin;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.utils.WebCommonUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.impl.PropertyDescriptor;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.runtime.properties.PropertySourceMap;
import org.jkiss.utils.CommonUtils;

import java.util.Collections;
import java.util.Map;

/**
 * Web connection origin info
 */
public class WebUserOriginInfo implements WebObjectOrigin {

    private static final Log log = Log.getLog(WebUserOriginInfo.class);

    protected final WebSession session;
    protected final WebUser user;
    @NotNull
    protected final WebAuthProviderDescriptor authProviderDescriptor;

    public WebUserOriginInfo(WebSession session, WebUser user, @NotNull WebAuthProviderDescriptor authProvider) {
        this.session = session;
        this.user = user;
        this.authProviderDescriptor = authProvider;
    }

    @NotNull
    @Override
    public String getType() {
        return authProviderDescriptor.getId();
    }

    @Nullable
    @Override
    public String getSubType() {
        return null;
    }

    @NotNull
    @Override
    public String getDisplayName() {
        return authProviderDescriptor.getLabel();
    }

    @Nullable
    @Override
    public String getIcon() {
        return WebCommonUtils.makeIconId(authProviderDescriptor.getIcon());
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
            SMAuthProvider<?> authProvider = this.authProviderDescriptor.getInstance();
            if (authProvider instanceof SMAuthProviderExternal && !authProviderDescriptor.isAuthHidden()) {
                // read user's info from credentials, previously we tried to read data from external service using
                // SMAuthProviderExternal#getUserDetails
                var creds = loadCredentials();
                return mapCredsToProperties(session, creds);
            }
        } catch (Exception e) {
            log.error(e);
        }
        return new WebPropertyInfo[0];
    }

    protected Map<String, Object> loadCredentials() throws DBException {
        return session.getSecurityController().getCurrentUserCredentials(this.authProviderDescriptor.getId());
    }

    private static WebPropertyInfo[] mapCredsToProperties(
        WebSession session, Map<String, Object> creds
    ) {
        if (CommonUtils.isEmpty(creds)) {
            return new WebPropertyInfo[0];
        }
        var propSource = new PropertySourceMap(creds);
        return creds.entrySet()
            .stream()
            .map(entry -> new PropertyDescriptor(
                    null,
                    entry.getKey(),
                    entry.getKey(),
                    null,
                    true,
                    entry.getValue().getClass(),
                    null,
                    new Object[0]
                )
            )
            .map(propDescriptor -> new WebPropertyInfo(session, propDescriptor, propSource))
            .toArray(WebPropertyInfo[]::new);
    }

}

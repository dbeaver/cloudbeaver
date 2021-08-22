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
package io.cloudbeaver.model.user;

import io.cloudbeaver.auth.DBWAuthProvider;
import io.cloudbeaver.auth.DBWAuthProviderFederated;
import io.cloudbeaver.auth.provider.AuthProviderConfig;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.Map;

/**
 * WebAuthProviderInfo.
 */
public class WebAuthProviderConfiguration {

    private static final Log log = Log.getLog(WebAuthProviderConfiguration.class);

    private final WebAuthProviderDescriptor providerDescriptor;
    private final String id;
    private final AuthProviderConfig config;

    public WebAuthProviderConfiguration(WebAuthProviderDescriptor providerDescriptor, String id, AuthProviderConfig config) {
        this.providerDescriptor = providerDescriptor;
        this.id = id;
        this.config = config;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return config.getDisplayName();
    }

    public String getIconURL() {
        return config.getIconURL();
    }

    public String getDescription() {
        return config.getDescription();
    }

    public Map<String, Object> getParameters() {
        return config.getParameters();
    }

    @Property
    public String getSignInLink() throws DBException {
        DBWAuthProvider<?> instance = providerDescriptor.getInstance();
        return instance instanceof DBWAuthProviderFederated ? ((DBWAuthProviderFederated) instance).getSignInLink(getId(), config.getParameters()) : null;
    }

    @Property
    public String getSignOutLink() throws DBException {
        DBWAuthProvider<?> instance = providerDescriptor.getInstance();
        return instance instanceof DBWAuthProviderFederated ? ((DBWAuthProviderFederated) instance).getSignOutLink(getId(), config.getParameters()) : null;
    }

    @Property
    public String getMetadataLink() throws DBException {
        DBWAuthProvider<?> instance = providerDescriptor.getInstance();
        return instance instanceof DBWAuthProviderFederated ? ((DBWAuthProviderFederated) instance).getMetadataLink(getId(), config.getParameters()) : null;
    }

    @Override
    public String toString() {
        return getDisplayName();
    }
}

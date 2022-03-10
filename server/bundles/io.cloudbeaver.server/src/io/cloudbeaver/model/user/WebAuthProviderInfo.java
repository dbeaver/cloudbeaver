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

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.provider.AuthProviderConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMAuthCredentialsProfile;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * WebAuthProviderInfo.
 */
public class WebAuthProviderInfo {

    private static final Log log = Log.getLog(WebAuthProviderInfo.class);

    private final AuthProviderDescriptor descriptor;

    public WebAuthProviderInfo(AuthProviderDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    AuthProviderDescriptor getDescriptor() {
        return descriptor;
    }

    public String getId() {
        return descriptor.getId();
    }

    public String getLabel() {
        return descriptor.getLabel();
    }

    public String getIcon() {
        return WebServiceUtils.makeIconId(descriptor.getIcon());
    }

    public String getDescription() {
        return descriptor.getDescription();
    }

    public boolean isDefaultProvider() {
        return descriptor.getId().equals(CBPlatform.getInstance().getApplication().getAppConfiguration().getDefaultAuthProvider());
    }

    public boolean isConfigurable() {
        return descriptor.isConfigurable();
    }

    public List<WebAuthProviderConfiguration> getConfigurations() {
        List<WebAuthProviderConfiguration> result = new ArrayList<>();
        for (Map.Entry<String, AuthProviderConfig> cfg : CBApplication.getInstance().getAppConfiguration().getAuthProviderConfigurations().entrySet()) {
            if (!cfg.getValue().isDisabled() && getId().equals(cfg.getValue().getProvider())) {
                result.add(new WebAuthProviderConfiguration(descriptor, cfg.getKey(), cfg.getValue()));
            }
        }
        return result;
    }

    public List<SMAuthCredentialsProfile> getCredentialProfiles() {
        return descriptor.getCredentialProfiles();
    }

    public String[] getRequiredFeatures() {
        String[] rf = descriptor.getRequiredFeatures();
        return rf == null ? new String[0] : rf;
    }

    @Override
    public String toString() {
        return getLabel();
    }

}

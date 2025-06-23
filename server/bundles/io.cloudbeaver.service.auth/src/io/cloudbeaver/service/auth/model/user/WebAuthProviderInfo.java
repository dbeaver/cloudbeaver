/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.auth.model.user;

import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.auth.SMAuthProviderFederated;
import io.cloudbeaver.auth.provisioning.SMProvisioner;
import io.cloudbeaver.model.app.ServletAuthConfiguration;
import io.cloudbeaver.registry.WebAuthProviderConfiguration;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.security.SMAuthCredentialsProfile;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;

import java.util.ArrayList;
import java.util.List;

/**
 * WebAuthProviderInfo.
 */
public class WebAuthProviderInfo {

    private static final Log log = Log.getLog(WebAuthProviderInfo.class);
    private static final SMAuthProviderCustomConfiguration TEMPLATE_CONFIG = new SMAuthProviderCustomConfiguration("{configuration_id}");

    @NotNull
    private final WebAuthProviderDescriptor descriptor;
    private final String origin;

    public WebAuthProviderInfo(@NotNull WebAuthProviderDescriptor descriptor, String origin) {
        this.descriptor = descriptor;
        this.origin = origin;
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
        if (WebAppUtils.getWebApplication().getAppConfiguration() instanceof ServletAuthConfiguration authConfiguration) {
            return descriptor.getId().equals(authConfiguration.getDefaultAuthProvider());
        }
        return false;
    }

    public boolean isConfigurable() {
        return descriptor.isConfigurable();
    }

    public boolean isFederated() {
        return descriptor.getInstance() instanceof SMAuthProviderFederated;
    }

    public boolean isTrusted() {
        return descriptor.isTrusted();
    }

    public boolean isPrivate() {
        return descriptor.isPrivate();
    }

    public boolean isRequired() {
        return descriptor.isRequired();
    }

    public boolean isAuthHidden() {
        return descriptor.isAuthHidden();
    }

    public boolean isAuthRoleProvided(SMAuthProviderCustomConfiguration configuration) {
        if (descriptor.getInstance() instanceof SMProvisioner provisioner) {
            return provisioner.isAuthRoleProvided(configuration);
        }
        return false;
    }

    public boolean isSupportProvisioning() {
        return descriptor.getInstance() instanceof SMProvisioner;
    }

    public List<WebAuthProviderConfiguration> getConfigurations() {
        List<WebAuthProviderConfiguration> result = new ArrayList<>();
        for (SMAuthProviderCustomConfiguration cfg : CBApplication.getInstance().getAppConfiguration().getAuthCustomConfigurations()) {
            if (!cfg.isDisabled() && getId().equals(cfg.getProvider())) {
                result.add(new WebAuthProviderConfiguration(descriptor, cfg, origin));
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

    public WebAuthProviderConfiguration getTemplateConfiguration() {
        return new WebAuthProviderConfiguration(descriptor, TEMPLATE_CONFIG, "{origin}");
    }

    @Override
    public String toString() {
        return getLabel();
    }

}

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
package io.cloudbeaver.model;

import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.config.PasswordPolicyConfiguration;
import io.cloudbeaver.registry.WebServerFeatureRegistry;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.registry.DataSourceNavigatorSettings;
import org.jkiss.dbeaver.registry.language.PlatformLanguageDescriptor;
import org.jkiss.dbeaver.registry.language.PlatformLanguageRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Web server configuration
 */
public class WebServerConfig {

    private final WebApplication application;

    public WebServerConfig(@NotNull WebApplication application) {
        this.application = application;
    }

    @Property
    public String getName() {
        if (application instanceof CBApplication<?> cbApp) {
            return CommonUtils.notEmpty(cbApp.getServerConfiguration().getServerName());
        }
        return "";
    }

    @Property
    public String getVersion() {
        return GeneralUtils.getProductVersion().toString();
    }

    @Property
    public String getWorkspaceId() {
        return DBWorkbench.getPlatform().getWorkspace().getWorkspaceId();
    }

    @Property
    public String getServerURL() {
        if (application instanceof CBApplication<?> cbApp) {
            return CommonUtils.notEmpty(cbApp.getServerConfiguration().getServerURL());
        }
        return "";
    }

    @Property
    public String getRootURI() {
        return CommonUtils.notEmpty(application.getServerConfiguration().getRootURI());
    }

    @Deprecated
    @Property
    public String getHostName() {
        return getContainerId();
    }

    @Property
    public String getContainerId() {
        if (application instanceof CBApplication<?> cbApp) {
            return CommonUtils.notEmpty(cbApp.getContainerId());
        }
       return "";
    }

    @Property
    public boolean isAnonymousAccessEnabled() {
        return application.getAppConfiguration().isAnonymousAccessEnabled();
    }

    @Property
    public boolean isSupportsCustomConnections() {
        return application.getAppConfiguration().isSupportsCustomConnections();
    }

    @Property
    public boolean isSupportsConnectionBrowser() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().isSupportsConnectionBrowser();
        }
        return false;
    }

    @Property
    public boolean isSupportsWorkspaces() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().isSupportsUserWorkspaces();
        }
        return false;
    }

    @Property
    public boolean isPublicCredentialsSaveEnabled() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().isPublicCredentialsSaveEnabled();
        }
        return false;
    }

    @Property
    public boolean isAdminCredentialsSaveEnabled() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().isAdminCredentialsSaveEnabled();
        }
        return false;
    }

    @Property
    public boolean isLicenseRequired() {
        return application.isLicenseRequired();
    }

    @Property
    public boolean isLicenseValid() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.isLicenseValid();
        }
        return false;
    }

    @Property
    public String getLicenseStatus() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getLicenseStatus();
        }
        return "";
    }

    @Property
    public boolean isConfigurationMode() {
        return application.isConfigurationMode();
    }

    @Property
    public boolean isDevelopmentMode() {
        return application.getServerConfiguration().isDevelMode();
    }

    @Property
    public boolean isRedirectOnFederatedAuth() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().isRedirectOnFederatedAuth();
        }
        return false;
    }

    @Property
    public boolean isResourceManagerEnabled() {
        return application.getAppConfiguration().isResourceManagerEnabled();
    }

    @Property
    public long getSessionExpireTime() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getServerConfiguration().getMaxSessionIdleTime();
        }
        return 0;
    }

    @Property
    public String getLocalHostAddress() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getLocalHostAddress();
        }
        return "";
    }

    @Property
    public String[] getEnabledFeatures() {
        return application.getAppConfiguration().getEnabledFeatures();
    }

    @Property
    @Nullable
    public String[] getDisabledBetaFeatures() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().getDisabledBetaFeatures();
        }
        return new String[0];
    }

    @Property
    @NotNull
    public String[] getServerFeatures() {
        return WebServerFeatureRegistry.getInstance().getServerFeatures();
    }

    @Property
    public String[] getEnabledAuthProviders() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().getEnabledAuthProviders();
        }
        return new String[0];
    }

    @Property
    public WebServerLanguage[] getSupportedLanguages() {
        List<PlatformLanguageDescriptor> langs = PlatformLanguageRegistry.getInstance().getLanguages();
        WebServerLanguage[] webLangs = new WebServerLanguage[langs.size()];
        for (int i = 0; i < webLangs.length; i++) {
            webLangs[i] = new WebServerLanguage(langs.get(i));
        }
        return webLangs;
    }

    @Property
    public WebServiceConfig[] getServices() {
        List<WebServiceConfig> services = new ArrayList<>();
        for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
            services.add(new WebServiceConfig(wsd));
        }
        return services.toArray(new WebServiceConfig[0]);
    }

    @Property
    public Map<String, Object> getProductConfiguration() {
        return CBPlatform.getInstance().getApplication().getProductConfiguration();
    }

    @Property
    public DBNBrowseSettings getDefaultNavigatorSettings() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().getDefaultNavigatorSettings();
        }
        return new DataSourceNavigatorSettings();
    }

    @Property
    public Map<String, Object> getResourceQuotas() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().getResourceQuotas();
        }
        return Map.of();
    }

    @Property
    public WebProductInfo getProductInfo() {
        return new WebProductInfo();
    }

    @Property
    public String[] getDisabledDrivers() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getAppConfiguration().getDisabledDrivers();
        }
        return new String[0];
    }

    @Property
    public Boolean isDistributed() {
        return application.isDistributed();
    }

    @Property
    public String getDefaultAuthRole() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getDefaultAuthRole();
        }
        return "";
    }

    @Property
    public String getDefaultUserTeam() {
        return application.getAppConfiguration().getDefaultUserTeam();
    }

    @Property
    public PasswordPolicyConfiguration getPasswordPolicyConfiguration() {
        if (application instanceof CBApplication<?> cbApp) {
            return cbApp.getSecurityManagerConfiguration().getPasswordPolicyConfiguration();
        }
        return new PasswordPolicyConfiguration();
    }
}

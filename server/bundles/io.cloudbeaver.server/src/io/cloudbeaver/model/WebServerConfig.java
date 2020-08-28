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
package io.cloudbeaver.model;

import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;
import org.jkiss.dbeaver.registry.language.PlatformLanguageDescriptor;
import org.jkiss.dbeaver.registry.language.PlatformLanguageRegistry;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Web server configuration
 */
public class WebServerConfig {

    private final CBApplication application;

    public WebServerConfig(CBApplication application) {
        this.application = application;
    }

    @Property
    public String getName() {
        return CommonUtils.notEmpty(application.getServerName());
    }

    @Property
    public String getVersion() {
        return GeneralUtils.getProductVersion().toString();
    }

    @Property
    public boolean isAnonymousAccessEnabled() {
        return application.getAppConfiguration().isAnonymousAccessEnabled();
    }

    @Property
    public boolean isAuthenticationEnabled() {
        return application.getAppConfiguration().isAuthenticationEnabled();
    }

    @Property
    public boolean isSupportsCustomConnections() {
        return application.getAppConfiguration().isSupportsCustomConnections();
    }

    @Property
    public boolean isSupportsConnectionBrowser() {
        return application.getAppConfiguration().isSupportsConnectionBrowser();
    }

    @Property
    public boolean isSupportsWorkspaces() {
        return application.getAppConfiguration().isSupportsUserWorkspaces();
    }

    @Property
    public boolean isConfigurationMode() {
        return application.isConfigurationMode();
    }

    @Property
    public boolean isDevelopmentMode() {
        return application.isDevelMode();
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
        return application.getDefaultNavigatorSettings();
    }

}

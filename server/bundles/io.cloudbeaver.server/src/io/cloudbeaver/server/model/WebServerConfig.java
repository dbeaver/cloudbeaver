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
package io.cloudbeaver.server.model;

import io.cloudbeaver.api.WebAction;
import io.cloudbeaver.server.CloudbeaverPlatform;
import io.cloudbeaver.server.registry.WebServiceDescriptor;
import io.cloudbeaver.server.registry.WebServiceRegistry;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.registry.language.PlatformLanguageDescriptor;
import org.jkiss.dbeaver.registry.language.PlatformLanguageRegistry;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Web server configuration
 */
public class WebServerConfig {

    private String name;
    private String version;
    private boolean supportsPredefinedConnections;
    private boolean supportsCustomConnections;
    private boolean supportsConnectionBrowser;
    private boolean supportsWorkspaces;

    public WebServerConfig(String name, String version) {
        this.name = name;
        this.version = version;
    }

    @Property
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Property
    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    @Property
    public boolean isSupportsPredefinedConnections() {
        return supportsPredefinedConnections;
    }

    public void setSupportsPredefinedConnections(boolean supportsPredefinedConnections) {
        this.supportsPredefinedConnections = supportsPredefinedConnections;
    }

    @Property
    public boolean isSupportsCustomConnections() {
        return supportsCustomConnections;
    }

    public void setSupportsCustomConnections(boolean supportsCustomConnections) {
        this.supportsCustomConnections = supportsCustomConnections;
    }

    @Property
    public boolean isSupportsConnectionBrowser() {
        return supportsConnectionBrowser;
    }

    public void setSupportsConnectionBrowser(boolean supportsConnectionBrowser) {
        this.supportsConnectionBrowser = supportsConnectionBrowser;
    }

    @Property
    public boolean isSupportsWorkspaces() {
        return supportsWorkspaces;
    }

    public void setSupportsWorkspaces(boolean supportsWorkspaces) {
        this.supportsWorkspaces = supportsWorkspaces;
    }

    @WebAction
    public WebServerLanguage[] getSupportedLanguages() {
        List<PlatformLanguageDescriptor> langs = PlatformLanguageRegistry.getInstance().getLanguages();
        WebServerLanguage[] webLangs = new WebServerLanguage[langs.size()];
        for (int i = 0; i < webLangs.length; i++) {
            webLangs[i] = new WebServerLanguage(langs.get(i));
        }
        return webLangs;
    }

    @WebAction
    public WebServiceConfig[] getServices() {
        List<WebServiceConfig> services = new ArrayList<>();
        for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
            services.add(new WebServiceConfig(wsd));
        }
        return services.toArray(new WebServiceConfig[0]);
    }

    @WebAction
    public Map<String, Object> getProductConfiguration() {
        return CloudbeaverPlatform.getInstance().getApplication().getProductConfiguration();
    }

}

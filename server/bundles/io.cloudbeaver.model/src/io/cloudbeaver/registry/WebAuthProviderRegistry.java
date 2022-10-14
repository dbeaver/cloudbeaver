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
package io.cloudbeaver.registry;

import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.registry.RegistryConstants;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class WebAuthProviderRegistry {

    private static final Log log = Log.getLog(WebAuthProviderRegistry.class);

    private static final String TAG_AUTH_PROVIDER = "authProvider"; //$NON-NLS-1$
    private static final String TAG_AUTH_PROVIDER_DISABLE = "authProviderDisable"; //$NON-NLS-1$

    private static WebAuthProviderRegistry instance = null;

    public synchronized static WebAuthProviderRegistry getInstance() {
        if (instance == null) {
            instance = new WebAuthProviderRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private final Map<String, WebAuthProviderDescriptor> authProviders = new LinkedHashMap<>();

    private WebAuthProviderRegistry() {
    }

    private void loadExtensions(IExtensionRegistry registry) {
        {
            IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(WebAuthProviderDescriptor.EXTENSION_ID);
            for (IConfigurationElement ext : extConfigs) {
                // Load webServices
                if (TAG_AUTH_PROVIDER.equals(ext.getName())) {
                    WebAuthProviderDescriptor providerDescriptor = new WebAuthProviderDescriptor(ext);
                    this.authProviders.put(providerDescriptor.getId(), providerDescriptor);
                }
            }

            for (IConfigurationElement ext : extConfigs) {
                // Disable auth providers
                if (TAG_AUTH_PROVIDER_DISABLE.equals(ext.getName())) {
                    String providerId = ext.getAttribute(RegistryConstants.ATTR_ID);
                    if (!this.authProviders.containsKey(providerId)) {
                        log.warn("Can't disable auth provider '" + providerId + "' - no such provider found");
                    } else {
                        this.authProviders.remove(providerId);
                    }
                }
            }
        }
    }

    public List<WebAuthProviderDescriptor> getAuthProviders() {
        return new ArrayList<>(authProviders.values());
    }

    public WebAuthProviderDescriptor getAuthProvider(String id) {
        return authProviders.get(id);
    }

}

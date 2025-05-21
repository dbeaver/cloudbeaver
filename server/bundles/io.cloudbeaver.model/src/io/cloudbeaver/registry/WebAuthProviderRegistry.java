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
package io.cloudbeaver.registry;

import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.impl.PropertyDescriptor;
import org.jkiss.dbeaver.registry.RegistryConstants;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public class WebAuthProviderRegistry {

    private static final Log log = Log.getLog(WebAuthProviderRegistry.class);

    private static final String TAG_AUTH_PROVIDER = "authProvider"; //$NON-NLS-1$
    private static final String TAG_AUTH_PROVIDER_DISABLE = "authProviderDisable"; //$NON-NLS-1$
    private static final String TAG_COMMON_PROVIDER_PROPERTIES = "commonProviderProperties"; //$NON-NLS-1$
    private static final String ATTRIBUTE_EXTENDED = "extended";

    private static WebAuthProviderRegistry instance = null;

    public synchronized static WebAuthProviderRegistry getInstance() {
        if (instance == null) {
            instance = new WebAuthProviderRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private final Map<String, WebAuthProviderDescriptor> authProviders = new LinkedHashMap<>();
    private final List<WebCommonAuthProviderPropertyDescriptor> commonProperties = new ArrayList<>();

    private WebAuthProviderRegistry() {
    }

    private void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(WebAuthProviderDescriptor.EXTENSION_ID);
        // Sort - parse providers with parent in the end
        Arrays.sort(extConfigs, (o1, o2) -> {
            String p1 = o1.getAttribute(ATTRIBUTE_EXTENDED);
            String p2 = o2.getAttribute(ATTRIBUTE_EXTENDED);
            if (CommonUtils.equalObjects(p1, p2)) return 0;
            if (p1 == null) return -1;
            if (p2 == null) return 1;
            return 0;
        });

        for (IConfigurationElement ext : extConfigs) {
            // Load webServices
            if (TAG_AUTH_PROVIDER.equals(ext.getName())) {
                WebAuthProviderDescriptor providerDescriptor;
                WebAuthProviderDescriptor webAuthProviderDescriptor
                    = authProviders.get(ext.getAttribute(WebRegistryConstant.ATTR_EXTENDED));
                if (webAuthProviderDescriptor != null) {
                    webAuthProviderDescriptor.loadExtraConfig(ext);
                } else {
                    providerDescriptor = new WebAuthProviderDescriptor(ext);
                    this.authProviders.put(providerDescriptor.getId(), providerDescriptor);
                }
            } else if (TAG_COMMON_PROVIDER_PROPERTIES.equals(ext.getName())) {
                var commonProperties = new WebCommonAuthProviderPropertyDescriptor(ext);
                this.commonProperties.add(commonProperties);
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

    static List<WebAuthProviderProperty> readProperties(IConfigurationElement root, String authProviderId) {
        List<WebAuthProviderProperty> properties = new ArrayList<>();
        for (IConfigurationElement propGroup : ArrayUtils.safeArray(root.getChildren(PropertyDescriptor.TAG_PROPERTY_GROUP))) {
            String category = propGroup.getAttribute(PropertyDescriptor.ATTR_LABEL);
            IConfigurationElement[] propElements = propGroup.getChildren(PropertyDescriptor.TAG_PROPERTY);
            for (IConfigurationElement prop : propElements) {
                WebAuthProviderProperty propertyDescriptor = new WebAuthProviderProperty(category, prop, authProviderId);
                properties.add(propertyDescriptor);
            }
        }
        return properties;
    }

    public List<WebCommonAuthProviderPropertyDescriptor> getCommonProperties() {
        return commonProperties;
    }

    public List<WebAuthProviderDescriptor> getAuthProviders() {
        return new ArrayList<>(authProviders.values());
    }

    public WebAuthProviderDescriptor getAuthProvider(String id) {
        return authProviders.get(id);
    }

}

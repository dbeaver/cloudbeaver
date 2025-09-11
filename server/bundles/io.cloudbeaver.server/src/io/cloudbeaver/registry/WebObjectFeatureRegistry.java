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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;

public class WebObjectFeatureRegistry {
    private static final Log log = Log.getLog(WebObjectFeatureRegistry.class);
    private static final String EXTENSION_ID = "io.cloudbeaver.object.feature.provider";
    private static final String TAG_FEATURE_PROVIDER = "featureProvider";
    private static WebObjectFeatureRegistry INSTANCE = null;

    private final List<WebObjectFeatureProviderDescriptor> providers = new ArrayList<>();

    public static synchronized WebObjectFeatureRegistry getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new WebObjectFeatureRegistry();
            INSTANCE.loadExtensions(Platform.getExtensionRegistry());
        }
        return INSTANCE;
    }

    private void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(EXTENSION_ID);
        for (IConfigurationElement ext : extConfigs) {
            if (!TAG_FEATURE_PROVIDER.equals(ext.getName())) {
                continue; // Only process featureProvider elements
            }
            try {
                providers.add(new WebObjectFeatureProviderDescriptor(ext));
            } catch (DBException e) {
                log.error("Error loading object feature provider", e);
            }
        }
    }

    public List<WebObjectFeatureProviderDescriptor> getProviders() {
        return providers;
    }
}
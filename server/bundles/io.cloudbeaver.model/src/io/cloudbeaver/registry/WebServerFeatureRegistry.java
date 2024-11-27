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

import io.cloudbeaver.DBWFeatureSet;
import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;

public class WebServerFeatureRegistry {

    private static final Log log = Log.getLog(WebServerFeatureRegistry.class);

    private static final String TAG_FEATURE = "feature"; //$NON-NLS-1$

    private static WebServerFeatureRegistry instance = null;

    public synchronized static WebServerFeatureRegistry getInstance() {
        if (instance == null) {
            instance = new WebServerFeatureRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private String[] serverFeatures = new String[0];

    private WebServerFeatureRegistry() {
    }

    private synchronized void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(WebServerFeatureDescriptor.EXTENSION_ID);
        List<DBWFeatureSet> features = new ArrayList<>();
        for (IConfigurationElement ext : extConfigs) {
            if (TAG_FEATURE.equals(ext.getName())) {
                features.add(
                    new WebServerFeatureDescriptor(ext));
            }
        }
        this.serverFeatures = features
            .stream()
            .map(DBWFeatureSet::getId)
            .toArray(String[]::new);
    }

    public String[] getServerFeatures() {
        return serverFeatures;
    }

}

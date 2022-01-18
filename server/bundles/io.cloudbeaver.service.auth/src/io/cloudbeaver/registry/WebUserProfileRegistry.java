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
import org.jkiss.dbeaver.model.impl.PropertyDescriptor;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.utils.ArrayUtils;

import java.util.ArrayList;
import java.util.List;

public class WebUserProfileRegistry {

    private static final Log log = Log.getLog(WebUserProfileRegistry.class);

    public static final String EXTENSION_ID = "io.cloudbeaver.userProfile"; //$NON-NLS-1$

    private static WebUserProfileRegistry instance = null;
    private final List<DBPPropertyDescriptor> properties = new ArrayList<>();

    public synchronized static WebUserProfileRegistry getInstance() {
        if (instance == null) {
            instance = new WebUserProfileRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private WebUserProfileRegistry() {
    }

    public List<DBPPropertyDescriptor> getProperties() {
        return properties;
    }

    private void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(EXTENSION_ID);
        for (IConfigurationElement ext : extConfigs) {
            if (ext.getName().equals("userProfileProperties")) {
                for (IConfigurationElement propGroup : ArrayUtils.safeArray(ext.getChildren(PropertyDescriptor.TAG_PROPERTY_GROUP))) {
                    properties.addAll(PropertyDescriptor.extractProperties(propGroup));
                }
            }
        }
    }

}

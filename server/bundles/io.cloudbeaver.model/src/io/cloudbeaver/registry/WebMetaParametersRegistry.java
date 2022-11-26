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
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.utils.ArrayUtils;

import java.util.ArrayList;
import java.util.List;

public class WebMetaParametersRegistry {

    private static final Log log = Log.getLog(WebMetaParametersRegistry.class);

    public static final String EXTENSION_ID = "io.cloudbeaver.metaParameters"; //$NON-NLS-1$

    private static WebMetaParametersRegistry instance = null;
    private final List<DBPPropertyDescriptor> userParameters = new ArrayList<>();
    private final List<DBPPropertyDescriptor> teamParameters = new ArrayList<>();

    public synchronized static WebMetaParametersRegistry getInstance() {
        if (instance == null) {
            instance = new WebMetaParametersRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private WebMetaParametersRegistry() {
    }

    public List<DBPPropertyDescriptor> getUserParameters() {
        return userParameters;
    }

    public List<DBPPropertyDescriptor> getTeamParameters() {
        return teamParameters;
    }

    public List<DBPPropertyDescriptor> getMetaParameters(SMSubjectType subjectType) {
        return subjectType == SMSubjectType.user ? userParameters : teamParameters;
    }

    private void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(EXTENSION_ID);
        for (IConfigurationElement ext : extConfigs) {
            if (ext.getName().equals("metaParameters")) {
                boolean isUser = "user".equals(ext.getAttribute("type"));
                for (IConfigurationElement propGroup : ArrayUtils.safeArray(ext.getChildren(PropertyDescriptor.TAG_PROPERTY_GROUP))) {
                    List<DBPPropertyDescriptor> props = PropertyDescriptor.extractProperties(propGroup);
                    if (isUser) {
                        userParameters.addAll(props);
                    } else {
                        teamParameters.addAll(props);
                    }
                }
            }
        }
    }

}

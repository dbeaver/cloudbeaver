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
import org.eclipse.core.runtime.spi.RegistryContributor;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPNamedObjectLocalized;
import org.jkiss.dbeaver.model.DBPObjectWithDescriptionLocalized;
import org.jkiss.dbeaver.model.impl.PropertyDescriptor;
import org.jkiss.dbeaver.utils.RuntimeUtils;
import org.osgi.framework.Bundle;
import org.osgi.framework.FrameworkUtil;

public class WebAuthProviderProperty extends PropertyDescriptor implements DBPNamedObjectLocalized, DBPObjectWithDescriptionLocalized {
    private final String[] requiredFeatures;
    @Nullable
    private final String type;

    private final Bundle bundle;

    public WebAuthProviderProperty(String category, IConfigurationElement config) {
        super(category, config);
        bundle = FrameworkUtil.getBundle(getClass()).getBundleContext()
            .getBundle(Long.parseLong(((RegistryContributor)config.getContributor()).getActualId()));
        String featuresAttr = config.getAttribute("requiredFeatures");
        this.requiredFeatures = featuresAttr == null ? new String[0] : featuresAttr.split(",");
        this.type = config.getAttribute("type");
    }

    @NotNull
    public String[] getRequiredFeatures() {
        return requiredFeatures;
    }

    @Nullable
    public String getType() {
        return type;
    }

    @Override
    public String getLocalizedName(String locale) {
        try {
            return RuntimeUtils.getBundleLocalization(bundle, locale).getString(this.getId());
        } catch (Exception e) {
            return this.getName();
        }
    }

    @Nullable
    @Override
    public String getLocalizedDescription(String locale) {
        try {
            return RuntimeUtils.getBundleLocalization(bundle, locale).getString(this.getId() + ".description");
        } catch (Exception e) {
            return this.getDescription();
        }
    }
}

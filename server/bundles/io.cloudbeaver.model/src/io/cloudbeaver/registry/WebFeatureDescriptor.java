/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
import io.cloudbeaver.utils.WebAppUtils;
import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.impl.AbstractContextDescriptor;

/**
 * WebFeatureDescriptor
 */
public class WebFeatureDescriptor extends AbstractContextDescriptor implements DBWFeatureSet {

    public static final String EXTENSION_ID = "io.cloudbeaver.feature"; //$NON-NLS-1$

    private final String id;
    private final String label;
    private final String description;
    private final DBPImage icon;

    public WebFeatureDescriptor(IConfigurationElement config)
    {
        super(config);
        this.id = config.getAttribute("id");
        this.label = config.getAttribute("label");
        this.description = config.getAttribute("description");
        this.icon = iconToImage(config.getAttribute("icon"));
    }

    @NotNull
    public String getId() {
        return id;
    }

    @NotNull
    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public DBPImage getIcon() {
        return icon;
    }

    @Override
    public boolean isEnabled() {
        return WebAppUtils.getWebApplication().getAppConfiguration().isFeatureEnabled(this.id);
    }

}

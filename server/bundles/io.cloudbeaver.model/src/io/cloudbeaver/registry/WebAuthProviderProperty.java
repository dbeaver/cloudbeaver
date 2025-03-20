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
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPConditionalProperty;
import org.jkiss.dbeaver.model.impl.LocalizedPropertyDescriptor;

public class WebAuthProviderProperty extends LocalizedPropertyDescriptor implements DBPConditionalProperty {
    private final String[] requiredFeatures;
    @Nullable
    private final String type;

    private final String authProviderId;
    private final String hideExpr;
    private final String readOnlyExpr;

    public WebAuthProviderProperty(String category, IConfigurationElement config, String authProviderId) {
        super(category, config);
        this.authProviderId = authProviderId;
        String featuresAttr = config.getAttribute("requiredFeatures");
        this.requiredFeatures = featuresAttr == null ? new String[0] : featuresAttr.split(",");
        this.type = config.getAttribute("type");
        this.hideExpr = config.getAttribute("hideExpr");
        this.readOnlyExpr = config.getAttribute("readOnlyExpr");
    }

    @NotNull
    public String[] getRequiredFeatures() {
        return requiredFeatures;
    }

    @Nullable
    public String getType() {
        return type;
    }

    @Nullable
    @Override
    public String getHideExpression() {
        return hideExpr;
    }

    @Nullable
    @Override
    public String getReadOnlyExpression() {
        return readOnlyExpr;
    }

    @Override
    public String getPropertyId() {
        if (authProviderId != null) {
            return "prop.auth.model." + authProviderId + "." + this.getId();
        } else {
            return "prop.auth.model." + this.getId();
        }
    }
}

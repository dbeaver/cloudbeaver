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
package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.impl.PropertyGroupDescriptor;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.registry.settings.ProductSettingDescriptor;

public class WebSettingsGroupInfo {
    @NotNull
    private final PropertyGroupDescriptor<ProductSettingDescriptor> groupDescriptor;

    public WebSettingsGroupInfo(@NotNull PropertyGroupDescriptor<ProductSettingDescriptor> groupDescriptor) {
        this.groupDescriptor = groupDescriptor;
    }

    @NotNull
    @Property
    public String getId() {
        return groupDescriptor.getFullId();
    }

    @NotNull
    @Property
    public String getDisplayName() {
        return groupDescriptor.getDisplayName();
    }
}

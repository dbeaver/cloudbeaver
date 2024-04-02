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

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.impl.PropertyGroupDescriptor;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.registry.settings.ProductSettingDescriptor;

import java.util.List;
import java.util.stream.Collectors;

public class WebProductSettings {
    @NotNull
    private final WebSession webSession;
    @NotNull
    private final List<PropertyGroupDescriptor<ProductSettingDescriptor>> groups;

    public WebProductSettings(
        @NotNull WebSession webSession,
        @NotNull List<PropertyGroupDescriptor<ProductSettingDescriptor>> groups
    ) {
        this.webSession = webSession;
        this.groups = groups;
    }

    @NotNull
    @Property
    public List<WebSettingsGroupInfo> getGroups() {
        return groups.stream()
            .map(WebSettingsGroupInfo::new)
            .collect(Collectors.toList());
    }

    @NotNull
    @Property
    public List<WebPropertyInfo> getSettings() {
        return groups.stream()
            .flatMap(group -> group.getSettings().stream())
            .map(setting -> new WebPropertyInfo(webSession, setting))
            .collect(Collectors.toList());
    }
}

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
package io.cloudbeaver.model.user;

import io.cloudbeaver.WebServiceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderDescriptor;
import org.jkiss.dbeaver.model.meta.Property;

public class WebDataSourceDescriptorInfo {

    @NotNull
    private final DBPDataSourceProviderDescriptor descriptor;

    public WebDataSourceDescriptorInfo(@NotNull DBPDataSourceProviderDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    @Property
    public String getName() {
        return descriptor.getName();
    }

    @Property
    public String getIcon() {
        return WebServiceUtils.makeIconId(descriptor.getIcon());
    }
}

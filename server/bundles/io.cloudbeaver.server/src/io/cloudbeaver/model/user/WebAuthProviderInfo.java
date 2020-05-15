/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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

import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderPropertyDescriptor;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;

import java.util.List;

/**
 * WebAuthProviderInfo.
 */
public class WebAuthProviderInfo {

    private static final Log log = Log.getLog(WebAuthProviderInfo.class);

    private final WebAuthProviderDescriptor descriptor;

    public WebAuthProviderInfo(WebAuthProviderDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    public String getId() {
        return descriptor.getId();
    }

    public String getLabel() {
        return descriptor.getLabel();
    }

    public String getIcon() {
        return descriptor.getIcon();
    }

    public String getDescription() {
        return descriptor.getDescription();
    }

    public boolean isDefaultProvider() {
        return descriptor.getId().equals(CBPlatform.getInstance().getApplication().getAppConfiguration().getDefaultAuthProvider());
    }

    public List<WebAuthProviderPropertyDescriptor> getCredentialParameters() {
        return descriptor.getCredentialParameters();
    }

    @Override
    public String toString() {
        return getId();
    }
}

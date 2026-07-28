/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.ai.model;

import io.cloudbeaver.WebServiceUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.AIFunctionDescriptor;

public class WebAIFunctionInfo {

    @NotNull
    private final transient AIFunctionDescriptor descriptor;

    public WebAIFunctionInfo(@NotNull AIFunctionDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    @NotNull
    public String getId() {
        return descriptor.getFullId();
    }

    @NotNull
    public String getName() {
        return descriptor.getName();
    }

    @Nullable
    public String getDescription() {
        return descriptor.getAiDescription();
    }

    public boolean isSystem() {
        return descriptor.isSystem();
    }

    @Nullable
    public String getIcon() {
        return WebServiceUtils.makeIconId(descriptor.getIcon());
    }
}

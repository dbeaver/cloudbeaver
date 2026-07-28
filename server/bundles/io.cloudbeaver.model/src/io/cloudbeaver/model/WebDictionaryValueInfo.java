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
package io.cloudbeaver.model;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.meta.Property;

/**
 * Generic id/name/description dictionary value.
 */
public class WebDictionaryValueInfo {

    @NotNull
    private final String id;
    @NotNull
    private final String name;
    @Nullable
    private final String description;

    public WebDictionaryValueInfo(@NotNull String id, @NotNull String name, @Nullable String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    @Property
    @NotNull
    public String getId() {
        return id;
    }

    @Property
    @NotNull
    public String getName() {
        return name;
    }

    @Property
    @Nullable
    public String getDescription() {
        return description;
    }
}

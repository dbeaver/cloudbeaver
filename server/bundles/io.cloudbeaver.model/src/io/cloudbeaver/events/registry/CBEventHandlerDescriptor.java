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
package io.cloudbeaver.events.registry;

import io.cloudbeaver.events.CBEventHandler;
import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.AbstractDescriptor;

/**
 * CB event handler descriptor
 */
public class CBEventHandlerDescriptor extends AbstractDescriptor {
    private final ObjectType implType;

    protected CBEventHandlerDescriptor(IConfigurationElement contributorConfig) {
        super(contributorConfig);
        this.implType = new ObjectType(contributorConfig, "class");
    }

    @NotNull
    public CBEventHandler getInstance() {
        try {
            return implType.createInstance(CBEventHandler.class);
        } catch (DBException e) {
            throw new IllegalStateException("Can not instantiate event handler '" + implType.getImplName() + "'", e);
        }
    }
}

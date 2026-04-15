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
package io.cloudbeaver.model.rm.local;

import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.AbstractDescriptor;

public class RMDataSourceConfigUpdateHandlerDescriptor extends AbstractDescriptor {
    public static final String EXTENSION_ID = "io.cloudbeaver.rm.datasource.update.handler"; //$NON-NLS-1$

    private final RMDataSourceConfigUpdateHandler instance;

    public RMDataSourceConfigUpdateHandlerDescriptor(IConfigurationElement config) throws DBException {
        super(config);
        ObjectType implClass = new ObjectType(config.getAttribute("class"));
        this.instance = implClass.createInstance(RMDataSourceConfigUpdateHandler.class);
    }

    public RMDataSourceConfigUpdateHandler getInstance() {
        return instance;
    }
}

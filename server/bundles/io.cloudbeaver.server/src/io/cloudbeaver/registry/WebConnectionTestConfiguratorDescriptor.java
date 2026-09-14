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
package io.cloudbeaver.registry;

import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.AbstractDescriptor;
import org.jkiss.dbeaver.model.meta.ForTest;

public class WebConnectionTestConfiguratorDescriptor extends AbstractDescriptor {
    public static final String EXTENSION_ID = "io.cloudbeaver.connectionTestConfigurator";

    private final String id;
    private final ObjectType implementationType;
    private DBWConnectionTestConfigurator instance;

    public WebConnectionTestConfiguratorDescriptor(@NotNull IConfigurationElement configuration) {
        super(configuration);
        this.id = configuration.getAttribute("id");
        this.implementationType = new ObjectType(configuration.getAttribute("class"));
    }

    @ForTest
    public WebConnectionTestConfiguratorDescriptor(
        @NotNull String id,
        @NotNull DBWConnectionTestConfigurator instance
    ) {
        super(id);
        this.id = id;
        this.instance = instance;
        this.implementationType = null;
    }

    @NotNull
    public String getId() {
        return id;
    }

    @NotNull
    public synchronized DBWConnectionTestConfigurator getInstance() throws DBException {
        if (instance == null) {
            instance = implementationType.createInstance(DBWConnectionTestConfigurator.class);
        }
        return instance;
    }
}

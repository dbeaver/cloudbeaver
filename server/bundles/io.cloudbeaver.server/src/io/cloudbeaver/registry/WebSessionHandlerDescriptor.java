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

package io.cloudbeaver.registry;

import io.cloudbeaver.service.DBWSessionHandler;
import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.AbstractContextDescriptor;

/**
 * WebServletHandlerDescriptor
 */
public class WebSessionHandlerDescriptor extends AbstractContextDescriptor {

    public static final String EXTENSION_ID = "io.cloudbeaver.servlet.handler"; //$NON-NLS-1$

    private final String id;
    private final DBWSessionHandler instance;

    public WebSessionHandlerDescriptor(IConfigurationElement config) throws DBException {
        super(config);
        this.id = config.getAttribute("id");
        ObjectType implClass = new ObjectType(config.getAttribute("class"));
        this.instance = implClass.createInstance(DBWSessionHandler.class);
    }

    @NotNull
    public String getId() {
        return id;
    }

    public DBWSessionHandler getInstance() {
        return instance;
    }

}

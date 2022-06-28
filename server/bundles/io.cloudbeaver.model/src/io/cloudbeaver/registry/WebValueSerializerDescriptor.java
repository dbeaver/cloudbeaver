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

import io.cloudbeaver.service.sql.DBWValueSerializer;
import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.impl.AbstractDescriptor;

/**
 * Value serializer descriptor
 */
public class WebValueSerializerDescriptor extends AbstractDescriptor {

    public static final String EXTENSION_ID = "io.cloudbeaver.valueSerializer"; //$NON-NLS-1$

    private final IConfigurationElement cfg;

    private final String valueType;
    private final ObjectType implType;

    public WebValueSerializerDescriptor(IConfigurationElement cfg) {
        super(cfg);
        this.cfg = cfg;
        this.valueType = cfg.getAttribute("type");
        this.implType = new ObjectType(cfg, "class");
    }

    @NotNull
    public String getValueType() {
        return valueType;
    }

    public DBWValueSerializer<?> createInstance() throws DBException {
        return implType.createInstance(DBWValueSerializer.class);
    }

}

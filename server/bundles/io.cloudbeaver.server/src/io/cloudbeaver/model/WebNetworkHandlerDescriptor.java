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
package io.cloudbeaver.model;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.model.net.DBWHandlerType;
import org.jkiss.dbeaver.registry.network.NetworkHandlerDescriptor;

import java.util.Arrays;

/**
 * Web network handler info
 */
public class WebNetworkHandlerDescriptor {

    private final WebSession session;
    private final NetworkHandlerDescriptor descriptor;

    public WebNetworkHandlerDescriptor(WebSession session, NetworkHandlerDescriptor descriptor) {
        this.session = session;
        this.descriptor = descriptor;
    }

    public String getId() {
        return descriptor.getId();
    }

    public String getCodeName() {
        return descriptor.getCodeName();
    }

    public String getLabel() {
        return descriptor.getLabel();
    }

    public String getDescription() {
        return descriptor.getDescription();
    }

    public boolean isSecured() {
        return descriptor.isSecured();
    }

    public DBWHandlerType getType() {
        return descriptor.getType();
    }

    public WebPropertyInfo[] getProperties() {
        return Arrays.stream(descriptor.getHandlerProperties())
            .map(p -> new WebPropertyInfo(session, p, null)).toArray(WebPropertyInfo[]::new);
    }

}

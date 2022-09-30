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
import org.eclipse.core.runtime.Platform;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CBEventHandlersRegistry {
    private static final String EXTENSION_ID = "io.cloudbeaver.event.handler";
    private static final String EVENT_HANDLER_TAG = "eventHandler";
    private static CBEventHandlersRegistry instance = null;

    public synchronized static CBEventHandlersRegistry getInstance() {
        if (instance == null) {
            instance = new CBEventHandlersRegistry();
        }
        return instance;
    }

    public List<CBEventHandler> getEventHandlers() {
        List<CBEventHandlerDescriptor> eventHandlerDescriptors = readDescriptors();

        return eventHandlerDescriptors.stream()
            .map(CBEventHandlerDescriptor::getInstance)
            .collect(Collectors.toList());

    }

    private List<CBEventHandlerDescriptor> readDescriptors() {
        var result = new ArrayList<CBEventHandlerDescriptor>();
        var registry = Platform.getExtensionRegistry();
        for (IConfigurationElement ext : registry.getConfigurationElementsFor(EXTENSION_ID)) {
            // Load webServices
            if (EVENT_HANDLER_TAG.equals(ext.getName())) {
                result.add(new CBEventHandlerDescriptor(ext));
            }
        }
        return result;
    }
}

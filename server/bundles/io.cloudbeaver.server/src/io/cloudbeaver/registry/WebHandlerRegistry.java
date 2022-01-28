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

import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;

public class WebHandlerRegistry {

    private static final Log log = Log.getLog(WebHandlerRegistry.class);

    private static final String TAG_SERVLET_HANDLER = "servletHandler"; //$NON-NLS-1$
    private static final String TAG_SESSION_HANDLER = "sessionHandler"; //$NON-NLS-1$

    private static WebHandlerRegistry instance = null;

    public synchronized static WebHandlerRegistry getInstance() {
        if (instance == null) {
            instance = new WebHandlerRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private final List<WebServletHandlerDescriptor> servletHandlers = new ArrayList<>();
    private final List<WebSessionHandlerDescriptor> sessionHandlers = new ArrayList<>();

    private WebHandlerRegistry() {
    }

    private void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(WebServletHandlerDescriptor.EXTENSION_ID);
        for (IConfigurationElement ext : extConfigs) {
            try {
                if (TAG_SERVLET_HANDLER.equals(ext.getName())) {
                    this.servletHandlers.add(
                        new WebServletHandlerDescriptor(ext));
                } else if (TAG_SESSION_HANDLER.equals(ext.getName())) {
                    this.sessionHandlers.add(
                        new WebSessionHandlerDescriptor(ext));
                }
            } catch (DBException e) {
                log.error("Error loading servlet handler", e);
            }
        }
    }

    public List<WebServletHandlerDescriptor> getServletHandlers() {
        return servletHandlers;
    }

    public List<WebSessionHandlerDescriptor> getSessionHandlers() {
        return sessionHandlers;
    }
}

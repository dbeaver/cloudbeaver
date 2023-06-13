/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;

import java.util.ArrayList;
import java.util.List;

public class RMFileOperationHandlersRegistry {
    private static final Log log = Log.getLog(RMFileOperationHandlersRegistry.class);

    private static final String TAG_FILE_HANDLER = "rmFileHandler"; //$NON-NLS-1$

    private static RMFileOperationHandlersRegistry instance = null;
    private final List<RMFileOperationHandlerDescriptor> fileHandlers = new ArrayList<>();


    public synchronized static RMFileOperationHandlersRegistry getInstance() {
        if (instance == null) {
            instance = new RMFileOperationHandlersRegistry();
            instance.loadExtensions(Platform.getExtensionRegistry());
        }
        return instance;
    }

    private void loadExtensions(IExtensionRegistry registry) {
        IConfigurationElement[] extConfigs = registry.getConfigurationElementsFor(RMFileOperationHandlerDescriptor.EXTENSION_ID);
        for (IConfigurationElement ext : extConfigs) {
            try {
                if (TAG_FILE_HANDLER.equals(ext.getName())) {
                    this.fileHandlers.add(
                        new RMFileOperationHandlerDescriptor(ext));
                }
            } catch (DBException e) {
                log.error("Error loading servlet handler", e);
            }
        }
    }

    public List<RMFileOperationHandlerDescriptor> getFileHandlers() {
        return fileHandlers;
    }
}

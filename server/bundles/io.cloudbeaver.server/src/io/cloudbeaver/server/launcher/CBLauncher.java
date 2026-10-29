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
package io.cloudbeaver.server.launcher;

import org.eclipse.core.runtime.adaptor.EclipseStarter;
import org.jkiss.dbeaver.model.app.DBPPlatform;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.osgi.framework.BundleContext;

import java.util.HashMap;
import java.util.Map;

/**
 * The activator class controls the plug-in life cycle
 */
public class CBLauncher {

    public static DBPPlatform instantiatePlatform() throws Exception {
        Map<String, String> props = new HashMap<>();

        EclipseStarter.setInitialProperties(props);
        EclipseStarter.startup(
            new String[]{},
            null);

        return DBWorkbench.getPlatform();
    }

    public static void main(String[] args) throws Exception {

        Map<String, String> props = new HashMap<>();

        EclipseStarter.setInitialProperties(props);
        BundleContext context = EclipseStarter.startup(
            new String[]{},
            null);
        //context.getBundles()
    }

}

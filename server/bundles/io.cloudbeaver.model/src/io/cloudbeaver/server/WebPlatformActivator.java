/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
package io.cloudbeaver.server;

import org.eclipse.core.runtime.Plugin;
import org.jkiss.dbeaver.ModelPreferences;
import org.jkiss.dbeaver.model.impl.preferences.BundlePreferenceStore;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;

import java.io.PrintStream;

/**
 * The activator class controls the plug-in life cycle
 */
public class WebPlatformActivator extends Plugin {

    // The shared instance
    private static WebPlatformActivator instance;
    private PrintStream debugWriter;
    private DBPPreferenceStore preferences;

    public WebPlatformActivator() {
    }

    public static WebPlatformActivator getInstance() {
        return instance;
    }

    @Override
    public void start(BundleContext context)
        throws Exception {
        super.start(context);

        instance = this;

        Bundle bundle = getBundle();
        ModelPreferences.setMainBundle(bundle);
        preferences = new BundlePreferenceStore(bundle);
    }

    @Override
    public void stop(BundleContext context)
        throws Exception {
        this.shutdownPlatform();

        if (debugWriter != null) {
            debugWriter.close();
            debugWriter = null;
        }
        instance = null;

        super.stop(context);
    }

    public DBPPreferenceStore getPreferences() {
        return preferences;
    }

    protected void shutdownPlatform() {

    }
}

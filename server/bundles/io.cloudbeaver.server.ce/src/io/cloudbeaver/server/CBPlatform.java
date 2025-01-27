/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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

import io.cloudbeaver.server.jobs.SessionStateJob;
import io.cloudbeaver.server.jobs.WebDataSourceMonitorJob;
import io.cloudbeaver.server.jobs.WebSessionMonitorJob;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.impl.app.BaseApplicationImpl;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.IOUtils;

import java.io.IOException;

/**
 * CBPlatform
 */
public class CBPlatform extends BaseWebPlatform {

    // The plug-in ID
    public static final String PLUGIN_ID = "io.cloudbeaver.server"; //$NON-NLS-1$

    private static final Log log = Log.getLog(CBPlatform.class);

    private WebServerPreferenceStore preferenceStore;

    public static CBPlatform getInstance() {
        return (CBPlatform) DBWorkbench.getPlatform();
    }

    protected CBPlatform() {
    }

    @Override
    protected synchronized void initialize() {
        long startTime = System.currentTimeMillis();
        log.info("Initialize web platform...: ");
        this.preferenceStore = new WebServerPreferenceStore(WebPlatformActivator.getInstance().getPreferences());
        super.initialize();
        scheduleServerJobs();
        log.info("Web platform initialized (" + (System.currentTimeMillis() - startTime) + "ms)");
    }

    protected void scheduleServerJobs() {
        super.scheduleServerJobs();
        new WebSessionMonitorJob(this, getApplication().getSessionManager())
            .scheduleMonitor();

        new SessionStateJob(this, getApplication().getSessionManager())
            .scheduleMonitor();

        new WebDataSourceMonitorJob(this, getApplication().getSessionManager())
            .scheduleMonitor();

        new AbstractJob("Delete temp folder") {
            @Override
            protected IStatus run(DBRProgressMonitor monitor) {
                try {
                    IOUtils.deleteDirectory(getTempFolder(monitor, TEMP_FILE_FOLDER));
                    IOUtils.deleteDirectory(getTempFolder(monitor, TEMP_FILE_IMPORT_FOLDER));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
                return Status.OK_STATUS;
            }
        }.schedule();
    }

    public synchronized void dispose() {
        long startTime = System.currentTimeMillis();
        log.debug("Shutdown Core...");

        super.dispose();

        System.gc();
        log.debug("Shutdown completed in " + (System.currentTimeMillis() - startTime) + "ms");
    }

    @NotNull
    @Override
    public CBApplication<?> getApplication() {
        return (CBApplication) BaseApplicationImpl.getInstance();
    }


    @NotNull
    @Override
    public DBPPreferenceStore getPreferenceStore() {
        return preferenceStore;
    }

    @Override
    public boolean isShuttingDown() {
        return false;
    }

}

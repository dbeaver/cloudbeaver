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

import io.cloudbeaver.auth.NoAuthCredentialsProvider;
import io.cloudbeaver.server.jobs.SessionStateJob;
import io.cloudbeaver.server.jobs.WebDataSourceMonitorJob;
import io.cloudbeaver.server.jobs.WebSessionMonitorJob;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBFileController;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderDescriptor;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverLibrary;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.runtime.AbstractJob;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CBPlatform
 */
public class CBPlatform extends BaseWebPlatform {

    // The plug-in ID
    public static final String PLUGIN_ID = "io.cloudbeaver.server"; //$NON-NLS-1$

    private static final Log log = Log.getLog(CBPlatform.class);

    @Nullable
    private static CBApplication<?> application = null;

    private WebServerPreferenceStore preferenceStore;
    protected final List<DBPDriver> applicableDrivers = new ArrayList<>();

    public static CBPlatform getInstance() {
        return (CBPlatform) DBWorkbench.getPlatform();
    }

    protected CBPlatform() {
    }

    public static void setApplication(@NotNull CBApplication<?> application) {
        CBPlatform.application = application;
    }

    @Override
    protected synchronized void initialize() {
        long startTime = System.currentTimeMillis();
        log.info("Initialize web platform...: ");
        this.preferenceStore = new WebServerPreferenceStore(WebPlatformActivator.getInstance().getPreferences());
        super.initialize();
        refreshApplicableDrivers();

        scheduleServerJobs();
        log.info("Web platform initialized (" + (System.currentTimeMillis() - startTime) + "ms)");
    }

    protected void scheduleServerJobs() {
        super.scheduleServerJobs();
        new WebSessionMonitorJob(this, application.getSessionManager())
            .scheduleMonitor();

        new SessionStateJob(this, application.getSessionManager())
            .scheduleMonitor();

        new WebDataSourceMonitorJob(this, application.getSessionManager())
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

        CBPlatform.application = null;
        System.gc();
        log.debug("Shutdown completed in " + (System.currentTimeMillis() - startTime) + "ms");
    }

    @NotNull
    @Override
    public CBApplication<?> getApplication() {
        return application;
    }

    public List<DBPDriver> getApplicableDrivers() {
        return applicableDrivers;
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

    public void refreshApplicableDrivers() {
        this.applicableDrivers.clear();

        for (DBPDataSourceProviderDescriptor dspd : DataSourceProviderRegistry.getInstance().getEnabledDataSourceProviders()) {
            for (DBPDriver driver : dspd.getEnabledDrivers()) {
                List<? extends DBPDriverLibrary> libraries = driver.getDriverLibraries();
                {
                    if (!application.getDriverRegistry().isDriverEnabled(driver)) {
                        continue;
                    }
                    boolean hasAllFiles = true, hasJars = false;
                    for (DBPDriverLibrary lib : libraries) {
                        if (!DBWorkbench.isDistributed() && !lib.isOptional() && lib.getType() != DBPDriverLibrary.FileType.license &&
                            (lib.getLocalFile() == null || !Files.exists(lib.getLocalFile())))
                        {
                            hasAllFiles = false;
                            log.error("\tDriver '" + driver.getId() + "' is missing library '" + lib.getDisplayName() + "'");
                        } else {
                            if (lib.getType() == DBPDriverLibrary.FileType.jar) {
                                hasJars = true;
                            }
                        }
                    }
                    if (hasAllFiles || hasJars) {
                        applicableDrivers.add(driver);
                    }
                }
            }
        }
        log.info("Available drivers: " + applicableDrivers.stream().map(DBPDriver::getFullName).collect(Collectors.joining(",")));
    }

    @NotNull
    @Override
    public DBFileController createFileController() {
        return getApplication().createFileController(new NoAuthCredentialsProvider());
    }
}

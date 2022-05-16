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

package io.cloudbeaver.server;

import io.cloudbeaver.registry.WebDriverRegistry;
import io.cloudbeaver.service.session.WebSessionManager;
import org.eclipse.core.resources.ResourcesPlugin;
import org.eclipse.core.runtime.Platform;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPExternalFileManager;
import org.jkiss.dbeaver.model.app.DBACertificateStorage;
import org.jkiss.dbeaver.model.app.DBASecureStorage;
import org.jkiss.dbeaver.model.app.DBPResourceHandler;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderDescriptor;
import org.jkiss.dbeaver.model.connection.DBPDataSourceProviderRegistry;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.connection.DBPDriverLibrary;
import org.jkiss.dbeaver.model.impl.app.DefaultCertificateStorage;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.qm.QMController;
import org.jkiss.dbeaver.model.qm.QMUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.registry.BasePlatformImpl;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.runtime.SecurityProviderUtils;
import org.jkiss.dbeaver.runtime.qm.QMControllerImpl;
import org.jkiss.dbeaver.runtime.qm.QMLogFileWriter;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.osgi.framework.Bundle;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CBPlatform
 */
public class CBPlatform extends BasePlatformImpl {

    // The plug-in ID
    public static final String PLUGIN_ID = "io.cloudbeaver.server"; //$NON-NLS-1$

    private static final Log log = Log.getLog(CBPlatform.class);

    public static final String WORK_DATA_FOLDER_NAME = ".work-data";

    static CBPlatform instance;

    @Nullable
    private static CBApplication application = null;

    private Path tempFolder;

    private QMControllerImpl queryManager;
    private QMLogFileWriter qmLogWriter;
    private DBACertificateStorage certificateStorage;
    private WebWorkspace workspace;

    private WebSessionManager sessionManager;
    private final List<DBPDriver> applicableDrivers = new ArrayList<>();

    public static CBPlatform getInstance() {
        if (instance == null) {
            synchronized (CBPlatform.class) {
                if (instance == null) {
                    // Initialize CB platform
                    CBPlatform.createInstance();
                }
            }
        }
        return instance;
    }

    private static CBPlatform createInstance() {
        log.debug("Initializing product: " + GeneralUtils.getProductTitle());
        if (Platform.getProduct() != null) {
            Bundle definingBundle = Platform.getProduct().getDefiningBundle();
            if (definingBundle != null) {
                log.debug("Host plugin: " + definingBundle.getSymbolicName() + " " + definingBundle.getVersion());
            } else {
                log.debug("!!! No product bundle found");
            }
        }

        try {
            instance = new CBPlatform();
            instance.initialize();
            return instance;
        } catch (Throwable e) {
            log.error("Error initializing CBPlatform", e);
            throw new IllegalStateException("Error initializing CBPlatform", e);
        }
    }

    public static DBPPreferenceStore getGlobalPreferenceStore() {
        return WebPlatformActivator.getInstance().getPreferences();
    }

    private CBPlatform() {
    }

    public static void setApplication(CBApplication application) {
        CBPlatform.application = application;
    }

    @Override
    protected void initialize() {
        long startTime = System.currentTimeMillis();
        log.info("Initialize web platform...");

        // Register BC security provider
        SecurityProviderUtils.registerSecurityProvider();

        // Register properties adapter
        this.workspace = new WebWorkspace(this, ResourcesPlugin.getWorkspace());
        this.workspace.initializeProjects();

        QMUtils.initApplication(this);
        this.queryManager = new QMControllerImpl();

        this.qmLogWriter = new QMLogFileWriter();
        this.queryManager.registerMetaListener(qmLogWriter);

        this.certificateStorage = new DefaultCertificateStorage(
            new File(WebPlatformActivator.getInstance().getStateLocation().toFile(), "security"));

        super.initialize();

        refreshApplicableDrivers();

        sessionManager = WebSessionManager.getInstance();

        new WebSessionMonitorJob(this).scheduleMonitor();

        log.info("Web platform initialized (" + (System.currentTimeMillis() - startTime) + "ms)");
    }

    public synchronized void dispose() {
        long startTime = System.currentTimeMillis();
        log.debug("Shutdown Core...");

        super.dispose();

        if (this.qmLogWriter != null) {
            this.queryManager.unregisterMetaListener(qmLogWriter);
            this.qmLogWriter.dispose();
            this.qmLogWriter = null;
        }
        if (this.queryManager != null) {
            this.queryManager.dispose();
            //queryManager = null;
        }
        DataSourceProviderRegistry.getInstance().dispose();

        if (workspace != null) {
            try {
                workspace.save(new VoidProgressMonitor());
            } catch (DBException ex) {
                log.error("Can't save workspace", ex); //$NON-NLS-1$
            }
        }

        // Remove temp folder
        if (tempFolder != null) {

            if (!ContentUtils.deleteFileRecursive(tempFolder.toFile())) {
                log.warn("Can't delete temp folder '" + tempFolder.toAbsolutePath() + "'");
            }
            tempFolder = null;
        }

        CBPlatform.application = null;
        CBPlatform.instance = null;
        System.gc();
        log.debug("Shutdown completed in " + (System.currentTimeMillis() - startTime) + "ms");
    }

    @NotNull
    @Override
    public DBPWorkspace getWorkspace() {
        return workspace;
    }

    @NotNull
    @Override
    public DBPResourceHandler getDefaultResourceHandler() {
        return CBResourceHandler.INSTANCE;
    }

    @NotNull
    @Override
    public CBApplication getApplication() {
        return application;
    }

    public List<DBPDriver> getApplicableDrivers() {
        return applicableDrivers;
    }

    @NotNull
    @Override
    public DBPDataSourceProviderRegistry getDataSourceProviderRegistry() {
        return DataSourceProviderRegistry.getInstance();
    }

    @NotNull
    public QMController getQueryManager() {
        return queryManager;
    }

    @NotNull
    @Override
    public DBPPreferenceStore getPreferenceStore() {
        return WebPlatformActivator.getInstance().getPreferences();
    }

    @NotNull
    @Override
    public DBACertificateStorage getCertificateStorage() {
        return certificateStorage;
    }

    @NotNull
    @Override
    public DBASecureStorage getSecureStorage() {
        return application.getSecureStorage();
    }

    @NotNull
    @Override
    public DBPExternalFileManager getExternalFileManager() {
        return workspace;
    }

    @NotNull
    public File getTempFolder(DBRProgressMonitor monitor, String name) {
        if (tempFolder == null) {
            // Make temp folder
            monitor.subTask("Create temp folder");
            tempFolder = workspace.getAbsolutePath().resolve(WORK_DATA_FOLDER_NAME);
        }
        if (!Files.exists(tempFolder)) {
            try {
                Files.createDirectories(tempFolder);
            } catch (IOException e) {
                log.error("Can't create temp directory " + tempFolder, e);
            }
        }
        Path folder = tempFolder.resolve(name);
        if (!Files.exists(folder)) {
            try {
                Files.createDirectories(folder);
            } catch (IOException e) {
                log.error("Error creating temp folder '" + folder.toAbsolutePath() + "'", e);
            }
        }
        return folder.toFile();
    }

    @NotNull
    @Override
    public File getConfigurationFile(String fileName) {
        return WebPlatformActivator.getConfigurationFile(fileName);
    }

    @Override
    public boolean isShuttingDown() {
        return false;
    }

    public WebSessionManager getSessionManager() {
        return sessionManager;
    }

    public void refreshApplicableDrivers() {
        this.applicableDrivers.clear();

        for (DBPDataSourceProviderDescriptor dspd : DataSourceProviderRegistry.getInstance().getEnabledDataSourceProviders()) {
            for (DBPDriver driver : dspd.getEnabledDrivers()) {
                List<? extends DBPDriverLibrary> libraries = driver.getDriverLibraries();
                {
                    if (!WebDriverRegistry.getInstance().isDriverEnabled(driver)) {
                        continue;
                    }
                    boolean hasAllFiles = true;
                    for (DBPDriverLibrary lib : libraries) {
                        if (!lib.isOptional() && lib.getType() != DBPDriverLibrary.FileType.license &&
                            (lib.getLocalFile() == null || !lib.getLocalFile().exists())) {
                            hasAllFiles = false;
                            log.error("\tDriver '" + driver.getId() + "' is missing library '" + lib.getDisplayName() + "'");
                            break;
                        }
                    }
                    if (hasAllFiles) {
                        applicableDrivers.add(driver);
                    }
                }
            }
        }
        log.info("Available drivers: " + applicableDrivers.stream().map(DBPDriver::getFullName).collect(Collectors.joining(",")));
    }

}

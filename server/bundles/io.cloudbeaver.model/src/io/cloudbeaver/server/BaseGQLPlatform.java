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

import io.cloudbeaver.DBWConstants;
import org.eclipse.core.runtime.Plugin;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.app.DBACertificateStorage;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.impl.app.DefaultCertificateStorage;
import org.jkiss.dbeaver.model.qm.QMRegistry;
import org.jkiss.dbeaver.model.qm.QMUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.BasePlatformImpl;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.runtime.SecurityProviderUtils;
import org.jkiss.dbeaver.runtime.qm.QMLogFileWriter;
import org.jkiss.dbeaver.runtime.qm.QMRegistryImpl;
import org.jkiss.dbeaver.utils.ContentUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public abstract class BaseGQLPlatform extends BasePlatformImpl {
    private static final Log log = Log.getLog(BaseGQLPlatform.class);
    public static final String WORK_DATA_FOLDER_NAME = ".work-data";

    private Path tempFolder;

    private QMRegistryImpl queryManager;
    private QMLogFileWriter qmLogWriter;
    private DBACertificateStorage certificateStorage;
    private WebGlobalWorkspace workspace;

    @Override
    protected synchronized void initialize() {
        // Register BC security provider
        SecurityProviderUtils.registerSecurityProvider();

        // Register properties adapter
        this.workspace = new WebGlobalWorkspace(this);
        this.workspace.initializeProjects();
        QMUtils.initApplication(this);

        this.queryManager = new QMRegistryImpl();

        this.qmLogWriter = new QMLogFileWriter();
        this.queryManager.registerMetaListener(qmLogWriter);

        this.certificateStorage = new DefaultCertificateStorage(
            WebPlatformActivator.getInstance()
                .getStateLocation()
                .toFile()
                .toPath()
                .resolve(DBConstants.CERTIFICATE_STORAGE_FOLDER));
        super.initialize();
    }

    @Override
    protected Plugin getProductPlugin() {
        return WebPlatformActivator.getInstance();
    }
    
    @NotNull
    @Override
    public DBACertificateStorage getCertificateStorage() {
        return certificateStorage;
    }

    @NotNull
    @Override
    public DBPWorkspace getWorkspace() {
        return workspace;
    }

    @NotNull
    public Path getTempFolder(@NotNull DBRProgressMonitor monitor, @NotNull String name) {
        if (tempFolder == null) {
            // Make temp folder
            monitor.subTask("Create temp folder");
            tempFolder = workspace.getAbsolutePath().resolve(DBWConstants.WORK_DATA_FOLDER_NAME);
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
        return folder;
    }

    @Override
    public synchronized void dispose() {
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
        DataSourceProviderRegistry.dispose();

        // Remove temp folder
        if (tempFolder != null) {

            if (!ContentUtils.deleteFileRecursive(tempFolder.toFile())) {
                log.warn("Can't delete temp folder '" + tempFolder.toAbsolutePath() + "'");
            }
            tempFolder = null;
        }
    }

    @NotNull
    public QMRegistry getQueryManager() {
        return queryManager;
    }

}

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
package io.cloudbeaver.server;

import io.cloudbeaver.server.websockets.WebSocketPingPongJob;
import org.eclipse.core.runtime.Plugin;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.app.DBACertificateStorage;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.impl.app.DefaultCertificateStorage;
import org.jkiss.dbeaver.model.qm.QMUtils;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.runtime.SecurityProviderUtils;

public abstract class BaseWebPlatform extends BaseServletPlatform {
    public static final String TEMP_FILE_FOLDER = "temp-sql-upload-files";
    public static final String TEMP_FILE_IMPORT_FOLDER = "temp-import-files";

    private DBACertificateStorage certificateStorage;
    private ServerGlobalWorkspace workspace;

    @Override
    protected synchronized void initialize() throws DBException {
        // Register BC security provider
        SecurityProviderUtils.registerSecurityProvider();

        // Register properties adapter
        getApplication().beforeWorkspaceInitialization();
        this.workspace = new ServerGlobalWorkspace(this, getApplication());
        this.workspace.initializeProjects();

        QMUtils.initPlatform(true);

        this.certificateStorage = new DefaultCertificateStorage(
            this,
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
    public abstract WebApplication getApplication();

    protected void scheduleServerJobs() {
        new WebSocketPingPongJob(WebAppUtils.getWebPlatform()).scheduleMonitor();
    }

    @Override
    public synchronized void dispose() {
        super.dispose();
        QMUtils.disposePlatform();
        DataSourceProviderRegistry.dispose();
    }

}

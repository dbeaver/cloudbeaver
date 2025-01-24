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
package io.cloudbeaver;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.app.DBPDataSourceRegistry;
import org.jkiss.dbeaver.model.app.DBPWorkspace;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.preferences.DBPPreferenceStore;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.task.DBTTaskManager;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.registry.rm.DataSourceRegistryRM;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.nio.file.Path;

public abstract class WebProjectImpl extends BaseWebProjectImpl {
    private static final Log log = Log.getLog(WebProjectImpl.class);
    @NotNull
    protected final DBPPreferenceStore preferenceStore;

    public WebProjectImpl(
        @NotNull DBPWorkspace workspace,
        @NotNull RMController resourceController,
        @NotNull SMSessionContext sessionContext,
        @NotNull RMProject project,
        @NotNull DBPPreferenceStore preferenceStore,
        @NotNull Path path
    ) {
        super(workspace, resourceController, sessionContext, project, path);
        this.preferenceStore = preferenceStore;
    }

    @Nullable
    @Override
    public Object getProjectProperty(String propName) {
        try {
            return getResourceController().getProjectProperty(getId(), propName);
        } catch (DBException e) {
            log.error("Cannot get project property", e);
            return null;
        }
    }

    @Override
    public void setProjectProperty(@NotNull String propName, @Nullable Object propValue) {
        try {
            getResourceController().setProjectProperty(getId(), propName, propValue);
        } catch (DBException e) {
            log.error("Cannot set project property", e);
        }
    }

    @Override
    public boolean isUseSecretStorage() {
        return DBWorkbench.isDistributed();
    }

    @NotNull
    @Override
    public DBTTaskManager getTaskManager() {
        throw new IllegalStateException("Task manager not supported");
    }

    @NotNull
    @Override
    protected DBPDataSourceRegistry createDataSourceRegistry() {
        return createRMRegistry();
    }

    @NotNull
    protected DataSourceRegistry<?> createRMRegistry() {
        return new DataSourceRegistryRM<>(this, getResourceController(), preferenceStore);
    }

}

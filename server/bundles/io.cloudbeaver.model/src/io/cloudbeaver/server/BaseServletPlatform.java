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

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.app.ServletApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.registry.BasePlatformImpl;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.StandardConstants;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public abstract class BaseServletPlatform extends BasePlatformImpl {
    private static final Log log = Log.getLog(BaseServletPlatform.class);
    public static final String BASE_TEMP_DIR = "dbeaver";

    protected volatile Path tempFolder;

    @NotNull
    public Path getTempFolder(@NotNull DBRProgressMonitor monitor, @NotNull String name) {
        if (tempFolder == null) {
            synchronized (this) {
                if (tempFolder == null) {
                    initTempFolder(monitor);
                }
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

    public abstract ServletApplication getApplication();

    private void initTempFolder(@NotNull DBRProgressMonitor monitor) {
        // Make temp folder
        monitor.subTask("Create temp folder");
        String sysTempFolder = System.getProperty(StandardConstants.ENV_TMP_DIR);
        if (CommonUtils.isNotEmpty(sysTempFolder)) {
            tempFolder = Path.of(sysTempFolder).resolve(BASE_TEMP_DIR).resolve(DBWConstants.WORK_DATA_FOLDER_NAME);
        } else {
            //we do not use workspace because it can be in external file system
            tempFolder = getApplication().getHomeDirectory().resolve(DBWConstants.WORK_DATA_FOLDER_NAME);
        }
    }

    public synchronized void dispose() {
        // Remove temp folder
        if (tempFolder != null) {

            if (!ContentUtils.deleteFileRecursive(tempFolder.toFile())) {
                log.warn("Can't delete temp folder '" + tempFolder.toAbsolutePath() + "'");
            }
            tempFolder = null;
        }
    }

}

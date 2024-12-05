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
package io.cloudbeaver.server.events;

import io.cloudbeaver.server.BaseWebPlatform;
import io.cloudbeaver.server.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.websocket.WSEventHandler;
import org.jkiss.dbeaver.model.websocket.event.WSEventDeleteTempFile;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class WSDeleteTempFileHandler implements WSEventHandler<WSEventDeleteTempFile> {

    private static final Log log = Log.getLog(WSDeleteTempFileHandler.class);

    public void resetTempFolder(String sessionId) {
        Path path = WebAppUtils.getWebPlatform()
            .getTempFolder(new VoidProgressMonitor(), BaseWebPlatform.TEMP_FILE_FOLDER)
            .resolve(sessionId);
        if (Files.exists(path)) {
            try {
                IOUtils.deleteDirectory(path);
            } catch (IOException e) {
                log.error("Error deleting temp path", e);
            }
        }
        path = WebAppUtils.getWebPlatform()
            .getTempFolder(new VoidProgressMonitor(), BaseWebPlatform.TEMP_FILE_IMPORT_FOLDER)
            .resolve(sessionId);
        if (Files.exists(path)) {
            try {
                IOUtils.deleteDirectory(path);
            } catch (IOException e) {
                log.error("Error deleting temp path", e);
            }
        }
    }

    @Override
    public void handleEvent(@NotNull WSEventDeleteTempFile event) {
        resetTempFolder(event.getSessionId());
    }
}

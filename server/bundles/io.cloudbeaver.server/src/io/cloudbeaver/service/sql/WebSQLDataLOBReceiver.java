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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;


public class WebSQLDataLOBReceiver extends WebSQLCellValueReceiver {
    private static final Log log = Log.getLog(WebSQLDataLOBReceiver.class);
    private static final String DATA_EXPORT_FOLDER_NAME = "sql-lob-files";
    @NotNull
    private final String tableName;
    @NotNull
    private final SessionExportFolder dataExportFolder;

    WebSQLDataLOBReceiver(
        @NotNull WebSession session,
        @NotNull String tableName,
        @NotNull DBSDataContainer dataContainer,
        int rowIndex
    ) {
        super(dataContainer, rowIndex);
        this.tableName = tableName;
        this.dataExportFolder = getSessionExportFolder(session);
    }

    @NotNull
    static Path getDataExportFolder(@NotNull WebSession session) {
        return getSessionExportFolder(session).path;
    }

    @NotNull
    private static SessionExportFolder getSessionExportFolder(@NotNull WebSession session) {
        return session.getAttribute(
            DATA_EXPORT_FOLDER_NAME,
            name -> new SessionExportFolder(WebAppUtils.getWebPlatform()
                .getTempFolder(session.getProgressMonitor(), DATA_EXPORT_FOLDER_NAME)
                .resolve(session.getSessionId())
                .normalize()),
            SessionExportFolder::dispose
        );
    }

    @NotNull
    public String createLobFile(@NotNull DBRProgressMonitor monitor) throws DBCException, IOException {
        String exportFileName = CommonUtils.truncateString(tableName, 32);
        StringBuilder fileName = new StringBuilder(exportFileName);
        fileName.append("_")
            .append(binding.getName())
            .append("_");
        Timestamp ts = new Timestamp(System.currentTimeMillis());
        String s = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(ts);
        fileName.append(s);
        exportFileName = CommonUtils.escapeFileName(fileName.toString());
        byte[] binaryValue = getBinaryValue(monitor);
        dataExportFolder.write(exportFileName, binaryValue);
        return exportFileName;
    }

    private static final class SessionExportFolder {
        private final Path path;
        private boolean disposed;

        private SessionExportFolder(@NotNull Path path) {
            this.path = path;
        }

        private synchronized void write(@NotNull String fileName, @NotNull byte[] value) throws IOException {
            if (disposed) {
                throw new IOException("LOB export session is closed");
            }
            Files.createDirectories(path);
            Files.write(path.resolve(fileName), value);
        }

        private synchronized void dispose() {
            // Prevent an in-flight export from recreating the folder after session cleanup.
            disposed = true;
            if (Files.exists(path)) {
                try {
                    IOUtils.deleteDirectory(path);
                } catch (IOException e) {
                    log.error("Error deleting LOB export folder", e);
                }
            }
        }
    }
}

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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.server.WebAppUtils;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;


public class WebSQLDataLOBReceiver extends WebSQLCellValueReceiver {
    private static final Log log = Log.getLog(WebSQLDataLOBReceiver.class);
    public static final Path DATA_EXPORT_FOLDER = WebAppUtils.getWebPlatform().getTempFolder(new VoidProgressMonitor(), "sql-lob" +
        "-files");
    private final String tableName;

    WebSQLDataLOBReceiver(String tableName, DBSDataContainer dataContainer, int rowIndex) {
        super(dataContainer, rowIndex);
        this.tableName = tableName;
        if (!Files.exists(DATA_EXPORT_FOLDER)) {
            try {
                Files.createDirectories(DATA_EXPORT_FOLDER);
            } catch (IOException e) {
                log.error("Error creating temp folder", e);
            }
        }

    }

    public String createLobFile(DBRProgressMonitor monitor) throws DBCException, IOException {
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
        Path file = WebSQLDataLOBReceiver.DATA_EXPORT_FOLDER.resolve(exportFileName);
        Files.write(file, binaryValue);
        return exportFileName;
    }


}

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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.utils.CommonUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.List;


public class WebSQLDataLOBReceiver implements DBDDataReceiver {
    private static final Log log = Log.getLog(WebSQLDataLOBReceiver.class);
    public static final File DATA_EXPORT_FOLDER = CBPlatform.getInstance().getTempFolder(new VoidProgressMonitor(), "sql-lob-files");

    private final String tableName;
    private final DBSDataContainer dataContainer;

    private DBDAttributeBinding binding;
    private DBDValue lobValue;
    private int rowIndex;

    WebSQLDataLOBReceiver(String tableName, DBSDataContainer dataContainer, int rowIndex) {
        this.tableName = tableName;
        this.dataContainer = dataContainer;
        this.rowIndex = rowIndex;
        if (!DATA_EXPORT_FOLDER.exists()){
            DATA_EXPORT_FOLDER.mkdirs();
        }

    }

    public String createLobFile(DBCSession session) throws DBCException, IOException {
        String exportFileName = CommonUtils.truncateString(tableName, 32);
        StringBuilder fileName = new StringBuilder(exportFileName);
        fileName.append("_")
                .append(binding.getName())
                .append("_");
        Timestamp ts = new Timestamp(System.currentTimeMillis());
        String s = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(ts);
        fileName.append(s);
        exportFileName = CommonUtils.escapeFileName(fileName.toString());
        byte[] binaryValue;
        Number fileSizeLimit = CBApplication.getInstance().getAppConfiguration().getResourceQuota(CBConstants.QUOTA_PROP_FILE_LIMIT);
        if (lobValue instanceof DBDContent) {
            binaryValue = ContentUtils.getContentBinaryValue(session.getProgressMonitor(), (DBDContent) lobValue);
        } else {
            binaryValue = lobValue.getRawValue().toString().getBytes();
        }
        if (binaryValue == null) {
            throw new DBCException("Lob value is null");
        }
        if (binaryValue.length > fileSizeLimit.longValue()) {
            throw new DBQuotaException(
                    "Data export quota exceeded", CBConstants.QUOTA_PROP_FILE_LIMIT, fileSizeLimit.longValue(), binaryValue.length);
        }
        File file = new File(DATA_EXPORT_FOLDER, exportFileName);
        Files.write(file.toPath(), binaryValue);
        return exportFileName;
    }



    @Override
    public void fetchStart(DBCSession session, DBCResultSet resultSet, long offset, long maxRows) throws DBCException {
        DBCResultSetMetaData meta = resultSet.getMeta();
        List<DBCAttributeMetaData> attributes = meta.getAttributes();
        DBCAttributeMetaData attrMeta = attributes.get(rowIndex);
        binding = new DBDAttributeBindingMeta(dataContainer, resultSet.getSession(), attrMeta);
    }
    @Override
    public void fetchRow(DBCSession session, DBCResultSet resultSet) throws DBCException {
        lobValue = (DBDValue) binding.getValueHandler().fetchValueObject(
            resultSet.getSession(),
            resultSet,
            binding.getMetaAttribute(),
            rowIndex);
    }

    @Override
    public void fetchEnd(DBCSession session, DBCResultSet resultSet) throws DBCException {

    }

    @Override
    public void close() {

    }
}

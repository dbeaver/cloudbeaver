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

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.data.DBDAttributeBindingMeta;
import org.jkiss.dbeaver.model.data.DBDContent;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.data.DBDValue;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.utils.ContentUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

public class WebSQLCellValueReceiver implements DBDDataReceiver {
    protected final DBSDataContainer dataContainer;
    protected int rowIndex;
    protected DBDAttributeBindingMeta binding;
    protected Object value;

    public WebSQLCellValueReceiver(DBSDataContainer dataContainer, int rowIndex) {
        this.dataContainer = dataContainer;
        this.rowIndex = rowIndex;
    }

    @Override
    public void fetchStart(@NotNull DBCSession session, @NotNull DBCResultSet resultSet, long offset, long maxRows) throws DBCException {
        DBCResultSetMetaData meta = resultSet.getMeta();
        List<? extends DBCAttributeMetaData> attributes = meta.getAttributes();
        DBCAttributeMetaData attrMeta = attributes.get(rowIndex);
        binding = new DBDAttributeBindingMeta(dataContainer, resultSet.getSession(), attrMeta);
    }

    @Override
    public void fetchRow(@NotNull DBCSession session, @NotNull DBCResultSet resultSet) throws DBCException {
        value = binding.getValueHandler().fetchValueObject(
            resultSet.getSession(),
            resultSet,
            binding.getMetaAttribute(),
            rowIndex);
    }

    @Override
    public void fetchEnd(@NotNull DBCSession session, @NotNull DBCResultSet resultSet) throws DBCException {

    }

    @Override
    public void close() {

    }

    @NotNull
    public byte[] getBinaryValue(DBRProgressMonitor monitor) throws DBCException {
        byte[] binaryValue;
        if (value instanceof DBDContent dbdContent) {
            binaryValue = ContentUtils.getContentBinaryValue(monitor, dbdContent);
        } else if (value instanceof DBDValue dbdValue) {
            binaryValue = dbdValue.getRawValue().toString().getBytes();
        } else {
            binaryValue = value.toString().getBytes(StandardCharsets.UTF_8);
        }
        if (binaryValue == null) {
            throw new DBCException("Lob value is null");
        }
        return binaryValue;
    }
}

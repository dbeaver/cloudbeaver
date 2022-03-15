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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDAttributeBindingMeta;
import org.jkiss.dbeaver.model.data.DBDAttributeBindingType;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.impl.data.DBDValueError;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;

class WebSQLQueryDataReceiver implements DBDDataReceiver {
    private static final Log log = Log.getLog(WebSQLQueryDataReceiver.class);

    private final WebSQLContextInfo contextInfo;
    private final DBSDataContainer dataContainer;
    private final WebDataFormat dataFormat;
    private final WebSQLQueryResultSet webResultSet = new WebSQLQueryResultSet();

    private DBDAttributeBinding[] bindings;
    private List<Object[]> rows = new ArrayList<>();
    private final Number rowLimit;

    WebSQLQueryDataReceiver(WebSQLContextInfo contextInfo, DBSDataContainer dataContainer, WebDataFormat dataFormat) {
        this.contextInfo = contextInfo;
        this.dataContainer = dataContainer;
        this.dataFormat = dataFormat;
        rowLimit = CBApplication.getInstance().getAppConfiguration().getResourceQuota(WebSQLConstants.QUOTA_PROP_ROW_LIMIT);
    }

    public WebSQLQueryResultSet getResultSet() {
        return webResultSet;
    }

    @Override
    public void fetchStart(DBCSession session, DBCResultSet dbResult, long offset, long maxRows) throws DBCException {
        DBCResultSetMetaData meta = dbResult.getMeta();
        List<DBCAttributeMetaData> attributes = meta.getAttributes();
        bindings = new DBDAttributeBindingMeta[attributes.size()];
        for (int i = 0; i < attributes.size(); i++) {
            DBCAttributeMetaData attrMeta = attributes.get(i);
            bindings[i] = new DBDAttributeBindingMeta(dataContainer, dbResult.getSession(), attrMeta);
        }
    }

    @Override
    public void fetchRow(DBCSession session, DBCResultSet resultSet) throws DBCException {

        Object[] row = new Object[bindings.length];

        for (int i = 0; i < bindings.length; i++) {
            DBDAttributeBinding binding = bindings[i];
            try {
                Object cellValue = binding.getValueHandler().fetchValueObject(
                    resultSet.getSession(),
                    resultSet,
                    binding.getMetaAttribute(),
                    i);
                row[i] = cellValue;
            } catch (Throwable e) {
                row[i] = new DBDValueError(e);
            }
        }

        rows.add(row);

        if (rowLimit != null && rows.size() > rowLimit.longValue()) {
            throw new DBQuotaException(
                "Result set rows quota exceeded", WebSQLConstants.QUOTA_PROP_ROW_LIMIT, rowLimit.longValue(), rows.size());
        }
    }

    @Override
    public void fetchEnd(DBCSession session, DBCResultSet resultSet) throws DBCException {

        WebSession webSession = contextInfo.getProcessor().getWebSession();
        DBSEntity entity = dataContainer instanceof DBSEntity ? (DBSEntity) dataContainer : null;

        try {
            DBExecUtils.bindAttributes(session, entity, resultSet, bindings, rows);
        } catch (DBException e) {
            log.error("Error binding attributes", e);
        }

        if (dataFormat != WebDataFormat.document) {
            convertComplexValuesToRelationalView(session);
        }

        // Set proper order position
        for (int i = 0; i < bindings.length; i++) {
            DBDAttributeBinding binding = bindings[i];
            if (binding instanceof DBDAttributeBindingType) {
                // Type bindings are produced by dynamic map resolve
                // Their positions are valid only within parent value
                // In web we make plain list of attributes so we must reorder leaf attributes
                ((DBDAttributeBindingType) binding).setOrdinalPosition(i);
            }
        }

        // Convert row values
        for (Object[] row : rows) {
            for (int i = 0; i < bindings.length; i++) {
                DBDAttributeBinding binding = bindings[i];
                row[i] = WebSQLUtils.makeWebCellValue(webSession, binding, row[i], dataFormat);
            }
        }

        webResultSet.setColumns(bindings);
        webResultSet.setRows(rows.toArray(new Object[0][]));

        WebSQLResultsInfo resultsInfo = contextInfo.saveResult(dataContainer, bindings);
        webResultSet.setResultsInfo(resultsInfo);

        boolean isSingleEntity = DBExecUtils.detectSingleSourceTable(bindings) != null;

        webResultSet.setSingleEntity(isSingleEntity);
    }

    private void convertComplexValuesToRelationalView(DBCSession session) {
        // Here we get leaf attributes and refetch them into plain tabl structure
        List<DBDAttributeBinding> leafBindings = new ArrayList<>();
        for (DBDAttributeBinding attr : bindings) {
            collectLeafBindings(attr, leafBindings);
        }
        if (CommonUtils.equalObjects(bindings, leafBindings)) {
            // No complex types
            return;
        }

        // Convert original rows into new rows with leaf attributes
        // Extract values for leaf attributes from original row
        DBDAttributeBinding[] leafAttributes = leafBindings.toArray(new DBDAttributeBinding[0]);
        List<Object[]> newRows = new ArrayList<>();
        for (Object[] row : rows) {
            Object[] newRow = new Object[leafBindings.size()];
            for (int i = 0; i < leafBindings.size(); i++) {
                DBDAttributeBinding leafAttr = leafBindings.get(i);
                try {
                    //Object topValue = row[leafAttr.getTopParent().getOrdinalPosition()];
                    Object cellValue = DBUtils.getAttributeValue(leafAttr, leafAttributes, row);
/*
                    Object cellValue = leafAttr.getValueHandler().getValueFromObject(
                        session,
                        leafAttr,
                        topValue,
                        false,
                        false);
*/
                    newRow[i] = cellValue;
                } catch (Exception e) {
                    newRow[i] = new DBDValueError(e);
                }
            }
            newRows.add(newRow);
        }
        this.bindings = leafAttributes;
        this.rows = newRows;
    }

    private void collectLeafBindings(DBDAttributeBinding attr, List<DBDAttributeBinding> leafBindings) {
        List<DBDAttributeBinding> nestedBindings = attr.getNestedBindings();
        if (CommonUtils.isEmpty(nestedBindings)) {
            leafBindings.add(attr);
        } else {
            for (DBDAttributeBinding nested : nestedBindings) {
                collectLeafBindings(nested, leafBindings);
            }
        }
    }

    @Override
    public void close() {
        rows.clear();
    }
}

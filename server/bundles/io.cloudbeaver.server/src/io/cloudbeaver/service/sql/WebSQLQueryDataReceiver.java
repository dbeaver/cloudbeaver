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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.exec.trace.DBCTrace;
import org.jkiss.dbeaver.model.exec.trace.DBCTraceDynamic;
import org.jkiss.dbeaver.model.impl.data.DBDValueError;
import org.jkiss.dbeaver.model.meta.MetaData;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

class WebSQLQueryDataReceiver implements DBDDataReceiver {
    private static final Log log = Log.getLog(WebSQLQueryDataReceiver.class);

    private final WebSQLContextInfo contextInfo;
    private final DBSDataContainer dataContainer;
    private final WebDataFormat dataFormat;
    private final WebSQLQueryResultSet webResultSet = new WebSQLQueryResultSet();

    private DBDAttributeBinding[] bindings;
    private DBCTrace trace;
    private List<WebSQLQueryResultSetRow> rows = new ArrayList<>();
    private final Number rowLimit;

    WebSQLQueryDataReceiver(WebSQLContextInfo contextInfo, DBSDataContainer dataContainer, WebDataFormat dataFormat) {
        this.contextInfo = contextInfo;
        this.dataContainer = dataContainer;
        this.dataFormat = dataFormat;
        rowLimit = ServletAppUtils.getServletApplication()
            .getAppConfiguration()
            .getResourceQuota(WebSQLConstants.QUOTA_PROP_ROW_LIMIT);
    }

    public WebSQLQueryResultSet getResultSet() {
        return webResultSet;
    }

    @Override
    public void fetchStart(@NotNull DBCSession session, @NotNull DBCResultSet dbResult, long offset, long maxRows) throws DBCException {
        DBCResultSetMetaData meta = dbResult.getMeta();
        List<? extends DBCAttributeMetaData> attributes = meta.getAttributes();
        bindings = new DBDAttributeBindingMeta[attributes.size()];
        for (int i = 0; i < attributes.size(); i++) {
            DBCAttributeMetaData attrMeta = attributes.get(i);
            bindings[i] = new DBDAttributeBindingMeta(dataContainer, dbResult.getSession(), attrMeta);
        }
        if (dbResult instanceof DBCResultSetTrace resultSetTrace) {
            this.trace = resultSetTrace.getExecutionTrace();
        }
    }

    @Override
    public void fetchRow(@NotNull DBCSession session, @NotNull DBCResultSet resultSet) throws DBCException {

        Map<String, Object> metaDataMap = null;
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
                if (cellValue != null) {
                    Method[] methods = cellValue.getClass().getMethods();
                    for (Method method : methods) {
                        if (method.isAnnotationPresent(MetaData.class)) {
                            if (metaDataMap == null) {
                                metaDataMap = new HashMap<>();
                            }
                            Object value = method.invoke(cellValue);
                            metaDataMap.put(method.getAnnotation(MetaData.class).name(), value);
                        }
                    }
                }

            } catch (Throwable e) {
                row[i] = new DBDValueError(e);
            }
        }

        rows.add(new WebSQLQueryResultSetRow(row, metaDataMap));

        if (rowLimit != null && rows.size() > rowLimit.longValue()) {
            throw new DBQuotaException(
                "Result set rows quota exceeded", WebSQLConstants.QUOTA_PROP_ROW_LIMIT, rowLimit.longValue(), rows.size());
        }
    }

    @Override
    public void fetchEnd(@NotNull DBCSession session, @NotNull DBCResultSet resultSet) throws DBCException {

        WebSession webSession = contextInfo.getProcessor().getWebSession();
        DBSEntity entity = dataContainer instanceof DBSEntity ? (DBSEntity) dataContainer : null;

        try {
            DBExecUtils.bindAttributes(session, entity, resultSet, bindings, rows.stream().map(WebSQLQueryResultSetRow::getData).collect(Collectors.toList()));
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
        for (WebSQLQueryResultSetRow row : rows) {
            for (int i = 0; i < bindings.length; i++) {
                DBDAttributeBinding binding = bindings[i];
                row.getData()[i] = WebSQLUtils.makeWebCellValue(webSession, binding, row.getData()[i], dataFormat);
            }
        }

        webResultSet.setColumns(bindings);
        webResultSet.setRows(List.of(rows.toArray(new WebSQLQueryResultSetRow[0])));
        webResultSet.setHasChildrenCollection(resultSet instanceof DBDSubCollectionResultSet);
        webResultSet.setSupportsDataFilter(dataContainer.isFeatureSupported(DBSDataContainer.FEATURE_DATA_FILTER));
        webResultSet.setHasDynamicTrace(trace instanceof DBCTraceDynamic);
        webResultSet.setReadOnlyInfo(contextInfo.getProcessor().getExecutionContext());

        WebSQLResultsInfo resultsInfo = contextInfo.saveResult(dataContainer, trace, bindings, rows.size() == 1);
        webResultSet.setResultsInfo(resultsInfo);

        boolean isSingleEntity = DBExecUtils.detectSingleSourceTable(bindings) != null;

        webResultSet.setSingleEntity(isSingleEntity);

        Set<DBDRowIdentifier> rowIdentifiers = resultsInfo.getRowIdentifiers();
        boolean hasRowIdentifier = rowIdentifiers.stream().allMatch(DBDRowIdentifier::isValidIdentifier);
        webResultSet.setHasRowIdentifier(!rowIdentifiers.isEmpty() && hasRowIdentifier);
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
        List<WebSQLQueryResultSetRow> newRows = new ArrayList<>();
        for (WebSQLQueryResultSetRow row : rows) {
            Object[] newRow = new Object[leafBindings.size()];
            for (int i = 0; i < leafBindings.size(); i++) {
                DBDAttributeBinding leafAttr = leafBindings.get(i);
                try {
                    //Object topValue = row[leafAttr.getTopParent().getOrdinalPosition()];
                    Object cellValue = DBUtils.getAttributeValue(leafAttr, leafAttributes, row.getData());
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
            newRows.add(new WebSQLQueryResultSetRow(newRow, row.getMetaData()));
        }
        this.bindings = leafAttributes;
        this.rows = newRows;
    }

    private void collectLeafBindings(DBDAttributeBinding attr, List<DBDAttributeBinding> leafBindings) {
        // we need to show arrays as string because there was a problem with showing multiple rows for custom objects
        if (attr.getDataKind() == DBPDataKind.ARRAY) {
            leafBindings.add(attr);
            return;
        }
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

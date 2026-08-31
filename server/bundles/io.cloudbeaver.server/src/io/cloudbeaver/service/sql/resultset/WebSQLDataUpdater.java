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
package io.cloudbeaver.service.sql.resultset;

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.BaseWebPlatform;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.sql.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.data.resultset.DBDDataStatementInfo;
import org.jkiss.dbeaver.model.data.resultset.DBDResultSetDataUpdater;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionSource;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.struct.DBSDataManipulator;
import org.jkiss.dbeaver.model.struct.DBSDocumentLocator;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.rdb.DBSManipulationType;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class WebSQLDataUpdater extends DBDResultSetDataUpdater<WebSQLDataStatementInfo, WebSQLResultsRow, WebDBDResultSetDataModel> {

    private final WebSession webSession;
    private final WebSQLResultsInfo resultsInfo;
    private final boolean generateScript;
    private final Map<WebSQLResultsRow, Map<DBDAttributeBinding, Object>> documentKeyValues = new IdentityHashMap<>();
    private final Map<WebSQLResultsRow, Object> insertDocumentValues = new IdentityHashMap<>();

    public WebSQLDataUpdater(
        @NotNull WebSession webSession,
        @NotNull WebDBDResultSetDataModel model,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull DBCExecutionContext executionContext,
        boolean generateScript
    ) {
        super(model, executionContext);
        this.webSession = webSession;
        this.resultsInfo = resultsInfo;
        this.generateScript = generateScript;
        collectChanges();
    }

    @NotNull
    public Set<WebSQLQueryResultSetRow> getUpdatedResultSetRows() {
        Set<WebSQLQueryResultSetRow> rows = new LinkedHashSet<>();
        for (WebSQLResultsRow row : changedRows) {
            rows.add(toResultSetRow(row));
        }
        for (WebSQLResultsRow row : addedRows) {
            rows.add(toResultSetRow(row));
        }
        return rows;
    }

    @NotNull
    private static WebSQLQueryResultSetRow toResultSetRow(@NotNull WebSQLResultsRow row) {
        Object[] values = row.getFinalRow() == null ? row.getValues() : row.getFinalRow();
        return new WebSQLQueryResultSetRow(values, row.getMetaData());
    }

    @NotNull
    @Override
    protected WebSQLDataStatementInfo getDataStatementInfo(
        @NotNull DBSManipulationType type,
        @NotNull WebSQLResultsRow row,
        @NotNull DBSEntity entity
    ) {
        Object[] finalRow = Objects.requireNonNull(row.getFinalRow(), "Final row values were not loaded");
        return new WebSQLDataStatementInfo(entity, finalRow);
    }

    @Nullable
    @Override
    protected Map<DBDAttributeBinding, Object> collectUpdateChanges(@NotNull WebSQLResultsRow row) {
        DBDAttributeBinding[] allAttributes = model.getResultsInfo().getAttributes();
        Map<DBDAttributeBinding, Object> updateChanges = new LinkedHashMap<>();
        for (Map.Entry<String, Object> v : row.getUpdateValues().entrySet()) {
            int index = CommonUtils.toInt(v.getKey());
            Object originalValue = row.getOriginalKeyValue(index);
            updateChanges.put(allAttributes[index], originalValue == null ? row.getValues()[index] : originalValue);
        }

        return updateChanges;
    }

    @Override
    protected void loadFinalRowValues(@NotNull WebSQLResultsRow row) throws DBException {
        if (row.getFinalRow() != null) {
            return;
        }
        Object[] finalRow = getFinalRow(row);
        boolean added = addedRows.contains(row);
        Map<Integer, Object> originalValues = new HashMap<>();
        try (
            DBCSession session = DBUtils.openUtilSession(
                webSession.getProgressMonitor(),
                resultsInfo.getDataContainer(),
                "Load final row"
            )
        ) {
            Map<Integer, DBDAttributeBinding> identifierAttributes = added
                ? Collections.emptyMap()
                : resolveIdentifierAttributes(session, row);
            convertRowValues(session, row, finalRow, added, identifierAttributes, originalValues);
            DBDAttributeBinding documentAttribute = resultsInfo.getDocumentAttribute();
            if (added && documentAttribute != null && resultsInfo.getAttributePosition(documentAttribute) < 0) {
                insertDocumentValues.put(row, createDocumentValue(session, documentAttribute, finalRow));
            }
        }
        row.setOriginalKeyValues(originalValues);
        row.setFinalRow(finalRow);
    }

    @NotNull
    private static Object[] getFinalRow(@NotNull WebSQLResultsRow row) {
        Object[] finalRow = Arrays.copyOf(row.getValues(), row.getValues().length);
        for (Map.Entry<String, Object> entry : row.getUpdateValues().entrySet()) {
            finalRow[CommonUtils.toInt(entry.getKey())] = entry.getValue();
        }
        return finalRow;
    }

    @NotNull
    private Map<Integer, DBDAttributeBinding> resolveIdentifierAttributes(
        @NotNull DBCSession session,
        @NotNull WebSQLResultsRow row
    ) throws DBException {
        Map<Integer, DBDAttributeBinding> attributes = new HashMap<>();
        DBDDocument resolvedDocument = null;
        for (DBDRowIdentifier identifier : resultsInfo.getRowIdentifiers()) {
            for (DBDAttributeBinding attribute : identifier.getAttributes()) {
                int position = resultsInfo.getAttributePosition(attribute);
                if (position >= 0) {
                    attributes.put(position, attribute);
                } else if (resultsInfo.getDataContainer() instanceof DBSDocumentLocator documentLocator) {
                    if (resolvedDocument == null) {
                        resolvedDocument = WebSQLUtils.makeDocumentInputValue(
                            session,
                            documentLocator,
                            resultsInfo,
                            row,
                            row.getMetaData()
                        );
                    }
                    documentKeyValues.computeIfAbsent(row, key -> new IdentityHashMap<>()).put(attribute, resolvedDocument);
                } else {
                    int keyPosition = resultsInfo.getDocumentIdAttributePosition(attribute);
                    if (keyPosition < 0 || keyPosition >= row.getValues().length) {
                        throw new DBCException(
                            "Document ID attribute for '" + attribute.getName() + "' is not present in the row"
                        );
                    }
                    attributes.put(keyPosition, attribute);
                    Object keyValue = convertInputCellValue(session, attribute, row.getValues()[keyPosition]);
                    documentKeyValues.computeIfAbsent(row, key -> new IdentityHashMap<>()).put(attribute, keyValue);
                }
            }
        }
        return attributes;
    }

    @Nullable
    @Override
    protected Object getKeyValue(@NotNull DBDAttributeBinding attribute, @NotNull WebSQLResultsRow row) throws DBException {
        Map<DBDAttributeBinding, Object> rowKeyValues = documentKeyValues.get(row);
        if (rowKeyValues != null && rowKeyValues.containsKey(attribute)) {
            return rowKeyValues.get(attribute);
        }
        return super.getKeyValue(attribute, row);
    }

    @Nullable
    @Override
    protected Object getInsertDocumentValue(
        @NotNull DBDAttributeBinding attribute,
        @NotNull WebSQLResultsRow row
    ) throws DBException {
        if (insertDocumentValues.containsKey(row)) {
            return insertDocumentValues.get(row);
        }
        return super.getInsertDocumentValue(attribute, row);
    }

    @NotNull
    @Override
    protected DBDAttributeValue getDeleteKeyAttributeValue(
        @NotNull DBDAttributeBinding attribute,
        @NotNull WebSQLResultsRow row
    ) throws DBException {
        if (attribute.getDataKind() == DBPDataKind.DOCUMENT
            && !(resultsInfo.getDataContainer() instanceof DBSDocumentLocator)) {
            int idPosition = resultsInfo.getDocumentIdAttributePosition(attribute);
            if (idPosition >= 0) {
                return new DBDAttributeValue(model.getAttributes()[idPosition], getKeyValue(attribute, row));
            }
        }
        return super.getDeleteKeyAttributeValue(attribute, row);
    }

    private void convertRowValues(
        @NotNull DBCSession session,
        @NotNull WebSQLResultsRow row,
        @NotNull Object[] finalRow,
        boolean added,
        @NotNull Map<Integer, DBDAttributeBinding> identifierAttributes,
        @NotNull Map<Integer, Object> originalValues
    ) throws DBException {
        BitSet positionsToConvert = new BitSet();
        identifierAttributes.keySet().forEach(positionsToConvert::set);
        if (added) {
            positionsToConvert.set(0, finalRow.length);
        } else {
            for (String indexValue : row.getUpdateValues().keySet()) {
                positionsToConvert.set(CommonUtils.toInt(indexValue));
            }
        }
        for (int position = positionsToConvert.nextSetBit(0);
             position >= 0;
             position = positionsToConvert.nextSetBit(position + 1)) {
            DBDAttributeBinding attribute = model.getAttributes()[position];
            DBDAttributeBinding identifierAttribute = identifierAttributes.get(position);
            if (!added && attribute.getDataKind() == DBPDataKind.DOCUMENT
                && attribute.getDataContainer() instanceof DBSDocumentLocator documentLocator) {
                DBDDocument document = resolveDocumentValue(session, row, documentLocator);
                finalRow[position] = document;
                if (identifierAttribute != null) {
                    originalValues.put(position, document);
                }
            } else {
                if (identifierAttribute != null) {
                    Object identifierValue = getDocumentKeyValue(row, identifierAttribute);
                    if (identifierValue == null) {
                        identifierValue = convertInputCellValue(session, identifierAttribute, row.getValues()[position]);
                    }
                    originalValues.put(position, identifierValue);
                    if (!row.getUpdateValues().containsKey(String.valueOf(position))) {
                        finalRow[position] = identifierValue;
                        continue;
                    }
                }
                finalRow[position] = convertInputCellValue(session, attribute, finalRow[position]);
            }
        }
    }

    @Nullable
    private Object getDocumentKeyValue(
        @NotNull WebSQLResultsRow row,
        @NotNull DBDAttributeBinding identifierAttribute
    ) {
        Map<DBDAttributeBinding, Object> rowKeyValues = documentKeyValues.get(row);
        return rowKeyValues == null ? null : rowKeyValues.get(identifierAttribute);
    }

    @NotNull
    private Object createDocumentValue(
        @NotNull DBCSession session,
        @NotNull DBDAttributeBinding documentAttribute,
        @NotNull Object[] values
    ) throws DBException {
        Map<String, Object> document = WebSQLUtils.makeDocumentValueMap(
            documentAttribute,
            model.getAttributes(),
            values
        );
        return convertInputCellValue(session, documentAttribute, document);
    }

    @NotNull
    private DBDDocument resolveDocumentValue(
        @NotNull DBCSession session,
        @NotNull WebSQLResultsRow row,
        @NotNull DBSDocumentLocator documentLocator
    ) throws DBException {
        DBDDocument document = WebSQLUtils.makeDocumentInputValue(
            session,
            documentLocator,
            resultsInfo,
            row,
            row.getMetaData()
        );
        if (document instanceof DBDComposite composite) {
            for (Map.Entry<String, Object> entry : row.getUpdateValues().entrySet()) {
                DBDAttributeBinding updateAttribute = model.getAttributes()[CommonUtils.toInt(entry.getKey())];
                composite.setAttributeValue(
                    updateAttribute,
                    convertInputCellValue(session, updateAttribute, entry.getValue())
                );
            }
        }
        return document;
    }

    @Nullable
    private Object convertInputCellValue(
        @NotNull DBCSession session,
        @NotNull DBDAttributeBinding attribute,
        @Nullable Object value
    ) throws DBException {
        if (value instanceof Map<?, ?> variables && variables.get("fileId") != null) {
            String fileId = variables.get("fileId").toString();
            try {
                UUID.fromString(fileId);
            } catch (IllegalArgumentException e) {
                throw new DBException("File ID is invalid", e);
            }
            Path uploadFolder = WebAppUtils.getWebPlatform()
                .getTempFolder(webSession.getProgressMonitor(), BaseWebPlatform.TEMP_FILE_FOLDER)
                .resolve(webSession.getSessionId())
                .normalize();
            Path path = uploadFolder.resolve(fileId).normalize();
            if (!path.startsWith(uploadFolder)) {
                throw new DBException("File ID is invalid");
            }
            try {
                value = Files.newInputStream(path);
            } catch (IOException e) {
                throw new DBException("Error reading uploaded file", e);
            }
        }
        return WebSQLUtils.convertInputCellValue(session, attribute, value, generateScript);
    }

    @Override
    protected void collectUpdatedRows() {
        for (WebSQLResultsRow row : model.getUpdatedRows()) {
            changedRows.add(row);
        }
        for (WebSQLResultsRow row : model.getAddedRows()) {
            super.addedRows.add(row);
        }
        super.deletedRows.addAll(model.getDeletedRows());
    }

    @Override
    protected boolean shouldInsertAttribute(@NotNull DBDAttributeBinding attribute, @Nullable Object value) {
        return value != null;
    }

    @NotNull
    @Override
    protected DBCExecutionSource createExecutionSource(@NotNull DBSDataManipulator dataContainer) {
        return new WebExecutionSource(dataContainer, getExecutionContext(), this);
    }

    @Nullable
    @Override
    protected DBDDataReceiver getKeyReceiver(@NotNull DBDDataStatementInfo statement) {
        if (statement instanceof WebSQLDataStatementInfo webStatement) {
            return new KeyDataReceiver(model.getAttributes(), webStatement.getFinalRow());
        }
        return null;
    }

    public long getUpdatedRowsCount() {
        return insertStats.getRowsUpdated() + updateStats.getRowsUpdated() + deleteStats.getRowsUpdated();
    }

    public long getExecutionDuration() {
        return insertStats.getExecuteTime() + updateStats.getExecuteTime() + deleteStats.getExecuteTime();
    }

}

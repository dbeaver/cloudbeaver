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

    public WebSQLDataUpdater(
        @NotNull WebSession webSession,
        @NotNull WebDBDResultSetDataModel model,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull DBCExecutionContext executionContext
    ) {
        super(model, executionContext);
        this.webSession = webSession;
        this.resultsInfo = resultsInfo;
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
        Object[] finalRow = Arrays.copyOf(row.getValues(), row.getValues().length);
        for (Map.Entry<String, Object> entry : row.getUpdateValues().entrySet()) {
            int index = CommonUtils.toInt(entry.getKey());
            finalRow[index] = entry.getValue();
        }
        boolean added = addedRows.contains(row);
        boolean[] attributesToConvert = new boolean[finalRow.length];
        boolean[] identifierAttributes = new boolean[finalRow.length];
        if (added) {
            Arrays.fill(attributesToConvert, true);
        } else {
            for (DBDRowIdentifier identifier : resultsInfo.getRowIdentifiers()) {
                for (DBDAttributeBinding attribute : identifier.getAttributes()) {
                    int index = attribute.getOrdinalPosition();
                    attributesToConvert[index] = true;
                    identifierAttributes[index] = true;
                }
            }
            for (String indexValue : row.getUpdateValues().keySet()) {
                attributesToConvert[CommonUtils.toInt(indexValue)] = true;
            }
        }
        Map<Integer, Object> originalValues = new HashMap<>();
        try (
            DBCSession session = DBUtils.openUtilSession(
                webSession.getProgressMonitor(),
                resultsInfo.getDataContainer(),
                "Load final row"
            )
        ) {
            for (int i = 0; i < finalRow.length; i++) {
                if (!attributesToConvert[i]) {
                    continue;
                }
                DBDAttributeBinding attr = model.getAttributes()[i];
                boolean isDocumentValue = !added
                    && model.getAttributes().length == 1
                    && attr.getDataKind() == DBPDataKind.DOCUMENT
                    && attr.getDataContainer() instanceof DBSDocumentLocator;
                if (isDocumentValue) {
                    DBDDocument document = WebSQLUtils.makeDocumentInputValue(
                            session,
                            (DBSDocumentLocator) attr.getDataContainer(),
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
                    finalRow[i] = document;
                    if (identifierAttributes[i]) {
                        originalValues.put(i, document);
                    }
                } else {
                    if (identifierAttributes[i]) {
                        originalValues.put(i, convertInputCellValue(session, attr, row.getValues()[i]));
                    }
                    finalRow[i] = convertInputCellValue(session, attr, finalRow[i]);
                }
            }
        }
        row.setOriginalKeyValues(originalValues);
        row.setFinalRow(finalRow);
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
        return WebSQLUtils.convertInputCellValue(session, attribute, value, false);
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

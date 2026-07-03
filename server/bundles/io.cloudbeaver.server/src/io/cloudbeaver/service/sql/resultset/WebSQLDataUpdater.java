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
import io.cloudbeaver.service.sql.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.data.resultset.DBDDataStatementInfo;
import org.jkiss.dbeaver.model.data.resultset.DBDResultSetDataUpdater;
import org.jkiss.dbeaver.model.data.resultset.DataUpdaterJob;
import org.jkiss.dbeaver.model.data.resultset.ISmartTransactionManager;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionSource;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.exec.DBCStatistics;
import org.jkiss.dbeaver.model.struct.DBSDataManipulator;
import org.jkiss.dbeaver.model.struct.DBSDocumentLocator;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.rdb.DBSManipulationType;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public class WebSQLDataUpdater extends DBDResultSetDataUpdater<WebSQLDataStatementInfo, WebSQLResultsRow, WebDBDResultSetDataModel> {

    private final WebSession webSession;
    private final WebSQLResultsInfo resultsInfo;

    private Set<WebSQLQueryResultSetRow> updatedResultSetRows;

    public WebSQLDataUpdater(
        @NotNull WebSession webSession,
        @NotNull WebDBDResultSetDataModel model,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull DBCExecutionContext executionContext
    ) {
        super(model, executionContext);
        this.webSession = webSession;
        this.resultsInfo = resultsInfo;
    }

    @NotNull
    public Set<WebSQLQueryResultSetRow> getUpdatedResultSetRows() {
        return updatedResultSetRows;
    }

    @NotNull
    @Override
    protected WebSQLDataStatementInfo getDataStatementInfo(
        @NotNull DBSManipulationType type,
        @NotNull WebSQLResultsRow row,
        @NotNull DBSEntity entity
    ) {
        return new WebSQLDataStatementInfo(entity, row.getValues());
    }

    @Nullable
    @Override
    protected Map<DBDAttributeBinding, Object> collectUpdateChanges(@NotNull WebSQLResultsRow row) {
        DBDAttributeBinding[] allAttributes = model.getResultsInfo().getAttributes();
        Map<DBDAttributeBinding, Object> updateChanges = new LinkedHashMap<>();
        for (Map.Entry<String, Object> v : row.getUpdateValues().entrySet()) {
            updateChanges.put(allAttributes[CommonUtils.toInt(v.getKey())], row.getValues()[CommonUtils.toInt(v.getKey())]);
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
        try (
            DBCSession session = DBUtils.openUtilSession(
                webSession.getProgressMonitor(),
                resultsInfo.getDataContainer(),
                "Load final row"
            )
        ) {
            for (int i = 0; i < finalRow.length; i++) {
                DBDAttributeBinding attr = model.getAttributes()[i];
                boolean isDocumentValue = model.getAttributes().length == 1
                    && attr.getDataKind() == DBPDataKind.DOCUMENT
                    && attr.getDataContainer() instanceof DBSDocumentLocator;
                if (isDocumentValue) {
                    finalRow[i] =
                        WebSQLUtils.makeDocumentInputValue(
                            session,
                            (DBSDocumentLocator) attr.getDataContainer(),
                            resultsInfo,
                            row,
                            null
                        );
                } else {
                    finalRow[i] = attr.getValueHandler().getValueFromObject(
                        session,
                        attr,
                        WebSQLUtils.convertInputCellValue(
                            session,
                            attr,
                            finalRow[i],
                            false
                        ),
                        false,
                        true
                    );
                }
            }
        }
        row.setFinalRow(finalRow);
    }

    @Override
    public void processReflectChanges(@Nullable Throwable error) {

    }

    @Override
    public void showError(@NotNull Throwable error) {

    }

    @Override
    public void before(@NotNull DataUpdaterJob job) {

    }

    @Override
    public void after() {

    }

    @Nullable
    @Override
    protected ISmartTransactionManager getSmartTransactionManager() {
        return null;
    }

    @Override
    protected void collectUpdatedRows() {
        Set<WebSQLQueryResultSetRow> updatedResultSetRows = new LinkedHashSet<>();
        for (WebSQLResultsRow row : model.getUpdatedRows()) {
            changedRows.add(row);
            updatedResultSetRows.add(new WebSQLQueryResultSetRow(row.getValues(), null));
        }
        for (WebSQLResultsRow row : model.getAddedRows()) {
            super.addedRows.add(row);
            updatedResultSetRows.add(new WebSQLQueryResultSetRow(row.getValues(), null));
        }
        super.deletedRows.addAll(model.getDeletedRows());
        this.updatedResultSetRows = updatedResultSetRows;
    }

    @Override
    protected void notifyContainer(@NotNull DBCStatistics statistics) {

    }

    @NotNull
    @Override
    protected DBCExecutionSource createExecutionSource(@NotNull DBSDataManipulator dataContainer) {
        return new WebExecutionSource(dataContainer, getExecutionContext(), this);
    }

    @Nullable
    @Override
    protected DBDDataReceiver getKeyReceiver(@NotNull DBDDataStatementInfo statement) {
        return new KeyDataReceiver(model.getAttributes());
    }

    public long getUpdatedRowsCount() {
        return insertStats.getRowsUpdated() + updateStats.getRowsUpdated() + deleteStats.getRowsUpdated();
    }

    public long getExecutionDuration() {
        return insertStats.getExecuteTime() + updateStats.getExecuteTime() + deleteStats.getExecuteTime();
    }

}

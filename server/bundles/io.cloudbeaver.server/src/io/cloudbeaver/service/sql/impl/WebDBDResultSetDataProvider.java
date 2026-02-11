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
package io.cloudbeaver.service.sql.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLResultsRow;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDResultSetDataProvider;
import org.jkiss.dbeaver.model.data.DBDRowIdentifier;
import org.jkiss.dbeaver.model.data.DBDValueRow;
import org.jkiss.dbeaver.model.data.hints.DBDValueHintContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObject;

import java.util.ArrayList;
import java.util.List;

public class WebDBDResultSetDataProvider implements DBDResultSetDataProvider, DBSObject {

    private final String resultsId;
    private final WebSQLContextInfo contextInfo;
    private final List<WebSQLResultsRow> selectedRows;

    WebDBDResultSetDataProvider(
        @NotNull String resultsId,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull List<WebSQLResultsRow> selectedRows
    ) {
        this.resultsId = resultsId;
        this.contextInfo = contextInfo;
        this.selectedRows = selectedRows;
    }

    @NotNull
    @Override
    public DBDAttributeBinding[] getAttributes() throws DBWebException {
        return contextInfo.getResults(resultsId).getAttributes();
    }

    @NotNull
    @Override
    public List<? extends DBDValueRow> getAllRows() {
        return getSelectedRows();
    }

    @NotNull
    @Override
    public List<? extends DBDValueRow> getSelectedRows() {
        if (selectedRows.isEmpty()) {
            return List.of();
        }

        List<WebDBDValueRow> rows = new ArrayList<>();
        for (int rowNumber = 0; rowNumber < selectedRows.size(); rowNumber++) {
            WebSQLResultsRow row = selectedRows.get(rowNumber);
            if (row != null && row.getData() != null) {
                rows.add(new WebDBDValueRow(rowNumber, row.getData()));
            }
        }
        return rows;
    }

    @Nullable
    @Override
    public DBSEntity getSingleSource() throws DBWebException {
        DBDRowIdentifier rowIdentifier = contextInfo.getResults(resultsId).getDefaultRowIdentifier();
        if (rowIdentifier == null) {
            return null;
        } else {
            return rowIdentifier.getEntity();
        }
    }

    @Nullable
    @Override
    public DBDRowIdentifier getDefaultRowIdentifier() {
        try {
            return contextInfo.getResults(resultsId).getDefaultRowIdentifier();
        } catch (DBWebException e) {
            return null;
        }
    }

    @Nullable
    @Override
    public Object getCellValue(@NotNull DBDAttributeBinding attribute, @NotNull DBDValueRow row) throws DBException {
        return DBUtils.getAttributeValue(attribute, getAttributes(), row.getValues());
    }

    @Nullable
    @Override
    public Object getCellValue(
        @NotNull DBDAttributeBinding attribute,
        @NotNull DBDValueRow row,
        @Nullable int[] rowIndexes,
        boolean retrieveDeepestCollectionElement
    ) throws DBWebException {
        return DBUtils.getAttributeValue(attribute, getAttributes(), row.getValues());
    }

    @Nullable
    @Override
    public DBDValueHintContext getHintContext() {
        return null;
    }

    @Nullable
    @Override
    public String getReadOnlyStatus(@Nullable DBPDataSourceContainer dataSourceContainer) {
        return null;
    }

    @Nullable
    @Override
    public DBSObject getParentObject() {
        return null;
    }

    @Nullable
    @Override
    public DBPDataSource getDataSource() {
        DBCExecutionContext executionContext = contextInfo.getProcessor().getExecutionContext();
        if (executionContext == null) {
            return null;
        } else {
            return executionContext.getDataSource();
        }
    }

    @NotNull
    @Override
    public String getName() {
        return WebDBDResultSetDataProvider.class.getSimpleName();
    }

    @Nullable
    @Override
    public String getDescription() {
        return null;
    }

    @Override
    public boolean isPersisted() {
        return false;
    }
}

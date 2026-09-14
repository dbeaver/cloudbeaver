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
import io.cloudbeaver.service.sql.WebAbstractDBDResultSetModel;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import io.cloudbeaver.service.sql.WebSQLResultsRow;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDResultSetDataProvider;
import org.jkiss.dbeaver.model.data.DBDValueRow;
import org.jkiss.dbeaver.model.data.ResultSetValuePath;
import org.jkiss.dbeaver.model.data.hints.DBDValueHintContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.struct.DBSObject;

import java.util.ArrayList;
import java.util.List;

public class WebDBDResultSetDataProvider extends WebAbstractDBDResultSetModel implements DBDResultSetDataProvider, DBSObject {

    private final List<WebSQLResultsRow> selectedRows;

    public WebDBDResultSetDataProvider(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull List<WebSQLResultsRow> selectedRows
    ) {
        super(contextInfo, resultsInfo);
        this.selectedRows = selectedRows;
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
            if (row != null && row.getValues() != null) {
                rows.add(new WebDBDValueRow(rowNumber, row.getValues()));
            }
        }
        return rows;
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
        @Nullable ResultSetValuePath valuePath,
        boolean retrieveDeepestCollectionElement
    ) throws DBWebException {
        if (valuePath != null) {
            return DBUtils.getRowValueByPath(row, valuePath);
        } else {
            return DBUtils.getAttributeValue(attribute, getAttributes(), row.getValues());
        }
    }

    @NotNull
    @Override
    public DBDValueHintContext getHintContext() {
        return hintContext;
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

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

import io.cloudbeaver.service.sql.WebAbstractDBDResultSetModel;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLResultsInfo;
import io.cloudbeaver.service.sql.WebSQLResultsRow;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDValueRow;

import java.util.ArrayList;
import java.util.List;

public class WebDBDResultSetDataModel extends WebAbstractDBDResultSetModel {
    private final List<WebSQLResultsRow> addedRows;
    private final List<WebSQLResultsRow> updatedRows;
    private final List<WebSQLResultsRow> deletedRows;
    private final List<WebSQLResultsRow> allRows;

    public WebDBDResultSetDataModel(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull WebSQLResultsInfo resultsInfo,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows
    ) {
        super(contextInfo, resultsInfo);
        this.addedRows = addedRows == null ? List.of() : addedRows;
        this.updatedRows = updatedRows == null ? List.of() : updatedRows;
        this.deletedRows = deletedRows == null ? List.of() : deletedRows;
        List<WebSQLResultsRow> rows = new ArrayList<>(
            this.addedRows.size() + this.updatedRows.size() + this.deletedRows.size()
        );
        rows.addAll(this.addedRows);
        rows.addAll(this.updatedRows);
        rows.addAll(this.deletedRows);
        for (int i = 0; i < rows.size(); i++) {
            rows.get(i).setRowNumber(i);
        }
        this.allRows = List.copyOf(rows);
    }

    @NotNull
    @Override
    public List<WebSQLResultsRow> getAllRows() {
        return allRows;
    }

    @NotNull
    public List<WebSQLResultsRow> getAddedRows() {
        return addedRows;
    }

    @NotNull
    public List<WebSQLResultsRow> getUpdatedRows() {
        return updatedRows;
    }

    @NotNull
    public List<WebSQLResultsRow> getDeletedRows() {
        return deletedRows;
    }

    @Nullable
    @Override
    public Object getCellValue(@NotNull DBDAttributeBinding attribute, @NotNull DBDValueRow row) throws DBException {
        if (row instanceof WebSQLResultsRow webSQLResultsRow && webSQLResultsRow.getResultRowValues() != null) {
            int position = resultsInfo.getAttributePosition(attribute);
            if (position >= 0) {
                return webSQLResultsRow.getResultRowValues()[position];
            }
        }
        return super.getCellValue(attribute, row);
    }
}

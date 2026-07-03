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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.data.hints.DBDValueHintContext;
import org.jkiss.dbeaver.model.impl.data.ResultSetHintContext;
import org.jkiss.dbeaver.model.struct.DBSEntity;

import java.util.Arrays;
import java.util.List;

public abstract class WebAbstractDBDResultSetModel implements DBDResultSetModel {

    protected final WebSQLContextInfo contextInfo;
    protected final WebSQLResultsInfo resultsInfo;
    protected final DBDValueHintContext hintContext;

    public WebAbstractDBDResultSetModel(@NotNull WebSQLContextInfo contextInfo, @NotNull WebSQLResultsInfo resultsInfo) {
        this.resultsInfo = resultsInfo;
        this.contextInfo = contextInfo;
        this.hintContext = new ResultSetHintContext(() -> null, () -> null);
    }

    @NotNull
    @Override
    public DBDAttributeBinding[] getAttributes() {
        return resultsInfo.getAttributes();
    }

    @NotNull
    @Override
    public List<DBDAttributeBinding> getVisibleAttributes() throws DBException {
        return Arrays.asList(getAttributes());
    }

    @NotNull
    @Override
    public abstract List<? extends DBDValueRow> getAllRows();

    @Nullable
    @Override
    public DBSEntity getSingleSource() throws DBWebException {
        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        if (rowIdentifier == null) {
            return null;
        } else {
            return rowIdentifier.getEntity();
        }
    }

    @Nullable
    @Override
    public DBDRowIdentifier getDefaultRowIdentifier() {
        return resultsInfo.getDefaultRowIdentifier();
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
    public String getReadOnlyStatus(@Nullable DBPDataSourceContainer dataSourceContainer) {
        return null;
    }

    @Nullable
    @Override
    public DBDAttributeBinding getDocumentAttribute() {
        return resultsInfo.getDocumentAttribute();
    }

    @NotNull
    public WebSQLResultsInfo getResultsInfo() {
        return resultsInfo;
    }
}

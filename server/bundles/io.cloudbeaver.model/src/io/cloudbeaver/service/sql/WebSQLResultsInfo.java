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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDRowIdentifier;
import org.jkiss.dbeaver.model.exec.trace.DBCTrace;
import org.jkiss.dbeaver.model.struct.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Web query results info.
 */
public class WebSQLResultsInfo {

    @NotNull
    private final DBSDataContainer dataContainer;
    @NotNull
    private final String id;
    private DBDAttributeBinding[] attributes;
    // TODO: find a way to remove isSingleRow and use virtual keys for reading BLOB and string cell values.
    private boolean isSingleRow;
    private DBCTrace trace;
    private String queryText;

    public WebSQLResultsInfo(@NotNull DBSDataContainer dataContainer, @NotNull String id) {
        this.dataContainer = dataContainer;
        this.id = id;
    }

    @NotNull
    public String getId() {
        return id;
    }

    @NotNull
    public DBSDataContainer getDataContainer() {
        return dataContainer;
    }

    public DBDAttributeBinding[] getAttributes() {
        return attributes;
    }

    public void setAttributes(DBDAttributeBinding[] attributes) {
        this.attributes = attributes;
    }

    public String getQueryText() {
        return queryText;
    }

    public void setQueryText(String queryText) {
        this.queryText = queryText;
    }

    @Nullable
    public DBDRowIdentifier getDefaultRowIdentifier() {
        for (DBDAttributeBinding column : attributes) {
            DBDRowIdentifier rowIdentifier = column.getRowIdentifier();
            if (rowIdentifier != null) {
                return rowIdentifier;
            }
        }
        return null;
    }

    @NotNull
    public Set<DBDRowIdentifier> getRowIdentifiers() {
        Set<DBDRowIdentifier> rowIdentifiers = new HashSet<>();
        for (DBDAttributeBinding column : attributes) {
            DBDRowIdentifier rowIdentifier = column.getRowIdentifier();
            if (rowIdentifier != null) {
                 rowIdentifiers.add(rowIdentifier);
            }
        }
        return rowIdentifiers;
    }

    public DBSAttributeBase getAttribute(String attributeName) {
        DBPDataSource dataSource = dataContainer.getDataSource();

        DBDAttributeBinding[] attrList = attributes;
        DBDAttributeBinding binding = null;
        for (String san : attributeName.split("\\.")) {
            if (dataSource != null) {
                san = DBUtils.getUnQuotedIdentifier(dataSource, san);
            }
            binding = DBUtils.findObject(attrList, san);
            if (binding == null) {
                return null;
            }
            List<DBDAttributeBinding> nestedBindings = binding.getNestedBindings();
            if (nestedBindings != null && !nestedBindings.isEmpty()) {
                attrList = nestedBindings.toArray(new DBDAttributeBinding[0]);
            }
        }
        return binding == null ? null : binding.getAttribute();
    }

    public DBSTypedObject getAttributeByPosition(int pos) {
        for (DBDAttributeBinding attr : attributes) {
            if (attr.getOrdinalPosition() == pos) {
                return attr;
            }
        }
        return null;
    }

    public boolean canRefreshResults() {
        DBSEntity entity = getDefaultRowIdentifier().getEntity();
        // FIXME: do not refresh documents for now. Can be solved by extracting document ID attributes
        // FIXME: but it will require to provide dynamic document metadata.
        return entity == null || entity.getDataSource() == null ||
            (!(entity instanceof DBSDocumentContainer) && !entity.getDataSource().getInfo().isDynamicMetadata());
    }

    public DBCTrace getTrace() {
        return trace;
    }

    public void setTrace(@NotNull DBCTrace trace) {
        this.trace = trace;
    }

    public boolean isSingleRow() {
        return isSingleRow;
    }

    public void setSingleRow(boolean singleRow) {
        isSingleRow = singleRow;
    }
}

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
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBExecUtils;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.Collections;
import java.util.List;

/**
 * Web SQL query resultset.
 */
public class WebSQLQueryResultSet {

    private static final Log log = Log.getLog(WebSQLQueryResultSet.class);

    private WebSQLQueryResultColumn[] columns;
    private List<WebSQLQueryResultSetRow> rows = Collections.emptyList();
    private boolean hasMoreData;
    private WebSQLResultsInfo resultsInfo;
    private boolean singleEntity = true;
    private boolean hasRowIdentifier;

    private boolean hasChildrenCollection;
    private boolean isSupportsDataFilter;
    private boolean hasDynamicTrace;
    private boolean readOnly;
    private String readOnlyStatus;

    public WebSQLQueryResultSet() {
    }

    @Property
    public String getId() {
        return resultsInfo == null ? null : resultsInfo.getId();
    }

    @Property
    public WebSQLQueryResultColumn[] getColumns() {
        return columns;
    }

    public void setColumns(WebSQLQueryResultColumn[] columns) {
        this.columns = columns;
    }

    public void setColumns(DBDAttributeBinding[] bindings) {
        WebSQLQueryResultColumn[] columns = new WebSQLQueryResultColumn[bindings.length];
        for (int i = 0; i < bindings.length; i++) {
            columns[i] = new WebSQLQueryResultColumn(bindings[i]);
        }
        this.columns = columns;
    }

    @Property
    @Deprecated
    public Object[][] getRows() {
        return rows.stream().map(WebSQLQueryResultSetRow::getData).toArray(x -> new Object[x][1]);
    }

    @Property
    public List<WebSQLQueryResultSetRow> getRowsWithMetaData() {
        return rows;
    }

    public void setRows(List<WebSQLQueryResultSetRow> rows) {
        this.rows = rows;
    }

    @Property
    public boolean isHasMoreData() {
        return hasMoreData;
    }

    public void setHasMoreData(boolean hasMoreData) {
        this.hasMoreData = hasMoreData;
    }

    @Property
    public boolean isSingleEntity() {
        return singleEntity;
    }

    public void setSingleEntity(boolean singleEntity) {
        this.singleEntity = singleEntity;
    }

    public WebSQLResultsInfo getResultsInfo() {
        return resultsInfo;
    }

    public void setResultsInfo(WebSQLResultsInfo resultsInfo) {
        this.resultsInfo = resultsInfo;
    }

    @Property
    public boolean isHasRowIdentifier() {
        return hasRowIdentifier;
    }

    public void setHasRowIdentifier(boolean hasRowIdentifier) {
        this.hasRowIdentifier = hasRowIdentifier;
    }

    @Property
    public boolean isHasChildrenCollection() {
        return hasChildrenCollection;
    }

    public void setHasChildrenCollection(boolean hasSuCollection) {
        this.hasChildrenCollection = hasSuCollection;
    }

    @Property
    public boolean isSupportsDataFilter() {
        return isSupportsDataFilter;
    }

    public void setSupportsDataFilter(boolean supportsDataFilter) {
        isSupportsDataFilter = supportsDataFilter;
    }

    @Property
    public boolean isHasDynamicTrace() {
        return hasDynamicTrace;
    }

    public void setHasDynamicTrace(boolean hasDynamicTrace) {
        this.hasDynamicTrace = hasDynamicTrace;
    }

    @Property
    public boolean isReadOnly() {
        return readOnly;
    }

    @Property
    public String getReadOnlyStatus() {
        return readOnlyStatus;
    }

    /**
     * Sets info about read-only status of a result set.
     */
    public void setReadOnlyInfo(@NotNull DBCExecutionContext executionContext) {
        this.readOnly = DBExecUtils.isResultSetReadOnly(executionContext);
        this.readOnlyStatus = DBExecUtils.getResultSetReadOnlyStatus(executionContext.getDataSource().getContainer());
    }
}

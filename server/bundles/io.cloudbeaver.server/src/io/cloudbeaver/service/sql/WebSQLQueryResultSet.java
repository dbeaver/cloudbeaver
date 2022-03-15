/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.meta.Property;

/**
 * Web SQL query resultset.
 */
public class WebSQLQueryResultSet {

    private static final Log log = Log.getLog(WebSQLQueryResultSet.class);

    private WebSQLQueryResultColumn[] columns;
    private Object[][] rows;
    private boolean hasMoreData;
    private WebSQLResultsInfo resultsInfo;
    private boolean singleEntity = true;

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
    public Object[][] getRows() {
        return rows;
    }

    public void setRows(Object[][] rows) {
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

}

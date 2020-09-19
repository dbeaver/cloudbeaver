/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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

import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.List;

/**
 * Web SQL query results.
 */
public class WebSQLQueryResults {

    private final WebDataFormat dataFormat;
    private Long updateRowCount;
    private WebSQLQueryResultSet resultSet;

    public WebSQLQueryResults(WebDataFormat dataFormat) {
        this.dataFormat = dataFormat;
    }

    public WebDataFormat getDataFormat() {
        return dataFormat;
    }

    @Property
    public Long getUpdateRowCount() {
        return updateRowCount;
    }

    public void setUpdateRowCount(long updateRowCount) {
        this.updateRowCount = updateRowCount;
    }

    @Property
    public WebSQLQueryResultSet getResultSet() {
        return resultSet;
    }

    public void setResultSet(WebSQLQueryResultSet resultSet) throws DBException {
        switch (dataFormat) {
            case document:

            case table:
                this.resultSet = resultSet;
                break;
            default:
                throw new DBException("Data format " + dataFormat + " is not supported");
        }
    }

    public List<WebSQLDatabaseDocument> getDocuments() {
        return null;
    }
}

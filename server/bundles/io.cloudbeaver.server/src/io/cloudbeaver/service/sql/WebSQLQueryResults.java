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

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.data.DBDDocument;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.meta.Property;

import java.util.ArrayList;
import java.util.List;

/**
 * Web SQL query results.
 */
public class WebSQLQueryResults {

    private static final Log log = Log.getLog(WebSQLQueryResults.class);

    private final WebSession webSession;
    private final WebDataFormat dataFormat;
    private Long updateRowCount;
    private WebSQLQueryResultSet resultSet;

    WebSQLQueryResults(@NotNull WebSession webSession, @Nullable WebDataFormat dataFormat) {
        this.webSession = webSession;
        this.dataFormat = dataFormat == null ? WebDataFormat.resultset : dataFormat;
    }

    @Property
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
        this.resultSet = resultSet;
    }

    @Property
    public WebSQLQueryResultSet getData() {
        return getResultSet();
    }

    public List<WebSQLDatabaseDocument> getDocuments() throws DBCException {
        if (dataFormat != WebDataFormat.document) {
            return null;
        }
        if (this.resultSet == null) {
            throw new DBCException("Null resultset");
        }
        if (this.resultSet.getColumns().length != 1 || this.resultSet.getColumns()[0].getAttribute().getDataKind() != DBPDataKind.DOCUMENT) {
            throw new DBCException("Non-document resultset columns");
        }

        List<WebSQLDatabaseDocument> documents = new ArrayList<>();
        for (Object[] row : resultSet.getRows()) {
            if (row.length != 1) {
                log.debug("Non-document row content");
            }
            if (row[0] == null) {
                documents.add(null);
            } else if (row[0] instanceof DBDDocument) {
                documents.add(new WebSQLDatabaseDocument(webSession, (DBDDocument) row[0]));
            } else {
                log.debug("Non-document row value: " + row[0].getClass().getName());
            }
        }

        return documents;
    }
}

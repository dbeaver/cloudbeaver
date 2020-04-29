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

import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.sql.SQLDialect;
import org.jkiss.utils.Pair;

/**
 * Web SQL dialect.
 */
public class WebSQLDialectInfo {

    private static final Log log = Log.getLog(WebSQLDialectInfo.class);

    private final DBPDataSource dataSource;
    private final SQLDialect dialect;

    public WebSQLDialectInfo(DBPDataSource dataSource, SQLDialect dialect) {
        this.dataSource = dataSource;
        this.dialect = dialect;
    }

    public String getName() {
        return dialect.getDialectName();
    }

    public String[] getDataTypes() {
        return dialect.getDataTypes(dataSource).toArray(new String[0]);
    }

    public String[] getFunctions() {
        return dialect.getFunctions(dataSource).toArray(new String[0]);
    }

    public String[] getReservedWords() {
        return dialect.getReservedWords().toArray(new String[0]);
    }

    public String[][] getQuoteStrings() {
        return dialect.getIdentifierQuoteStrings();
    }

    public String[] getSingleLineComments() {
        return dialect.getSingleLineComments();
    }

    public String[][] getMultiLineComments() {
        Pair<String, String> mlComments = dialect.getMultiLineComments();
        if (mlComments == null) {
            return new String[0][];
        }
        return new String[][] { { mlComments.getFirst(), mlComments.getSecond() } };
    }

    public String getCatalogSeparator() {
        return dialect.getCatalogSeparator();
    }

    public String getStructSeparator() {
        return String.valueOf(dialect.getStructSeparator());
    }

    public String getScriptDelimiter() {
        return dialect.getScriptDelimiter();
    }

}

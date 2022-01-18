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

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPContextProvider;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.DBDDataFilter;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.SQLScriptContext;
import org.jkiss.dbeaver.model.sql.data.SQLQueryDataContainer;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSObject;

import java.io.PrintWriter;

/**
 * Web SQL query data container.
 */
public class WebSQLQueryDataContainer implements DBSDataContainer, DBPContextProvider {

    private static final Log log = Log.getLog(WebSQLQueryDataContainer.class);

    private final DBPDataSource dataSource;
    private final String query;
    private final SQLQueryDataContainer queryDataContainer;

    public WebSQLQueryDataContainer(DBPDataSource dataSource, String query) {
        this.dataSource = dataSource;
        this.query = query;

        SQLScriptContext scriptContext = new SQLScriptContext(null,
            this, null, new PrintWriter(System.err, true), null);
        queryDataContainer = new SQLQueryDataContainer(this, new SQLQuery(dataSource, query), scriptContext, log);
    }

    @Nullable
    @Override
    public DBSObject getParentObject() {
        return dataSource;
    }

    @NotNull
    @Override
    public String getName() {
        return query;
    }

    @Override
    public boolean isPersisted() {
        return false;
    }

    @Nullable
    @Override
    public String getDescription() {
        return queryDataContainer.getDescription();
    }

    @Nullable
    @Override
    public DBPDataSource getDataSource() {
        return dataSource;
    }

    @Override
    public String[] getSupportedFeatures() {
        return queryDataContainer.getSupportedFeatures();
    }

    @NotNull
    @Override
    public DBCStatistics readData(@NotNull DBCExecutionSource source, @NotNull DBCSession session, @NotNull DBDDataReceiver dataReceiver, @Nullable DBDDataFilter dataFilter, long firstRow, long maxRows, long flags, int fetchSize) throws DBCException {
        return queryDataContainer.readData(source, session, dataReceiver, dataFilter, firstRow, maxRows, flags, fetchSize);
    }

    @Override
    public long countData(@NotNull DBCExecutionSource source, @NotNull DBCSession session, @Nullable DBDDataFilter dataFilter, long flags) throws DBCException {
        return queryDataContainer.countData(source, session, dataFilter, flags);
    }

    @Nullable
    @Override
    public DBCExecutionContext getExecutionContext() {
        return DBUtils.getDefaultContext(dataSource, false);
    }

}

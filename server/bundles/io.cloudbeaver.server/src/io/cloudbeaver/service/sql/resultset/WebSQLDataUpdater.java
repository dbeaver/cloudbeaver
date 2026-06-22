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

import io.cloudbeaver.service.sql.WebExecutionSource;
import io.cloudbeaver.service.sql.WebSQLQueryResultSetRow;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.data.resultset.DBDDataStatementInfo;
import org.jkiss.dbeaver.model.data.resultset.DBDResultSetDataUpdater;
import org.jkiss.dbeaver.model.edit.DBEPersistAction;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionSource;
import org.jkiss.dbeaver.model.exec.DBCStatistics;
import org.jkiss.dbeaver.model.struct.DBSDataManipulator;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class WebSQLDataUpdater extends DBDResultSetDataUpdater {

    private final List<DBDAttributeBinding> attributes;
    private final Set<WebSQLQueryResultSetRow> updatedResultSetRows = new LinkedHashSet<>();

    public WebSQLDataUpdater(
        @NotNull DBCExecutionContext executionContext,
        @NotNull List<DBEPersistAction> actions,
        @NotNull List<WebSQLDataStatementInfo> updateStatements,
        @NotNull List<WebSQLDataStatementInfo> insertStatements,
        @NotNull List<WebSQLDataStatementInfo> deleteStatements,
        @NotNull List<DBDAttributeBinding> attributes,
        boolean generateScript
    ) {
        super(executionContext, actions, updateStatements, insertStatements, deleteStatements, Map.of(), generateScript);
        this.attributes = attributes;
        updateStatements.forEach(s -> updatedResultSetRows.add(new WebSQLQueryResultSetRow(s.getFinalRow(), null)));
        insertStatements.forEach(s -> updatedResultSetRows.add(new WebSQLQueryResultSetRow(s.getFinalRow(), null)));
    }

    @NotNull
    public Set<WebSQLQueryResultSetRow> getUpdatedResultSetRows() {
        return updatedResultSetRows;
    }

    @Override
    protected void notifyContainer(@NotNull DBCStatistics statistics) {

    }

    @NotNull
    @Override
    protected DBCExecutionSource createExecutionSource(@NotNull DBSDataManipulator dataContainer) {
        return new WebExecutionSource(dataContainer, getExecutionContext(), this);
    }

    @Nullable
    @Override
    protected DBDDataReceiver getKeyReceiver(@NotNull DBDDataStatementInfo statement) {
        return new KeyDataReceiver(attributes);
    }

    public long getUpdatedRowsCount() {
        return insertStats.getRowsUpdated() + updateStats.getRowsUpdated() + deleteStats.getRowsUpdated();
    }

    public long getExecutionDuration() {
        return insertStats.getExecuteTime() + updateStats.getExecuteTime() + deleteStats.getExecuteTime();
    }

}

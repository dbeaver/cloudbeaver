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

import io.cloudbeaver.DBWService;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;

import java.util.List;
import java.util.Map;

/**
 * DBWServiceSQL
 */
public interface DBWServiceSQL extends DBWService {

    @WebAction
    WebSQLDialectInfo getDialectInfo(@NotNull WebSQLProcessor processor) throws DBWebException;

    @WebAction
    WebSQLCompletionProposal[] getCompletionProposals(@NotNull WebSQLContextInfo sqlContext, @NotNull String query, Integer position, Integer maxResults) throws DBWebException;

    @WebAction
    WebSQLContextInfo createContext(@NotNull WebSQLProcessor processor, String defaultCatalog, String defaultSchema);

    @WebAction
    void destroyContext(@NotNull WebSQLContextInfo sqlContext);

    @WebAction
    void setContextDefaults(@NotNull WebSQLContextInfo sqlContext, String catalogName, String schemaName) throws DBWebException;

    @WebAction
    @NotNull
    WebSQLExecuteInfo executeQuery(@NotNull WebSQLContextInfo contextInfo, @NotNull String sql, @Nullable WebSQLDataFilter filter, @Nullable WebDataFormat dataFormat) throws DBWebException;

    @WebAction
    Boolean closeResult(@NotNull WebSQLContextInfo sqlContext, @NotNull String resultId) throws DBWebException;

    @WebAction
    WebSQLExecuteInfo readDataFromContainer(@NotNull WebSQLContextInfo contextInfo, @NotNull String nodePath, @Nullable WebSQLDataFilter filter, WebDataFormat dataFormat) throws DBWebException;

    @WebAction
    WebSQLExecuteInfo updateResultsData(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull List<Object> updateRow,
        @NotNull Map<String, Object> updateValues, WebDataFormat dataFormat) throws DBWebException;

    @WebAction
    WebSQLExecuteInfo updateResultsDataBatch(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows, WebDataFormat dataFormat) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncExecuteQuery(@NotNull WebSQLContextInfo contextInfo, @NotNull String sql, @Nullable WebSQLDataFilter filter, @Nullable WebDataFormat dataFormat) throws DBException;

    @WebAction
    WebSQLExecuteInfo asyncGetQueryResults(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException;
}

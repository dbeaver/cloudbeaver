/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.WebTransactionLogInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWService;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.exec.DBCLogicalOperator;
import org.jkiss.dbeaver.model.exec.trace.DBCTraceProperty;
import org.jkiss.dbeaver.model.sql.registry.SQLGeneratorDescriptor;

import java.util.List;
import java.util.Map;

/**
 * DBWServiceSQL
 */
public interface DBWServiceSQL extends DBWService {

    @WebAction
    WebSQLContextInfo[] listContexts(
        @NotNull WebSession session,
        @Nullable String projectId,
        @Nullable String connectionId,
        @Nullable String contextId) throws DBWebException;

    @WebAction
    WebSQLDialectInfo getDialectInfo(@NotNull WebConnectionInfo processor) throws DBWebException;

    @WebAction
    WebSQLCompletionProposal[] getCompletionProposals(
        @NotNull WebSQLContextInfo sqlContext,
        @NotNull String query,
        Integer position,
        Integer maxResults,
        Boolean simpleMode) throws DBWebException;

    @WebAction
    String formatQuery(@NotNull WebSQLContextInfo sqlContext, @NotNull String query) throws DBWebException;

    @WebAction
    DBCLogicalOperator[] getSupportedOperations(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        int attributeIndex) throws DBWebException;

    @WebAction
    SQLGeneratorDescriptor[] getEntityQueryGenerators(
        @NotNull WebSession session,
        @NotNull List<String> nodePathList) throws DBWebException;

    @WebAction
    String generateEntityQuery(
        @NotNull WebSession session,
        @NotNull String generatorId,
        @NotNull Map<String, Object> options,
        @NotNull List<String> nodePathList) throws DBWebException;

    @WebAction
    WebSQLContextInfo createContext(
        @NotNull WebSQLProcessor processor,
        String projectId,
        String defaultCatalog,
        String defaultSchema) throws DBWebException;

    @WebAction
    void destroyContext(@NotNull WebSQLContextInfo sqlContext);

    @WebAction
    void setContextDefaults(@NotNull WebSQLContextInfo sqlContext, String catalogName, String schemaName) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncExecuteQuery(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String sql,
        @Nullable String resultId,
        @Nullable WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat,
        boolean readLogs,
        @NotNull WebSession webSession) throws DBException;

    @WebAction
    WebAsyncTaskInfo asyncReadDataFromContainer(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String nodePath,
        @Nullable String resultId,
        @Nullable WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat) throws DBWebException;

    /**
     * Reads dynamic trace from provided database results.
     */
    @NotNull
    @WebAction
    List<DBCTraceProperty> readDynamicTrace(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId
    ) throws DBException;

    @WebAction
    Boolean closeResult(@NotNull WebSQLContextInfo sqlContext, @NotNull String resultId) throws DBWebException;

    /**
     * Updates result set data (sync function).
     */
    @WebAction
    @Deprecated // use async function
    WebSQLExecuteInfo updateResultsDataBatch(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat
    ) throws DBWebException;

    /**
     * Creates async task for updating results data.
     */
    @WebAction
    WebAsyncTaskInfo asyncUpdateResultsDataBatch(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat
    ) throws DBWebException;

    /**
     * Reads cell LOB value from result set.
     */
    @WebAction
    String readLobValue(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull Integer lobColumnIndex,
        @NotNull WebSQLResultsRow row) throws DBWebException;

    @NotNull
    @WebAction
    String getCellValue(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull Integer lobColumnIndex,
        @NotNull WebSQLResultsRow row) throws DBWebException;

    @WebAction
    String updateResultsDataBatchScript(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        WebDataFormat dataFormat) throws DBWebException;

    @WebAction
    WebSQLExecuteInfo asyncGetQueryResults(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncSqlExplainExecutionPlan(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String sql,
        @NotNull Map<String, Object> options) throws DBException;

    @WebAction
    WebSQLExecutionPlan asyncSqlExplainExecutionPlanResult(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException;

    @WebAction
    WebSQLScriptInfo parseSqlScript(@NotNull WebConnectionInfo connectionInfo, @NotNull String sqlScript) throws DBWebException;

    @WebAction
    WebSQLQueryInfo parseSqlQuery(@NotNull WebConnectionInfo connectionInfo, @NotNull String sqlScript, int cursorPosition) throws DBWebException;

    @WebAction
    String generateGroupByQuery(@NotNull WebSQLContextInfo contextInfo,
                                @NotNull String resultsId,
                                @NotNull List<String> columnsList,
                                @Nullable List<String> functions,
                                @Nullable Boolean showDuplicatesOnly) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo getRowDataCount(@NotNull WebSession webSession, @NotNull WebSQLContextInfo contextInfo, @NotNull String resultsId) throws DBWebException;

    @Nullable
    @WebAction
    Long getRowDataCountResult(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncSqlSetAutoCommit(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo contextInfo,
        boolean autoCommit
    ) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncSqlRollbackTransaction(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo contextInfo
    ) throws DBWebException;

    @WebAction
    WebAsyncTaskInfo asyncSqlCommitTransaction(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo sqlContext);

    @WebAction
    WebTransactionLogInfo getTransactionLogInfo(
        @NotNull WebSession webSession,
        @NotNull WebSQLContextInfo sqlContext
    );
}

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
package io.cloudbeaver.service.sql;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionPreferenceStore;
import io.cloudbeaver.model.session.WebSessionProvider;
import io.cloudbeaver.server.jobs.SqlOutputLogReaderJob;
import io.cloudbeaver.service.sql.messages.WebSQLMessages;
import io.cloudbeaver.service.sql.resultset.WebDBDResultSetDataModel;
import io.cloudbeaver.service.sql.resultset.WebSQLDataUpdater;
import io.cloudbeaver.utils.WebEventUtils;
import io.cloudbeaver.websocket.event.task.WSSessionTaskConfirmationRequestEvent;
import io.cloudbeaver.websocket.event.task.WSSessionTaskQueryConfirmationRequestEvent;
import org.eclipse.jface.text.Document;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.data.resultset.ResultSetSaveSettings;
import org.jkiss.dbeaver.model.edit.DBEPersistAction;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.exec.output.DBCServerOutputReader;
import org.jkiss.dbeaver.model.exec.plan.DBCPlan;
import org.jkiss.dbeaver.model.exec.plan.DBCQueryPlanner;
import org.jkiss.dbeaver.model.exec.plan.DBCQueryPlannerConfiguration;
import org.jkiss.dbeaver.model.impl.AbstractExecutionSource;
import org.jkiss.dbeaver.model.impl.DefaultServerOutputReader;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseItem;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.qm.QMUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.*;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.sql.parser.SQLRuleManager;
import org.jkiss.dbeaver.model.sql.parser.SQLScriptParser;
import org.jkiss.dbeaver.model.struct.*;
import org.jkiss.dbeaver.model.websocket.event.WSEvent;
import org.jkiss.dbeaver.model.websocket.event.WSTransactionalCountEvent;
import org.jkiss.dbeaver.registry.confirmation.ConfirmationConstants;
import org.jkiss.dbeaver.registry.confirmation.ConfirmationDescriptor;
import org.jkiss.dbeaver.registry.confirmation.ConfirmationRegistry;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.nio.charset.StandardCharsets;
import java.text.MessageFormat;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Web SQL processor.
 */
public class WebSQLProcessor implements WebSessionProvider {

    private static final Log log = Log.getLog(WebSQLProcessor.class);

    private static final int MAX_RESULTS_COUNT = 100;

    private final WebSession webSession;
    private final WebConnectionInfo connection;
    private final SQLSyntaxManager syntaxManager;
    private final SQLRuleManager ruleManager;
    private final Map<String, WebSQLContextInfo> contexts = new LinkedHashMap<>();

    private final AtomicInteger contextId = new AtomicInteger();

    WebSQLProcessor(@NotNull WebSession webSession, @NotNull WebConnectionInfo connection) {
        this.webSession = webSession;
        this.connection = connection;

        syntaxManager = new SQLSyntaxManager();
        syntaxManager.init(
            connection.getDataSource().getSQLDialect(), connection.getDataSourceContainer().getPreferenceStore());

        ruleManager = new SQLRuleManager(syntaxManager);
        ruleManager.loadRules(connection.getDataSource(), false);
    }

    void dispose() {
        synchronized (contexts) {
            contexts.forEach((s, context) -> context.dispose());
            contexts.clear();
        }
    }

    public WebConnectionInfo getConnection() {
        return connection;
    }

    @Override
    public WebSession getWebSession() {
        return webSession;
    }

    public SQLSyntaxManager getSyntaxManager() {
        return syntaxManager;
    }

    SQLRuleManager getRuleManager() {
        return ruleManager;
    }

    public DBCExecutionContext getExecutionContext() {
        return DBUtils.getDefaultContext(connection.getDataSource(), false);
    }

    private DBCExecutionContext getExecutionContext(@NotNull DBSDataContainer dataContainer) {
        return DBUtils.getDefaultContext(dataContainer, false);
    }

    @NotNull
    public WebSQLContextInfo createContext(String defaultCatalog, String defaultSchema, String projectId) throws DBCException {
        String contextId = connection.getId() + ":" + this.contextId.incrementAndGet();
        WebSQLContextInfo contextInfo = new WebSQLContextInfo(this, contextId, defaultCatalog, defaultSchema, projectId);
        synchronized (contexts) {
            contexts.put(contextId, contextInfo);
        }
        return contextInfo;
    }

    @Nullable
    public WebSQLContextInfo getContext(@NotNull String contextId) {
        synchronized (contexts) {
            return contexts.get(contextId);
        }
    }

    @NotNull
    public WebSQLContextInfo[] getContexts() {
        synchronized (contexts) {
            return contexts.values().toArray(new WebSQLContextInfo[0]);
        }
    }

    public void destroyContext(@NotNull WebSQLContextInfo context) {
        context.dispose();
        synchronized (contexts) {
            contexts.remove(context.getId());
        }
    }

    @NotNull
    public WebSQLExecuteInfo processQuery(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String sql,
        @Nullable String resultId,
        @Nullable WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat,
        @NotNull WebSession webSession,
        @NotNull WebAsyncTaskInfo asyncTask,
        boolean readLogs,
        boolean useEvents
    ) throws DBWebException, DBCException {
        if (filter == null) {
            // Use default filter
            filter = new WebSQLDataFilter();
        }
        long startTime = System.currentTimeMillis();
        WebSQLExecuteInfo executeInfo = new WebSQLExecuteInfo();

        WebSQLParametersProvider parametersProvider = new WebSQLParametersProvider(webSession, asyncTask);

        var dataContainer = new WebSQLQueryDataContainer(connection.getDataSource(), syntaxManager, sql, parametersProvider);

        DBCExecutionContext context = getExecutionContext(dataContainer);

        try {
            final DBDDataFilter dataFilter = filter.makeDataFilter(
                monitor, (resultId == null ? null : contextInfo.getResults(resultId)));
            if (dataFilter.hasFilters()) {
                sql = context.getDataSource().getSQLDialect().addFiltersToQuery(
                    monitor,
                    context.getDataSource(),
                    sql,
                    dataFilter);
            }

            final WebSQLDataFilter webDataFilter = filter;

            Document document = new Document();
            document.set(sql);

            SQLParserContext parserContext = new SQLParserContext(
                context.getDataSource(),
                syntaxManager,
                ruleManager,
                document);

            SQLScriptElement element = SQLScriptParser.extractActiveQuery(parserContext, 0, sql.length());

            boolean isGenerated = false;
            if (element instanceof SQLControlCommand command) {
                SQLControlResult controlResult = dataContainer.getScriptContext().executeControlCommand(monitor, command);
                if (controlResult.getTransformed() != null) {
                    isGenerated = true;
                    element = controlResult.getTransformed();
                } else {
                    WebSQLQueryResults stats = new WebSQLQueryResults(webSession, dataFormat);
                    executeInfo.setResults(new WebSQLQueryResults[]{stats});
                }
            }
            if (element instanceof SQLQuery mainQuery) {

                if (useEvents) {
                    // fill query with parameters
                    mainQuery.setParameters(SQLScriptParser.parseParametersAndVariables(parserContext, 0, mainQuery.getLength()));
                    boolean isConfirmed =
                        dataContainer.getScriptContext().fillQueryParameters(mainQuery, () -> null, true) &&
                            confirmDangerousQueryIfNeeded(mainQuery.getScriptElements(), asyncTask, isGenerated);
                    if (!isConfirmed) {
                        throw new DBWebException("Query execution was cancelled by user");
                    }
                }

                DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
                    try (DBCSession session = context.openSession(monitor, resolveQueryPurpose(dataFilter), "Execute SQL")) {
                        List<SQLScriptElement> sqlQueries = mainQuery.getScriptElements();
                        for (SQLScriptElement sqlElement : sqlQueries) {
                            if (!(sqlElement instanceof SQLQuery sqlQuery)) {
                                log.error("Non-query script elements are not allowed: " + sqlElement);
                                continue;
                            }

                            AbstractExecutionSource source = new AbstractExecutionSource(
                                dataContainer,
                                session.getExecutionContext(),
                                WebSQLProcessor.this,
                                sqlQuery);

                            try (DBCStatement dbStat = DBUtils.makeStatement(
                                source,
                                session,
                                DBCStatementType.SCRIPT,
                                sqlQuery,
                                webDataFilter.getOffset(),
                                webDataFilter.getLimit()))
                            {
                                SqlOutputLogReaderJob sqlOutputLogReaderJob = null;
                                if (readLogs) {
                                    DBPDataSource dataSource = context.getDataSource();
                                    DBCServerOutputReader dbcServerOutputReader = DBUtils.getAdapter(DBCServerOutputReader.class, dataSource);
                                    if (dbcServerOutputReader == null) {
                                        dbcServerOutputReader = new DefaultServerOutputReader();
                                    }
                                    sqlOutputLogReaderJob = new SqlOutputLogReaderJob(
                                        webSession, context, dbStat, dbcServerOutputReader, contextInfo.getId());
                                    sqlOutputLogReaderJob.schedule();
                                }
                                // Set query timeout
                                int queryTimeout = session.getDataSource().getContainer().getPreferenceStore()
                                    .getInt(WebSQLConstants.QUOTA_PROP_SQL_QUERY_TIMEOUT);
                                if (queryTimeout <= 0) {
                                    queryTimeout = CommonUtils.toInt(
                                        getWebSession().getApplication().getAppConfiguration()
                                            .getResourceQuota(WebSQLConstants.QUOTA_PROP_SQL_QUERY_TIMEOUT));
                                }
                                if (queryTimeout > 0) {
                                    try {
                                        dbStat.setStatementTimeout(queryTimeout);
                                    } catch (Throwable e) {
                                        log.debug("Can't set statement timeout:" + e.getMessage());
                                    }
                                }

                                boolean hasResultSet = dbStat.executeStatement();

                                // Wait SqlLogStateJob, if its starts
                                if (sqlOutputLogReaderJob != null) {
                                    sqlOutputLogReaderJob.join();
                                }
                                fillQueryResults(
                                    contextInfo,
                                    dataContainer,
                                    dbStat,
                                    hasResultSet,
                                    executeInfo,
                                    webDataFilter,
                                    dataFilter,
                                    dataFormat,
                                    sqlElement.getOriginalText()
                                );
                            }
                        }
                    }
                });
            } else {
                executeInfo.setResults(new WebSQLQueryResults[0]);
            }
        } catch (DBException e) {
            throw new DBWebException("Error executing query", e);
        }
        DBCTransactionManager txnManager = DBUtils.getTransactionManager(context);
        if (txnManager != null && !txnManager.isAutoCommit()) {
            sendTransactionalEvent(contextInfo);
        }

        executeInfo.setDuration(System.currentTimeMillis() - startTime);
        if (executeInfo.getResults().length == 0) {
            executeInfo.setStatusMessage("No Data");
        } else {
            executeInfo.setStatusMessage("Executed");
        }

        return executeInfo;
    }

    @NotNull
    public WebSQLExecuteInfo readDataFromContainer(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBSDataContainer dataContainer,
        @Nullable String resultId,
        @NotNull WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat
    ) throws DBException {

        WebSQLExecuteInfo executeInfo = new WebSQLExecuteInfo();

        DBCExecutionContext executionContext = DBUtils.getOrOpenDefaultContext(dataContainer, false);
        DBDDataFilter dataFilter = filter.makeDataFilter(
            monitor, (resultId == null ? null : contextInfo.getResults(resultId)));
        DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
            try (DBCSession session = executionContext.openSession(monitor, resolveQueryPurpose(dataFilter), "Read data from container")) {
                try (
                    WebSQLQueryDataReceiver dataReceiver = new WebSQLQueryDataReceiver(contextInfo, dataContainer, dataFormat, dataFilter)
                ) {
                    DBCStatistics statistics = dataContainer.readData(
                        new WebExecutionSource(dataContainer, executionContext, this),
                        session,
                        dataReceiver,
                        dataFilter,
                        filter.getOffset(),
                        filter.getLimit(),
                        DBSDataContainer.FLAG_NONE,
                        filter.getLimit());
                    executeInfo.setDuration(statistics.getTotalTime());

                    WebSQLQueryResults results = new WebSQLQueryResults(webSession, dataFormat);
                    WebSQLQueryResultSet resultSet = dataReceiver.getResultSet();
                    results.setResultSet(resultSet);

                    executeInfo.setResults(new WebSQLQueryResults[]{results});
                    setResultFilterText(session.getDataSource(), executeInfo, dataFilter);
                    executeInfo.setFullQuery(statistics.getQueryText());
                    if (resultSet != null && resultSet.getRowsWithMetaData() != null && resultSet.getResultsInfo() != null) {
                        resultSet.getResultsInfo().setQueryText(statistics.getQueryText());
                        executeInfo.setStatusMessage(resultSet.getRowsWithMetaData().size() + " row(s) fetched");
                    }
                }
            }
        });
        return executeInfo;
    }

    @NotNull
    public WebSQLExecuteInfo updateResultsDataBatch(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat
    ) throws DBException {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);
        Set<DBDRowIdentifier> rowIdentifierList = getRowIdentifiers(
            resultsInfo,
            updatedRows,
            deletedRows,
            addedRows
        );
        validateRowIdentifiers(resultsInfo, rowIdentifierList, updatedRows, deletedRows, addedRows);

        DBCExecutionContext executionContext = getExecutionContext(resultsInfo.getDataContainer());

        WebDBDResultSetDataModel dataProvider = new WebDBDResultSetDataModel(
            contextInfo,
            resultsInfo,
            addedRows,
            updatedRows,
            deletedRows
        );

        WebSQLDataUpdater updater = new WebSQLDataUpdater(
            webSession,
            dataProvider,
            resultsInfo,
            executionContext
        );

        ResultSetSaveSettings settings = new ResultSetSaveSettings();
        updater.prepareStatements(monitor, settings);
        if (!updater.execute(monitor, false, settings, null)) {
            Throwable error = updater.getExecutionError();
            throw new DBCException(
                "Error persisting data changes",
                error == null ? new DBException("Data update failed") : error
            );
        }

        getUpdatedRowsInfo(resultsInfo, updater.getUpdatedResultSetRows(), dataFormat, monitor);

        if (!updater.isAutoCommitEnabled()) {
            sendTransactionalEvent(contextInfo);
        }

        WebSQLQueryResultSet updatedResultSet = new WebSQLQueryResultSet();
        updatedResultSet.setResultsInfo(resultsInfo);
        updatedResultSet.setColumns(resultsInfo.getAttributes());

        WebSQLQueryResults updateResults = new WebSQLQueryResults(webSession, dataFormat);
        updateResults.setUpdateRowCount(updater.getUpdatedRowsCount());
        updateResults.setResultSet(updatedResultSet);
        updatedResultSet.setRows(List.of(updater.getUpdatedResultSetRows().toArray(new WebSQLQueryResultSetRow[0])));

        WebSQLExecuteInfo result = new WebSQLExecuteInfo();
        result.setDuration(updater.getExecutionDuration());
        List<WebSQLQueryResults> queryResults = new ArrayList<>();
        queryResults.add(updateResults);
        result.setResults(queryResults.toArray(new WebSQLQueryResults[0]));

        return result;
    }

    private void validateRowIdentifiers(
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull Set<DBDRowIdentifier> rowIdentifiers,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows
    ) throws DBCException {
        if (!CommonUtils.isEmpty(deletedRows) || !CommonUtils.isEmpty(addedRows)) {
            for (DBDRowIdentifier identifier : rowIdentifiers) {
                if (identifier == null || !identifier.isValidIdentifier()) {
                    throw new DBCException("Can't detect a valid row identifier for data update");
                }
            }
        }
        if (!CommonUtils.isEmpty(updatedRows)) {
            DBDAttributeBinding[] attributes = resultsInfo.getAttributes();
            for (WebSQLResultsRow row : updatedRows) {
                for (String indexValue : row.getUpdateValues().keySet()) {
                    int index = CommonUtils.toInt(indexValue, -1);
                    if (index < 0 || index >= attributes.length) {
                        throw new DBCException("Invalid updated attribute index: " + indexValue);
                    }
                    DBDRowIdentifier identifier = attributes[index].getRowIdentifier();
                    if (identifier == null || !identifier.isValidIdentifier()) {
                        throw new DBCException(
                            "Attribute '" + attributes[index].getName() + "' has no valid row identifier"
                        );
                    }
                }
            }
        }
    }

    @NotNull
    private Set<DBDRowIdentifier> getRowIdentifiers(
        @NotNull WebSQLResultsInfo resultsInfo,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows
    ) {
        Set<DBDRowIdentifier> rowIdentifierList = new HashSet<>();
        // several row identifiers could be if we update result set table with join
        // we can't add or delete rows from result set table with join
        if (!CommonUtils.isEmpty(deletedRows) || !CommonUtils.isEmpty(addedRows)) {
            rowIdentifierList.add(resultsInfo.getDefaultRowIdentifier());
        } else if (!CommonUtils.isEmpty(updatedRows)) {
            rowIdentifierList = resultsInfo.getRowIdentifiers();
        }
        return rowIdentifierList;
    }

    private void sendTransactionalEvent(@NotNull WebSQLContextInfo contextInfo) {
        int count = QMUtils.getTransactionState(getExecutionContext()).getUpdateCount();
        webSession.addSessionEvent(
            new WSTransactionalCountEvent(
                WebEventUtils.getSmSessionId(webSession),
                contextInfo.getWebSession().getUserId(),
                contextInfo.getProjectId(),
                contextInfo.getId(),
                contextInfo.getConnectionId(),
                count
            )
        );
    }

    private void getUpdatedRowsInfo(
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull Set<WebSQLQueryResultSetRow> newResultSetRows,
        @Nullable WebDataFormat dataFormat,
        @NotNull DBRProgressMonitor monitor
    ) throws DBException {
        try (DBCSession session = getExecutionContext().openSession(
            monitor,
            DBCExecutionPurpose.UTIL,
            "Refresh row(s) after insert/update")
        ) {
            boolean canRefreshResults = resultsInfo.canRefreshResults();
            for (WebSQLQueryResultSetRow row : newResultSetRows) {
                if (row.getData().length == 0) {
                    continue;
                }
                if (!canRefreshResults) {
                    makeWebCellRow(resultsInfo, row, dataFormat);
                    continue;
                }
                List<DBDAttributeConstraint> constraints = new ArrayList<>();
                boolean hasKey = true;
                // get attributes only from row identifiers
                Set<DBDAttributeBinding> idAttributes = resultsInfo.getRowIdentifiers().stream()
                    .flatMap(r -> r.getAttributes().stream())
                    .collect(Collectors.toSet());
                for (DBDAttributeBinding attr : idAttributes) {
                    if (attr.getRowIdentifier() == null) {
                        continue;
                    }
                    final Object keyValue = row.getData()[attr.getOrdinalPosition()];
                    if (DBUtils.isNullValue(keyValue)) {
                        hasKey = false;
                        break;
                    }
                    final DBDAttributeConstraint constraint = new DBDAttributeConstraint(attr);
                    constraint.setOperator(DBCLogicalOperator.EQUALS);
                    constraint.setValue(keyValue);
                    constraints.add(constraint);
                }
                if (!hasKey) {
                    // No key value for this row
                    makeWebCellRow(resultsInfo, row, dataFormat);
                    continue;
                }
                DBDDataFilter filter = new DBDDataFilter(constraints);
                DBSDataContainer dataContainer = resultsInfo.getDataContainer();
                WebRowDataReceiver dataReceiver = new WebRowDataReceiver(resultsInfo.getAttributes(), row.getData(), dataFormat);
                dataContainer.readData(
                    new AbstractExecutionSource(dataContainer, getExecutionContext(dataContainer), this),
                    session,
                    dataReceiver,
                    filter,
                    0,
                    0,
                    DBSDataContainer.FLAG_REFRESH,
                    0);
            }
        }
    }

    private void makeWebCellRow(
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull WebSQLQueryResultSetRow row,
        @Nullable WebDataFormat dataFormat
    ) throws DBCException {
        for (int i = 0; i < row.getData().length; i++) {
            row.getData()[i] = WebSQLUtils.makeWebCellValue(
                webSession,
                resultsInfo.getAttributeByPosition(i),
                row.getData()[i],
                dataFormat);
        }
    }

    @NotNull
    public String generateResultsDataUpdateScript(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows
    ) throws DBException {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);
        Set<DBDRowIdentifier> rowIdentifierList = getRowIdentifiers(
            resultsInfo,
            updatedRows,
            deletedRows,
            addedRows
        );
        validateRowIdentifiers(resultsInfo, rowIdentifierList, updatedRows, deletedRows, addedRows);

        DBCExecutionContext executionContext = getExecutionContext(resultsInfo.getDataContainer());
        WebDBDResultSetDataModel dataProvider = new WebDBDResultSetDataModel(
            contextInfo,
            resultsInfo,
            addedRows,
            updatedRows,
            deletedRows
        );

        WebSQLDataUpdater updater = new WebSQLDataUpdater(
            webSession,
            dataProvider,
            resultsInfo,
            executionContext
        );

        StringBuilder sqlBuilder = new StringBuilder();
        updater.prepareStatements(monitor, new ResultSetSaveSettings());
        if (!updater.execute(monitor, true, new ResultSetSaveSettings(), null)) {
            Throwable error = updater.getExecutionError();
            throw new DBCException(
                "Error generating data update script",
                error == null ? new DBException("Script generation failed") : error
            );
        }
        sqlBuilder.append(
            SQLUtils.generateScript(executionContext.getDataSource(), updater.getActions().toArray(new DBEPersistAction[0]), false)
        );
        return sqlBuilder.toString();
    }

    ////////////////////////////////////////////////
    // ExecutionPlan

    @NotNull
    public WebSQLExecutionPlan explainExecutionPlan(
        @NotNull DBRProgressMonitor monitor,
        @NotNull String sql,
        @NotNull Map<String, Object> configuration) throws DBWebException {

        DBCQueryPlanner planner;
        DBCExecutionContext executionContext = getExecutionContext();
        if (executionContext != null) {
            DBPDataSource dataSource = executionContext.getDataSource();
            planner = GeneralUtils.adapt(dataSource, DBCQueryPlanner.class);
        } else {
            throw new DBWebException("Not connected to data source");
        }

        if (planner == null) {
            throw new DBWebException("Datasource '" + executionContext.getDataSource() + "' doesn't support execution plan");
        }

        DBCPlan[] dbcPlan = new DBCPlan[1];

        try {
            DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
                try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Execute SQL")) {
                    DBCQueryPlannerConfiguration planConfig = new DBCQueryPlannerConfiguration();
                    planConfig.getParameters().putAll(configuration);
                    dbcPlan[0] = planner.planQueryExecution(session, sql, planConfig);
                }
            });
        } catch (DBException e) {
            throw new DBWebException("Error explaining execution plan", e);
        }

        return new WebSQLExecutionPlan(webSession, dbcPlan[0]);
    }

    @NotNull
    public String readLobValue(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull Integer lobColumnIndex,
        @NotNull WebSQLResultsRow row
    ) throws DBException {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);

        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        String tableName;
        if (rowIdentifier == null && resultsInfo.isSingleRow()) {
            tableName = resultsInfo.getDataContainer().getName();
        } else {
            checkRowIdentifier(resultsInfo, rowIdentifier);
            tableName = rowIdentifier.getEntity().getName();
        }
        WebSQLDataLOBReceiver dataReceiver = new WebSQLDataLOBReceiver(tableName, resultsInfo.getDataContainer(), lobColumnIndex);
        readCellDataValue(monitor, resultsInfo, row, dataReceiver);
        try {
            return dataReceiver.createLobFile(monitor);
        } catch (Exception e) {
            throw new DBWebException("Error creating temporary lob file ", e);
        }
    }

    private void readCellDataValue(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull WebSQLResultsRow row,
        @NotNull WebSQLCellValueReceiver dataReceiver
    ) throws DBException {
        DBSDataContainer dataContainer = resultsInfo.getDataContainer();
        DBCExecutionContext executionContext = getExecutionContext(dataContainer);
        try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Generate data update batches")) {
            DBDDataFilter dataFilter = new DBDDataFilter();
            addKeyAttributes(monitor, resultsInfo, row, dataContainer, session, dataFilter);
            WebExecutionSource executionSource = new WebExecutionSource(dataContainer, executionContext, this);
            dataContainer.readData(
                executionSource, session, dataReceiver, dataFilter,
                0, 1, DBSDataContainer.FLAG_NONE, 1);
        }
    }

    private void addKeyAttributes(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull WebSQLResultsRow row,
        @NotNull DBSDataContainer dataContainer,
        @NotNull DBCSession session,
        @NotNull DBDDataFilter dataFilter
    ) throws DBException {
        if (resultsInfo.isSingleRow()) {
            long rowCount = DBUtils.readRowCount(monitor, session.getExecutionContext(), dataContainer, null, this);
            if (rowCount == 1) {
                return;
            }
        }
        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        checkRowIdentifier(resultsInfo, rowIdentifier);
        DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);
        Object[] rowValues = new Object[keyAttributes.length];
        List<DBDAttributeConstraint> constraints = new ArrayList<>();
        for (int i = 0; i < keyAttributes.length; i++) {
            DBDAttributeBinding keyAttribute = keyAttributes[i];
            boolean isDocumentValue = keyAttributes.length == 1
                                      && keyAttribute.getDataKind() == DBPDataKind.DOCUMENT
                                      && dataContainer instanceof DBSDocumentLocator;
            if (isDocumentValue) {
                rowValues[i] =
                    WebSQLUtils.makeDocumentInputValue(session, (DBSDocumentLocator) dataContainer, resultsInfo, row, null);
            } else {
                Object inputCellValue = row.getValues()[keyAttribute.getOrdinalPosition()];
                rowValues[i] = keyAttribute.getValueHandler().getValueFromObject(
                    session,
                    keyAttribute,
                    WebSQLUtils.convertInputCellValue(
                        session, keyAttribute,
                        inputCellValue, false),
                    false,
                    true);
            }
            final DBDAttributeConstraint constraint = new DBDAttributeConstraint(keyAttribute);
            constraint.setOperator(DBCLogicalOperator.EQUALS);
            constraint.setValue(rowValues[i]);
            constraints.add(constraint);
        }
        dataFilter.addConstraints(constraints);
    }

    /**
     * Reads cell value as string from provided row and column index.
     */
    @NotNull
    public String readStringValue(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull Integer columnIndex,
        @NotNull WebSQLResultsRow row
    ) throws DBException {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);
        if (!resultsInfo.isSingleRow()) {
            DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
            checkRowIdentifier(resultsInfo, rowIdentifier);
        }
        WebSQLCellValueReceiver dataReceiver = new WebSQLCellValueReceiver(resultsInfo.getDataContainer(), columnIndex);
        readCellDataValue(monitor, resultsInfo, row, dataReceiver);
        return new String(dataReceiver.getBinaryValue(monitor), StandardCharsets.UTF_8);
    }

    ////////////////////////////////////////////////
    // Misc

    private void checkRowIdentifier(WebSQLResultsInfo resultsInfo, DBDRowIdentifier rowIdentifier) throws DBWebException {
        if (rowIdentifier == null || !rowIdentifier.isValidIdentifier()) {
            throw new DBWebException("Can't detect row identifier for data container '" + resultsInfo.getDataContainer().getName() + "'. It must have at least one unique key.");
        }
    }

    private void checkDataEditAllowed(DBSEntity dataContainer) throws DBWebException {
        if (!(dataContainer instanceof DBSDataManipulator)) {
            throw new DBWebException("Data container '" + dataContainer.getName() + "' is not editable");
        }
    }

    @NotNull
    public <T> T getDataContainerByNodePath(DBRProgressMonitor monitor, @NotNull String containerPath, Class<T> type) throws DBException {
        DBNNode node = webSession.getNavigatorModelOrThrow().getNodeByPath(monitor, containerPath);
        if (node == null) {
            throw new DBWebException("Container node '" + containerPath + "' not found");
        }
        if (!(node instanceof DBNDatabaseItem)) {
            throw new DBWebException("Container node '" + containerPath + "' is not a database item");
        }
        DBSObject object = ((DBNDatabaseItem) node).getObject();
        if (!type.isInstance(object)) {
            throw new DBWebException("Container node '" + containerPath + "' doesn't implement " + type.getName());
        }
        return type.cast(object);
    }


    private void fillQueryResults(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull DBSDataContainer dataContainer,
        @NotNull DBCStatement dbStat,
        boolean hasResultSet,
        @NotNull WebSQLExecuteInfo executeInfo,
        @NotNull WebSQLDataFilter webDataFilter,
        @NotNull DBDDataFilter dataFilter,
        @Nullable WebDataFormat dataFormat,
        @NotNull String originalQuery
    ) throws DBException {

        List<WebSQLQueryResults> resultList = new ArrayList<>();
        int maxResultsCount = resolveMaxResultsCount(dataContainer.getDataSource());
        WebSQLQueryResults stats = new WebSQLQueryResults(webSession, dataFormat);
        long rowsUpdated = 0;
        for (int i = 0; i < maxResultsCount; i++) {
            if (hasResultSet) {
                WebSQLQueryResults results = new WebSQLQueryResults(webSession, dataFormat);
                try (DBCResultSet resultSet = dbStat.openResultSet()) {
                    if (resultSet == null) {
                        break;
                    }
                    try (
                        WebSQLQueryDataReceiver dataReceiver = new WebSQLQueryDataReceiver(
                            contextInfo,
                            dataContainer,
                            dataFormat,
                            dataFilter
                        )
                    ) {
                        readResultSet(dbStat.getSession(), resultSet, webDataFilter, dataReceiver);
                        results.setResultSet(dataReceiver.getResultSet());
                    }
                }
                resultList.add(results);
            } else {
                long updateRowCount = dbStat.getUpdateRowCount();
                if (updateRowCount >= 0) {
                    rowsUpdated += updateRowCount;
                } else {
                    break;
                }
            }
            hasResultSet = dbStat.nextResults();
        }
        if (resultList.isEmpty()) {
            stats.setUpdateRowCount(rowsUpdated);
            resultList.add(stats);
        }
        executeInfo.setResults(resultList.toArray(new WebSQLQueryResults[0]));

        setResultFilterText(dbStat.getSession().getDataSource(), executeInfo, dataFilter);
        executeInfo.setFullQuery(dbStat.getQueryString());
        executeInfo.setOriginalQuery(originalQuery);
    }

    private void setResultFilterText(
        @NotNull DBPDataSource dataSource,
        @NotNull WebSQLExecuteInfo executeInfo,
        @NotNull DBDDataFilter filter
    ) throws DBException {
        if (filter.getConstraintsCount() > 0 || !CommonUtils.isEmpty(filter.getWhere())) {
            StringBuilder where = new StringBuilder();
            SQLUtils.appendConditionString(
                filter,
                dataSource,
                null,
                where,
                true);
            executeInfo.setFilterText(where.toString());
        }
    }

    private void readResultSet(
        @NotNull DBCSession session,
        @NotNull DBCResultSet dbResult,
        @NotNull WebSQLDataFilter filter,
        @NotNull WebSQLQueryDataReceiver dataReceiver
    ) throws DBException {
        DBDDataReceiver.startFetchWorkflow(dataReceiver, session, dbResult, filter.getOffset(), filter.getLimit());
        int rowCount = 0;
        while (dbResult.nextRow()) {
            if (rowCount > filter.getLimit()) {
                break;
            }

            dataReceiver.fetchRow(session, dbResult);
            rowCount++;
        }
    }

    public class WebRowDataReceiver extends RowDataReceiver {
        private final WebDataFormat dataFormat;

        public WebRowDataReceiver(DBDAttributeBinding[] curAttributes, Object[] rowValues, WebDataFormat dataFormat) {
            super(curAttributes);
            this.rowValues = rowValues;
            this.dataFormat = dataFormat;
        }

        @Override
        protected void fetchRowValues(DBCSession session, DBCResultSet resultSet) throws DBCException {
            for (int i = 0; i < curAttributes.length; i++) {
                final DBDAttributeBinding attr = curAttributes[i];
                DBDValueHandler valueHandler = attr.getValueHandler();
                Object attrValue = valueHandler.fetchValueObject(session, resultSet, attr, i);

                // Patch result rows (adapt to web format)
                rowValues[i] = WebSQLUtils.makeWebCellValue(webSession, attr, attrValue, dataFormat);
            }
        }

    }


    ///////////////////////////////////////////////////////
    // Utils
    private static int resolveMaxResultsCount(@Nullable DBPDataSource dataSource) {
        if (dataSource == null) {
            return MAX_RESULTS_COUNT;
        }
        return dataSource.getInfo().supportsMultipleResults() ? MAX_RESULTS_COUNT : 1;
    }

    private static DBCExecutionPurpose resolveQueryPurpose(DBDDataFilter filter) {
        return filter.hasFilters() ? DBCExecutionPurpose.USER_FILTERED : DBCExecutionPurpose.USER;
    }

    private boolean confirmDangerousQueryIfNeeded(
        @NotNull List<SQLScriptElement> scriptElements,
        @NotNull WebAsyncTaskInfo asyncTask,
        boolean isGenerated
    ) throws DBWebException {
        Boolean skipConfirmations = webSession.getAttribute(WebSQLConstants.SKIP_TASK_CONFIRMATIONS_ATTR);
        if (skipConfirmations != null && skipConfirmations) {
            return true;
        }

        boolean hasGeneratedUpdates = false;
        boolean hasDangerousUpdates = false;
        boolean hasDropStatement = false;
        String title = null;
        String message = null;
        String queryPreview = null;
        if (isGenerated) {
            Set<SQLQueryCategory> categories = SQLQueryCategory.categorizeScript(scriptElements);
            hasGeneratedUpdates = categories.contains(SQLQueryCategory.DDL) ||
                categories.contains(SQLQueryCategory.DML) ||
                categories.contains(SQLQueryCategory.UNKNOWN);
            title = WebSQLMessages.model_web_ai_query_confirmation_title;
            message = WebSQLMessages.model_web_ai_query_confirmation_message;
            queryPreview = scriptElements.stream()
                .map(SQLScriptElement::getText)
                .collect(Collectors.joining("\n\n"));
        } else {
            WebSessionPreferenceStore store = webSession.getUserPreferenceStore();
            boolean confirmDangerousQueries = store.getUserPreferenceBoolean(ConfirmationConstants.CONFIRM_DANGER_SQL_KEY, true);
            boolean confirmDropQueries = store.getUserPreferenceBoolean(ConfirmationConstants.CONFIRM_DROP_SQL_KEY, true);
            for (SQLScriptElement scriptElement : scriptElements) {
                if (scriptElement instanceof SQLQuery sqlQuery) {
                    if (confirmDangerousQueries && sqlQuery.isDeleteUpdateDangerous()) {
                        hasDangerousUpdates = true;
                        ConfirmationDescriptor descriptor = ConfirmationRegistry.getInstance()
                            .getConfirmation(ConfirmationConstants.CONFIRM_DANGER_SQL_ID);
                        title = descriptor.getLocalizedTitle(webSession.getLocale());
                        var entityMetadata = sqlQuery.getEntityMetadata(false);
                        message = MessageFormat.format(
                            descriptor.getLocalizedMessage(webSession.getLocale()),
                            sqlQuery.getType().name(),
                            entityMetadata != null ? entityMetadata.getEntityName() : "multiple tables"
                        );
                        break;
                    }
                    if (confirmDropQueries && sqlQuery.isDropDangerous()) {
                        hasDropStatement = true;
                        ConfirmationDescriptor descriptor = ConfirmationRegistry.getInstance()
                            .getConfirmation(ConfirmationConstants.CONFIRM_DROP_SQL_ID);
                        title = descriptor.getLocalizedTitle(webSession.getLocale());
                        message = MessageFormat.format(
                            descriptor.getLocalizedMessage(webSession.getLocale()),
                            sqlQuery.getText()
                        );
                        break;
                    }
                }
            }
        }

        if (!hasGeneratedUpdates && !hasDangerousUpdates && !hasDropStatement) {
            return true;
        } else {
            WSEvent confirmationEvent = createConfirmationEvent(asyncTask, queryPreview, title, message);
            CompletableFuture<Boolean> confirmationFuture = new CompletableFuture<>();
            return CommonUtils.toBoolean(WebSQLUtils.requestConfirmation(webSession, asyncTask, confirmationEvent, confirmationFuture));
        }
    }

    @NotNull
    private WSEvent createConfirmationEvent(
        @NotNull WebAsyncTaskInfo asyncTask,
        @Nullable String query,
        @NotNull String title,
        @NotNull String message
    ) {
        WSEvent confirmationEvent;
        if (query != null) {
            confirmationEvent = new WSSessionTaskQueryConfirmationRequestEvent(
                asyncTask.getId(), title, message, query
            );
        } else {
            confirmationEvent = new WSSessionTaskConfirmationRequestEvent(
                asyncTask.getId(), title, message
            );
        }
        return confirmationEvent;
    }
}

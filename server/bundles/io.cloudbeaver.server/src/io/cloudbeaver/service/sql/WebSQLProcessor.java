/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import com.google.gson.internal.LinkedTreeMap;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionProvider;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.jobs.SqlOutputLogReaderJob;
import org.eclipse.jface.text.Document;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.*;
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
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.*;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.sql.parser.SQLRuleManager;
import org.jkiss.dbeaver.model.sql.parser.SQLScriptParser;
import org.jkiss.dbeaver.model.struct.*;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Web SQL processor.
 */
public class WebSQLProcessor implements WebSessionProvider {

    private static final Log log = Log.getLog(WebSQLProcessor.class);

    private static final int MAX_RESULTS_COUNT = 100;

    private static final String FILE_ID = "fileId";
    private static final String TEMP_FILE_FOLDER = "temp-sql-upload-files";

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
        boolean readLogs) throws DBWebException {
        if (filter == null) {
            // Use default filter
            filter = new WebSQLDataFilter();
        }
        long startTime = System.currentTimeMillis();
        WebSQLExecuteInfo executeInfo = new WebSQLExecuteInfo();

        var dataContainer = new WebSQLQueryDataContainer(connection.getDataSource(), sql);

        DBCExecutionContext context = getExecutionContext(dataContainer);

        try {
            final DBDDataFilter dataFilter = filter.makeDataFilter((resultId == null ? null : contextInfo.getResults(resultId)));
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

            if (element instanceof SQLControlCommand command) {
                dataContainer.getScriptContext().executeControlCommand(command);
                WebSQLQueryResults stats = new WebSQLQueryResults(webSession, dataFormat);
                executeInfo.setResults(new WebSQLQueryResults[]{stats});
            } else if (element instanceof SQLQuery sqlQuery) {
                DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
                    try (DBCSession session = context.openSession(monitor, resolveQueryPurpose(dataFilter), "Execute SQL")) {
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
                            int queryTimeout = (int) session.getDataSource().getContainer().getPreferenceStore()
                                .getDouble(WebSQLConstants.QUOTA_PROP_SQL_QUERY_TIMEOUT);
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
                            fillQueryResults(contextInfo, dataContainer, dbStat, hasResultSet, executeInfo, webDataFilter, dataFilter, dataFormat);
                        } catch (DBException e) {
                            throw new InvocationTargetException(e);
                        }
                    }
                });
            }
        } catch (DBException e) {
            throw new DBWebException("Error executing query", e);
        }
        executeInfo.setDuration(System.currentTimeMillis() - startTime);
        if (executeInfo.getResults().length == 0) {
            executeInfo.setStatusMessage("No Data");
        } else {
            executeInfo.setStatusMessage("Success");
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
        @Nullable WebDataFormat dataFormat) throws DBException {

        WebSQLExecuteInfo executeInfo = new WebSQLExecuteInfo();

        DBCExecutionContext executionContext = getExecutionContext(dataContainer);
        DBDDataFilter dataFilter = filter.makeDataFilter((resultId == null ? null : contextInfo.getResults(resultId)));
        DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
            try (DBCSession session = executionContext.openSession(monitor, resolveQueryPurpose(dataFilter), "Read data from container")) {
                try (WebSQLQueryDataReceiver dataReceiver = new WebSQLQueryDataReceiver(contextInfo, dataContainer, dataFormat)) {
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
                    setResultFilterText(dataContainer, session.getDataSource(), executeInfo, dataFilter);
                    executeInfo.setFullQuery(statistics.getQueryText());
                    if (resultSet != null && resultSet.getRows() != null) {
                        resultSet.getResultsInfo().setQueryText(statistics.getQueryText());
                        executeInfo.setStatusMessage(resultSet.getRows().length + " row(s) fetched");
                    }
                } catch (DBException e) {
                    throw new InvocationTargetException(e);
                }
            }
        });
        return executeInfo;
    }

    public WebSQLExecuteInfo updateResultsDataBatch(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat) throws DBException
    {
        Set<Object[]> newResultSetRows = new LinkedHashSet<>();
        KeyDataReceiver keyReceiver = new KeyDataReceiver(contextInfo.getResults(resultsId));
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);

        Set<DBDRowIdentifier> rowIdentifierList = new HashSet<>();
        // several row identifiers could be if we update result set table with join
        // we can't add or delete rows from result set table with join
        if (!CommonUtils.isEmpty(deletedRows) || !CommonUtils.isEmpty(addedRows)) {
            rowIdentifierList.add(resultsInfo.getDefaultRowIdentifier());
        } else if (!CommonUtils.isEmpty(updatedRows)) {
            rowIdentifierList = resultsInfo.getRowIdentifiers();
        }

        long totalUpdateCount = 0;

        WebSQLExecuteInfo result = new WebSQLExecuteInfo();
        List<WebSQLQueryResults> queryResults = new ArrayList<>();
        for (var rowIdentifier : rowIdentifierList) {
            Map<DBSDataManipulator.ExecuteBatch, Object[]> resultBatches = new LinkedHashMap<>();
            DBSDataManipulator dataManipulator = generateUpdateResultsDataBatch(
                monitor, resultsInfo, rowIdentifier, updatedRows, deletedRows, addedRows, dataFormat, resultBatches, keyReceiver);


            DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
            try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Update data in container")) {
                DBCTransactionManager txnManager = DBUtils.getTransactionManager(executionContext);
                boolean revertToAutoCommit = false;
                if (txnManager != null && txnManager.isSupportsTransactions() && txnManager.isAutoCommit()) {
                    txnManager.setAutoCommit(monitor, false);
                    revertToAutoCommit = true;
                }
                try {
                    Map<String, Object> options = Collections.emptyMap();
                    for (Map.Entry<DBSDataManipulator.ExecuteBatch, Object[]> rb : resultBatches.entrySet()) {
                        DBSDataManipulator.ExecuteBatch batch = rb.getKey();
                        Object[] rowValues = rb.getValue();
                        keyReceiver.setRow(rowValues);
                        DBCStatistics statistics = batch.execute(session, options);

                        totalUpdateCount += statistics.getRowsUpdated();
                        result.setDuration(result.getDuration() + statistics.getExecuteTime());
                        newResultSetRows.add(rowValues);
                    }

                    if (txnManager != null && txnManager.isSupportsTransactions()) {
                        txnManager.commit(session);
                    }
                } catch (Exception e) {
                    if (txnManager != null && txnManager.isSupportsTransactions()) {
                        txnManager.rollback(session, null);
                    }
                    throw new DBCException("Error persisting data changes", e);
                } finally {
                    if (revertToAutoCommit) {
                        txnManager.setAutoCommit(monitor, true);
                    }
                }
            }
        }
        getUpdatedRowsInfo(resultsInfo, newResultSetRows, dataFormat, monitor);

        WebSQLQueryResultSet updatedResultSet = new WebSQLQueryResultSet();
        updatedResultSet.setResultsInfo(resultsInfo);
        updatedResultSet.setColumns(resultsInfo.getAttributes());

        WebSQLQueryResults updateResults = new WebSQLQueryResults(webSession, dataFormat);
        updateResults.setUpdateRowCount(totalUpdateCount);
        updateResults.setResultSet(updatedResultSet);
        updatedResultSet.setRows(newResultSetRows.toArray(new Object[0][]));

        queryResults.add(updateResults);

        result.setResults(queryResults.toArray(new WebSQLQueryResults[0]));

        return result;
    }

    private void getUpdatedRowsInfo(
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull Set<Object[]> newResultSetRows,
        @Nullable WebDataFormat dataFormat,
        @NotNull DBRProgressMonitor monitor)
        throws DBCException {
        try (DBCSession session = getExecutionContext().openSession(
            monitor,
            DBCExecutionPurpose.UTIL,
            "Refresh row(s) after insert/update")
        ) {
            for (Object[] row : newResultSetRows) {
                if (row.length == 0) {
                    continue;
                }
                List<DBDAttributeConstraint> constraints = new ArrayList<>();
                boolean hasKey = true;
                for (DBDAttributeBinding attr : resultsInfo.getAttributes()) {
                    if (attr.getRowIdentifier() == null) {
                        continue;
                    }
                    final Object keyValue = row[attr.getOrdinalPosition()];
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
                    continue;
                }
                DBDDataFilter filter = new DBDDataFilter(constraints);
                DBSDataContainer dataContainer = resultsInfo.getDataContainer();
                RowDataReceiver dataReceiver = new RowDataReceiver(resultsInfo.getAttributes(), row, dataFormat);
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

    public String generateResultsDataUpdateScript(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat) throws DBException
    {
        Map<DBSDataManipulator.ExecuteBatch, Object[]> resultBatches = new LinkedHashMap<>();


        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);
        Set<DBDRowIdentifier> rowIdentifierList = new HashSet<>();
        // several row identifiers could be if we update result set table with join
        // we can't add or delete rows from result set table with join
        if (!CommonUtils.isEmpty(deletedRows) || !CommonUtils.isEmpty(addedRows)) {
            rowIdentifierList.add(resultsInfo.getDefaultRowIdentifier());
        } else if (!CommonUtils.isEmpty(updatedRows)) {
            rowIdentifierList = resultsInfo.getRowIdentifiers();
        }
        StringBuilder sqlBuilder = new StringBuilder();
        for (var rowIdentifier : rowIdentifierList) {
            DBSDataManipulator dataManipulator = generateUpdateResultsDataBatch(
                monitor, resultsInfo, rowIdentifier, updatedRows, deletedRows, addedRows, dataFormat, resultBatches, null);

            List<DBEPersistAction> actions = new ArrayList<>();

            DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
            try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Update data in container")) {
                Map<String, Object> options = Collections.emptyMap();
                for (DBSDataManipulator.ExecuteBatch batch : resultBatches.keySet()) {
                    batch.generatePersistActions(session, actions, options);
                }
            }

            sqlBuilder.append(
                SQLUtils.generateScript(executionContext.getDataSource(), actions.toArray(new DBEPersistAction[0]), false)
            );
        }
        return sqlBuilder.toString();
    }

    private DBSDataManipulator generateUpdateResultsDataBatch(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLResultsInfo resultsInfo,
        @NotNull DBDRowIdentifier rowIdentifier,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat,
        @NotNull Map<DBSDataManipulator.ExecuteBatch, Object[]> resultBatches,
        @Nullable DBDDataReceiver keyReceiver)
        throws DBException
    {

        DBSEntity dataContainer = rowIdentifier.getEntity();
        checkDataEditAllowed(dataContainer);
        DBSDataManipulator dataManipulator = (DBSDataManipulator) dataContainer;
        //only script generation (without execution)
        boolean withoutExecution = keyReceiver == null;

        DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
        try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Generate data update batches")) {
            WebExecutionSource executionSource = new WebExecutionSource(dataManipulator, executionContext, this);

            DBDAttributeBinding[] allAttributes = resultsInfo.getAttributes();
            DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);

            WebSQLQueryResultSet updatedResultSet = new WebSQLQueryResultSet();
            updatedResultSet.setResultsInfo(resultsInfo);
            updatedResultSet.setColumns(resultsInfo.getAttributes());

            if (!CommonUtils.isEmpty(updatedRows)) {

                for (WebSQLResultsRow row : updatedRows) {
                    Object[] finalRow = row.getData();
                    Map<String, Object> updateValues = row.getUpdateValues().entrySet().stream()
                        .filter(x -> CommonUtils.equalObjects(allAttributes[CommonUtils.toInt(x.getKey())].getRowIdentifier(), rowIdentifier))
                        .collect(HashMap::new, (m,v) -> m.put(v.getKey(), v.getValue()), HashMap::putAll);
                    if (finalRow.length == 0 || CommonUtils.isEmpty(updateValues)) {
                        continue;
                    }
                    DBDAttributeBinding[] updateAttributes = new DBDAttributeBinding[updateValues.size()];
                    // Final row is what we return back

                    int index = 0;
                    for (String indexStr : updateValues.keySet()) {
                        int attrIndex = CommonUtils.toInt(indexStr, -1);
                        updateAttributes[index++] = allAttributes[attrIndex];
                    }

                    Object[] rowValues = new Object[updateAttributes.length + keyAttributes.length];
                    for (int i = 0; i < updateAttributes.length; i++) {
                        DBDAttributeBinding updateAttribute = updateAttributes[i];
                        Object value = updateValues.get(String.valueOf(updateAttribute.getOrdinalPosition()));
                        Object realCellValue = setCellRowValue(value, webSession, session, updateAttribute, withoutExecution);
                        rowValues[i] = realCellValue;
                        finalRow[updateAttribute.getOrdinalPosition()] = realCellValue;
                    }
                    for (int i = 0; i < keyAttributes.length; i++) {
                        DBDAttributeBinding keyAttribute = keyAttributes[i];
                        boolean isDocumentValue = keyAttributes.length == 1 && keyAttribute.getDataKind() == DBPDataKind.DOCUMENT && dataContainer instanceof DBSDocumentLocator;
                        if (isDocumentValue) {
                            rowValues[updateAttributes.length + i] =
                                makeDocumentInputValue(session, (DBSDocumentLocator) dataContainer, resultsInfo, row);
                        } else {
                            rowValues[updateAttributes.length + i] = keyAttribute.getValueHandler().getValueFromObject(
                                session,
                                keyAttribute,
                                convertInputCellValue(session, keyAttribute,
                                    row.getData()[(keyAttribute.getOrdinalPosition())], withoutExecution),
                                false,
                                true);
                        }
                        if (ArrayUtils.contains(updateAttributes, keyAttribute)) {
                            // Key attribute is already updated
                        } else if (!isDocumentValue) {
                            finalRow[keyAttribute.getOrdinalPosition()] = rowValues[updateAttributes.length + i];
                        }
                    }

                    DBSDataManipulator.ExecuteBatch updateBatch = dataManipulator.updateData(
                        session, updateAttributes, keyAttributes, null, executionSource);
                    updateBatch.add(rowValues);
                    resultBatches.put(updateBatch, finalRow);
                }
            }

            // Add new rows
            if (!CommonUtils.isEmpty(addedRows)) {
                for (WebSQLResultsRow row : addedRows) {
                    Object[] addedValues = row.getData();
                    if (addedValues.length == 0) {
                        continue;
                    }
                    Map<DBDAttributeBinding, Object> insertAttributes = new LinkedHashMap<>();
                    // Final row is what we return back

                    for (int i = 0; i < allAttributes.length; i++) {
                        if (addedValues[i] != null) {
                            Object realCellValue;
                            if (addedValues[i] instanceof LinkedTreeMap variables) {
                                realCellValue = setCellRowValue(variables, webSession, session, allAttributes[i], withoutExecution);
                            } else {
                                realCellValue = convertInputCellValue(session, allAttributes[i],
                                    addedValues[i], withoutExecution);
                            }
                            insertAttributes.put(allAttributes[i], realCellValue);
                            addedValues[i] = realCellValue;
                        }
                    }

                    DBSDataManipulator.ExecuteBatch insertBatch = dataManipulator.insertData(
                        session,
                        insertAttributes.keySet().toArray(new DBDAttributeBinding[0]),
                        needKeys(keyAttributes, addedValues) ? keyReceiver : null,
                        executionSource,
                        new LinkedHashMap<>());
                    insertBatch.add(insertAttributes.values().toArray());
                    resultBatches.put(insertBatch, addedValues);
                }
            }

            if (keyAttributes.length > 0 && !CommonUtils.isEmpty(deletedRows)) {
                for (WebSQLResultsRow row : deletedRows) {
                    Object[] keyData = row.getData();
                    if (keyData.length == 0) {
                        continue;
                    }
                    Map<DBDAttributeBinding, Object> delKeyAttributes = new LinkedHashMap<>();

                    boolean isDocumentKey = keyAttributes.length == 1 && keyAttributes[0].getDataKind() == DBPDataKind.DOCUMENT;

                    for (int i = 0; i < allAttributes.length; i++) {
                        if (isDocumentKey || ArrayUtils.contains(keyAttributes, allAttributes[i])) {
                            Object realCellValue = convertInputCellValue(session, allAttributes[i],
                                keyData[i], withoutExecution);
                            delKeyAttributes.put(allAttributes[i], realCellValue);
                        }
                    }

                    DBSDataManipulator.ExecuteBatch deleteBatch = dataManipulator.deleteData(
                        session,
                        delKeyAttributes.keySet().toArray(new DBSAttributeBase[0]),
                        executionSource);
                    deleteBatch.add(delKeyAttributes.values().toArray());
                    resultBatches.put(deleteBatch, new Object[0]);
                }
            }
        }

        return dataManipulator;
    }

    private boolean needKeys(DBDAttributeBinding[] keyAttributes, Object[] finalRow) {
        for (var col : keyAttributes) {
            if (col.getAttribute().isAutoGenerated() && DBUtils.isNullValue(finalRow[col.getOrdinalPosition()])) {
                return true;
            }
        }
        return false;
    }

    @NotNull
    public DBDDocument makeDocumentInputValue(
        DBCSession session,
        DBSDocumentLocator dataContainer,
        WebSQLResultsInfo resultsInfo,
        WebSQLResultsRow row) throws DBException
    {
        // Document reference
        DBDDocument document = null;
        Map<String, Object> keyMap = new LinkedHashMap<>();
        DBDAttributeBinding[] attributes = resultsInfo.getAttributes();
        for (int j = 0; j < attributes.length; j++) {
            DBDAttributeBinding attr = attributes[j];
            Object plainValue = WebSQLUtils.makePlainCellValue(session, attr, row.getData()[j]);
            if (plainValue instanceof DBDDocument) {
                // FIXME: Hack for DynamoDB. We pass entire document as a key
                // FIXME: Let's just return it back for now
                document = (DBDDocument) plainValue;
                break;
            }
            keyMap.put(attr.getName(), plainValue);
        }
        if (document == null) {
            document = dataContainer.findDocument(session.getProgressMonitor(), keyMap);
            if (document == null) {
                throw new DBCException("Error finding document by key " + keyMap);
            }
        }
        return document;
    }

    @Nullable
    public Object convertInputCellValue(DBCSession session, DBDAttributeBinding updateAttribute, Object cellRawValue, boolean justGenerateScript) throws DBCException {
        cellRawValue = WebSQLUtils.makePlainCellValue(session, updateAttribute, cellRawValue);
        Object realCellValue = cellRawValue;
        // In some cases we already have final value here
        if (!(realCellValue instanceof DBDValue)) {
            try {
                realCellValue = updateAttribute.getValueHandler().getValueFromObject(
                    session,
                    updateAttribute,
                    cellRawValue,
                    false,
                    true);
            } catch (DBCException e) {
                //checks if this function is used only for script generation
                if (justGenerateScript) {
                    return null;
                } else {
                    throw e;
                }
            }
        }
        return realCellValue;
    }

    ////////////////////////////////////////////////
    // ExecutionPlan

    @NotNull
    public WebSQLExecutionPlan explainExecutionPlan(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
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
                } catch (DBException e) {
                    throw new InvocationTargetException(e);
                }
            });
        } catch (DBException e) {
            throw new DBWebException("Error explaining execution plan", e);
        }

        return new WebSQLExecutionPlan(webSession, dbcPlan[0]);
    }


    public String readLobValue(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull Integer lobColumnIndex,
        @Nullable WebSQLResultsRow row
    ) throws DBException {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);

        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        checkRowIdentifier(resultsInfo, rowIdentifier);
        DBSDataContainer dataContainer = resultsInfo.getDataContainer();
        DBCExecutionContext executionContext = getExecutionContext(dataContainer);
        String tableName = rowIdentifier.getEntity().getName();
        WebSQLDataLOBReceiver dataReceiver = new WebSQLDataLOBReceiver(tableName, dataContainer, lobColumnIndex);
        try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Generate data update batches")) {
            WebExecutionSource executionSource = new WebExecutionSource(dataContainer, executionContext, this);
            DBDDataFilter dataFilter = new DBDDataFilter();
            DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);
            Object[] rowValues = new Object[keyAttributes.length];
            List<DBDAttributeConstraint> constraints = new ArrayList<>();
            for (int i = 0; i < keyAttributes.length; i++) {
                DBDAttributeBinding keyAttribute = keyAttributes[i];
                boolean isDocumentValue = keyAttributes.length == 1 && keyAttribute.getDataKind() == DBPDataKind.DOCUMENT && dataContainer instanceof DBSDocumentLocator;
                if (isDocumentValue) {
                    rowValues[i] =
                        makeDocumentInputValue(session, (DBSDocumentLocator) dataContainer, resultsInfo, row);
                } else {
                    Object inputCellValue = row.getData()[keyAttribute.getOrdinalPosition()];

                    rowValues[i] = keyAttribute.getValueHandler().getValueFromObject(
                        session,
                        keyAttribute,
                        convertInputCellValue(session, keyAttribute,
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
            DBCStatistics statistics = dataContainer.readData(
                executionSource, session, dataReceiver, dataFilter,
                0, 1, DBSDataContainer.FLAG_NONE, 1);
            try {
                return dataReceiver.createLobFile(session);
            } catch (Exception e) {
                throw new DBWebException("Error creating temporary lob file ", e);
            }
        }
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
        DBNNode node = webSession.getNavigatorModel().getNodeByPath(monitor, containerPath);
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
        @Nullable WebDataFormat dataFormat) throws DBException {

        List<WebSQLQueryResults> resultList = new ArrayList<>();
        int maxResultsCount = resolveMaxResultsCount(dataContainer.getDataSource());
        WebSQLQueryResults stats = new WebSQLQueryResults(webSession, dataFormat);
        var rowsUpdated = 0;
        for (int i = 0; i < maxResultsCount; i++) {
            if (hasResultSet) {
                WebSQLQueryResults results = new WebSQLQueryResults(webSession, dataFormat);
                try (DBCResultSet resultSet = dbStat.openResultSet()) {
                    if (resultSet == null) {
                        break;
                    }
                    try (WebSQLQueryDataReceiver dataReceiver = new WebSQLQueryDataReceiver(contextInfo, dataContainer, dataFormat)) {
                        readResultSet(dbStat.getSession(), resultSet, webDataFilter, dataReceiver);
                        results.setResultSet(dataReceiver.getResultSet());
                        dataReceiver.getResultSet().getResultsInfo().setQueryText(resultSet.getSourceStatement().getQueryString());
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

        setResultFilterText(dataContainer, dbStat.getSession().getDataSource(), executeInfo, dataFilter);
        executeInfo.setFullQuery(dbStat.getQueryString());
    }

    private void setResultFilterText(@NotNull DBSDataContainer dataContainer, @NotNull DBPDataSource dataSource, @NotNull WebSQLExecuteInfo executeInfo, @NotNull DBDDataFilter filter) throws DBException {
        if (!filter.getConstraints().isEmpty() || !CommonUtils.isEmpty(filter.getWhere())) {
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

    private void readResultSet(@NotNull DBCSession session, @NotNull DBCResultSet dbResult, @NotNull WebSQLDataFilter filter, @NotNull WebSQLQueryDataReceiver dataReceiver) throws DBCException {
        dataReceiver.fetchStart(session, dbResult, filter.getOffset(), filter.getLimit());
        int rowCount = 0;
        while (dbResult.nextRow()) {
            if (rowCount > filter.getLimit()) {
                break;
            }

            dataReceiver.fetchRow(session, dbResult);
            rowCount++;
        }
        dataReceiver.fetchEnd(session, dbResult);
    }

    /**
     * Key data receiver
     */
    static class KeyDataReceiver implements DBDDataReceiver {

        private final WebSQLResultsInfo results;
        private Object[] row;

        public KeyDataReceiver(WebSQLResultsInfo results) {
            this.results = results;
        }

        void setRow(Object[] row) {
            this.row = row;
        }

        @Override
        public void fetchStart(DBCSession session, DBCResultSet resultSet, long offset, long maxRows) {

        }

        @Override
        public void fetchRow(DBCSession session, DBCResultSet resultSet)
            throws DBCException {
            DBDAttributeBinding[] resultsAttributes = results.getAttributes();

            DBCResultSetMetaData rsMeta = resultSet.getMeta();
            List<DBCAttributeMetaData> keyAttributes = rsMeta.getAttributes();
            for (int i = 0; i < keyAttributes.size(); i++) {
                DBCAttributeMetaData keyAttribute = keyAttributes.get(i);
                DBDValueHandler valueHandler = DBUtils.findValueHandler(session, keyAttribute);
                Object keyValue = valueHandler.fetchValueObject(session, resultSet, keyAttribute, i);
                if (keyValue == null) {
                    continue;
                }
                boolean updated = false;
                if (!CommonUtils.isEmpty(keyAttribute.getName())) {
                    DBDAttributeBinding binding = DBUtils.findObject(resultsAttributes, keyAttribute.getName());
                    if (binding != null) {
                        // Got it. Just update column oldValue
                        row[binding.getOrdinalPosition()] = keyValue;
                        continue;
                    }
                }
                // Key not found
                // Try to find and update auto-increment column
                for (int k = 0; k < resultsAttributes.length; k++) {
                    DBDAttributeBinding column = resultsAttributes[k];
                    if (column.isAutoGenerated()) {
                        // Got it
                        row[k] = keyValue;
                        break;
                    }
                }
            }
        }

        @Override
        public void fetchEnd(DBCSession session, DBCResultSet resultSet) {

        }

        @Override
        public void close() {
        }
    }

    public class RowDataReceiver implements DBDDataReceiver {
        private final DBDAttributeBinding[] curAttributes;
        private final WebDataFormat dataFormat;
        private final Object[] row;

        public RowDataReceiver(DBDAttributeBinding[] curAttributes, Object[] row, WebDataFormat dataFormat) {
            this.curAttributes = curAttributes;
            this.row = row;
            this.dataFormat = dataFormat;
        }

        @Override
        public void fetchStart(DBCSession session, DBCResultSet resultSet, long offset, long maxRows) {

        }

        @Override
        public void fetchRow(DBCSession session, DBCResultSet resultSet)
            throws DBCException {
            DBCResultSetMetaData rsMeta = resultSet.getMeta();
            // Compare attributes with existing model attributes
            List<DBCAttributeMetaData> attributes = rsMeta.getAttributes();
            if (attributes.size() != curAttributes.length) {
                log.debug("Wrong meta attributes count (" + attributes.size() + " <> " + curAttributes.length + ") - can't refresh");
                return;
            }
            for (int i = 0; i < curAttributes.length; i++) {
                DBCAttributeMetaData metaAttribute = curAttributes[i].getMetaAttribute();
                if (metaAttribute == null ||
                    !CommonUtils.equalObjects(metaAttribute.getName(), attributes.get(i).getName())) {
                    log.debug("Attribute '" + metaAttribute + "' doesn't match '" + attributes.get(i).getName() + "'");
                    return;
                }
            }

            for (int i = 0; i < curAttributes.length; i++) {
                final DBDAttributeBinding attr = curAttributes[i];
                DBDValueHandler valueHandler = attr.getValueHandler();
                Object attrValue = valueHandler.fetchValueObject(session, resultSet, attr, i);

                // Patch result rows (adapt to web format)
                row[i] = WebSQLUtils.makeWebCellValue(webSession, attr, attrValue, dataFormat);
            }

        }

        @Override
        public void fetchEnd(DBCSession session, DBCResultSet resultSet) {

        }

        @Override
        public void close() {
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

    private Object setCellRowValue(Object cellRow, WebSession webSession, DBCSession dbcSession, DBDAttributeBinding allAttributes, boolean withoutExecution) {
        if (cellRow instanceof LinkedTreeMap) {
            LinkedTreeMap<String, Object> variables = (LinkedTreeMap<String, Object>) cellRow;
            if (variables.get(FILE_ID) != null) {
                Path path = CBPlatform.getInstance()
                    .getTempFolder(webSession.getProgressMonitor(), TEMP_FILE_FOLDER)
                    .resolve(webSession.getSessionId())
                    .resolve(variables.get(FILE_ID).toString());

                try {
                    var file = Files.newInputStream(path);
                    return convertInputCellValue(dbcSession, allAttributes, file, withoutExecution);
                } catch (IOException | DBCException e) {
                    return new DBException(e.getMessage());
                }
            }
        }
        try {
            return convertInputCellValue(dbcSession, allAttributes, cellRow, withoutExecution);
        } catch (DBCException e) {
            return new DBException(e.getMessage());
        }
    }
}

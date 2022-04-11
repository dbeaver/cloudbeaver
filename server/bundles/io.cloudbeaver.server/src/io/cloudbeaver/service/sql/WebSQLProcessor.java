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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionProvider;
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
import org.jkiss.dbeaver.model.exec.plan.DBCPlan;
import org.jkiss.dbeaver.model.exec.plan.DBCQueryPlanner;
import org.jkiss.dbeaver.model.exec.plan.DBCQueryPlannerConfiguration;
import org.jkiss.dbeaver.model.impl.AbstractExecutionSource;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseItem;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.SQLSyntaxManager;
import org.jkiss.dbeaver.model.sql.SQLUtils;
import org.jkiss.dbeaver.model.sql.parser.SQLRuleManager;
import org.jkiss.dbeaver.model.struct.*;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

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

    private AtomicInteger contextId = new AtomicInteger();

    WebSQLProcessor(@NotNull  WebSession webSession, @NotNull WebConnectionInfo connection) {
        this.webSession = webSession;
        this.connection = connection;

        syntaxManager = new SQLSyntaxManager();
        syntaxManager.init(connection.getDataSource().getSQLDialect(), connection.getDataSourceContainer().getPreferenceStore());

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

    SQLSyntaxManager getSyntaxManager() {
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
    public WebSQLContextInfo createContext(String defaultCatalog, String defaultSchema) throws DBCException {
        String contextId = connection.getId() + ":" + this.contextId.incrementAndGet();
        WebSQLContextInfo contextInfo = new WebSQLContextInfo(this, contextId, defaultCatalog, defaultSchema);
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
        @Nullable WebDataFormat dataFormat) throws DBWebException {
        if (filter == null) {
            // Use default filter
            filter = new WebSQLDataFilter();
        }
        long startTime = System.currentTimeMillis();
        WebSQLExecuteInfo executeInfo = new WebSQLExecuteInfo();

        DBSDataContainer dataContainer = new WebSQLQueryDataContainer(connection.getDataSource(), sql);

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
            final String sqlQueryText = sql;
            SQLQuery sqlQuery = new SQLQuery(context.getDataSource(), sqlQueryText);
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
                        boolean hasResultSet = dbStat.executeStatement();
                        fillQueryResults(contextInfo, dataContainer, dbStat, hasResultSet, executeInfo, webDataFilter, dataFilter, dataFormat);
                    } catch (DBException e) {
                        throw new InvocationTargetException(e);
                    }
                }
            });
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

                    if (resultSet != null && resultSet.getRows() != null) {
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
        Map<DBSDataManipulator.ExecuteBatch, Object[]> resultBatches = new LinkedHashMap<>();

        KeyDataReceiver keyReceiver = new KeyDataReceiver(contextInfo.getResults(resultsId));

        DBSDataManipulator dataManipulator = generateUpdateResultsDataBatch(
            monitor, contextInfo, resultsId, updatedRows, deletedRows, addedRows, dataFormat, resultBatches, keyReceiver);

        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);

        long totalUpdateCount = 0;

        WebSQLExecuteInfo result = new WebSQLExecuteInfo();
        List<WebSQLQueryResults> queryResults = new ArrayList<>();

        DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
        try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Update data in container")) {
            DBCTransactionManager txnManager = DBUtils.getTransactionManager(executionContext);
            boolean revertToAutoCommit = false;
            if (txnManager  != null && txnManager.isSupportsTransactions() && txnManager.isAutoCommit()) {
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

                    // Patch result rows (adapt to web format)
                    for (int i = 0; i < rowValues.length; i++) {
                        rowValues[i] = WebSQLUtils.makeWebCellValue(webSession, resultsInfo.getAttributeByPosition(i), rowValues[i], dataFormat);
                    }

                    totalUpdateCount += statistics.getRowsUpdated();
                    result.setDuration(result.getDuration() + statistics.getExecuteTime());
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

        WebSQLQueryResultSet updatedResultSet = new WebSQLQueryResultSet();
        updatedResultSet.setResultsInfo(resultsInfo);
        updatedResultSet.setColumns(resultsInfo.getAttributes());

        WebSQLQueryResults updateResults = new WebSQLQueryResults(webSession, dataFormat);
        updateResults.setUpdateRowCount(totalUpdateCount);
        updateResults.setResultSet(updatedResultSet);
        updatedResultSet.setRows(resultBatches.values().toArray(new Object[0][]));

        queryResults.add(updateResults);

        result.setResults(queryResults.toArray(new WebSQLQueryResults[0]));

        return result;
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

        DBSDataManipulator dataManipulator = generateUpdateResultsDataBatch(
            monitor, contextInfo, resultsId, updatedRows, deletedRows, addedRows, dataFormat, resultBatches, null);

        List<DBEPersistAction> actions = new ArrayList<>();

        DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
        try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Update data in container")) {
            Map<String, Object> options = Collections.emptyMap();
            for (DBSDataManipulator.ExecuteBatch batch : resultBatches.keySet()) {
                batch.generatePersistActions(session, actions, options);
            }
        }

        return SQLUtils.generateScript(executionContext.getDataSource(), actions.toArray(new DBEPersistAction[0]), false);
    }

    private DBSDataManipulator generateUpdateResultsDataBatch(
        @NotNull DBRProgressMonitor monitor,
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat,
        @NotNull Map<DBSDataManipulator.ExecuteBatch, Object[]> resultBatches,
        @Nullable DBDDataReceiver keyReceiver)
        throws DBException
    {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);

        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        checkRowIdentifier(resultsInfo, rowIdentifier);
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
                    Map<String, Object> updateValues = row.getUpdateValues();
                    if (CommonUtils.isEmpty(row.getData()) || CommonUtils.isEmpty(updateValues)) {
                        continue;
                    }
                    DBDAttributeBinding[] updateAttributes = new DBDAttributeBinding[updateValues.size()];
                    // Final row is what we return back
                    Object[] finalRow = row.getData().toArray();

                    int index = 0;
                    for (String indexStr : updateValues.keySet()) {
                        int attrIndex = CommonUtils.toInt(indexStr, -1);
                        updateAttributes[index++] = allAttributes[attrIndex];
                    }

                    Object[] rowValues = new Object[updateAttributes.length + keyAttributes.length];
                    for (int i = 0; i < updateAttributes.length; i++) {
                        DBDAttributeBinding updateAttribute = updateAttributes[i];
                        Object realCellValue = convertInputCellValue(session, updateAttribute,
                            updateValues.get(String.valueOf(updateAttribute.getOrdinalPosition())), withoutExecution);
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
                                    row.getData().get(keyAttribute.getOrdinalPosition()), withoutExecution),
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
                        session, updateAttributes, keyAttributes, keyReceiver, executionSource);
                    updateBatch.add(rowValues);
                    resultBatches.put(updateBatch, finalRow);
                }
            }

            // Add new rows
            if (!CommonUtils.isEmpty(addedRows)) {
                for (WebSQLResultsRow row : addedRows) {
                    List<?> addedValues = row.getData();
                    if (CommonUtils.isEmpty(row.getData())) {
                        continue;
                    }
                    Map<DBDAttributeBinding, Object> insertAttributes = new LinkedHashMap<>();
                    // Final row is what we return back
                    Object[] finalRow = row.getData().toArray();

                    for (int i = 0; i < allAttributes.length; i++) {
                        if (addedValues.get(i) != null) {
                            Object realCellValue = convertInputCellValue(session, allAttributes[i],
                                addedValues.get(i), withoutExecution);
                            insertAttributes.put(allAttributes[i], realCellValue);
                            finalRow[i] = WebSQLUtils.makeWebCellValue(webSession, null, realCellValue, dataFormat);
                        }
                    }

                    DBSDataManipulator.ExecuteBatch insertBatch = dataManipulator.insertData(
                        session,
                        insertAttributes.keySet().toArray(new DBDAttributeBinding[0]),
                        keyReceiver,
                        executionSource,
                        new LinkedHashMap<>());
                    insertBatch.add(insertAttributes.values().toArray());
                    resultBatches.put(insertBatch, finalRow);
                }
            }

            if (keyAttributes.length > 0 && !CommonUtils.isEmpty(deletedRows)) {
                for (WebSQLResultsRow row : deletedRows) {
                    List<?> keyData = row.getData();
                    if (CommonUtils.isEmpty(row.getData())) {
                        continue;
                    }
                    Map<DBDAttributeBinding, Object> delKeyAttributes = new LinkedHashMap<>();

                    boolean isDocumentKey = keyAttributes.length == 1 && keyAttributes[0].getDataKind() == DBPDataKind.DOCUMENT;

                    for (int i = 0; i < allAttributes.length; i++) {
                        if (isDocumentKey || ArrayUtils.contains(keyAttributes, allAttributes[i])) {
                            Object realCellValue = convertInputCellValue(session, allAttributes[i],
                                keyData.get(i), withoutExecution);
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
            Object plainValue = WebSQLUtils.makePlainCellValue(session, attr, row.getData().get(j));
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
            @Nullable WebSQLResultsRow row) throws DBException {
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
                    Object inputCellValue = row.getData().get(keyAttribute.getOrdinalPosition());

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
        for (int i = 0; i < maxResultsCount; i++) {
            WebSQLQueryResults results = new WebSQLQueryResults(webSession, dataFormat);
            if (hasResultSet) {
                try (DBCResultSet resultSet = dbStat.openResultSet()) {
                    if (resultSet == null) {
                        break;
                    }
                    try (WebSQLQueryDataReceiver dataReceiver = new WebSQLQueryDataReceiver(contextInfo, dataContainer, dataFormat)) {
                        readResultSet(dbStat.getSession(), resultSet, webDataFilter, dataReceiver);
                        results.setResultSet(dataReceiver.getResultSet());
                    }
                }
            } else {
                long updateRowCount = dbStat.getUpdateRowCount();
                if (updateRowCount >= 0) {
                    results.setUpdateRowCount(updateRowCount);
                } else {
                    break;
                }
            }
            resultList.add(results);
            hasResultSet = dbStat.nextResults();
        }
        if (resultList.isEmpty()) {
            resultList.add(new WebSQLQueryResults(webSession, dataFormat));
        }
        executeInfo.setResults(resultList.toArray(new WebSQLQueryResults[0]));

        setResultFilterText(dataContainer, dbStat.getSession().getDataSource(), executeInfo, dataFilter);
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
}

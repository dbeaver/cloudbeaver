/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp and others
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
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataKind;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.data.*;
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
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Web SQL processor.
 */
public class WebSQLProcessor {

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
        syntaxManager.init(connection.getDataSource());

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
        String contextId = String.valueOf(this.contextId.incrementAndGet());
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
            {
                DBDDataFilter dataFilter = filter.makeDataFilter(monitor, dataContainer);
                if (dataFilter.hasFilters()) {
                    sql = context.getDataSource().getSQLDialect().addFiltersToQuery(
                        monitor,
                        context.getDataSource(),
                        sql,
                        dataFilter);
                }
            }

            final WebSQLDataFilter dataFilter = filter;
            final String sqlQueryText = sql;
            SQLQuery sqlQuery = new SQLQuery(context.getDataSource(), sqlQueryText);

            DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
                try (DBCSession session = context.openSession(monitor, DBCExecutionPurpose.USER, "Execute SQL")) {
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
                        dataFilter.getOffset(),
                        dataFilter.getLimit()))
                    {
                        boolean hasResultSet = dbStat.executeStatement();
                        fillQueryResults(contextInfo, dataContainer, dbStat, hasResultSet, executeInfo, dataFilter, dataFormat);
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
        @NotNull WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat) throws DBException {

        WebSQLExecuteInfo executeInfo = new WebSQLExecuteInfo();

        DBCExecutionContext executionContext = getExecutionContext(dataContainer);
        DBDDataFilter dataFilter = filter.makeDataFilter(monitor, dataContainer);
        DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
            try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Read data from container")) {
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
                    setResultFilterText(dataContainer, session.getDataSource(), executeInfo, filter);

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

    @WebAction
    public WebSQLExecuteInfo updateResultsData(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @NotNull List<Object> updateRow,
        @NotNull Map<String, Object> updateValues, WebDataFormat dataFormat) throws DBWebException
    {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);
        WebSession webSession = contextInfo.getProcessor().getWebSession();

        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        checkRowIdentifier(resultsInfo, rowIdentifier);
        DBSEntity dataContainer = rowIdentifier.getEntity();
        checkDataEditAllowed(dataContainer);
        DBSDataManipulator dataManipulator = (DBSDataManipulator) dataContainer;

        DBRProgressMonitor monitor = this.webSession.getProgressMonitor();
        WebSQLExecuteInfo result = new WebSQLExecuteInfo();

        try {
            DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
                try {
                    DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
                    try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Update data in container")) {
                        WebExecutionSource executionSource = new WebExecutionSource(dataManipulator, executionContext, this);

                        DBDAttributeBinding[] allAttributes = resultsInfo.getAttributes();
                        DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);
                        DBDAttributeBinding[] updateAttributes = new DBDAttributeBinding[updateValues.size()];
                        // Final row is what we return back
                        Object[] finalRow = updateRow.toArray();

                        int index = 0;
                        for (String indexStr : updateValues.keySet()) {
                            int attrIndex = CommonUtils.toInt(indexStr, -1);
                            updateAttributes[index++] = allAttributes[attrIndex];
                        }

                        Object[] rowValues = new Object[updateAttributes.length + keyAttributes.length];
                        for (int i = 0; i < updateAttributes.length; i++) {
                            DBDAttributeBinding updateAttribute = updateAttributes[i];
                            Object cellRawValue = updateValues.get(String.valueOf(updateAttribute.getOrdinalPosition()));
                            Object realCellValue = updateAttribute.getValueHandler().getValueFromObject(session, updateAttribute, cellRawValue, false, true);
                            rowValues[i] = realCellValue;
                            finalRow[updateAttribute.getOrdinalPosition()] = WebSQLUtils.makeWebCellValue(webSession, null, realCellValue, dataFormat);
                        }
                        for (int i = 0; i < keyAttributes.length; i++) {
                            DBDAttributeBinding keyAttribute = keyAttributes[i];
                            Object cellValueRaw = updateRow.get(keyAttribute.getOrdinalPosition());
                            rowValues[updateAttributes.length + i] = keyAttribute.getValueHandler().getValueFromObject(session, keyAttribute, cellValueRaw, false, true);
                        }

                        DBSDataManipulator.ExecuteBatch updateBatch = dataManipulator.updateData(session, updateAttributes, keyAttributes, null, executionSource);
                        updateBatch.add(rowValues);
                        DBCStatistics statistics = updateBatch.execute(session, Collections.emptyMap());

                        // Returns fake resultset with updated row values
                        WebSQLQueryResultSet updatedResultSet = new WebSQLQueryResultSet();
                        updatedResultSet.setResultsInfo(resultsInfo);
                        updatedResultSet.setColumns(resultsInfo.getAttributes());
                        updatedResultSet.setRows(new Object[][]{finalRow});

                        WebSQLQueryResults updateResults = new WebSQLQueryResults(this.webSession, dataFormat);
                        updateResults.setUpdateRowCount(statistics.getRowsUpdated());
                        updateResults.setResultSet(updatedResultSet);
                        result.setDuration(statistics.getExecuteTime());
                        result.setResults(new WebSQLQueryResults[]{updateResults});
                    }
                } catch (Exception e) {
                    throw new InvocationTargetException(e);
                }
            });
        } catch (DBException e) {
            throw new DBWebException("Error updating data", e);
        }
        return result;
    }

    @WebAction
    public WebSQLExecuteInfo updateResultsDataBatch(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat) throws DBWebException
    {
        WebSQLResultsInfo resultsInfo = contextInfo.getResults(resultsId);

        DBDRowIdentifier rowIdentifier = resultsInfo.getDefaultRowIdentifier();
        checkRowIdentifier(resultsInfo, rowIdentifier);
        DBSEntity dataContainer = rowIdentifier.getEntity();
        checkDataEditAllowed(dataContainer);
        DBSDataManipulator dataManipulator = (DBSDataManipulator) dataContainer;

        DBRProgressMonitor monitor = webSession.getProgressMonitor();
        WebSQLExecuteInfo result = new WebSQLExecuteInfo();
        List<WebSQLQueryResults> queryResults = new ArrayList<>();

        try {
            DBExecUtils.tryExecuteRecover(monitor, connection.getDataSource(), param -> {
                try {
                    DBCExecutionContext executionContext = getExecutionContext(dataManipulator);
                    try (DBCSession session = executionContext.openSession(monitor, DBCExecutionPurpose.USER, "Update rows in container")) {
                        WebExecutionSource executionSource = new WebExecutionSource(dataManipulator, executionContext, this);

                        DBDAttributeBinding[] allAttributes = resultsInfo.getAttributes();
                        DBDAttributeBinding[] keyAttributes = rowIdentifier.getAttributes().toArray(new DBDAttributeBinding[0]);

                        if (!CommonUtils.isEmpty(updatedRows)) {
                            WebSQLQueryResultSet updatedResultSet = new WebSQLQueryResultSet();
                            updatedResultSet.setResultsInfo(resultsInfo);
                            updatedResultSet.setColumns(resultsInfo.getAttributes());
                            long totalUpdateCount = 0;

                            List <Object[]> resultRows = new ArrayList<>();

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
                                    Object cellRawValue = updateValues.get(String.valueOf(updateAttribute.getOrdinalPosition()));
                                    cellRawValue = WebSQLUtils.makePlainCellValue(session, updateAttribute, cellRawValue);
                                    Object realCellValue = cellRawValue;
                                    // In some cases we already have final value here
                                    if (!(realCellValue instanceof DBDValue)) {
                                        realCellValue = updateAttribute.getValueHandler().getValueFromObject(session, updateAttribute, cellRawValue, false, true);
                                    }
                                    rowValues[i] = realCellValue;
                                    finalRow[updateAttribute.getOrdinalPosition()] = WebSQLUtils.makeWebCellValue(webSession, null, realCellValue, dataFormat);
                                }
                                for (int i = 0; i < keyAttributes.length; i++) {
                                    DBDAttributeBinding keyAttribute = keyAttributes[i];
                                    if (keyAttributes.length == 1 && keyAttribute.getDataKind() == DBPDataKind.DOCUMENT && dataContainer instanceof DBSDocumentLocator) {
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
                                            document = ((DBSDocumentLocator) dataContainer).findDocument(session.getProgressMonitor(), keyMap);
                                            if (document == null) {
                                                throw new DBCException("Error finding document by key " + keyMap);
                                            }
                                        }
                                        rowValues[updateAttributes.length + i] = document;
                                    } else {
                                        Object cellValueRaw = row.getData().get(keyAttribute.getOrdinalPosition());
                                        cellValueRaw = WebSQLUtils.makePlainCellValue(session, keyAttribute, cellValueRaw);
                                        rowValues[updateAttributes.length + i] = keyAttribute.getValueHandler().getValueFromObject(session, keyAttribute, cellValueRaw, false, true);
                                    }
                                }

                                DBSDataManipulator.ExecuteBatch updateBatch = dataManipulator.updateData(session, updateAttributes, keyAttributes, null, executionSource);
                                updateBatch.add(rowValues);
                                DBCStatistics statistics = updateBatch.execute(session, Collections.emptyMap());

                                totalUpdateCount += statistics.getRowsUpdated();
                                result.setDuration(result.getDuration() + statistics.getExecuteTime());
                                resultRows.add(finalRow);
                            }

                            WebSQLQueryResults updateResults = new WebSQLQueryResults(webSession, dataFormat);
                            updateResults.setUpdateRowCount(totalUpdateCount);
                            updateResults.setResultSet(updatedResultSet);
                            updatedResultSet.setRows(resultRows.toArray(new Object[0][]));

                            queryResults.add(updateResults);
                        }

                        if (!CommonUtils.isEmpty(addedRows)) {
                            throw new DBCException("New row add is not supported");
                        }

                        if (!CommonUtils.isEmpty(deletedRows)) {
                            throw new DBCException("Row delete is not supported");
                        }
                    }
                } catch (Exception e) {
                    throw new InvocationTargetException(e);
                }
            });
        } catch (DBException e) {
            throw new DBWebException("Error updating data", e);
        }
        result.setResults(queryResults.toArray(new WebSQLQueryResults[0]));
        return result;
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
        @NotNull WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat) throws DBException {

        List<WebSQLQueryResults> resultList = new ArrayList<>();
        for (int i = 0; i < MAX_RESULTS_COUNT; i++) {
            WebSQLQueryResults results = new WebSQLQueryResults(webSession, dataFormat);
            if (hasResultSet) {
                DBCResultSet resultSet = dbStat.openResultSet();
                if (resultSet == null) {
                    break;
                }
                try (WebSQLQueryDataReceiver dataReceiver = new WebSQLQueryDataReceiver(contextInfo, dataContainer, dataFormat)) {
                    readResultSet(dbStat.getSession(), resultSet, filter, dataReceiver);
                    results.setResultSet(dataReceiver.getResultSet());
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

        executeInfo.setResults(resultList.toArray(new WebSQLQueryResults[0]));

        setResultFilterText(dataContainer, dbStat.getSession().getDataSource(), executeInfo, filter);
    }

    private void setResultFilterText(@NotNull DBSDataContainer dataContainer, @NotNull DBPDataSource dataSource, @NotNull WebSQLExecuteInfo executeInfo, @NotNull WebSQLDataFilter filter) throws DBException {
        if (!filter.getConstraints().isEmpty() || !CommonUtils.isEmpty(filter.getWhere())) {
            StringBuilder where = new StringBuilder();
            SQLUtils.appendConditionString(
                filter.makeDataFilter(webSession.getProgressMonitor(), dataContainer),
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

    ///////////////////////////////////////////////////////
    // Utils

}

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
package io.cloudbeaver.service.sql.impl;


import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.sql.*;
import org.eclipse.jface.text.Document;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCLogicalOperator;
import org.jkiss.dbeaver.model.exec.DBExecUtils;
import org.jkiss.dbeaver.model.impl.sql.BasicSQLDialect;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.*;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionAnalyzer;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionProposalBase;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionRequest;
import org.jkiss.dbeaver.model.sql.format.SQLFormatUtils;
import org.jkiss.dbeaver.model.sql.generator.SQLGenerator;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.sql.parser.SQLScriptParser;
import org.jkiss.dbeaver.model.sql.registry.SQLGeneratorConfigurationRegistry;
import org.jkiss.dbeaver.model.sql.registry.SQLGeneratorDescriptor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSWrapper;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceSQL implements DBWServiceSQL {

    private static final Log log = Log.getLog(WebServiceSQL.class);

    @Override
    public WebSQLContextInfo[] listContexts(@NotNull WebSession session, @Nullable String connectionId, @Nullable String contextId) throws DBWebException {
        List<WebConnectionInfo> conToRead = new ArrayList<>();
        if (connectionId != null) {
            WebConnectionInfo webConnection = WebServiceBindingBase.getWebConnection(session, connectionId);
            conToRead.add(webConnection);
        } else {
            conToRead.addAll(session.getConnections());
        }

        List<WebSQLContextInfo> contexts  = new ArrayList<>();
        for (WebConnectionInfo con : conToRead) {
            WebSQLProcessor sqlProcessor = WebServiceBindingSQL.getSQLProcessor(con, false);
            if (sqlProcessor != null) {
                WebSQLContextInfo[] conContexts = sqlProcessor.getContexts();
                contexts.addAll(Arrays.asList(conContexts));
            }
        }
        if (contextId != null) {
            contexts.removeIf(c -> !c.getId().equals(contextId));
        }
        return contexts.toArray(new WebSQLContextInfo[0]);
    }

    @Override
    @NotNull
    public WebSQLDialectInfo getDialectInfo(@NotNull WebConnectionInfo connectionInfo) throws DBWebException {
        DBPDataSourceContainer dataSourceContainer = connectionInfo.getDataSourceContainer();
        SQLDialect dialect = getSqlDialectFromConnection(dataSourceContainer);
        return new WebSQLDialectInfo(dataSourceContainer.getDataSource(), dialect);
    }

    @NotNull
    public SQLDialect getSqlDialectFromConnection(DBPDataSourceContainer dataSourceContainer) {
        DBPDataSource dataSource = dataSourceContainer.getDataSource();
        SQLDialect dialect;
        if (dataSource != null) {
            dialect = SQLUtils.getDialectFromDataSource(dataSource);
        } else {
            try {
                dialect = dataSourceContainer.getScriptDialect().createInstance();
            } catch (DBException e) {
                log.debug(e);
                try {
                    dialect = dataSourceContainer.getDriver().getProviderDescriptor().getScriptDialect().createInstance();
                } catch (DBException e1) {
                    dialect = BasicSQLDialect.INSTANCE;
                }
            }
        }
        return dialect;
    }

    @NotNull
    public WebSQLCompletionProposal[] getCompletionProposals(
        @NotNull WebSQLContextInfo sqlContext,
        @NotNull String query,
        Integer position,
        Integer maxResults,
        Boolean simpleMode) throws DBWebException
    {
        try {
            DBPDataSource dataSource = sqlContext.getProcessor().getConnection().getDataSourceContainer().getDataSource();

            Document document = new Document();
            document.set(query);

            WebSQLCompletionContext completionContext = new WebSQLCompletionContext(sqlContext);

            SQLScriptElement activeQuery;

            if (position != null) {
                SQLParserContext parserContext = new SQLParserContext(
                    sqlContext.getProcessor().getConnection().getDataSource(),
                    completionContext.getSyntaxManager(),
                    completionContext.getRuleManager(),
                    document);
                activeQuery = SQLScriptParser.extractActiveQuery(parserContext, position, 0);
            } else {
                activeQuery = new SQLQuery(dataSource, query);
            }


            SQLCompletionRequest request = new SQLCompletionRequest(
                completionContext,
                document,
                position == null ? 0 : position,
                activeQuery,
                CommonUtils.getBoolean(simpleMode, false)
            );

            SQLCompletionAnalyzer analyzer = new SQLCompletionAnalyzer(request);
            analyzer.runAnalyzer(sqlContext.getProcessor().getWebSession().getProgressMonitor());
            List<SQLCompletionProposalBase> proposals = analyzer.getProposals();
            if (maxResults == null) maxResults = 200;
            if (proposals.size() > maxResults) {
                proposals = proposals.subList(0, maxResults);
            }

            WebSQLCompletionProposal[] result = new WebSQLCompletionProposal[proposals.size()];
            for (int i = 0; i < proposals.size(); i++) {
                result[i] = new WebSQLCompletionProposal(proposals.get(i));
            }
            return result;
        } catch (DBException e) {
            throw new DBWebException("Error processing SQL proposals", e);
        }
    }

    @NotNull
    public String formatQuery(@NotNull WebSQLContextInfo sqlContext, @NotNull String query) throws DBWebException {
        DBPDataSource dataSource = sqlContext.getProcessor().getConnection().getDataSourceContainer().getDataSource();
        if (dataSource == null) {
            throw new DBWebException("DataSource is null: can't format SQL query");
        }
        return SQLFormatUtils.formatSQL(dataSource, query);
    }

    @Override
    public DBCLogicalOperator[] getSupportedOperations(@NotNull WebSQLContextInfo contextInfo, @NotNull String resultsId, int attributeIndex) throws DBWebException {
        WebSQLResultsInfo results = contextInfo.getResults(resultsId);
        if (attributeIndex < 0 || attributeIndex >= results.getAttributes().length) {
            throw new DBWebException("Invalid attribute index (" + attributeIndex + ")");
        }
        DBDAttributeBinding attribute = results.getAttributes()[attributeIndex];
        return attribute.getValueHandler().getSupportedOperators(attribute);
    }

    @Override
    public SQLGeneratorDescriptor[] getEntityQueryGenerators(
        @NotNull WebSession session,
        @NotNull List<String> nodePathList)
        throws DBWebException
    {
        List<DBSObject> objectList = getObjectListFromNodeIds(session, nodePathList);
        return SQLGeneratorConfigurationRegistry.getInstance().getApplicableGenerators(objectList, session).toArray(new SQLGeneratorDescriptor[0]);
    }

    @Override
    public String generateEntityQuery(@NotNull WebSession session, @NotNull String generatorId, @NotNull Map<String, Object> options, @NotNull List<String> nodePathList) throws DBWebException {
        List<DBSObject> objectList = getObjectListFromNodeIds(session, nodePathList);
        SQLGeneratorDescriptor generator = SQLGeneratorConfigurationRegistry.getInstance().getGenerator(generatorId);
        if (generator == null) {
            throw new DBWebException("Generator '" + generatorId + "' not found");
        }
        try {
            SQLGenerator<DBSObject> generatorInstance = generator.createGenerator(objectList);
            generatorInstance.run(session.getProgressMonitor());
            return generatorInstance.getResult();
        } catch (DBException e) {
            throw new DBWebException("Error creating SQL generator", e);
        } catch (InvocationTargetException e) {
            throw new DBWebException("Error generating SQL", e.getTargetException());
        } catch (InterruptedException e) {
            return "-- Interrupted";
        }
    }

    @NotNull
    private List<DBSObject> getObjectListFromNodeIds(@NotNull WebSession session, @NotNull List<String> nodePathList) throws DBWebException {
        try {
            List<DBSObject> objectList = new ArrayList<>(nodePathList.size());
            for (String nodePath : nodePathList) {
                DBNNode node = session.getNavigatorModel().getNodeByPath(session.getProgressMonitor(), nodePath);
                if (node == null) {
                    throw new DBException("Node '" + nodePath + "' not found");
                }
                if (node instanceof DBSWrapper) {
                    DBSObject object = ((DBSWrapper) node).getObject();
                    if (object != null) {
                        objectList.add(object);
                    }
                }
            }
            return objectList;
        } catch (DBException e) {
            throw new DBWebException("Error getting objects from node IDs", e);
        }
    }

    @Override
    public WebSQLContextInfo createContext(@NotNull WebSQLProcessor processor, String defaultCatalog, String defaultSchema) throws DBWebException {
        try {
            return processor.createContext(defaultCatalog, defaultSchema);
        } catch (DBCException e) {
            throw new DBWebException("Error creating execution context", e);
        }
    }

    @Override
    public void destroyContext(@NotNull WebSQLContextInfo sqlContext) {
        sqlContext.getProcessor().destroyContext(sqlContext);
    }

    @Override
    public void setContextDefaults(@NotNull WebSQLContextInfo sqlContext, String catalogName, String schemaName) throws DBWebException {
        try {
            sqlContext.setDefaults(catalogName, schemaName);
        } catch (DBCException e) {
            throw new DBWebException("Error changing context defaul schema/catalog", e);
        }
    }

    @Override
    public Boolean closeResult(@NotNull WebSQLContextInfo sqlContext, @NotNull String resultId) throws DBWebException {
        if (!sqlContext.closeResult(resultId)) {
            throw new DBWebException("Invalid result ID " + resultId);
        }
        return true;
    }

    @Override
    public WebSQLExecuteInfo updateResultsDataBatch(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String resultsId,
        @Nullable List<WebSQLResultsRow> updatedRows,
        @Nullable List<WebSQLResultsRow> deletedRows,
        @Nullable List<WebSQLResultsRow> addedRows,
        @Nullable WebDataFormat dataFormat) throws DBWebException
    {
        try {
            WebSQLExecuteInfo[] result = new WebSQLExecuteInfo[1];

            DBExecUtils.tryExecuteRecover(
                contextInfo.getProcessor().getWebSession().getProgressMonitor(),
                contextInfo.getProcessor().getConnection().getDataSource(),
                monitor -> {
                    try {
                        result[0] = contextInfo.getProcessor().updateResultsDataBatch(
                            monitor, contextInfo, resultsId, updatedRows, deletedRows, addedRows, dataFormat);
                    } catch (Exception e) {
                        throw new InvocationTargetException(e);
                    }
                }
            );
            return result[0];
        } catch (DBException e) {
            throw new DBWebException("Error updating resultset data", e);
        }
    }

    @Override
    public String readLobValue(
            @NotNull WebSQLContextInfo contextInfo,
            @NotNull String resultsId,
            @NotNull Integer lobColumnIndex,
            @Nullable List<WebSQLResultsRow> row) throws DBWebException
    {
        try {
            var result = new StringBuilder();

            DBExecUtils.tryExecuteRecover(
                    contextInfo.getProcessor().getWebSession().getProgressMonitor(),
                    contextInfo.getProcessor().getConnection().getDataSource(),
                    monitor -> {
                        try {
                            result.append(contextInfo.getProcessor().readLobValue(
                                    monitor, contextInfo, resultsId, lobColumnIndex, row.get(0)));
                        } catch (Exception e) {
                            throw new InvocationTargetException(e);
                        }
                    }
            );
            return result.toString();
        } catch (DBException e) {
            throw new DBWebException("Error reading LOB value ", e);
        }
    }

    @Override
    public String updateResultsDataBatchScript(@NotNull WebSQLContextInfo contextInfo, @NotNull String resultsId, @Nullable List<WebSQLResultsRow> updatedRows, @Nullable List<WebSQLResultsRow> deletedRows, @Nullable List<WebSQLResultsRow> addedRows, WebDataFormat dataFormat) throws DBWebException {
        try {
            return contextInfo.getProcessor().generateResultsDataUpdateScript(
                contextInfo.getProcessor().getWebSession().getProgressMonitor(),
                contextInfo, resultsId, updatedRows, deletedRows, addedRows, dataFormat);
        } catch (DBException e) {
            throw new DBWebException("Error genering update script", e);
        }
    }

    @NotNull
    public WebAsyncTaskInfo asyncExecuteQuery(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String sql,
        @Nullable String resultId,
        @Nullable WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat)
    {
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<String>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                try {
                    monitor.beginTask("Execute query", 1);
                    monitor.subTask("Process query " + sql);
                    WebSQLExecuteInfo executeResults = contextInfo.getProcessor().processQuery(
                        monitor, contextInfo, sql, resultId, filter, dataFormat);
                    this.result = executeResults.getStatusMessage();
                    this.extendedResults = executeResults;
                } catch (Throwable e) {
                    throw new InvocationTargetException(e);
                } finally {
                    monitor.done();
                }
            }
        };
        return contextInfo.getProcessor().getWebSession().createAndRunAsyncTask("SQL execute", runnable);
    }

    @Override
    public WebAsyncTaskInfo asyncReadDataFromContainer(
        @NotNull WebSQLContextInfo contextInfo,
        @NotNull String nodePath,
        @Nullable String resultId,
        @Nullable WebSQLDataFilter filter,
        @Nullable WebDataFormat dataFormat) throws DBWebException {
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<String>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                try {
                    monitor.beginTask("Read data", 1);
                    monitor.subTask("Extra data from " + nodePath);

                    DBSDataContainer dataContainer = contextInfo.getProcessor().getDataContainerByNodePath(
                        monitor, nodePath, DBSDataContainer.class);

                    WebSQLExecuteInfo executeResults =  contextInfo.getProcessor().readDataFromContainer(
                        contextInfo,
                        monitor,
                        dataContainer,
                        resultId,
                        filter != null ? filter : new WebSQLDataFilter(),
                        dataFormat);
                    this.result = executeResults.getStatusMessage();
                    this.extendedResults = executeResults;
                } catch (Throwable e) {
                    throw new InvocationTargetException(e);
                } finally {
                    monitor.done();
                }
            }
        };
        return contextInfo.getProcessor().getWebSession().createAndRunAsyncTask("Read data from container " + nodePath, runnable);
    }

    @Override
    public WebSQLExecuteInfo asyncGetQueryResults(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException {
        WebAsyncTaskInfo taskStatus = webSession.asyncTaskStatus(taskId, false);
        if (taskStatus != null) {
            return (WebSQLExecuteInfo) taskStatus.getExtendedResult();
        }
        return null;
    }

    ////////////////////////////////////////////////////
    // Explain plan

    @Override
    public WebAsyncTaskInfo asyncSqlExplainExecutionPlan(@NotNull WebSQLContextInfo contextInfo, @NotNull String sql, @NotNull Map<String, Object> configuration) throws DBException {
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<String>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                try {
                    monitor.beginTask("Explain execution plan", 1);
                    monitor.subTask("Explain query [" + sql + "] execution plan");
                    WebSQLExecutionPlan executeResults = contextInfo.getProcessor().explainExecutionPlan(monitor, contextInfo, sql, configuration);
                    this.result = "Execution plan explain has been scheduled";
                    this.extendedResults = executeResults;
                } catch (Throwable e) {
                    throw new InvocationTargetException(e);
                } finally {
                    monitor.done();
                }
            }
        };
        return contextInfo.getProcessor().getWebSession().createAndRunAsyncTask("SQL query execution plan explain", runnable);
    }

    @Override
    public WebSQLExecutionPlan asyncSqlExplainExecutionPlanResult(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException {
        WebAsyncTaskInfo taskStatus = webSession.asyncTaskStatus(taskId, false);
        if (taskStatus != null) {
            return (WebSQLExecutionPlan) taskStatus.getExtendedResult();
        }
        return null;
    }

    @Override
    public WebSQLScriptInfo parseSqlScript(@NotNull WebConnectionInfo connectionInfo, @NotNull String sqlScript) throws DBWebException {
        SQLDialect dialect = getSqlDialectFromConnection(connectionInfo.getDataSourceContainer());
        List<SQLScriptElement> queries = SQLScriptParser.parseScript(
            dialect,
            connectionInfo.getDataSourceContainer().getPreferenceStore(),
            sqlScript);
        List<WebSQLQueryInfo> queriesInfo = queries.stream()
                .map(query -> new WebSQLQueryInfo(query.getOffset(), query.getOffset() + query.getText().length()))
                .collect(Collectors.toList());
        return new WebSQLScriptInfo(queriesInfo);
    }

    @Override
    public WebSQLQueryInfo parseSqlQuery(@NotNull WebConnectionInfo connectionInfo, @NotNull String sqlScript, int cursorPosition) throws DBWebException {
        SQLDialect dialect = getSqlDialectFromConnection(connectionInfo.getDataSourceContainer());
        SQLScriptElement query = SQLScriptParser.parseQuery(
            dialect,
            connectionInfo.getDataSourceContainer().getPreferenceStore(),
            sqlScript,
            cursorPosition);
        return query == null ? new WebSQLQueryInfo(0, 0) : new WebSQLQueryInfo(query.getOffset(), query.getOffset() + query.getText().length());
    }
}

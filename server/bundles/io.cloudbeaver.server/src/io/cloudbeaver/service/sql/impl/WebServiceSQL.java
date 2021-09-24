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
package io.cloudbeaver.service.sql.impl;


import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.sql.*;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IRegion;
import org.eclipse.jface.text.Region;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCLogicalOperator;
import org.jkiss.dbeaver.model.exec.DBExecUtils;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.SQLDialect;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.SQLScriptElement;
import org.jkiss.dbeaver.model.sql.SQLUtils;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionAnalyzer;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionProposalBase;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionRequest;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.sql.parser.SQLScriptParser;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceSQL implements DBWServiceSQL {

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
    public WebSQLDialectInfo getDialectInfo(@NotNull WebSQLProcessor processor) throws DBWebException {
        DBPDataSource dataSource = processor.getConnection().getDataSourceContainer().getDataSource();
        SQLDialect dialect = SQLUtils.getDialectFromDataSource(dataSource);
        return new WebSQLDialectInfo(dataSource, dialect);
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
                    () -> sqlContext.getProcessor().getExecutionContext(),
                    completionContext.getSyntaxManager(),
                    completionContext.getRuleManager(),
                    document);
                activeQuery = SQLScriptParser.extractActiveQuery(parserContext, new IRegion[]{new Region(position, 0)});
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

    @WebAction
    @NotNull
    public WebSQLExecuteInfo executeQuery(@NotNull WebSQLContextInfo sqlContext, @NotNull String sql, @Nullable WebSQLDataFilter filter, @Nullable WebDataFormat dataFormat) throws DBWebException {
        return sqlContext.getProcessor().processQuery(
            sqlContext.getProcessor().getWebSession().getProgressMonitor(),
            sqlContext,
            sql,
            filter,
            dataFormat);
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
    public WebAsyncTaskInfo asyncExecuteQuery(@NotNull WebSQLContextInfo contextInfo, @NotNull String sql, @Nullable WebSQLDataFilter filter, @Nullable WebDataFormat dataFormat) {
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<String>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                try {
                    monitor.beginTask("Execute query", 1);
                    monitor.subTask("Process query " + sql);
                    WebSQLExecuteInfo executeResults = contextInfo.getProcessor().processQuery(monitor, contextInfo, sql, filter, dataFormat);
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
    public WebAsyncTaskInfo asyncReadDataFromContainer(@NotNull WebSQLContextInfo contextInfo, @NotNull String nodePath, @Nullable WebSQLDataFilter filter, @Nullable WebDataFormat dataFormat) throws DBWebException {
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<String>() {
            @Override
            public void run(DBRProgressMonitor monitor) throws InvocationTargetException, InterruptedException {
                try {
                    monitor.beginTask("Read data", 1);
                    monitor.subTask("Extra data from " + nodePath);

                    DBSDataContainer dataContainer = contextInfo.getProcessor().getDataContainerByNodePath(monitor, nodePath, DBSDataContainer.class);

                    WebSQLExecuteInfo executeResults =  contextInfo.getProcessor().readDataFromContainer(
                        contextInfo,
                        monitor,
                        dataContainer,
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
}

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
package io.cloudbeaver.service.sql.impl;


import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.sql.*;
import org.eclipse.jface.text.Document;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.SQLDialect;
import org.jkiss.dbeaver.model.sql.SQLQuery;
import org.jkiss.dbeaver.model.sql.SQLScriptElement;
import org.jkiss.dbeaver.model.sql.SQLUtils;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionAnalyzer;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionProposalBase;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionRequest;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;

import java.lang.reflect.InvocationTargetException;
import java.util.List;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceSQL implements DBWServiceSQL {

    @Override
    @NotNull
    public WebSQLDialectInfo getDialectInfo(@NotNull WebSQLProcessor processor) throws DBWebException {
        DBPDataSource dataSource = processor.getConnection().getDataSourceContainer().getDataSource();
        SQLDialect dialect = SQLUtils.getDialectFromDataSource(dataSource);
        return new WebSQLDialectInfo(dataSource, dialect);
    }

    @NotNull
    public WebSQLCompletionProposal[] getCompletionProposals(@NotNull WebSQLContextInfo sqlContext, @NotNull String query, Integer position, Integer maxResults) throws DBWebException {
        try {
            DBPDataSource dataSource = sqlContext.getProcessor().getConnection().getDataSourceContainer().getDataSource();
            Document document = new Document();
            document.set(query);
            SQLScriptElement activeQuery = new SQLQuery(dataSource, query);
            SQLCompletionRequest request = new SQLCompletionRequest(
                new WebSQLCompletionContext(sqlContext),
                document,
                position == null ? 0 : position,
                activeQuery,
                false
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
    public WebSQLContextInfo createContext(@NotNull WebSQLProcessor processor, String defaultCatalog, String defaultSchema) {
        return processor.createContext(defaultCatalog, defaultSchema);
    }

    @Override
    public void destroyContext(@NotNull WebSQLContextInfo sqlContext) {
        sqlContext.getProcessor().destroyContext(sqlContext);
    }

    @Override
    public void setContextDefaults(@NotNull WebSQLContextInfo sqlContext, String catalogName, String schemaName) throws DBWebException {
        sqlContext.setDefaults(catalogName, schemaName);
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
    public WebSQLExecuteInfo readDataFromContainer(@NotNull WebSQLContextInfo contextInfo, @NotNull String containerPath, @Nullable WebSQLDataFilter filter, @Nullable WebDataFormat dataFormat) throws DBWebException {
        try {
            DBRProgressMonitor monitor = contextInfo.getProcessor().getWebSession().getProgressMonitor();

            DBSDataContainer dataContainer = contextInfo.getProcessor().getDataContainerByNodePath(monitor, containerPath, DBSDataContainer.class);

            if (filter == null) {
                // Use default filter
                filter = new WebSQLDataFilter();
            }

            return contextInfo.getProcessor().readDataFromContainer(contextInfo, monitor, dataContainer, filter, dataFormat);
        } catch (DBException e) {
            if (e instanceof DBWebException) throw (DBWebException) e;
            throw new DBWebException("Error reading data from '"  + containerPath + "'", e);
        }
    }

    @Override
    public WebSQLExecuteInfo updateResultsData(@NotNull WebSQLContextInfo contextInfo, @NotNull String resultsId, @NotNull List<Object> updateRow, @NotNull Map<String, Object> updateValues, WebDataFormat dataFormat) throws DBWebException {
        return contextInfo.getProcessor().updateResultsData(contextInfo, resultsId, updateRow, updateValues, dataFormat);
    }

    @Override
    public WebSQLExecuteInfo updateResultsDataBatch(@NotNull WebSQLContextInfo contextInfo, @NotNull String resultsId, @Nullable List<WebSQLResultsRow> updatedRows, @Nullable List<WebSQLResultsRow> deletedRows, @Nullable List<WebSQLResultsRow> addedRows, WebDataFormat dataFormat) throws DBWebException {
        return contextInfo.getProcessor().updateResultsDataBatch(contextInfo, resultsId, updatedRows, deletedRows, addedRows, dataFormat);
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
    public WebSQLExecuteInfo asyncGetQueryResults(@NotNull WebSession webSession, @NotNull String taskId) throws DBWebException {
        WebAsyncTaskInfo taskStatus = webSession.asyncTaskStatus(taskId, false);
        if (taskStatus != null) {
            return (WebSQLExecuteInfo) taskStatus.getExtendedResult();
        }
        return null;
    }


}

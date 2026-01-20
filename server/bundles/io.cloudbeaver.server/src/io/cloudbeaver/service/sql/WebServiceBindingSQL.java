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

import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.DBWServletContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.sql.impl.WebServiceSQL;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceBindingSQL extends WebServiceBindingBase<DBWServiceSQL>
    implements DBWServiceBindingServlet<ServletApplication> {

    public WebServiceBindingSQL() {
        super(DBWServiceSQL.class, new WebServiceSQL(), "schema/service.sql.graphqls");
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("sqlDialectInfo", env ->
                getService(env).getDialectInfo(getWebConnection(env))
            )
            .dataFetcher("sqlListContexts", env ->
                getService(env).listContexts(getWebSession(env),
                    getProjectReference(env),
                    getArgument(env, "connectionId"),
                    getArgument(env, "contextId"))
            )
            .dataFetcher("sqlCompletionProposals", env ->
                getService(env).getCompletionProposals(
                    getSQLContext(env),
                    getArgumentVal(env, "query"),
                    getArgument(env, "position"),
                    getArgument(env, "maxResults"),
                    getArgument(env, "simpleMode")
                )
            )
            .dataFetcher("sqlFormatQuery", env ->
                getService(env).formatQuery(
                    getSQLContext(env),
                    getArgumentVal(env, "query")
                )
            )
            .dataFetcher("sqlSupportedOperations", env ->
                getService(env).getSupportedOperations(
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getArgumentVal(env, "attributeIndex"))
            )
            .dataFetcher("sqlEntityQueryGenerators", env ->
                getService(env).getEntityQueryGenerators(
                    getWebSession(env),
                    getArgumentVal(env, "nodePathList"))
            )
            .dataFetcher("sqlGenerateEntityQuery", env ->
                getService(env).generateEntityQuery(
                    getWebSession(env),
                    getArgumentVal(env, "generatorId"),
                    getArgumentVal(env, "options"),
                    getArgumentVal(env, "nodePathList"))
            ).dataFetcher("sqlParseScript", env ->
                getService(env).parseSqlScript(getWebConnection(env), getArgumentVal(env, "script"))
            ).dataFetcher("sqlParseQuery", env ->
                getService(env).parseSqlQuery(
                    getWebConnection(env),
                    getArgumentVal(env, "script"),
                    getArgumentVal(env, "position"))
            ).dataFetcher("sqlGenerateGroupingQuery", env ->
            getService(env).generateGroupByQuery(
                getSQLContext(env),
                getArgumentVal(env, "resultsId"),
                getArgumentVal(env, "columnNames"),
                getArgument(env, "functions"),
                getArgument(env, "showDuplicatesOnly"))
            )
            .dataFetcher(
                "asyncSqlGroupingResultSet", env ->
                    getService(env).getGroupingSqlResultSet(
                        getWebSession(env),
                        getSQLContext(env),
                        getArgumentVal(env, "originalResultsId"),
                        getArgument(env, "currentResultsId"),
                        getArgumentVal(env, "columnNames"),
                        getArgument(env, "functions"),
                        getArgument(env, "showDuplicatesOnly"),
                        getDataFilter(env),
                        getDataFormat(env),
                        CommonUtils.toBoolean(getArgument(env, "isInteractive"))
                    )
            )
        ;

        model.getMutationType()
            .dataFetcher("sqlContextCreate", env -> getService(env).createContext(
                getSQLProcessor(env),
                getProjectReference(env),
                getArgument(env, "defaultCatalog"),
                getArgument(env, "defaultSchema")))
            .dataFetcher("sqlContextDestroy", env -> { getService(env).destroyContext(getSQLContext(env)); return true; } )
            .dataFetcher("sqlContextSetDefaults", env -> {
                getService(env).setContextDefaults(
                    getSQLContext(env),
                    getArgument(env, "defaultCatalog"),
                    getArgument(env, "defaultSchema"));
                return true;
            })

            .dataFetcher("sqlResultClose", env ->
                {
                    WebSQLContextInfo sqlContext = getSQLContext(env, false);
                    if (sqlContext == null) {
                        throw new DBWebException("SQL context not found");
                    }
                    return getService(env).closeResult(
                        getSQLContext(env),
                        getArgumentVal(env, "resultId"));
                })
            .dataFetcher("readLobValue", env -> // deprecated
                getService(env).readLobValue(
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getArgumentVal(env, "lobColumnIndex"),
                    getResultsRow(env, "row").get(0)))
            .dataFetcher("sqlReadLobValue", env ->
                getService(env).readLobValue(
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getArgumentVal(env, "lobColumnIndex"),
                    new WebSQLResultsRow(getArgument(env, "row"))))
            .dataFetcher("sqlReadStringValue", env ->
                getService(env).getCellValue(
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getArgumentVal(env, "columnIndex"),
                    new WebSQLResultsRow(getArgument(env, "row"))))
            .dataFetcher("sqlGetDynamicTrace", env ->
                getService(env).readDynamicTrace(
                    getWebSession(env),
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId")
                ))
            .dataFetcher("updateResultsDataBatch", env ->
                getService(env).updateResultsDataBatch(
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getResultsRow(env, "updatedRows"),
                    getResultsRow(env, "deletedRows"),
                    getResultsRow(env, "addedRows"),
                    getDataFormat(env)))
            .dataFetcher("asyncUpdateResultsDataBatch", env ->
                getService(env).asyncUpdateResultsDataBatch(
                    getWebSession(env),
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getResultsRow(env, "updatedRows"),
                    getResultsRow(env, "deletedRows"),
                    getResultsRow(env, "addedRows"),
                    getDataFormat(env)))
            .dataFetcher("updateResultsDataBatchScript", env ->
                getService(env).updateResultsDataBatchScript(
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId"),
                    getResultsRow(env, "updatedRows"),
                    getResultsRow(env, "deletedRows"),
                    getResultsRow(env, "addedRows"),
                    getDataFormat(env)))

            .dataFetcher("asyncSqlExecuteQuery", env ->
                getService(env).asyncExecuteQuery(
                    getWebSession(env),
                    getProjectReference(env),
                    getSQLContext(env),
                    getArgumentVal(env, "sql"),
                    getArgument(env, "resultId"),
                    getDataFilter(env),
                    getDataFormat(env),
                    CommonUtils.toBoolean(getArgument(env, "readLogs")),
                    CommonUtils.toBoolean(getArgument(env, "isInteractive"))
                )
            )
            .dataFetcher("asyncReadDataFromContainer", env ->
                getService(env).asyncReadDataFromContainer(
                    getSQLContext(env),
                    getArgumentVal(env, "containerNodePath"),
                    getArgument(env, "resultId"),
                    getDataFilter(env),
                    getDataFormat(env)
                ))
            .dataFetcher("asyncSqlExecuteResults", env ->
                getService(env).asyncGetQueryResults(
                    getWebSession(env), getArgumentVal(env, "taskId")
                ))
            .dataFetcher("asyncSqlExplainExecutionPlan", env ->
                getService(env).asyncSqlExplainExecutionPlan(
                    getSQLContext(env),
                    getArgumentVal(env, "query"),
                    getArgumentVal(env, "configuration")
                ))
            .dataFetcher("asyncSqlExplainExecutionPlanResult", env ->
                getService(env).asyncSqlExplainExecutionPlanResult(
                    getWebSession(env), getArgumentVal(env, "taskId")
                ))
            .dataFetcher("asyncSqlRowDataCount", env ->
                getService(env).getRowDataCount(
                    getWebSession(env),
                    getSQLContext(env),
                    getArgumentVal(env, "resultsId")
                ))
            .dataFetcher("asyncSqlRowDataCountResult", env ->
                getService(env).getRowDataCountResult(
                    getWebSession(env),
                    getArgumentVal(env, "taskId")
            ))
            .dataFetcher("asyncSqlSetAutoCommit", env ->
                getService(env).asyncSqlSetAutoCommit(
                    getWebSession(env),
                    getSQLContext(env),
                    getArgumentVal(env, "autoCommit")
            ))
            .dataFetcher("asyncSqlCommitTransaction", env ->
                getService(env).asyncSqlCommitTransaction(
                    getWebSession(env),
                    getSQLContext(env)
                ))
            .dataFetcher("getTransactionLogInfo", env ->
                getService(env).getTransactionLogInfo(
                    getWebSession(env),
                    getSQLContext(env)
                    ))
            .dataFetcher("asyncSqlRollbackTransaction", env ->
                getService(env).asyncSqlRollbackTransaction(
                    getWebSession(env),
                    getSQLContext(env)
                ));
    }

    @NotNull
    public static WebDataFormat getDataFormat(DataFetchingEnvironment env) {
        String dataFormat = getArgument(env, "dataFormat");
        return CommonUtils.valueOf(WebDataFormat.class, dataFormat, WebDataFormat.resultset);
    }

    @NotNull
    public static WebSQLConfiguration getSQLConfiguration(WebSession webSession) {
        return webSession.getAttribute("sqlConfiguration", cfg -> new WebSQLConfiguration(), WebSQLConfiguration::dispose);
    }

    @NotNull
    public static WebSQLProcessor getSQLProcessor(DataFetchingEnvironment env) throws DBWebException {
        WebConnectionInfo connectionInfo = getWebConnection(env);
        return getSQLProcessor(connectionInfo);
    }

    @Nullable
    public static WebSQLProcessor getSQLProcessor(DataFetchingEnvironment env, boolean connect) throws DBWebException {
        WebConnectionInfo connectionInfo = getWebConnection(env);
        return getSQLProcessor(connectionInfo, connect);
    }

    @NotNull
    public static WebSQLProcessor getSQLProcessor(WebConnectionInfo connectionInfo) throws DBWebException {
        return getSQLConfiguration(connectionInfo.getSession()).getSQLProcessor(connectionInfo);
    }

    @Nullable
    public static WebSQLProcessor getSQLProcessor(WebConnectionInfo connectionInfo, boolean connect) throws DBWebException {
        return getSQLConfiguration(connectionInfo.getSession()).getSQLProcessor(connectionInfo, connect);
    }

    @NotNull
    public static WebSQLContextInfo getSQLContext(DataFetchingEnvironment env) throws DBWebException {
        WebSQLContextInfo context = getSQLContext(env, true);
        if (context == null) {
            throw new DBWebException("Error getting SQL context");
        }
        return context;
    }

    @Nullable
    public static WebSQLContextInfo getSQLContext(DataFetchingEnvironment env, boolean connect) throws DBWebException {
        WebSQLProcessor processor = getSQLProcessor(env, connect);
        if (processor == null) {
            return null;
        }
        String contextId = getArgument(env, "contextId");
        return getSQLContext(processor, contextId);
    }

    @NotNull
    public static WebSQLContextInfo getSQLContext(WebSQLProcessor processor, String contextId) throws DBWebException {
        WebSQLContextInfo context = processor.getContext(contextId);
        if (context == null) {
            throw new DBWebException("SQL context '" + contextId + "' not found");
        }
        return context;
    }

    @Override
    public void addServlets(ServletApplication application, DBWServletContext servletContext) throws DBException {
        servletContext.addServlet(
            "sqlResultValueViewer",
            new WebSQLResultServlet(application, getServiceImpl()),
            application.getServicesURI() + "sql-result-value/*"
        );
        servletContext.addServlet(
            "sqlUploadFile",
            new WebSQLFileLoaderServlet(application),
            application.getServicesURI() + "resultset/blob/*"
        );
    }

    @Override
    public boolean isApplicable(ServletApplication application) {
        return application.isMultiuser();
    }

    private static class WebSQLConfiguration {
        private final Map<WebConnectionInfo, WebSQLProcessor> processors = new HashMap<>();

        public WebSQLConfiguration() {
        }

        WebSQLProcessor getSQLProcessor(WebConnectionInfo connectionInfo) throws DBWebException {
            return WebServiceBindingSQL.getSQLProcessor(connectionInfo, true);
        }

        WebSQLProcessor getSQLProcessor(WebConnectionInfo connectionInfo, boolean connect) throws DBWebException {
            if (connectionInfo.getDataSource() == null) {
                if (!connect) {
                    return null;
                }
                try {
                    connectionInfo.getDataSourceContainer().connect(connectionInfo.getSession().getProgressMonitor(), true, false);
                } catch (DBException e) {
                    throw new DBWebException("Error connecting to database", e);
                }
            }
            synchronized (processors) {
                WebSQLProcessor processor = processors.get(connectionInfo);
                if (processor == null) {
                    processor = new WebSQLProcessor(connectionInfo.getSession(), connectionInfo);
                    connectionInfo.addCloseListener(processors::remove);
                    processors.put(connectionInfo, processor);
                }
                return processor;
            }
        }

        public WebSQLConfiguration dispose() {
            synchronized (processors) {
                processors.forEach((connectionInfo, processor) -> processor.dispose());
                processors.clear();
            }
            return this;
        }
    }

    ///////////////////////////////////////
    // Helpers
    public static WebSQLDataFilter getDataFilter(DataFetchingEnvironment env) {
        Map<String, Object> filterProps = getArgument(env, "filter");
        return filterProps == null ? null : new WebSQLDataFilter(filterProps);
    }

    private static List<WebSQLResultsRow> getResultsRow(DataFetchingEnvironment env, String param) {
        List<Map<String, Object>> mapList = getArgument(env, param);
        if (CommonUtils.isEmpty(mapList)) {
            return null;
        }
        return mapList.stream().map(WebSQLResultsRow::new).collect(Collectors.toList());
    }

}

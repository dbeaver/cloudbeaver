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

import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.sql.impl.WebServiceSQL;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
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
public class WebServiceBindingSQL extends WebServiceBindingBase<DBWServiceSQL> implements DBWServiceBindingServlet {

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
                    env.getArgument("connectionId"),
                    env.getArgument("contextId"))
            )
            .dataFetcher("sqlCompletionProposals", env ->
                getService(env).getCompletionProposals(
                    getSQLContext(env),
                    env.getArgument("query"),
                    env.getArgument("position"),
                    env.getArgument("maxResults"),
                    env.getArgument("simpleMode")
                )
            )
            .dataFetcher("sqlFormatQuery", env ->
                getService(env).formatQuery(
                    getSQLContext(env),
                    env.getArgument("query")
                )
            )
            .dataFetcher("sqlSupportedOperations", env ->
                getService(env).getSupportedOperations(
                    getSQLContext(env),
                    env.getArgument("resultsId"),
                    env.getArgument("attributeIndex"))
            )
            .dataFetcher("sqlEntityQueryGenerators", env ->
                getService(env).getEntityQueryGenerators(
                    getWebSession(env),
                    env.getArgument("nodePathList"))
            )
            .dataFetcher("sqlGenerateEntityQuery", env ->
                getService(env).generateEntityQuery(
                    getWebSession(env),
                    env.getArgument("generatorId"),
                    env.getArgument("options"),
                    env.getArgument("nodePathList"))
            ).dataFetcher("sqlParseScript", env ->
                getService(env).parseSqlScript(getWebConnection(env), env.getArgument("script"))
            ).dataFetcher("sqlParseQuery", env ->
                getService(env).parseSqlQuery(
                    getWebConnection(env),
                    env.getArgument("script"),
                    env.getArgument("position"))
            )
        ;

        model.getMutationType()
            .dataFetcher("sqlContextCreate", env -> getService(env).createContext(
                getSQLProcessor(env),
                env.getArgument("defaultCatalog"),
                env.getArgument("defaultSchema")))
            .dataFetcher("sqlContextDestroy", env -> { getService(env).destroyContext(getSQLContext(env)); return true; } )
            .dataFetcher("sqlContextSetDefaults", env -> {
                getService(env).setContextDefaults(
                    getSQLContext(env),
                    env.getArgument("defaultCatalog"),
                    env.getArgument("defaultSchema"));
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
                        env.getArgument("resultId"));
                })
            .dataFetcher("readLobValue", env ->
                    getService(env).readLobValue(
                            getSQLContext(env),
                            env.getArgument("resultsId"),
                            env.getArgument("lobColumnIndex"),
                            getResultsRow(env, "row")))
            .dataFetcher("updateResultsDataBatch", env ->
                getService(env).updateResultsDataBatch(
                    getSQLContext(env),
                    env.getArgument("resultsId"),
                    getResultsRow(env, "updatedRows"),
                    getResultsRow(env, "deletedRows"),
                    getResultsRow(env, "addedRows"),
                    getDataFormat(env)))
            .dataFetcher("updateResultsDataBatchScript", env ->
                getService(env).updateResultsDataBatchScript(
                    getSQLContext(env),
                    env.getArgument("resultsId"),
                    getResultsRow(env, "updatedRows"),
                    getResultsRow(env, "deletedRows"),
                    getResultsRow(env, "addedRows"),
                    getDataFormat(env)))

            .dataFetcher("asyncSqlExecuteQuery", env ->
                getService(env).asyncExecuteQuery(
                    getSQLContext(env),
                    env.getArgument("sql"),
                    env.getArgument("resultId"),
                    getDataFilter(env),
                    getDataFormat(env)))
            .dataFetcher("asyncReadDataFromContainer", env ->
                getService(env).asyncReadDataFromContainer(
                    getSQLContext(env),
                    env.getArgument("containerNodePath"),
                    env.getArgument("resultId"),
                    getDataFilter(env),
                    getDataFormat(env)
                ))
            .dataFetcher("asyncSqlExecuteResults", env ->
                getService(env).asyncGetQueryResults(
                    getWebSession(env), env.getArgument("taskId")
                ))
            .dataFetcher("asyncSqlExplainExecutionPlan", env ->
                getService(env).asyncSqlExplainExecutionPlan(
                    getSQLContext(env),
                    env.getArgument("query"),
                    env.getArgument("configuration")
                ))
            .dataFetcher("asyncSqlExplainExecutionPlanResult", env ->
                getService(env).asyncSqlExplainExecutionPlanResult(
                    getWebSession(env), env.getArgument("taskId")
                ));
    }

    @NotNull
    private WebDataFormat getDataFormat(DataFetchingEnvironment env) {
        String dataFormat = env.getArgument("dataFormat");
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
        String contextId = env.getArgument("contextId");
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
    public void addServlets(CBApplication application, ServletContextHandler servletContextHandler) {
        servletContextHandler.addServlet(
            new ServletHolder("sqlResultValueViewer", new WebSQLResultServlet(application, getServiceImpl())),
            application.getServicesURI() + "sql-result-value/*");
    }

    private static class WebSQLConfiguration {
        private final Map<WebConnectionInfo, WebSQLProcessor> processors = new HashMap<>();

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

    private static WebSQLDataFilter getDataFilter(DataFetchingEnvironment env) {
        Map<String, Object> filterProps = env.getArgument("filter");
        return filterProps == null ? null : new WebSQLDataFilter(filterProps);
    }

    private static List<WebSQLResultsRow> getResultsRow(DataFetchingEnvironment env, String param) {
        List<Map<String, Object>> mapList = env.getArgument(param);
        if (CommonUtils.isEmpty(mapList)) {
            return null;
        }
        return mapList.stream().map(WebSQLResultsRow::new).collect(Collectors.toList());
    }

}

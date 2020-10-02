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
package io.cloudbeaver.service.sql;

import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.sql.impl.WebServiceSQL;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceBindingSQL extends WebServiceBindingBase<DBWServiceSQL> {

    public WebServiceBindingSQL() {
        super(DBWServiceSQL.class, new WebServiceSQL(), "schema/service.sql.graphqls");
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("sqlDialectInfo", env ->
                getService(env).getDialectInfo(getSQLProcessor(env))
            )
            .dataFetcher("sqlCompletionProposals", env ->
                getService(env).getCompletionProposals(
                    getSQLContext(env),
                    env.getArgument("query"),
                    env.getArgument("position"),
                    env.getArgument("maxResults")
                )
            );

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

            .dataFetcher("sqlExecuteQuery", env ->
                getService(env).executeQuery(
                    getSQLContext(env),
                    env.getArgument("sql"),
                    getDataFilter(env),
                    getDataFormat(env)))
            .dataFetcher("sqlResultClose", env ->
                getService(env).closeResult(
                    getSQLContext(env),
                    env.getArgument("resultId")))

            .dataFetcher("readDataFromContainer", env ->
                getService(env).readDataFromContainer(
                    getSQLContext(env),
                    env.getArgument("containerNodePath"),
                    getDataFilter(env),
                    getDataFormat(env)))
            .dataFetcher("updateResultsData", env ->
                getService(env).updateResultsData(
                    getSQLContext(env),
                    env.getArgument("resultsId"),
                    env.getArgument("updateRow"),
                    env.getArgument("updateValues"),
                    getDataFormat(env)))
            .dataFetcher("updateResultsDataBatch", env ->
                getService(env).updateResultsDataBatch(
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
                    getDataFilter(env),
                    getDataFormat(env)
                ))
            .dataFetcher("asyncSqlExecuteResults", env ->
                getService(env).asyncGetQueryResults(
                    getWebSession(env), env.getArgument("taskId")
                ));
    }

    private WebDataFormat getDataFormat(DataFetchingEnvironment env) {
        String dataFormat = env.getArgument("dataFormat");
        return CommonUtils.valueOf(WebDataFormat.class, dataFormat, WebDataFormat.resultset);
    }

    public static WebSQLConfiguration getSQLConfiguration(WebSession webSession) {
        return webSession.getAttribute("sqlConfiguration", cfg -> new WebSQLConfiguration(), WebSQLConfiguration::dispose);
    }

    public static WebSQLProcessor getSQLProcessor(DataFetchingEnvironment env) throws DBWebException {
        WebConnectionInfo connectionInfo = getWebConnection(env);
        return getSQLConfiguration(connectionInfo.getSession()).getSQLProcessor(connectionInfo);
    }

    public static WebSQLContextInfo getSQLContext(DataFetchingEnvironment env) throws DBWebException {
        WebSQLProcessor processor = getSQLProcessor(env);
        String contextId = env.getArgument("contextId");
        WebSQLContextInfo context = processor.getContext(contextId);
        if (context == null) {
            throw new DBWebException("SQL context '" + contextId + "' not found");
        }
        return context;
    }

    private static class WebSQLConfiguration {
        private final Map<WebConnectionInfo, WebSQLProcessor> processors = new HashMap<>();

        WebSQLProcessor getSQLProcessor(WebConnectionInfo connectionInfo) throws DBWebException {
            if (connectionInfo.getDataSource() == null) {
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

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
import io.cloudbeaver.DBWUtils;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.session.WebSessionManager;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.sql.impl.WebServiceSQL;
import org.jkiss.dbeaver.DBException;

import java.util.HashMap;
import java.util.Map;

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
                getSQLProcessor(model, env).getDialectInfo()
            )
            .dataFetcher("sqlCompletionProposals", env ->
                getSQLContext(model, env).getCompletionProposals(
                    env.getArgument("query"),
                    env.getArgument("position"),
                    env.getArgument("maxResults")
                )
            );

        model.getMutationType()
            .dataFetcher("sqlContextCreate", env -> getSQLProcessor(model, env).createContext(env.getArgument("defaultCatalog"), env.getArgument("defaultSchema")))
            .dataFetcher("sqlContextDestroy", env -> { getSQLContext(model, env).destroy(); return true; } )
            .dataFetcher("sqlContextSetDefaults", env -> { getSQLContext(model, env).setDefaults(env.getArgument("defaultCatalog"), env.getArgument("defaultSchema")); return true; })

            .dataFetcher("sqlExecuteQuery", env ->
                getSQLContext(model, env).executeQuery(
                    env.getArgument("sql"), getDataFilter(env)
                ))
            .dataFetcher("sqlResultClose", env ->
                getSQLContext(model, env).closeResult(env.getArgument("resultId")))

            .dataFetcher("readDataFromContainer", env ->
                getSQLProcessor(model, env).readDataFromContainer(
                    getSQLContext(model, env),
                    env.getArgument("containerNodePath"), getDataFilter(env)
                ))
            .dataFetcher("updateResultsData", env ->
                getSQLProcessor(model, env).updateResultsData(
                    getSQLContext(model, env),
                    env.getArgument("resultsId"),
                    env.getArgument("updateRow"),
                    env.getArgument("updateValues")
                ))
            .dataFetcher("asyncSqlExecuteQuery", env ->
                getSQLContext(model, env).asyncExecuteQuery(
                    env.getArgument("sql"), getDataFilter(env)
                ));
    }

    public static WebSQLConfiguration getSQLConfiguration(WebSession webSession) {
        return webSession.getAttribute("sqlConfiguration", cfg -> new WebSQLConfiguration(), cfg -> null);
    }

    public static WebSQLProcessor getSQLProcessor(DBWBindingContext model, DataFetchingEnvironment env) throws DBWebException {
        WebConnectionInfo connectionInfo = getWebConnection(model, env);
        return getSQLConfiguration(connectionInfo.getSession()).getSQLProcessor(connectionInfo);
    }

    public static WebSQLContextInfo getSQLContext(DBWBindingContext model, DataFetchingEnvironment env) throws DBWebException {
        WebSQLProcessor processor = getSQLProcessor(model, env);
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
            WebSQLProcessor processor = processors.get(connectionInfo);
            if (processor == null) {
                processor = new WebSQLProcessor(connectionInfo.getSession(), connectionInfo);
                processors.put(connectionInfo, processor);
            }
            return processor;
        }
    }

    ///////////////////////////////////////
    // Helpers

    private static WebSQLDataFilter getDataFilter(DataFetchingEnvironment env) {
        Map<String, Object> filterProps = env.getArgument("filter");
        return filterProps == null ? null : new WebSQLDataFilter(filterProps);
    }
}

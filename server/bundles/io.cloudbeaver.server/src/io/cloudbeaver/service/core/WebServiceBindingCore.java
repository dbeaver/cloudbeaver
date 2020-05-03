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
package io.cloudbeaver.service.core;

import graphql.schema.idl.TypeRuntimeWiring;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSessionManager;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.core.impl.WebServiceCore;

/**
 * Web service implementation
 */
public class WebServiceBindingCore extends WebServiceBindingBase<DBWServiceCore> {

    public WebServiceBindingCore() {
        super(DBWServiceCore.class, new WebServiceCore(), "schema/service.core.graphqls");
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        CBPlatform platform = CBPlatform.getInstance();
        WebSessionManager sessionManager = platform.getSessionManager();
        model.getQueryType()
            .dataFetcher("serverConfig", env -> platform.getServerConfig())

            .dataFetcher("driverList", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).getDriverList(env.getArgument("id")))
            .dataFetcher("dataSourceList", env -> platform.getGlobalDataSources())

            .dataFetcher("sessionPermissions", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).getSessionPermissions())
            .dataFetcher("sessionState", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)))

            .dataFetcher("readSessionLog", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env), false, true).readLog(
                env.getArgument("maxEntries"),
                env.getArgument("clearEntries")))
        ;

        model.getMutationType()
            .dataFetcher("openSession", env -> sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env), false))
            .dataFetcher("closeSession", env -> sessionManager.closeSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("touchSession", env -> sessionManager.touchSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("changeSessionLanguage", env -> {
                sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).setLocale(env.getArgument("locale"));
                return true;
            })

            .dataFetcher("openConnection", env -> sessionManager.openConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("config")))
            .dataFetcher("createConnection", env -> sessionManager.createConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("config")))
            .dataFetcher("testConnection", env -> sessionManager.testConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("config")))
            .dataFetcher("closeConnection", env -> sessionManager.closeConnection(GraphQLEndpoint.getServletRequest(env), env.getArgument("id")))

            .dataFetcher("asyncTaskStatus", env ->
                sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).asyncTaskStatus(
                    env.getArgument("id"))
            )
            .dataFetcher("asyncTaskCancel", env ->
                sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env)).asyncTaskCancel(
                    env.getArgument("id"))
            )
        ;

        model.getRuntimeWiring().type(TypeRuntimeWiring.newTypeWiring("AsyncTaskResult").typeResolver(env -> {
                return env.getObject();
            })
        );
    }

}

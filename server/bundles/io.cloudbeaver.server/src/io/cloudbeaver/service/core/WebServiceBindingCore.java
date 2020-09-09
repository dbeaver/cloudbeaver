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

import graphql.TypeResolutionEnvironment;
import graphql.schema.DataFetchingEnvironment;
import graphql.schema.idl.TypeRuntimeWiring;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebConnectionConfig;
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
            .dataFetcher("serverConfig", env -> getService(env).getServerConfig())

            .dataFetcher("driverList", env -> getService(env).getDriverList(getWebSession(env), env.getArgument("id")))
            .dataFetcher("authModels", env -> getService(env).getAuthModels(getWebSession(env)))
            .dataFetcher("templateDataSources", env -> getService(env).getTemplateDataSources())
            .dataFetcher("templateConnections", env -> getService(env).getTemplateConnections(getWebSession(env)))

            .dataFetcher("sessionPermissions", env -> getService(env).getSessionPermissions(getWebSession(env)))
            .dataFetcher("sessionState", env -> getService(env).getSessionState(getWebSession(env)))

            .dataFetcher("connectionState", env -> getService(env).getConnectionState(getWebSession(env), env.getArgument("id")))
            .dataFetcher("connectionInfo", env -> getService(env).getConnectionState(getWebSession(env), env.getArgument("id")))

            .dataFetcher("readSessionLog", env -> getService(env).readSessionLog(
                getWebSession(env),
                env.getArgument("maxEntries"),
                env.getArgument("clearEntries")))
        ;

        model.getMutationType()
            .dataFetcher("openSession", env -> getService(env).openSession(sessionManager.getWebSession(GraphQLEndpoint.getServletRequest(env), false)))
            .dataFetcher("closeSession", env -> getService(env).closeSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("touchSession", env -> getService(env).touchSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("refreshSessionConnections", env -> getService(env).refreshSessionConnections(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("changeSessionLanguage", env -> getService(env).changeSessionLanguage(getWebSession(env), env.getArgument("locale")))

            .dataFetcher("openConnection", env -> getService(env).openConnection(getWebSession(env), getConnectionConfig(env)))
            .dataFetcher("createConnection", env -> getService(env).createConnection(getWebSession(env), getConnectionConfig(env)))
            .dataFetcher("createConnectionFromTemplate", env -> getService(env).createConnectionFromTemplate(getWebSession(env), env.getArgument("templateId")))
            .dataFetcher("initConnection", env -> getService(env).initConnection(getWebSession(env), env.getArgument("id"), env.getArgument("credentials")))
            .dataFetcher("testConnection", env -> getService(env).testConnection(getWebSession(env), getConnectionConfig(env)))
            .dataFetcher("closeConnection", env -> getService(env).closeConnection(getWebSession(env), env.getArgument("id")))
            .dataFetcher("deleteConnection", env -> getService(env).deleteConnection(getWebSession(env), env.getArgument("id")))

            .dataFetcher("setConnectionNavigatorSettings", env -> getService(env).setConnectionNavigatorSettings(getWebSession(env), env.getArgument("id"), WebServiceUtils.parseNavigatorSettings(env.getArgument("settings"))))

            .dataFetcher("asyncTaskInfo", env -> getService(env).getAsyncTaskInfo(
                getWebSession(env),
                env.getArgument("id"),
                env.getArgument("removeOnFinish")))
            .dataFetcher("asyncTaskCancel", env -> getService(env).cancelAsyncTask(getWebSession(env), env.getArgument("id")))
        ;

        model.getRuntimeWiring().type(TypeRuntimeWiring.newTypeWiring("AsyncTaskResult").typeResolver(TypeResolutionEnvironment::getObject)
        );
    }

    private WebConnectionConfig getConnectionConfig(DataFetchingEnvironment env) {
        return new WebConnectionConfig(env.getArgument("config"));
    }

}

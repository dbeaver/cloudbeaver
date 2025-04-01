/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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
import io.cloudbeaver.model.WebNetworkHandlerConfigInput;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.server.WebAppSessionManager;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.core.impl.WebServiceCore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jkiss.utils.CommonUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceBindingCore extends WebServiceBindingBase<DBWServiceCore> {

    public WebServiceBindingCore() {
        super(DBWServiceCore.class, new WebServiceCore(), "schema/service.core.graphqls");
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        WebAppSessionManager sessionManager = WebAppUtils.getWebApplication().getSessionManager();
        model.getQueryType()
            .dataFetcher("serverConfig", env -> getService(env).getServerConfig())
            .dataFetcher("systemInfo", env -> getService(env).getSystemInformationProperties(getWebSession(env)))
            .dataFetcher("productSettings", env -> getService(env).getProductSettings(getWebSession(env)))

            .dataFetcher("driverList", env -> getService(env).getDriverList(getWebSession(env), env.getArgument("id")))
            .dataFetcher("authModels", env -> getService(env).getAuthModels(getWebSession(env)))
            .dataFetcher("networkHandlers", env -> getService(env).getNetworkHandlers(getWebSession(env)))
            .dataFetcher("userConnections", env -> getService(env).getUserConnections(
                getWebSession(env), getProjectReference(env), env.getArgument("id"), env.getArgument("projectIds")))

            .dataFetcher("connectionFolders", env -> getService(env).getConnectionFolders(
                getWebSession(env), getProjectReference(env), env.getArgument("path")))

            .dataFetcher("sessionPermissions", env -> getService(env).getSessionPermissions(getWebSession(env)))
            .dataFetcher("sessionState", env -> getService(env).getSessionState(findWebSession(env, true)))

            .dataFetcher("connectionInfo", env -> getService(env).getConnectionState(
                getWebSession(env), getProjectReference(env), env.getArgument("id")))

            .dataFetcher("listProjects", env -> getService(env).getProjects(getWebSession(env)))
            .dataFetcher("readSessionLog", env -> {
                // CB-90. Log read mustn't extend session lifetime and mustn't fail if there is no session.
                WebSession session = findWebSession(env);
                if (session == null) {
                    return Collections.emptyList();
                }
                return getService(env).readSessionLog(
                    session,
                    env.getArgument("maxEntries"),
                    env.getArgument("clearEntries"));
            })
        ;

        model.getMutationType()
            .dataFetcher("openSession", env -> {
                HttpServletRequest servletRequest = GraphQLEndpoint.getServletRequest(env);
                HttpServletResponse servletResponse = GraphQLEndpoint.getServletResponse(env);
                return getService(env).openSession(
                    sessionManager.getWebSession(servletRequest, servletResponse, false),
                    env.getArgument("defaultLocale"),
                    servletRequest,
                    servletResponse);
            })
            .dataFetcher("closeSession", env -> getService(env).closeSession(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("touchSession", env -> getService(env).touchSession(
                GraphQLEndpoint.getServletRequest(env), GraphQLEndpoint.getServletResponse(env)))
            .dataFetcher("updateSession", env -> getService(env).updateSession(
                GraphQLEndpoint.getServletRequest(env), GraphQLEndpoint.getServletResponse(env)))
            .dataFetcher("refreshSessionConnections", env -> getService(env).refreshSessionConnections(
                GraphQLEndpoint.getServletRequest(env), GraphQLEndpoint.getServletResponse(env)))
            .dataFetcher("changeSessionLanguage", env -> getService(env).changeSessionLanguage(getWebSession(env), env.getArgument("locale")))

            .dataFetcher("createConnection", env -> getService(env).createConnection(
                getWebSession(env), getProjectReference(env), getConnectionConfig(env)))
            .dataFetcher("updateConnection", env -> getService(env).updateConnection(
                getWebSession(env), getProjectReference(env), getConnectionConfig(env)))
            .dataFetcher("deleteConnection", env -> getService(env).deleteConnection(
                getWebSession(env), getProjectReference(env), env.getArgument("id")))
            .dataFetcher("copyConnectionFromNode", env -> getService(env).copyConnectionFromNode(
                getWebSession(env),
                getProjectReference(env),
                env.getArgument("nodePath"),
                new WebConnectionConfig(env.getArgument("config"))))
            .dataFetcher("initConnection", env -> {
                    List<Map<String, Object>> networkCredentials = env.getArgument("networkCredentials");
                    List<WebNetworkHandlerConfigInput> nhc = null;
                    if (networkCredentials != null) {
                        nhc = networkCredentials.stream().map(WebNetworkHandlerConfigInput::new).collect(Collectors.toList());
                    }
                    return getService(env).initConnection(
                        getWebSession(env),
                        getProjectReference(env),
                        env.getArgument("id"),
                        env.getArgument("credentials"),
                        nhc,
                        CommonUtils.toBoolean(env.getArgument("saveCredentials")),
                        CommonUtils.toBoolean(env.getArgument("sharedCredentials")),
                        env.getArgument("selectedSecretId")
                    );
                }
            )
            .dataFetcher("testConnection", env -> getService(env).testConnection(
                getWebSession(env), getProjectReference(env), getConnectionConfig(env)
            ))
            .dataFetcher("testNetworkHandler", env -> getService(env).testNetworkHandler(
                getWebSession(env), new WebNetworkHandlerConfigInput(env.getArgument("config"))
            ))
            .dataFetcher("closeConnection", env -> getService(env).closeConnection(getWebSession(env), getProjectReference(env), env.getArgument("id")))

            .dataFetcher("setConnectionNavigatorSettings", env -> getService(env).setConnectionNavigatorSettings(
                getWebSession(env),
                getProjectReference(env),
                env.getArgument("id"),
                WebServiceUtils.parseNavigatorSettings(env.getArgument("settings"))
            ))

            .dataFetcher("asyncTaskInfo", env -> getService(env).getAsyncTaskInfo(
                getWebSession(env),
                env.getArgument("id"),
                env.getArgument("removeOnFinish")))
            .dataFetcher("asyncTaskCancel", env -> getService(env).cancelAsyncTask(getWebSession(env), env.getArgument("id")))

            .dataFetcher("createConnectionFolder", env -> getService(env).createConnectionFolder(
                getWebSession(env),
                getProjectReference(env),
                env.getArgument("parentFolderPath"),
                env.getArgument("folderName")
            ))
            .dataFetcher("renameConnectionFolder", env -> getService(env).renameConnectionFolder(
                getWebSession(env),
                getProjectReference(env),
                env.getArgument("folderPath"),
                env.getArgument("newName")
            ))
            .dataFetcher("deleteConnectionFolder", env -> getService(env).deleteConnectionFolder(
                getWebSession(env),
                getProjectReference(env),
                env.getArgument("folderPath")
            ))
        ;

        model.getRuntimeWiring().type(TypeRuntimeWiring.newTypeWiring("AsyncTaskResult").typeResolver(TypeResolutionEnvironment::getObject)
        );

    }

    private WebConnectionConfig getConnectionConfig(DataFetchingEnvironment env) {
        return new WebConnectionConfig(env.getArgument("config"));
    }
}

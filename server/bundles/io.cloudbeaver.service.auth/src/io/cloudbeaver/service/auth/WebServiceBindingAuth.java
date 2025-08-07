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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.auth.impl.WebServiceAuthImpl;
import org.jkiss.utils.CommonUtils;

/**
 * Web service implementation
 */
public class WebServiceBindingAuth extends WebServiceBindingBase<DBWServiceAuth> {

    private static final String SCHEMA_FILE_NAME = "schema/service.auth.graphqls";

    public WebServiceBindingAuth() {
        super(DBWServiceAuth.class, new WebServiceAuthImpl(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("authLogin", env -> getService(env).authLogin(
                getWebSession(env, false),
                env.getArgument("provider"),
                env.getArgument("configuration"),
                env.getArgument("credentials"),
                CommonUtils.toBoolean(env.getArgument("linkUser")),
                CommonUtils.toBoolean(env.getArgument("forceSessionsLogout"))
            ))
            .dataFetcher("federatedAuthTaskResult", env -> getService(env).federatedAuthTaskResult(
                getWebSession(env, false),
                env.getArgument("taskId")
            ))
            .dataFetcher("authLogoutExtended", env -> getService(env).authLogout(
                GraphQLEndpoint.getServletRequest(env),
                getWebSession(env, false),
                env.getArgument("provider"),
                env.getArgument("configuration")
            ))
            .dataFetcher("authLogout", env -> {
                getService(env).authLogout(
                    GraphQLEndpoint.getServletRequest(env),
                    getWebSession(env, false),
                    env.getArgument("provider"),
                    env.getArgument("configuration"));
                return true;
            })
            .dataFetcher("authUpdateStatus", env -> getService(env).authUpdateStatus(
                getWebSession(env, false),
                env.getArgument("authId"),
                CommonUtils.toBoolean(env.getArgument("linkUser"))
            ))
            .dataFetcher("activeUser", env -> getService(env).activeUser(getWebSession(env, false)))
            .dataFetcher("authProviders", env -> getService(env).getAuthProviders(GraphQLEndpoint.getServletRequest(env)))
            .dataFetcher("authChangeLocalPassword", env -> getService(env).changeLocalPassword(
                getWebSession(env),
                env.getArgument("oldPassword"),
                env.getArgument("newPassword")
            ))
            .dataFetcher("listUserProfileProperties",
                env -> getService(env).listUserProfileProperties(getWebSession(env)))
        ;
        model.getMutationType()
            .dataFetcher("setUserConfigurationParameter",
                env -> getService(env).setUserConfigurationParameter(getWebSession(env),
                    env.getArgument("name"),
                    env.getArgument("value")))
            .dataFetcher("setUserPreferences",
                env -> getService(env).setUserConfigurationParameters(getWebSession(env),
                    env.getArgument("preferences")))
            .dataFetcher("federatedLogin", env -> getService(env).federatedLogin(
                GraphQLEndpoint.getServletRequest(env),
                getWebSession(env, false),
                env.getArgument("provider"),
                env.getArgument("configuration"),
                CommonUtils.toBoolean(env.getArgument("linkUser")),
                CommonUtils.toBoolean(env.getArgument("forceSessionsLogout"))
            ))
        ;
    }
}

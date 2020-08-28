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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.admin.impl.WebServiceAdmin;

/**
 * Web service implementation
 */
public class WebServiceBindingAdmin extends WebServiceBindingBase<DBWServiceAdmin> {

    private static final String SCHEMA_FILE_NAME = "schema/service.admin.graphqls";

    public WebServiceBindingAdmin() {
        super(DBWServiceAdmin.class, new WebServiceAdmin(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("listUsers",
                env -> getService(env).listUsers(getWebSession(env), env.getArgument("userId")))
            .dataFetcher("listRoles",
                env -> getService(env).listRoles(getWebSession(env), env.getArgument("roleId")))
            .dataFetcher("listPermissions",
                env -> getService(env).listPermissions(getWebSession(env)))
            .dataFetcher("createUser",
                env -> getService(env).createUser(getWebSession(env), env.getArgument("userId")))
            .dataFetcher("deleteUser",
                env -> getService(env).deleteUser(getWebSession(env), env.getArgument("userId")))
            .dataFetcher("createRole",
                env -> getService(env).createRole(getWebSession(env), env.getArgument("roleId")))
            .dataFetcher("deleteRole",
                env -> getService(env).deleteRole(getWebSession(env), env.getArgument("roleId")))

            .dataFetcher("grantUserRole",
                env -> getService(env).grantUserRole(getWebSession(env), env.getArgument("userId"), env.getArgument("roleId")))
            .dataFetcher("revokeUserRole",
                env -> getService(env).revokeUserRole(getWebSession(env), env.getArgument("userId"), env.getArgument("roleId")))
            .dataFetcher("setSubjectPermissions",
                env -> getService(env).setSubjectPermissions(getWebSession(env), env.getArgument("roleId"), env.getArgument("permissions")))
        .dataFetcher("setUserCredentials",
            env -> getService(env).setUserCredentials(getWebSession(env), env.getArgument("userId"), env.getArgument("providerId"), env.getArgument("credentials")))

        .dataFetcher("allConnections", env -> getService(env).getAllConnections(getWebSession(env)))
        .dataFetcher("searchConnections", env -> getService(env).searchConnections(getWebSession(env), env.getArgument("hostNames")))

        .dataFetcher("createConnectionConfiguration",
            env -> getService(env).createConnectionConfiguration(getWebSession(env), new WebConnectionConfig(env.getArgument("config"))))
        .dataFetcher("updateConnectionConfiguration",
            env -> getService(env).updateConnectionConfiguration(getWebSession(env), env.getArgument("id"), new WebConnectionConfig(env.getArgument("config"))))
        .dataFetcher("deleteConnectionConfiguration",
            env -> getService(env).deleteConnectionConfiguration(getWebSession(env), env.getArgument("id")))

        .dataFetcher("getConnectionSubjectAccess",
            env -> getService(env).getConnectionSubjectAccess(getWebSession(env), env.getArgument("connectionId")))
        .dataFetcher("setConnectionSubjectAccess",
            env -> getService(env).setConnectionSubjectAccess(getWebSession(env), env.getArgument("connectionId"), env.getArgument("subjects")))

        .dataFetcher("getSubjectConnectionAccess",
            env -> getService(env).getSubjectConnectionAccess(getWebSession(env), env.getArgument("subjectId")))
        .dataFetcher("setSubjectConnectionAccess",
            env -> getService(env).setSubjectConnectionAccess(getWebSession(env), env.getArgument("subjectId"), env.getArgument("connections")))

        .dataFetcher("configureServer",
            env -> getService(env).configureServer(getWebSession(env), new AdminServerConfig(env.getArgument("configuration"))))
        .dataFetcher("setDefaultNavigatorSettings",
            env -> getService(env).setDefaultNavigatorSettings(getWebSession(env), WebServiceUtils.parseNavigatorSettings(env.getArgument("settings"))))
        ;
    }

}

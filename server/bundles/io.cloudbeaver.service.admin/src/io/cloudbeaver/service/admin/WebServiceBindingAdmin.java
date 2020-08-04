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
        model.getQueryType().dataFetcher("listUsers",
            env -> getService(env).listUsers(getWebSession(env), env.getArgument("userId")));
        model.getQueryType().dataFetcher("listRoles",
            env -> getService(env).listRoles(getWebSession(env), env.getArgument("roleId")));
        model.getQueryType().dataFetcher("listPermissions",
            env -> getService(env).listPermissions(getWebSession(env)));
        model.getQueryType().dataFetcher("createUser",
            env -> getService(env).createUser(getWebSession(env), env.getArgument("userId")));
        model.getQueryType().dataFetcher("deleteUser",
            env -> getService(env).deleteUser(getWebSession(env), env.getArgument("userId")));
        model.getQueryType().dataFetcher("createRole",
            env -> getService(env).createRole(getWebSession(env), env.getArgument("roleId")));
        model.getQueryType().dataFetcher("deleteRole",
            env -> getService(env).deleteRole(getWebSession(env), env.getArgument("roleId")));

        model.getQueryType().dataFetcher("grantUserRole",
            env -> getService(env).grantUserRole(getWebSession(env), env.getArgument("userId"), env.getArgument("roleId")));
        model.getQueryType().dataFetcher("revokeUserRole",
            env -> getService(env).revokeUserRole(getWebSession(env), env.getArgument("userId"), env.getArgument("roleId")));
        model.getQueryType().dataFetcher("setSubjectPermissions",
            env -> getService(env).setSubjectPermissions(getWebSession(env), env.getArgument("roleId"), env.getArgument("permissions")));
        model.getQueryType().dataFetcher("setUserCredentials",
            env -> getService(env).setUserCredentials(getWebSession(env), env.getArgument("userId"), env.getArgument("providerId"), env.getArgument("credentials")));
    }

}

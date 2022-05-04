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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebConnectionConfig;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.admin.impl.WebAdminLogsServlet;
import io.cloudbeaver.service.admin.impl.WebServiceAdmin;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.jkiss.utils.CommonUtils;

/**
 * Web service implementation
 */
public class WebServiceBindingAdmin extends WebServiceBindingBase<DBWServiceAdmin> implements DBWServiceBindingServlet {

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
                env -> getService(env).createRole(
                    getWebSession(env),
                    env.getArgument("roleId"),
                    env.getArgument("roleName"),
                    env.getArgument("description")))
            .dataFetcher("updateRole",
                env -> getService(env).updateRole(
                    getWebSession(env),
                    env.getArgument("roleId"),
                    env.getArgument("roleName"),
                    env.getArgument("description")))
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
        .dataFetcher("enableUser",
            env -> getService(env).enableUser(getWebSession(env), env.getArgument("userId"), env.getArgument("enabled")))
        .dataFetcher("allConnections", env -> getService(env).getAllConnections(getWebSession(env), env.getArgument("id")))
        .dataFetcher("searchConnections", env -> getService(env).searchConnections(getWebSession(env), env.getArgument("hostNames")))

        .dataFetcher("createConnectionConfiguration",
            env -> getService(env).createConnectionConfiguration(getWebSession(env), new WebConnectionConfig(env.getArgument("config"))))
        .dataFetcher("copyConnectionConfiguration",
            env -> getService(env).copyConnectionConfiguration(getWebSession(env), env.getArgument("nodePath"), new WebConnectionConfig(env.getArgument("config"))))
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

        .dataFetcher("listFeatureSets",
            env -> getService(env).listFeatureSets(getWebSession(env)))

        .dataFetcher("listAuthProviderConfigurationParameters",
            env -> getService(env).listAuthProviderConfigurationParameters(getWebSession(env), env.getArgument("providerId")))
        .dataFetcher("listAuthProviderConfigurations",
            env -> getService(env).listAuthProviderConfigurations(getWebSession(env), env.getArgument("providerId")))
        .dataFetcher("saveAuthProviderConfiguration",
            env -> getService(env).saveAuthProviderConfiguration(
                getWebSession(env),
                env.getArgument("providerId"),
                env.getArgument("id"),
                env.getArgument("displayName"),
                CommonUtils.toBoolean((Boolean)env.getArgument("disabled")),
                env.getArgument("iconURL"),
                env.getArgument("description"),
                env.getArgument("parameters")))
        .dataFetcher("deleteAuthProviderConfiguration",
            env -> getService(env).deleteAuthProviderConfiguration(getWebSession(env), env.getArgument("id")))

            .dataFetcher("saveUserMetaParameter",
                env -> getService(env).saveUserMetaParameter(
                    getWebSession(env),
                    env.getArgument("id"),
                    env.getArgument("displayName"),
                    env.getArgument("description"),
                    env.getArgument("required")))

            .dataFetcher("deleteUserMetaParameter",
                env -> getService(env).deleteUserMetaParameter(
                    getWebSession(env),
                    env.getArgument("id")))

            .dataFetcher("setUserMetaParameterValues",
                env -> getService(env).setUserMetaParameterValues(
                    getWebSession(env),
                    env.getArgument("userId"),
                    env.getArgument("parameters")))

            .dataFetcher("configureServer",
            env -> getService(env).configureServer(getWebSession(env), new AdminServerConfig(env.getArgument("configuration"))))
        .dataFetcher("setDefaultNavigatorSettings",
            env -> getService(env).setDefaultNavigatorSettings(getWebSession(env), WebServiceUtils.parseNavigatorSettings(env.getArgument("settings"))))
        ;
    }

    @Override
    public void addServlets(CBApplication application, ServletContextHandler servletContextHandler) {
        servletContextHandler.addServlet(
            new ServletHolder("adminLogs", new WebAdminLogsServlet(application)),
            application.getServicesURI() + "logs/*");
    }

}

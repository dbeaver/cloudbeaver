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
package io.cloudbeaver.service.admin;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.graphql.GraphQLEndpoint;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.DBWServletContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.admin.impl.WebAdminLogsServlet;
import io.cloudbeaver.service.admin.impl.WebServiceAdmin;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

/**
 * Web service implementation
 */
public class WebServiceBindingAdmin extends WebServiceBindingBase<DBWServiceAdmin>
                implements DBWServiceBindingServlet<CBApplication> {

    private static final String SCHEMA_FILE_NAME = "schema/service.admin.graphqls";

    public WebServiceBindingAdmin() {
        super(DBWServiceAdmin.class, new WebServiceAdmin(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher(
                "adminUserInfo",
                env -> getService(env).getUserById(getWebSession(env), env.getArgument("userId"))
            )
            .dataFetcher(
                "listUsers",
                env -> getService(env).listUsers(
                    getWebSession(env),
                    new AdminUserInfoFilter(env.getArgument("filter"), env.getArgument("page"))
                )
            )
            .dataFetcher("listTeams",
                env -> getService(env).listTeams(getWebSession(env), env.getArgument("teamId")))
            .dataFetcher("listPermissions",
                env -> getService(env).listPermissions(getWebSession(env)))
            .dataFetcher("listAuthRoles",
                env -> getService(env).listAuthRoles())
            .dataFetcher("listTeamRoles",
                env -> getService(env).listTeamRoles())
            .dataFetcher("listTeamMetaParameters",
                env -> getService(env).listTeamMetaParameters(getWebSession(env)))
            .dataFetcher("createUser",
                env -> getService(env).createUser(
                    getWebSession(env),
                    env.getArgument("userId"),
                    env.getArgument("enabled"),
                    env.getArgument("authRole")
                ))
            .dataFetcher("deleteUser",
                env -> getService(env).deleteUser(getWebSession(env), env.getArgument("userId")))
            .dataFetcher("createTeam",
                env -> getService(env).createTeam(
                    getWebSession(env),
                    env.getArgument("teamId"),
                    env.getArgument("teamName"),
                    env.getArgument("description")))
            .dataFetcher("updateTeam",
                env -> getService(env).updateTeam(
                    getWebSession(env),
                    env.getArgument("teamId"),
                    env.getArgument("teamName"),
                    env.getArgument("description")))
            .dataFetcher("deleteTeam",
                env -> getService(env).deleteTeam(
                    getWebSession(env),
                    env.getArgument("teamId"),
                    CommonUtils.toBoolean(env.getArgument("force"))))

            .dataFetcher("grantUserTeam",
                env -> getService(env).grantUserTeam(getWebSession(env), env.getArgument("userId"), env.getArgument("teamId")))
            .dataFetcher("revokeUserTeam",
                env -> getService(env).revokeUserTeam(getWebSession(env), env.getArgument("userId"), env.getArgument("teamId")))
            .dataFetcher("setSubjectPermissions",
                env -> getService(env).setSubjectPermissions(getWebSession(env), env.getArgument("subjectId"), env.getArgument("permissions")))
            .dataFetcher("setUserCredentials",
                env -> getService(env).setUserCredentials(getWebSession(env),
                    env.getArgument("userId"),
                    env.getArgument("providerId"),
                    env.getArgument("credentials")))
            .dataFetcher("deleteUserCredentials",
                env -> getService(env).deleteUserCredentials(getWebSession(env), env.getArgument("userId"), env.getArgument("providerId")))
            .dataFetcher("enableUser",
                env -> getService(env).enableUser(getWebSession(env), env.getArgument("userId"), env.getArgument("enabled")))
            .dataFetcher("setUserAuthRole",
                env -> getService(env).setUserAuthRole(getWebSession(env), env.getArgument("userId"), env.getArgument("authRole")))
            .dataFetcher("setUserTeamRole",
                env -> getService(env).setUserTeamRole(
                    getWebSession(env),
                    env.getArgument("userId"),
                    env.getArgument("teamId"),
                    env.getArgument("teamRole")
                )
            )
            .dataFetcher("searchConnections", env -> getService(env).searchConnections(getWebSession(env), env.getArgument("hostNames")))
            .dataFetcher("getConnectionSubjectAccess",
                env -> getService(env).getConnectionSubjectAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    env.getArgument("connectionId")))
            .dataFetcher("setConnectionSubjectAccess",
                env -> getService(env).setConnectionSubjectAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    env.getArgument("connectionId"),
                    env.getArgument("subjects")))
            .dataFetcher("addConnectionsAccess",
                env -> getService(env).addConnectionsAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    env.getArgument("connectionIds"),
                    env.getArgument("subjects")))
            .dataFetcher("deleteConnectionsAccess",
                env -> getService(env).deleteConnectionsAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    env.getArgument("connectionIds"),
                    env.getArgument("subjects")))

        .dataFetcher("getSubjectConnectionAccess",
            env -> getService(env).getSubjectConnectionAccess(getWebSession(env), env.getArgument("subjectId")))
        .dataFetcher("setSubjectConnectionAccess",
            env -> getService(env).setSubjectConnectionAccess(getWebSession(env), env.getArgument("subjectId"), env.getArgument("connections")))

        .dataFetcher("listFeatureSets",
            env -> getService(env).listFeatureSets(getWebSession(env)))

        .dataFetcher("listAuthProviderConfigurationParameters",
            env -> getService(env).listAuthProviderConfigurationParameters(getWebSession(env), env.getArgument("providerId")))
        .dataFetcher("listAuthProviderConfigurations",
            env -> getService(env).listAuthProviderConfigurations(GraphQLEndpoint.getServletRequest(env),
                getWebSession(env), env.getArgument("providerId"))
        )
        .dataFetcher("saveAuthProviderConfiguration",
            env -> getService(env).saveAuthProviderConfiguration(
                GraphQLEndpoint.getServletRequest(env),
                getWebSession(env),
                env.getArgument("providerId"),
                env.getArgument("id"),
                env.getArgument("displayName"),
                CommonUtils.toBoolean((Boolean)env.getArgument("disabled")),
                env.getArgument("iconURL"),
                env.getArgument("description"), env.getArgument("parameters")
            ))
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
            .dataFetcher("setTeamMetaParameterValues",
                env -> getService(env).setTeamMetaParameterValues(
                    getWebSession(env),
                    env.getArgument("teamId"),
                    env.getArgument("parameters")))

            .dataFetcher("configureServer",
                env -> getService(env).configureServer(getWebSession(env), env.getArgument("configuration")))
        .dataFetcher("setDefaultNavigatorSettings",
            env -> getService(env).setDefaultNavigatorSettings(getWebSession(env), WebServiceUtils.parseNavigatorSettings(env.getArgument("settings"))))
        ;
        model.getMutationType()
            .dataFetcher("adminUpdateProductConfiguration",
                env -> getService(env).updateProductConfiguration(getWebSession(env), env.getArgument("configuration")));
    }

    @Override
    public void addServlets(CBApplication application, DBWServletContext servletContext) throws DBException {
        if(!application.isMultiuser()) {
            return;
        }
        servletContext.addServlet("adminLogs", new WebAdminLogsServlet(application), application.getServicesURI() + "logs/*");
    }

}

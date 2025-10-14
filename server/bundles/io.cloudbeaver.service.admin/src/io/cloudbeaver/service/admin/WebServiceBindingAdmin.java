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
                implements DBWServiceBindingServlet<CBApplication<?>> {

    private static final String SCHEMA_FILE_NAME = "schema/service.admin.graphqls";

    public WebServiceBindingAdmin() {
        super(DBWServiceAdmin.class, new WebServiceAdmin(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) {
        model.getQueryType()
            .dataFetcher(
                "adminUserInfo",
                env -> getService(env).getUserById(getWebSession(env), getArgumentVal(env, "userId"))
            )
            .dataFetcher(
                "listUsers",
                env -> getService(env).listUsers(
                    getWebSession(env),
                    new AdminUserInfoFilter(getArgumentVal(env, "filter"), getArgumentVal(env, "page"))
                )
            )
            .dataFetcher("listTeams",
                env -> getService(env).listTeams(getWebSession(env), getArgument(env, "teamId")))
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
                    getArgument(env, "userId"),
                    getArgumentVal(env, "enabled"),
                    getArgument(env, "authRole")
                ))
            .dataFetcher("deleteUser",
                env -> getService(env).deleteUser(getWebSession(env), getArgumentVal(env, "userId")))
            .dataFetcher("createTeam",
                env -> getService(env).createTeam(
                    getWebSession(env),
                    getArgumentVal(env, "teamId"),
                    getArgumentVal(env, "teamName"),
                    getArgument(env, "description")))
            .dataFetcher("updateTeam",
                env -> getService(env).updateTeam(
                    getWebSession(env),
                    getArgumentVal(env, "teamId"),
                    getArgumentVal(env, "teamName"),
                    getArgument(env, "description")))
            .dataFetcher("deleteTeam",
                env -> getService(env).deleteTeam(
                    getWebSession(env),
                    getArgumentVal(env, "teamId"),
                    CommonUtils.toBoolean(getArgument(env, "force"))))

            .dataFetcher("grantUserTeam",
                env -> getService(env).grantUserTeam(getWebSession(env), getArgumentVal(env, "userId"), getArgumentVal(env, "teamId")))
            .dataFetcher("revokeUserTeam",
                env -> getService(env).revokeUserTeam(getWebSession(env), getArgumentVal(env, "userId"), getArgumentVal(env, "teamId")))
            .dataFetcher("setSubjectPermissions",
                env -> getService(env).setSubjectPermissions(getWebSession(env), getArgumentVal(env, "subjectId"), getArgumentVal(env, "permissions")))
            .dataFetcher("setUserCredentials",
                env -> getService(env).setUserCredentials(getWebSession(env),
                    getArgumentVal(env, "userId"),
                    getArgumentVal(env, "providerId"),
                    getArgumentVal(env, "credentials")))
            .dataFetcher("deleteUserCredentials",
                env -> getService(env).deleteUserCredentials(getWebSession(env), getArgumentVal(env, "userId"), getArgumentVal(env, "providerId")))
            .dataFetcher("enableUser",
                env -> getService(env).enableUser(getWebSession(env), getArgumentVal(env, "userId"), getArgumentVal(env, "enabled")))
            .dataFetcher("setUserAuthRole",
                env -> getService(env).setUserAuthRole(getWebSession(env), getArgumentVal(env, "userId"), getArgumentVal(env, "authRole")))
            .dataFetcher("setUserTeamRole",
                env -> getService(env).setUserTeamRole(
                    getWebSession(env),
                    getArgumentVal(env, "userId"),
                    getArgumentVal(env, "teamId"),
                    getArgument(env, "teamRole")
                )
            )
            .dataFetcher("searchConnections", env -> getService(env).searchConnections(getWebSession(env), getArgumentVal(env, "hostNames")))
            .dataFetcher("getConnectionSubjectAccess",
                env -> getService(env).getConnectionSubjectAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    getArgumentVal(env, "connectionId")))
            .dataFetcher("setConnectionSubjectAccess",
                env -> getService(env).setConnectionSubjectAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    getArgumentVal(env, "connectionId"),
                    getArgumentVal(env, "subjects")))
            .dataFetcher("addConnectionsAccess",
                env -> getService(env).addConnectionsAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    getArgumentVal(env, "connectionIds"),
                    getArgumentVal(env, "subjects")))
            .dataFetcher("deleteConnectionsAccess",
                env -> getService(env).deleteConnectionsAccess(
                    getWebSession(env),
                    getProjectReference(env),
                    getArgumentVal(env, "connectionIds"),
                    getArgumentVal(env, "subjects")))

        .dataFetcher("getSubjectConnectionAccess",
            env -> getService(env).getSubjectConnectionAccess(getWebSession(env), getArgumentVal(env, "subjectId")))
        .dataFetcher("setSubjectConnectionAccess",
            env -> getService(env).setSubjectConnectionAccess(getWebSession(env), getArgumentVal(env, "subjectId"), getArgumentVal(env, "connections")))

        .dataFetcher("listFeatureSets",
            env -> getService(env).listFeatureSets(getWebSession(env)))

        .dataFetcher("listAuthProviderConfigurationParameters",
            env -> getService(env).listAuthProviderConfigurationParameters(getWebSession(env), getArgumentVal(env, "providerId")))
        .dataFetcher("listAuthProviderConfigurations",
            env -> getService(env).listAuthProviderConfigurations(
                GraphQLEndpoint.getServletRequestOrThrow(env),
                getWebSession(env), getArgument(env, "providerId"))
        )
        .dataFetcher("saveAuthProviderConfiguration",
            env -> getService(env).saveAuthProviderConfiguration(
                GraphQLEndpoint.getServletRequestOrThrow(env),
                getWebSession(env),
                getArgumentVal(env, "providerId"),
                getArgumentVal(env, "id"),
                getArgumentVal(env, "displayName"),
                CommonUtils.toBoolean(getArgument(env, "disabled")),
                getArgument(env, "iconURL"),
                getArgument(env, "description"), getArgument(env, "parameters")
            ))
        .dataFetcher("deleteAuthProviderConfiguration",
            env -> getService(env).deleteAuthProviderConfiguration(getWebSession(env), getArgumentVal(env, "id")))

            .dataFetcher("saveUserMetaParameter",
                env -> getService(env).saveUserMetaParameter(
                    getWebSession(env),
                    getArgumentVal(env, "id"),
                    getArgumentVal(env, "displayName"),
                    getArgument(env, "description"),
                    getArgument(env, "required")))

            .dataFetcher("deleteUserMetaParameter",
                env -> getService(env).deleteUserMetaParameter(
                    getWebSession(env),
                    getArgumentVal(env, "id")))

            .dataFetcher("setUserMetaParameterValues",
                env -> getService(env).setUserMetaParameterValues(
                    getWebSession(env),
                    getArgumentVal(env, "userId"),
                    getArgumentVal(env, "parameters")))
            .dataFetcher("setTeamMetaParameterValues",
                env -> getService(env).setTeamMetaParameterValues(
                    getWebSession(env),
                    getArgumentVal(env, "teamId"),
                    getArgumentVal(env, "parameters")))

            .dataFetcher("configureServer",
                env -> getService(env).configureServer(getWebSession(env), getArgumentVal(env, "configuration")))
        .dataFetcher("setDefaultNavigatorSettings",
            env -> getService(env).setDefaultNavigatorSettings(getWebSession(env), WebServiceUtils.parseNavigatorSettings(getArgument(env, "settings"))))
        ;
        model.getMutationType()
            .dataFetcher("adminUpdateProductConfiguration",
                env -> getService(env).updateProductConfiguration(getWebSession(env), getArgumentVal(env, "configuration")));
    }

    @Override
    public void addServlets(CBApplication application, DBWServletContext servletContext) throws DBException {
        if(!application.isMultiuser()) {
            return;
        }
        servletContext.addServlet("adminLogs", new WebAdminLogsServlet(application), application.getServicesURI() + "logs/*");
    }

}

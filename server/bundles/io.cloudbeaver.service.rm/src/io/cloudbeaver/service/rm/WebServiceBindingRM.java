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
package io.cloudbeaver.service.rm;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.rm.impl.WebServiceRM;
import io.cloudbeaver.service.rm.model.RMProjectPermissions;
import io.cloudbeaver.service.rm.model.RMSubjectProjectPermissions;
import org.jkiss.utils.CommonUtils;

/**
 * Web service implementation
 */
public class WebServiceBindingRM extends WebServiceBindingBase<DBWServiceRM> {

    private static final String SCHEMA_FILE_NAME = "schema/service.rm.graphqls";

    public WebServiceBindingRM() {
        super(DBWServiceRM.class, new WebServiceRM(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("rmListProjects",
                env -> getService(env).listProjects(getWebSession(env)))
            .dataFetcher("rmListSharedProjects",
                env -> getService(env).listSharedProjects(getWebSession(env)))
            .dataFetcher("rmProject",
                env -> getService(env).getProject(getWebSession(env), env.getArgument("projectId")))
            .dataFetcher("rmListResources",
                env -> getService(env).listResources(getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("folder"),
                    env.getArgument("nameMask"),
                    CommonUtils.toBoolean(env.getArgument("readProperties")),
                    CommonUtils.toBoolean(env.getArgument("readHistory"))))
            .dataFetcher("rmReadResourceAsString",
                env -> getService(env).readResourceAsString(getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("resourcePath")))
            .dataFetcher("rmListProjectPermissions", env -> getService(env).listProjectPermissions())
            .dataFetcher("rmListProjectGrantedPermissions", env -> getService(env).listProjectGrantedPermissions(
                getWebSession(env),
                env.getArgument("projectId")
            ))
            .dataFetcher("rmListSubjectProjectsPermissionGrants", env -> getService(env).listSubjectProjectsPermissionGrants(
                getWebSession(env),
                env.getArgument("subjectId")
            ))
        ;
        model.getMutationType()
            .dataFetcher("rmCreateResource",
                env -> getService(env).createResource(getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("resourcePath"),
                    CommonUtils.toBoolean(env.getArgument("isFolder"))))
            .dataFetcher("rmMoveResource",
                env -> getService(env).moveResource(getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("oldResourcePath"),
                    env.getArgument("newResourcePath")))
            .dataFetcher("rmDeleteResource",
                env -> getService(env).deleteResource(getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("resourcePath")))
            .dataFetcher("rmWriteResourceStringContent",
                env -> getService(env).writeResourceStringContent(getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("resourcePath"),
                    env.getArgument("data"),
                    env.getArgument("forceOverwrite")))
            .dataFetcher("rmCreateProject", env -> getService(env).createProject(
                getWebSession(env),
                env.getArgument("projectName"),
                env.getArgument("description")
            ))
            .dataFetcher("rmDeleteProject", env -> getService(env).deleteProject(
                getWebSession(env),
                getProjectReference(env)
            ))
            .dataFetcher("rmSetProjectPermissions", env -> getService(env).setProjectPermissions(
                getWebSession(env),
                env.getArgument("projectId"),
                new RMSubjectProjectPermissions(env.getArgument("permissions"))
            ))
            .dataFetcher("rmSetResourceProperty", env -> getService(env).setResourceProperty(
                getWebSession(env),
                env.getArgument("projectId"),
                env.getArgument("resourcePath"),
                env.getArgument("name"),
                env.getArgument("value")
            ))
            .dataFetcher("rmSetSubjectProjectPermissions", env -> getService(env).setSubjectProjectPermissions(
                getWebSession(env),
                env.getArgument("subjectId"),
                new RMProjectPermissions(env.getArgument("permissions"))
            ))
            .dataFetcher("rmAddProjectsPermissions", env -> getService(env).addProjectsPermissions(
                getWebSession(env),
                env.getArgument("projectIds"),
                env.getArgument("subjectIds"),
                env.getArgument("permissions")
            ))
            .dataFetcher("rmDeleteProjectsPermissions", env -> getService(env).deleteProjectsPermissions(
                getWebSession(env),
                env.getArgument("projectIds"),
                env.getArgument("subjectIds"),
                env.getArgument("permissions")
            ))
        ;
    }
}

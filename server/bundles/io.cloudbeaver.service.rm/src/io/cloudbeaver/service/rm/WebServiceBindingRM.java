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
    public void bindWiring(DBWBindingContext model) {
        model.getQueryType()
            .dataFetcher("rmListProjects",
                env -> getService(env).listProjects(getWebSession(env)))
            .dataFetcher("rmListSharedProjects",
                env -> getService(env).listSharedProjects(getWebSession(env)))
            .dataFetcher("rmProject",
                env -> getService(env).getProject(getWebSession(env), getArgumentVal(env, "projectId")))
            .dataFetcher("rmListResources",
                env -> getService(env).listResources(getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgument(env, "folder"),
                    getArgument(env, "nameMask"),
                    CommonUtils.toBoolean(getArgument(env, "readProperties")),
                    CommonUtils.toBoolean(getArgument(env, "readHistory"))))
            .dataFetcher("rmReadResourceAsString",
                env -> getService(env).readResourceAsString(getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "resourcePath")))
            .dataFetcher("rmListProjectPermissions", env -> getService(env).listProjectPermissions())
            .dataFetcher("rmListProjectGrantedPermissions", env -> getService(env).listProjectGrantedPermissions(
                getWebSession(env),
                getArgumentVal(env, "projectId")
            ))
            .dataFetcher("rmListSubjectProjectsPermissionGrants", env -> getService(env).listSubjectProjectsPermissionGrants(
                getWebSession(env),
                getArgumentVal(env, "subjectId")
            ))
            .dataFetcher(
                "rmUserProjectSettings", env -> getService(env).getProjectSettings(
                    getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgument(env, "settingId")
                )
            )
        ;
        model.getMutationType()
            .dataFetcher("rmCreateResource",
                env -> getService(env).createResource(getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "resourcePath"),
                    CommonUtils.toBoolean(getArgument(env, "isFolder"))))
            .dataFetcher("rmMoveResource",
                env -> getService(env).moveResource(getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "oldResourcePath"),
                    getArgumentVal(env, "newResourcePath")))
            .dataFetcher("rmDeleteResource",
                env -> getService(env).deleteResource(getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "resourcePath")))
            .dataFetcher("rmWriteResourceStringContent",
                env -> getService(env).writeResourceStringContent(getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "resourcePath"),
                    getArgumentVal(env, "data"),
                    getArgumentVal(env, "forceOverwrite")))
            .dataFetcher("rmCreateProject", env -> getService(env).createProject(
                getWebSession(env),
                getArgumentVal(env, "projectName"),
                getArgument(env, "description")
            ))
            .dataFetcher(
                "rmUpdateProject", env -> getService(env).updateProject(
                    getWebSession(env),
                    getProjectReference(env),
                    getArgument(env, "projectName"),
                    getArgument(env, "description")
                )
            )
            .dataFetcher("rmDeleteProject", env -> getService(env).deleteProject(
                getWebSession(env),
                getProjectReference(env)
            ))
            .dataFetcher("rmSetProjectPermissions", env -> getService(env).setProjectPermissions(
                getWebSession(env),
                getArgumentVal(env, "projectId"),
                new RMSubjectProjectPermissions(getArgumentVal(env, "permissions"))
            ))
            .dataFetcher("rmSetResourceProperty", env -> getService(env).setResourceProperty(
                getWebSession(env),
                getArgumentVal(env, "projectId"),
                getArgumentVal(env, "resourcePath"),
                getArgumentVal(env, "name"),
                getArgument(env, "value")
            ))
            .dataFetcher("rmSetSubjectProjectPermissions", env -> getService(env).setSubjectProjectPermissions(
                getWebSession(env),
                getArgumentVal(env, "subjectId"),
                new RMProjectPermissions(getArgumentVal(env, "permissions"))
            ))
            .dataFetcher("rmAddProjectsPermissions", env -> getService(env).addProjectsPermissions(
                getWebSession(env),
                getArgumentVal(env, "projectIds"),
                getArgumentVal(env, "subjectIds"),
                getArgumentVal(env, "permissions")
            ))
            .dataFetcher("rmDeleteProjectsPermissions", env -> getService(env).deleteProjectsPermissions(
                getWebSession(env),
                getArgumentVal(env, "projectIds"),
                getArgumentVal(env, "subjectIds"),
                getArgumentVal(env, "permissions")
            ))
            .dataFetcher(
                "rmAddUserProjectSettings", env -> getService(env).addProjectSettings(
                    getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "settings")
                )
            )
            .dataFetcher(
                "rmDeleteUserProjectSettings", env -> getService(env).deleteProjectSettings(
                    getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgument(env, "settingIds")
                )
            )

        ;
    }
}

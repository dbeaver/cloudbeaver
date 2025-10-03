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
package io.cloudbeaver.service.fs;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.DBWServletContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.fs.impl.WebServiceFS;
import io.cloudbeaver.service.fs.model.WebFSServlet;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

/**
 * Web service implementation
 */
public class WebServiceBindingFS extends WebServiceBindingBase<DBWServiceFS> implements DBWServiceBindingServlet<CBApplication> {

    private static final String SCHEMA_FILE_NAME = "schema/service.fs.graphqls";

    public WebServiceBindingFS() {
        super(DBWServiceFS.class, new WebServiceFS(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("fsListFileSystems",
                env -> getService(env).getAvailableFileSystems(getWebSession(env), getArgumentVal(env, "projectId")))
            .dataFetcher("fsFileSystem",
                env -> getService(env).getFileSystem(
                    getWebSession(env),
                    getArgumentVal(env, "projectId"),
                    getArgumentVal(env, "nodePath")
                )
            )
            .dataFetcher("fsFile",
                env -> getService(env).getFile(getWebSession(env),
                    getArgumentVal(env, "nodePath")
                )
            )
            .dataFetcher("fsListFiles",
                env -> getService(env).getFiles(getWebSession(env),
                    getArgumentVal(env, "folderPath")
                )
            )
            .dataFetcher("fsReadFileContentAsString",
                env -> getService(env).readFileContent(getWebSession(env),
                    getArgumentVal(env, "nodePath")
                )
            )
        ;
        model.getMutationType()
            .dataFetcher("fsCreateFile",
                env -> getService(env).createFile(getWebSession(env),
                    getArgumentVal(env, "parentPath"),
                    getArgumentVal(env, "fileName")
                )
            )
            .dataFetcher("fsCreateFolder",
                env -> getService(env).createFolder(getWebSession(env),
                    getArgumentVal(env, "parentPath"),
                    getArgumentVal(env, "folderName")
                    )
            )
            .dataFetcher("fsDelete",
                env -> getService(env).deleteFile(getWebSession(env),
                    getArgumentVal(env, "nodePath")
                )
            )
            .dataFetcher("fsMove",
                env -> getService(env).moveFile(
                    getWebSession(env),
                    getArgumentVal(env, "nodePath"),
                    getArgumentVal(env, "toParentNodePath")
                )
            )
            .dataFetcher("fsRename",
                env -> getService(env).renameFile(
                    getWebSession(env),
                    getArgumentVal(env, "nodePath"),
                    getArgumentVal(env, "newName")
                )
            )
            .dataFetcher("fsCopy",
                env -> getService(env).copyFile(
                    getWebSession(env),
                    getArgumentVal(env, "nodePath"),
                    getArgumentVal(env, "toParentNodePath")
                )
            )
            .dataFetcher("fsWriteFileStringContent",
                env -> getService(env).writeFileContent(
                    getWebSession(env),
                    getArgumentVal(env, "nodePath"),
                    getArgumentVal(env, "data"),
                    CommonUtils.toBoolean(getArgument(env, "forceOverwrite"))
                )
            )
        ;
    }

    @Override
    public void addServlets(CBApplication application, DBWServletContext servletContext) throws DBException {
        if (!application.isMultiuser()) {
            return;
        }
        servletContext.addServlet(
            "fileSystems",
            new WebFSServlet(application, getServiceImpl()),
            application.getServicesURI() + "fs-data/*"
        );
    }
}

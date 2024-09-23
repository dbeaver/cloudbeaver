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
                env -> getService(env).getAvailableFileSystems(getWebSession(env), env.getArgument("projectId")))
            .dataFetcher("fsFileSystem",
                env -> getService(env).getFileSystem(
                    getWebSession(env),
                    env.getArgument("projectId"),
                    env.getArgument("nodePath")
                )
            )
            .dataFetcher("fsFile",
                env -> getService(env).getFile(getWebSession(env),
                    env.getArgument("nodePath")
                )
            )
            .dataFetcher("fsListFiles",
                env -> getService(env).getFiles(getWebSession(env),
                    env.getArgument("folderPath")
                )
            )
            .dataFetcher("fsReadFileContentAsString",
                env -> getService(env).readFileContent(getWebSession(env),
                    env.getArgument("nodePath")
                )
            )
        ;
        model.getMutationType()
            .dataFetcher("fsCreateFile",
                env -> getService(env).createFile(getWebSession(env),
                    env.getArgument("parentPath"),
                    env.getArgument("fileName")
                )
            )
            .dataFetcher("fsCreateFolder",
                env -> getService(env).createFolder(getWebSession(env),
                    env.getArgument("parentPath"),
                    env.getArgument("folderName")
                    )
            )
            .dataFetcher("fsDelete",
                env -> getService(env).deleteFile(getWebSession(env),
                    env.getArgument("nodePath")
                )
            )
            .dataFetcher("fsMove",
                env -> getService(env).moveFile(
                    getWebSession(env),
                    env.getArgument("nodePath"),
                    env.getArgument("toParentNodePath")
                )
            )
            .dataFetcher("fsRename",
                env -> getService(env).renameFile(
                    getWebSession(env),
                    env.getArgument("nodePath"),
                    env.getArgument("newName")
                )
            )
            .dataFetcher("fsCopy",
                env -> getService(env).copyFile(
                    getWebSession(env),
                    env.getArgument("nodePath"),
                    env.getArgument("toParentNodePath")
                )
            )
            .dataFetcher("fsWriteFileStringContent",
                env -> getService(env).writeFileContent(
                    getWebSession(env),
                    env.getArgument("nodePath"),
                    env.getArgument("data"),
                    CommonUtils.toBoolean(env.getArgument("forceOverwrite"))
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

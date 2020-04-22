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
package io.cloudbeaver.service.data.transfer;

import graphql.schema.DataFetchingEnvironment;
import graphql.schema.idl.TypeDefinitionRegistry;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.api.DBWModel;
import io.cloudbeaver.api.DBWServiceGraphQL;
import io.cloudbeaver.api.DBWServiceServlet;
import io.cloudbeaver.api.DBWUtils;
import io.cloudbeaver.server.CloudbeaverApplication;
import io.cloudbeaver.server.model.session.WebSession;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

/**
 * Web service implementation
 */
public class WebServiceDataTransfer implements DBWServiceGraphQL, DBWServiceServlet {

    private static final String DT_SCHEMA_FILE_NAME = "schema/service.data.transfer.graphqls";

    private WebDataTransferManager dtManager;

    @Override
    public TypeDefinitionRegistry getTypeDefinition() throws DBWebException {
        return WebServiceUtils.loadSchemaDefinition(getClass(), DT_SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWModel model) {
        dtManager = new WebDataTransferManager(model);
        model.getQueryType()
            .dataFetcher("dataTransferAvailableStreamProcessors",
                env -> dtManager.getAvailableStreamProcessors(getWebSession(model, env)))
            .dataFetcher("dataTransferExportDataFromContainer", env -> dtManager.dataTransferExportDataFromContainer(
                getWebSession(model, env),
                env.getArgument("connectionId"),
                env.getArgument("containerNodePath"),
                env.getArgument("parameters")
            ))
            .dataFetcher("dataTransferExportDataFromResults", env -> dtManager.dataTransferExportDataFromResults(
                getWebSession(model, env),
                env.getArgument("connectionId"),
                env.getArgument("contextId"),
                env.getArgument("resultsId"),
                env.getArgument("parameters")
            ))
            .dataFetcher("dataTransferRemoveDataFile", env -> dtManager.dataTransferRemoveDataFile(
                getWebSession(model, env),
                env.getArgument("dataFileId")
            ))
        ;

    }

    private WebSession getWebSession(DBWModel model, DataFetchingEnvironment env) throws DBWebException {
        return model.getSessionManager().getWebSession(DBWUtils.getServletRequest(env));
    }

    @Override
    public void addServlets(CloudbeaverApplication application, ServletContextHandler servletContextHandler) {
        ServletHolder servletHolder = new ServletHolder("dataTransfer", new WebDataTransferServlet(application));
        servletContextHandler.addServlet(servletHolder, application.getServicesURI() + "data/*");
    }
}

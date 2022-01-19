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
package io.cloudbeaver.service.data.transfer;

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferParameters;
import io.cloudbeaver.service.data.transfer.impl.WebDataTransferServlet;
import io.cloudbeaver.service.data.transfer.impl.WebServiceDataTransfer;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

/**
 * Web service implementation
 */
public class WebServiceBindingDataTransfer extends WebServiceBindingBase<DBWServiceDataTransfer> implements DBWServiceBindingServlet {

    public WebServiceBindingDataTransfer() {
        super(DBWServiceDataTransfer.class, new WebServiceDataTransfer(), "schema/service.data.transfer.graphqls");
    }

    @Override
    public void bindWiring(DBWBindingContext model) {

        model.getQueryType()
            .dataFetcher("dataTransferAvailableStreamProcessors",
                env -> getService(env).getAvailableStreamProcessors(getWebSession(env)))
            .dataFetcher("dataTransferExportDataFromContainer", env -> getService(env).dataTransferExportDataFromContainer(
                WebServiceBindingSQL.getSQLProcessor(env),
                env.getArgument("containerNodePath"),
                new WebDataTransferParameters(env.getArgument("parameters"))
            ))
            .dataFetcher("dataTransferExportDataFromResults", env -> getService(env).dataTransferExportDataFromResults(
                WebServiceBindingSQL.getSQLContext(env),
                env.getArgument("resultsId"),
                new WebDataTransferParameters(env.getArgument("parameters"))
            ))
            .dataFetcher("dataTransferRemoveDataFile", env -> getService(env).dataTransferRemoveDataFile(
                getWebSession(env),
                env.getArgument("dataFileId")
            ))
        ;

    }

    @Override
    public void addServlets(CBApplication application, ServletContextHandler servletContextHandler) {
        servletContextHandler.addServlet(
            new ServletHolder("dataTransfer", new WebDataTransferServlet(application, getServiceImpl())),
            application.getServicesURI() + "data/*");
    }
}

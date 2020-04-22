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

import graphql.schema.idl.TypeDefinitionRegistry;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.api.DBWModel;
import io.cloudbeaver.api.DBWServiceGraphQL;
import io.cloudbeaver.api.DBWServiceServlet;
import io.cloudbeaver.server.CloudbeaverApplication;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

/**
 * Web service implementation
 */
public class WebServiceDataTransfer implements DBWServiceGraphQL, DBWServiceServlet {

    private static final String DT_SCHEMA_FILE_NAME = "schema/service.data.transfer.graphqls";

    @Override
    public TypeDefinitionRegistry getTypeDefinition() throws DBWebException {
        return WebServiceUtils.loadSchemaDefinition(getClass(), DT_SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWModel model) throws DBWebException {
        model.getQueryType().dataFetcher("data.dtGetAvailableStreamFormats", env -> {
            return null;

/*
            WebSession webSession = model.getSessionManager().getWebSession(DBWUtils.getServletRequest(env));
            WebNavigatorNodeInfo node = webSession.getNavigatorNodeInfo(env.getArgument("nodeId"));
            DBNNode dbNode = node.getNode();
            if (dbNode instanceof DBNDatabaseNode) {
                DBSObject object = ((DBNDatabaseNode) dbNode).getObject();
                if (object instanceof DBPScriptObject) {
                    Map<String, Object> options = env.getArgument("options");
                    if (options == null) {
                        options = new LinkedHashMap<>();
                    }
                    return ((DBPScriptObject) object).getObjectDefinitionText(webSession.getProgressMonitor(), options);
                } else {
                    throw new DBWebException("Object '" + node.getId() + "' doesn't support DDL");
                }
            } else {
                throw new DBWebException("Node '" + node.getId() + "' is not database node");
            }
*/
        });

    }

    @Override
    public void addServlets(CloudbeaverApplication application, ServletContextHandler servletContextHandler) {
        ServletHolder servletHolder = new ServletHolder("dataTransfer", new WebDataTransferServlet(application));
        servletContextHandler.addServlet(servletHolder, application.getServicesURI() + "data/*");
    }
}

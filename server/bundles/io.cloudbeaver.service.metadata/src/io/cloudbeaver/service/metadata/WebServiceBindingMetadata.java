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
package io.cloudbeaver.service.metadata;

import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.metadata.impl.WebServiceMetadata;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.navigator.DBNNode;

/**
 * Web service implementation
 */
public class WebServiceBindingMetadata extends WebServiceBindingBase<DBWServiceMetadata> {

    private static final String SCHEMA_FILE_NAME = "schema/service.metadata.graphqls";

    public WebServiceBindingMetadata() {
        super(DBWServiceMetadata.class, new WebServiceMetadata(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("metadataGetNodeDDL", env -> getService(env).getNodeDDL(
                getWebSession(env),
                getNodeFromPath(env),
                env.getArgument("options"))
            ).dataFetcher("metadataGetNodeExtendedDDL", env -> getService(env).getNodeExtendedDDL(
                getWebSession(env),
                getNodeFromPath(env)
            ));
    }

    private DBNNode getNodeFromPath(DataFetchingEnvironment env) throws DBException {
        WebSession webSession = getWebSession(env);
        String nodePath = env.getArgument("nodeId");
        if (nodePath == null) {
            throw new DBException("Node path is null");
        }
        return webSession.getNavigatorModelOrThrow().getNodeByPath(webSession.getProgressMonitor(), nodePath);
    }
}

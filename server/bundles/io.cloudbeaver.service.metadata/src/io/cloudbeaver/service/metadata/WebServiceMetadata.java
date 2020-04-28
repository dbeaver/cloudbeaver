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
package io.cloudbeaver.service.metadata;

import graphql.schema.idl.TypeDefinitionRegistry;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.api.DBWModel;
import io.cloudbeaver.api.DBWUtils;
import io.cloudbeaver.api.WebServiceBase;
import io.cloudbeaver.server.model.WebNavigatorNodeInfo;
import io.cloudbeaver.server.model.session.WebSession;

import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceMetadata extends WebServiceBase<WebMetadataAPI> {

    private static final String SCHEMA_FILE_NAME = "schema/service.metadata.graphqls";

    public WebServiceMetadata() {
        super(WebMetadataAPI.class, new WebMetadataImpl());
    }

    @Override
    public TypeDefinitionRegistry getTypeDefinition() throws DBWebException {
        return loadSchemaDefinition(getClass(), SCHEMA_FILE_NAME);
    }

    @Override
    public void bindWiring(DBWModel model) throws DBWebException {
        model.getQueryType().dataFetcher("metadataGetNodeDDL", env -> {
            WebSession webSession = model.getSessionManager().getWebSession(DBWUtils.getServletRequest(env));
            WebNavigatorNodeInfo node = webSession.getNavigatorNodeInfo(env.getArgument("nodeId"));
            Map<String, Object> options = env.getArgument("options");

            return getAPI(env).getNodeDDL(webSession, node, options);
        });

    }
}

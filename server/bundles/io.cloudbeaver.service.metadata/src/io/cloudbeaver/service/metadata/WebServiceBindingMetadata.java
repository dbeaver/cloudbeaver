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
package io.cloudbeaver.service.metadata;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.metadata.impl.WebServiceMetadata;
import org.jkiss.dbeaver.model.navigator.DBNNode;

import java.util.Map;

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
        model.getQueryType().dataFetcher("metadataGetNodeDDL", env -> {
            WebSession webSession = getWebSession(env);

            String nodePath = env.getArgument("nodeId");
            DBNNode node = webSession.getNavigatorModel().getNodeByPath(webSession.getProgressMonitor(), nodePath);
            Map<String, Object> options = env.getArgument("options");

            return getService(env).getNodeDDL(webSession, node, options);
        });

    }
}

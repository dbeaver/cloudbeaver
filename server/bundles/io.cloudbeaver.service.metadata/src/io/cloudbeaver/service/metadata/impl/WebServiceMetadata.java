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
package io.cloudbeaver.service.metadata.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.metadata.DBWServiceMetadata;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPScriptObject;
import org.jkiss.dbeaver.model.DBPScriptObjectExt;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.struct.DBSObject;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceMetadata implements DBWServiceMetadata {


    @Override
    public String getNodeDDL(WebSession webSession, DBNNode dbNode, Map<String, Object> options) throws DBWebException {
        validateDatabaseNode(dbNode);
        DBSObject object = ((DBNDatabaseNode) dbNode).getObject();
        if (!(object instanceof DBPScriptObject)) {
            throw new DBWebException("Object '" + dbNode.getNodeItemPath() + "' doesn't support DDL");
        }
        if (options == null) {
            options = new LinkedHashMap<>();
        }
        try {
            return ((DBPScriptObject) object).getObjectDefinitionText(webSession.getProgressMonitor(), options);
        } catch (DBException e) {
            throw new DBWebException("Error extracting DDL", e);
        }
    }

    @Override
    public String getNodeExtendedDDL(WebSession webSession, DBNNode dbNode) throws DBWebException {
        validateDatabaseNode(dbNode);
        DBSObject object = ((DBNDatabaseNode) dbNode).getObject();
        if (!(object instanceof DBPScriptObjectExt)) {
            throw new DBWebException("Object '" + dbNode.getNodeItemPath() + "' doesn't support extended DDL");
        }
        try {
            return ((DBPScriptObjectExt) object).getExtendedDefinitionText(webSession.getProgressMonitor());
        } catch (DBException e) {
            throw new DBWebException("Error extracting extended DDL", e);
        }
    }

    private void validateDatabaseNode(DBNNode dbNode) throws DBWebException {
        if (!(dbNode instanceof DBNDatabaseNode)) {
            throw new DBWebException("Node '" + dbNode.getNodeItemPath() + "' is not database node");
        }
    }
}

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
package io.cloudbeaver.service.metadata.impl;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebAsyncTaskInfo;
import io.cloudbeaver.model.session.WebAsyncTaskProcessor;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.metadata.DBWServiceMetadata;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPScriptObject;
import org.jkiss.dbeaver.model.DBPScriptObjectExt;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Web service implementation
 */
public class WebServiceMetadata implements DBWServiceMetadata {

    private static final Set<String> SUPPORTED_DDL_OPTIONS = Set.of(
        DBPScriptObject.OPTION_INCLUDE_NESTED_OBJECTS,
        DBPScriptObject.OPTION_INCLUDE_COMMENTS,
        DBPScriptObject.OPTION_INCLUDE_PERMISSIONS);

    @Nullable
    @Override
    public String getNodeDDL(
        @NotNull WebSession webSession,
        @NotNull DBNNode dbNode,
        @Nullable Map<String, Object> options
    ) throws DBWebException {
        return generateNodeDDL(webSession.getProgressMonitor(), dbNode, options);
    }

    @NotNull
    @Override
    public WebAsyncTaskInfo asyncGetNodeDDL(
        @NotNull WebSession webSession,
        @NotNull String nodeId,
        @Nullable Map<String, Object> options
    ) throws DBWebException {
        WebAsyncTaskProcessor<String> runnable = new WebAsyncTaskProcessor<>() {
            @Override
            public void run(@NotNull DBRProgressMonitor monitor) throws InvocationTargetException {
                try {
                    monitor.beginTask("Generate DDL", 1);
                    monitor.subTask("Generate DDL for node '" + nodeId + "'");
                    DBNNode node = webSession.getNavigatorModelOrThrow().getNodeByPath(monitor, nodeId);
                    if (node == null) {
                        throw new DBWebException("Node '" + nodeId + "' not found");
                    }
                    this.result = generateNodeDDL(monitor, node, options);
                } catch (Throwable e) {
                    throw new InvocationTargetException(e);
                } finally {
                    monitor.done();
                }
            }
        };
        return webSession.createAndRunAsyncTask("Generate DDL", runnable);
    }

    @Nullable
    private String generateNodeDDL(
        @NotNull DBRProgressMonitor monitor,
        @NotNull DBNNode dbNode,
        @Nullable Map<String, Object> options
    ) throws DBWebException {
        validateDatabaseNode(dbNode);
        DBSObject object = ((DBNDatabaseNode) dbNode).getObject();
        if (!(object instanceof DBPScriptObject)) {
            throw new DBWebException("Object '" + dbNode.getNodeUri() + "' doesn't support DDL");
        }
        Map<String, Object> ddlOptions = new LinkedHashMap<>();
        if (options != null) {
            for (String option : SUPPORTED_DDL_OPTIONS) {
                if (options.containsKey(option)) {
                    ddlOptions.put(option, CommonUtils.toBoolean(options.get(option)));
                }
            }
        }
        try {
            return ((DBPScriptObject) object).getObjectDefinitionText(monitor, ddlOptions);
        } catch (DBException e) {
            throw new DBWebException("Error extracting DDL", e);
        }
    }

    @Nullable
    @Override
    public String getNodeExtendedDDL(@NotNull WebSession webSession, @NotNull DBNNode dbNode) throws DBWebException {
        validateDatabaseNode(dbNode);
        DBSObject object = ((DBNDatabaseNode) dbNode).getObject();
        if (!(object instanceof DBPScriptObjectExt)) {
            throw new DBWebException("Object '" + dbNode.getNodeUri() + "' doesn't support extended DDL");
        }
        try {
            return ((DBPScriptObjectExt) object).getExtendedDefinitionText(webSession.getProgressMonitor());
        } catch (DBException e) {
            throw new DBWebException("Error extracting extended DDL", e);
        }
    }

    private void validateDatabaseNode(@NotNull DBNNode dbNode) throws DBWebException {
        if (!(dbNode instanceof DBNDatabaseNode)) {
            throw new DBWebException("Node '" + dbNode.getNodeUri() + "' is not database node");
        }
    }
}

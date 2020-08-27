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
package io.cloudbeaver.service.navigator.impl;


import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.DBWServiceNavigator;
import io.cloudbeaver.service.navigator.WebDatabaseObjectInfo;
import io.cloudbeaver.service.navigator.WebNavigatorNodeInfo;
import io.cloudbeaver.service.navigator.WebStructContainers;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.impl.struct.ContextDefaultObjectsReader;
import org.jkiss.dbeaver.model.navigator.DBNContainer;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Web service implementation
 */
public class WebServiceNavigator implements DBWServiceNavigator {
    private static final List<WebNavigatorNodeInfo> EMPTY_NODE_LIST = Collections.emptyList();

    @Override
    public List<WebNavigatorNodeInfo> getNavigatorNodeChildren(WebSession session, String parentPath, Integer offset, Integer limit, Boolean onlyFolders) throws DBWebException {
        WebServiceUtils.checkServerConfigured();
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode[] nodeChildren;
            boolean isRootPath = CommonUtils.isEmpty(parentPath) || "/".equals(parentPath);
            if (isRootPath) {
                nodeChildren = session.getDatabasesNode().getChildren(monitor);
                // Inject extra nodes
                List<DBNNode> extraNodes = session.getProjectNode().getExtraNodes();
                if (!extraNodes.isEmpty()) {
                    nodeChildren = ArrayUtils.concatArrays(extraNodes.toArray(new DBNNode[0]), nodeChildren);
                }
            } else {
                DBNNode parentNode = session.getNavigatorModel().getNodeByPath(monitor, parentPath);
                if (parentNode == null) {
                    throw new DBWebException("Node '" + parentPath + "' not found");
                }
                if (!parentNode.hasChildren(true)) {
                    return EMPTY_NODE_LIST;
                }
                nodeChildren = parentNode.getChildren(monitor);
            }
            if (nodeChildren == null) {
                return EMPTY_NODE_LIST;
            }
            List<WebNavigatorNodeInfo> result = new ArrayList<>();
            if (isRootPath) {
                // Add navigator extensions
                for (DBNNode extraNode : session.getNavigatorModel().getRoot().getExtraNodes()) {
                    result.add(new WebNavigatorNodeInfo(session, extraNode));
                }
            }

            for (DBNNode node : nodeChildren) {
                if (!CommonUtils.toBoolean(onlyFolders) || node instanceof DBNContainer) {
                    result.add(new WebNavigatorNodeInfo(session, node));
                }
            }
            return  result;
        } catch (DBException e) {
            throw new DBWebException(e, null);
        }
    }

    @Override
    @NotNull
    public WebNavigatorNodeInfo getNavigatorNodeInfo(WebSession session, String nodePath) throws DBWebException {
        WebServiceUtils.checkServerConfigured();
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModel().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            return new WebNavigatorNodeInfo(session, node);
        } catch (DBException e) {
            throw new DBWebException("Error getting navigator node '"  + nodePath + "'", e);
        }
    }

    @Override
    public boolean refreshNavigatorNode(WebSession session, String nodePath) throws DBWebException {
        WebServiceUtils.checkServerConfigured();
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModel().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            node.refreshNode(monitor, this);
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error refreshing navigator node '"  + nodePath + "'", e);
        }
    }

    @Override
    public WebStructContainers getStructContainers(WebConnectionInfo connection, String catalog) throws DBWebException {
        WebServiceUtils.checkServerConfigured();

        DBPDataSource dataSource = connection.getDataSource();
        DBCExecutionContext executionContext = DBUtils.getDefaultContext(connection.getDataSource(), false);

        ContextDefaultObjectsReader reader = new ContextDefaultObjectsReader(dataSource, executionContext);
        reader.setReadNodes(false);
        try {
            reader.run(connection.getSession().getProgressMonitor());
        } catch (InvocationTargetException e) {
            throw new DBWebException("Error reading context defaults", e.getTargetException());
        } catch (InterruptedException e) {
            // ignore
        }
        WebStructContainers structContainers = new WebStructContainers();
        if (!CommonUtils.isEmpty(reader.getObjectList())) {
            for (DBSObject node : reader.getObjectList()) {
                if (!dataSource.getContainer().getNavigatorSettings().isShowSystemObjects() && DBUtils.isSystemObject(node)) {
                    continue;
                }
                List<WebDatabaseObjectInfo> objectInfos = node instanceof DBSCatalog ? structContainers.getCatalogList() : structContainers.getSchemaList();
                objectInfos.add(new WebDatabaseObjectInfo(connection.getSession(), node));
            }
        }
        return structContainers;
    }

}

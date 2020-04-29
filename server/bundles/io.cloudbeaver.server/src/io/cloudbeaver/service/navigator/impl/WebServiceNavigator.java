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
import io.cloudbeaver.model.WebNavigatorNodeInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.DBWServiceNavigator;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.navigator.DBNContainer;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.utils.CommonUtils;

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
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode parentNode = CommonUtils.isEmpty(parentPath) || "/".equals(parentPath) ? session.getDatabases() : session.getNavigatorModel().getNodeByPath(monitor, parentPath);
            if (parentNode == null) {
                throw new DBWebException("Node '" + parentPath + "' not found");
            }
            if (!parentNode.hasChildren(true)) {
                return EMPTY_NODE_LIST;
            }
            DBNNode[] nodeChildren = parentNode.getChildren(monitor);
            if (nodeChildren == null) {
                return EMPTY_NODE_LIST;
            }
            List<WebNavigatorNodeInfo> result = new ArrayList<>();
            for (DBNNode node : nodeChildren) {
                if (!CommonUtils.toBoolean(onlyFolders) || node instanceof DBNContainer) {
                    result.add(new WebNavigatorNodeInfo(session, node));
                }
            }
            return  result;
        } catch (DBException e) {
            throw new DBWebException("Error getting navigator nodes", e);
        }
    }

    @Override
    @NotNull
    public WebNavigatorNodeInfo getNavigatorNodeInfo(WebSession session, String nodePath) throws DBWebException {
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


}

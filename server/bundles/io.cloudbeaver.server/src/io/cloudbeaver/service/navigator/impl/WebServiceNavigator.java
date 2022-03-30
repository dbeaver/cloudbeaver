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
package io.cloudbeaver.service.navigator.impl;


import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.WebCommandContext;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.DBWServiceNavigator;
import io.cloudbeaver.service.navigator.WebCatalog;
import io.cloudbeaver.service.navigator.WebNavigatorNodeInfo;
import io.cloudbeaver.service.navigator.WebStructContainers;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.model.DBPRefreshableObject;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.edit.DBECommandContext;
import org.jkiss.dbeaver.model.edit.DBEObjectMaker;
import org.jkiss.dbeaver.model.edit.DBEObjectRenamer;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionContextDefaults;
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;

/**
 * Web service implementation
 */
public class WebServiceNavigator implements DBWServiceNavigator {
    private static final List<WebNavigatorNodeInfo> EMPTY_NODE_LIST = Collections.emptyList();

    public static final String ROOT_DATABASES = "databases";
    private static final boolean SHOW_EXTRA_NODES = false;

    @Override
    public List<WebNavigatorNodeInfo> getNavigatorNodeChildren(@NotNull WebSession session, @NotNull String parentPath, Integer offset, Integer limit, Boolean onlyFolders) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode[] nodeChildren;
            boolean isRootPath = CommonUtils.isEmpty(parentPath) || "/".equals(parentPath) || ROOT_DATABASES.equals(parentPath);
            DBNModel navigatorModel = session.getNavigatorModel();
            if (isRootPath) {
                DBNProject projectNode = navigatorModel.getRoot().getProjectNode(session.getSingletonProject());
                nodeChildren = DBNUtils.getNodeChildrenFiltered(monitor, projectNode.getDatabases(), true);
                if (SHOW_EXTRA_NODES) {
                    // Inject extra nodes. Disabled because we use different root path for extra nodes
                    List<DBNNode> extraNodes = projectNode.getExtraNodes();
                    if (!extraNodes.isEmpty()) {
                        nodeChildren = ArrayUtils.concatArrays(extraNodes.toArray(new DBNNode[0]), nodeChildren);
                    }
                }
            } else {
                DBNNode parentNode = navigatorModel.getNodeByPath(monitor, parentPath);
                if (parentNode == null) {
                    throw new DBWebException("Node '" + parentPath + "' not found");
                }
                if (!parentNode.hasChildren(false)) {
                    return EMPTY_NODE_LIST;
                }
                nodeChildren = DBNUtils.getNodeChildrenFiltered(monitor, parentNode, false);
            }
            if (nodeChildren == null) {
                return EMPTY_NODE_LIST;
            }
            List<WebNavigatorNodeInfo> result = new ArrayList<>();
            if (isRootPath) {
                // Add navigator extensions
                for (DBNNode extraNode : navigatorModel.getRoot().getExtraNodes()) {
                    result.add(new WebNavigatorNodeInfo(session, extraNode));
                }
            }

            for (DBNNode node : nodeChildren) {
                if (node instanceof DBNDatabaseFolder && CommonUtils.isEmpty(((DBNDatabaseFolder) node).getMeta().getChildren(null))) {
                    // Skip empty folders. Folder may become empty if their nested elements are provided by UI plugins.
                    continue;
                }
                if (!CommonUtils.toBoolean(onlyFolders) || node instanceof DBNContainer) {
                    result.add(new WebNavigatorNodeInfo(session, node));
                }
            }
            // Checks the range of the expected result
            if (offset == null || limit == null || (offset == 0 && limit >= result.size())) {
                return result;
            } else if (offset + limit <= result.size()) {
                return result.subList(offset, offset + limit);
            } else  {
                return result.subList(offset, result.size());
            }
        } catch (DBException e) {
            throw new DBWebException(e, null);
        }
    }

    @Override
    public List<WebNavigatorNodeInfo> getNavigatorNodeParents(@NotNull WebSession session, String nodePath) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNModel navigatorModel = session.getNavigatorModel();
            DBNNode node = navigatorModel.getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Node '" + nodePath + "' not found");
            }

            List<WebNavigatorNodeInfo> nodeParents = new ArrayList<>();
            for (DBNNode parent = node.getParentNode(); parent != null && !(parent instanceof DBNRoot); parent = parent.getParentNode()) {
                nodeParents.add(new WebNavigatorNodeInfo(session, parent));
            }

            return nodeParents;
        } catch (DBException e) {
            throw new DBWebException(e, null);
        }
    }

    @Override
    @NotNull
    public WebNavigatorNodeInfo getNavigatorNodeInfo(@NotNull WebSession session, @NotNull String nodePath) throws DBWebException {
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
    public boolean refreshNavigatorNode(@NotNull WebSession session, @NotNull String nodePath) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModel().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            if (node instanceof DBNDataSource) {
                // Do not refresh entire tree - just clear child nodes
                // Otherwise refresh may fail if navigator settings were changed.
                DBPDataSource dataSource = ((DBNDataSource) node).getDataSource();
                if (dataSource instanceof DBPRefreshableObject) {
                    ((DBPRefreshableObject) dataSource).refreshObject(monitor);
                }
                ((DBNDataSource) node).cleanupNode();
            } else {
                node.refreshNode(monitor, this);
            }
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error refreshing navigator node '"  + nodePath + "'", e);
        }
    }

    @Override
    public WebStructContainers getStructContainers(WebConnectionInfo connection, String contextId, String catalog) throws DBWebException {
        DBPDataSource dataSource = connection.getDataSource();
        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        DBCExecutionContext executionContext = DBUtils.getDefaultContext(connection.getDataSource(), false);
        if (executionContext == null) {
            throw new DBWebException("No default execution context for " + connection.getName());
        }
        DBCExecutionContextDefaults<?, ?> contextDefaults = executionContext.getContextDefaults();

        WebStructContainers structContainers = new WebStructContainers();

        structContainers.setSupportsCatalogChange(contextDefaults != null && contextDefaults.supportsCatalogChange());
        structContainers.setSupportsSchemaChange(contextDefaults != null && contextDefaults.supportsSchemaChange());

        List<? extends DBSObject> nodes = this.getCatalogs(
                monitor,
                connection.getDataSourceContainer().getDataSource(),
                contextDefaults
        );

        List<WebCatalog> catalogList = structContainers.getCatalogList();
        List<WebNavigatorNodeInfo> schemaList = structContainers.getSchemaList();

        for (DBSObject node : nodes) {
            if (!dataSource.getContainer().getNavigatorSettings().isShowSystemObjects() && DBUtils.isSystemObject(node)) {
                continue;
            }

            if(node instanceof DBSCatalog) {
                WebNavigatorNodeInfo catalogObjectInfo = this.getNodeFromObject(connection.getSession(), node);

                if (catalogObjectInfo != null) {
                    WebCatalog webCatalog = new WebCatalog(catalogObjectInfo);

                    if (
                        contextDefaults != null && contextDefaults.supportsSchemaChange()
                        && (
                            contextDefaults.getDefaultCatalog().getName() == node.getName()
                            || catalog == node.getName()
                        )
                    ) {
                        try {
                            List<WebNavigatorNodeInfo> schemasList = webCatalog.getSchemaList();
                            Collection<? extends DBSObject> objectsCollection = ((DBSObjectContainer) node).getChildren(monitor);

                            for (DBSObject schemaObject : objectsCollection) {
                                if (!dataSource.getContainer().getNavigatorSettings().isShowSystemObjects() && DBUtils.isSystemObject(node)) {
                                    continue;
                                }
                                if (schemaObject instanceof DBSSchema) {
                                    WebNavigatorNodeInfo schemaNodeInfo = this.getNodeFromObject(connection.getSession(), schemaObject);

                                    if (schemaNodeInfo != null) {
                                        schemasList.add(schemaNodeInfo);
                                    }
                                }
                            }
                        } catch (DBException e) {
//                          throw new DBWebException("Error reading schema list", e);
                            // TODO: we need to log some message to console
                        }
                    }

                    catalogList.add(webCatalog);
                }
            } else if(node instanceof DBSSchema && contextDefaults != null && contextDefaults.supportsSchemaChange()) {
                WebNavigatorNodeInfo schemaNodeInfo = this.getNodeFromObject(connection.getSession(), node);

                if(schemaNodeInfo != null){
                    schemaList.add(schemaNodeInfo);
                }
            }
        }
        return structContainers;
    }

    protected List<? extends DBSObject> getCatalogs(DBRProgressMonitor monitor, DBSObject rootObject, DBCExecutionContextDefaults<?, ?> contextDefaults) throws DBWebException {
        if (rootObject instanceof DBSObjectContainer) {
            try {
                Collection<? extends DBSObject> objectsCollection;
                if (rootObject instanceof DBSCatalog && contextDefaults != null && !contextDefaults.supportsCatalogChange()) {
                    objectsCollection = Collections.singletonList(contextDefaults.getDefaultCatalog());
                } else {
                    objectsCollection = ((DBSObjectContainer) rootObject).getChildren(monitor);
                }
                return new ArrayList<>(objectsCollection);
            } catch (DBException e) {
                throw new DBWebException("Error reading context defaults", e);
//                return Collections.emptyList();
            }
        }
        return Collections.emptyList();
    }

    @Nullable
    protected WebNavigatorNodeInfo getNodeFromObject(WebSession session, DBSObject object){
        DBNModel navigatorModel = session.getNavigatorModel();
        DBRProgressMonitor monitor = session.getProgressMonitor();
        DBNNode node = navigatorModel.getNodeByObject(monitor, object, false);

        return node == null ? null : new WebNavigatorNodeInfo(session, node);
    }

    @Override
    public String renameNode(@NotNull WebSession session, @NotNull String nodePath, @NotNull String newName) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModel().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }

            if (node.supportsRename()) {
                node.rename(session.getProgressMonitor(), newName);
                return node.getName();
            }
            if (node instanceof DBNDatabaseNode) {
                return renameDatabaseObject(
                    session,
                    (DBNDatabaseNode) node,
                    CommonUtils.trim(CommonUtils.notEmpty(newName)));
            }
            throw new DBException("Rename is not supported");
        } catch (DBException e) {
            throw new DBWebException("Error renaming navigator node '"  + nodePath + "'", e);
        }
    }

    @Override
    public int deleteNodes(@NotNull WebSession session, @NotNull List<String> nodePaths) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            Map<DBNDatabaseNode, DBEObjectMaker> nodes = new LinkedHashMap<>();
            for (String path : nodePaths) {
                DBNNode node = session.getNavigatorModel().getNodeByPath(monitor, path);
                if (node == null) {
                    throw new DBWebException("Navigator node '"  + path + "' not found");
                }
                if (node instanceof DBNDatabaseNode) {
                    DBSObject object = ((DBNDatabaseNode) node).getObject();
                    DBEObjectMaker objectDeleter = DBWorkbench.getPlatform().getEditorsRegistry().getObjectManager(
                        object.getClass(), DBEObjectMaker.class);
                    if (objectDeleter == null || !objectDeleter.canDeleteObject(object)) {
                        throw new DBException("Object " + object + " delete is not supported");
                    }
                    nodes.put((DBNDatabaseNode) node, objectDeleter);
                } else {
                    throw new DBWebException("Navigator node '"  + path + "' is not a database node");
                }
            }

            Map<String, Object> options = new LinkedHashMap<>();
            for (Map.Entry<DBNDatabaseNode, DBEObjectMaker> ne : nodes.entrySet()) {
                DBSObject object = ne.getKey().getObject();
                DBCExecutionContext executionContext = getCommandExecutionContext(object);
                DBECommandContext commandContext = new WebCommandContext(executionContext, false);
                ne.getValue().deleteObject(commandContext, object, options);
                commandContext.saveChanges(session.getProgressMonitor(), options);
            }
            return nodes.size();

        } catch (DBException e) {
            throw new DBWebException("Error deleting navigator nodes "  + nodePaths, e);
        }
    }

    private String renameDatabaseObject(WebSession session, DBNDatabaseNode node, String newName) throws DBException {
        if (node.getParentNode() instanceof DBNContainer) {
            DBSObject object = node.getObject();
            if (object != null) {
                DBEObjectRenamer objectRenamer = DBWorkbench.getPlatform().getEditorsRegistry().getObjectManager(
                    object.getClass(), DBEObjectRenamer.class);
                if (objectRenamer != null) {
                    DBCExecutionContext executionContext = getCommandExecutionContext(object);
                    Map<String, Object> options = new LinkedHashMap<>();
                    DBECommandContext commandContext = new WebCommandContext(executionContext, false);
                    objectRenamer.renameObject(commandContext, object, options, newName);
                    try {
                        commandContext.saveChanges(session.getProgressMonitor(), options);
                    } catch (DBException e) {
                        commandContext.resetChanges(true);
                        throw e;
                    }
                    return node.getName();
                }
            }
        }
        throw new DBException("Node " + node.getNodeItemPath() + " rename is not supported");
    }

    public DBCExecutionContext getCommandExecutionContext(DBSObject object) {
        DBCExecutionContext executionContext = DBUtils.getDefaultContext(object, true);
        if (executionContext == null) {
            // It may happen in case of lazy context initialization
            executionContext = DBUtils.getDefaultContext(object.getDataSource(), true);
        }
        return executionContext;
    }

}

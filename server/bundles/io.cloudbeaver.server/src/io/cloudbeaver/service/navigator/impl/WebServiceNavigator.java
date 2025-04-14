/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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


import io.cloudbeaver.BaseWebProjectImpl;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebCommandContext;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.rm.DBNAbstractResourceManagerNode;
import io.cloudbeaver.model.rm.DBNResourceManagerResource;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.service.navigator.DBWServiceNavigator;
import io.cloudbeaver.service.navigator.WebCatalog;
import io.cloudbeaver.service.navigator.WebNavigatorNodeInfo;
import io.cloudbeaver.service.navigator.WebStructContainers;
import io.cloudbeaver.service.security.SMUtils;
import io.cloudbeaver.utils.ServletAppUtils;
import io.cloudbeaver.utils.WebConnectionFolderUtils;
import io.cloudbeaver.utils.WebEventUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.edit.DBECommandContext;
import org.jkiss.dbeaver.model.edit.DBEObjectMaker;
import org.jkiss.dbeaver.model.edit.DBEObjectRenamer;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCExecutionContextDefaults;
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeItem;
import org.jkiss.dbeaver.model.rm.RMControllerProvider;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectContainer;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.dbeaver.model.struct.rdb.DBSCatalog;
import org.jkiss.dbeaver.model.struct.rdb.DBSSchema;
import org.jkiss.dbeaver.model.websocket.WSConstants;
import org.jkiss.dbeaver.model.websocket.event.datasource.WSDataSourceProperty;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceProperty;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

import java.text.MessageFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Web service implementation
 */
public class WebServiceNavigator implements DBWServiceNavigator {
    private static final List<WebNavigatorNodeInfo> EMPTY_NODE_LIST = Collections.emptyList();

    public static final String ROOT_DATABASES = "databases";

    @Override
    public List<WebNavigatorNodeInfo> getNavigatorNodeChildren(
        @NotNull WebSession session,
        @NotNull String parentPath,
        Integer offset,
        Integer limit,
        Boolean onlyFolders
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode[] nodeChildren;
            boolean isRootPath = CommonUtils.isEmpty(parentPath) || "/".equals(parentPath) || ROOT_DATABASES.equals(parentPath);
            DBNModel navigatorModel = session.getNavigatorModelOrThrow();
            Set<String> applicableDrivers = WebServiceUtils.getApplicableDriversIds();
            if (isRootPath) {
                DBNRoot rootNode = navigatorModel.getRoot();
                nodeChildren = DBNUtils.getNodeChildrenFiltered(monitor, rootNode, true);
            } else {
                DBNNode parentNode = navigatorModel.getNodeByPath(monitor, parentPath);
                if (parentNode == null) {
                    throw new DBWebException("Node '" + parentPath + "' not found");
                }
                if (!parentNode.hasChildren(false)) {
                    return EMPTY_NODE_LIST;
                }
                if (parentNode instanceof DBNProject projectNode) {
                    parentNode = projectNode.getDatabases();
                }
                nodeChildren = DBNUtils.getNodeChildrenFiltered(monitor, parentNode, false);
            }
            if (nodeChildren == null) {
                return EMPTY_NODE_LIST;
            }
            List<WebNavigatorNodeInfo> result = new ArrayList<>();
            Set<String> nodeIds = new HashSet<>(); // filter duplicate node ids

            for (DBNNode node : nodeChildren) {
                if (node instanceof DBNDatabaseFolder folderNode && CommonUtils.isEmpty(folderNode.getMeta().getChildren(null))) {
                    // Skip empty folders. Folder may become empty if their nested elements are provided by UI plugins.
                    continue;
                }
                if (!CommonUtils.toBoolean(onlyFolders) || node instanceof DBNContainer) {
                    // Skip connections which are not supported in CB
                    if (node instanceof DBNDataSource dataSourceNode) {
                        DBPDataSourceContainer container = dataSourceNode.getDataSourceContainer();
                        // compare by id because driver object can be recreated if it was custom or disabled
                        if (!applicableDrivers.contains(container.getDriver().getId())) {
                            continue;
                        }
                    }
                    var nodeId = node.getNodeUri();
                    if (nodeIds.contains(nodeId)) {
                        session.addWarningMessage(
                            MessageFormat.format("Duplicate child node ''{0}'' was found in parent node ''{1}''",
                                nodeId,
                                parentPath)
                        );
                        continue;
                    }
                    var customConnectionsEnabled =
                        ServletAppUtils.getServletApplication().getAppConfiguration().isSupportsCustomConnections()
                            || SMUtils.isRMAdmin(session);
                    if (node instanceof DBNProject project && !customConnectionsEnabled && project.getProject().isPrivateProject()) {
                        continue;
                    }
                    nodeIds.add(node.getNodeUri());
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
            throw new DBWebException(e.getMessage(), e);
        }
    }

    @Override
    public List<WebNavigatorNodeInfo> getNavigatorNodeParents(
        @NotNull WebSession session,
        String nodePath
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModelOrThrow().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Node '" + nodePath + "' not found");
            }

            boolean shouldSkipProjectNode = nodePath.startsWith(DBNNode.NodePathType.ext.getPrefix());
            List<WebNavigatorNodeInfo> nodeParents = new ArrayList<>();
            for (DBNNode parent = getLogicalParentNode(node);
                 parent != null && !(parent instanceof DBNRoot);
                 parent = getLogicalParentNode(parent)) {
                //FIXME remove after node path refactoring
                if (parent instanceof DBNProjectDatabases) {
                    continue;
                }
                if (parent instanceof DBNProject && shouldSkipProjectNode) {
                    continue;
                }
                nodeParents.add(new WebNavigatorNodeInfo(session, parent));
            }

            return nodeParents;
        } catch (DBException e) {
            throw new DBWebException(e);
        }
    }

    private DBNNode getLogicalParentNode(DBNNode node) {
        if (node instanceof DBNLocalFolder) {
            return ((DBNLocalFolder) node).getLogicalParent();
        }
        return node.getParentNode();
    }

    @Override
    @NotNull
    public WebNavigatorNodeInfo getNavigatorNodeInfo(
        @NotNull WebSession session,
        @NotNull String nodePath
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModelOrThrow().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            return new WebNavigatorNodeInfo(session, node);
        } catch (DBException e) {
            throw new DBWebException("Error getting navigator node '"  + nodePath + "'", e);
        }
    }

    @Override
    public boolean setNavigatorNodeFilter(
        @NotNull WebSession webSession,
        @NotNull String nodePath,
        @Nullable List<String> include,
        @Nullable List<String> exclude) throws DBWebException {
        try {
            DBRProgressMonitor monitor = webSession.getProgressMonitor();

            DBNNode node = webSession.getNavigatorModelOrThrow().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            DBSObjectFilter filter = new DBSObjectFilter();
            if (!CommonUtils.isEmpty(include)) {
                filter.setInclude(include);
            }
            if (!CommonUtils.isEmpty(exclude)) {
                filter.setExclude(exclude);
            }
            filter.setEnabled(true);
            if (node instanceof DBNDatabaseNode dbNode) {
                DBXTreeItem itemsMeta = DBNUtils.getValidItemsMeta(webSession.getProgressMonitor(), dbNode);
                dbNode.setNodeFilter(itemsMeta, filter, true);
                if (node.getOwnerProject() instanceof RMControllerProvider rmControllerProvider &&
                    hasNodeEditPermission(webSession, node, rmControllerProvider.getRMProject())
                ) {
                    // Save settings
                    dbNode.getDataSourceContainer().persistConfiguration();
                }
            }
        } catch (DBException e) {
            if (e instanceof DBWebException) {
                throw (DBWebException)e;
            }
            throw new DBWebException("Error changing navigator node '"  + nodePath + "' filters", e);
        }
        return true;
    }

    @Override
    public WebNavigatorNodeInfo refreshNavigatorNode(
        @NotNull WebSession session,
        @NotNull String nodePath,
        @Nullable Boolean recursive
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModelOrThrow().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            if (node instanceof DBNDataSource dbnDataSource) {
                // Do not refresh entire tree - just clear child nodes
                // Otherwise refresh may fail if navigator settings were changed.
                DBPDataSource dataSource = dbnDataSource.getDataSource();
                if (dataSource instanceof DBPRefreshableObject refreshableObject) {
                    refreshableObject.refreshObject(monitor);
                }
                dbnDataSource.cleanupNode();
            } else if (node instanceof DBNLocalFolder) {
                // Refresh can't be applied to the local folder node
            } else if (node instanceof DBNRoot) {
                if (recursive != null && recursive) {
                    node.refreshNode(monitor, this);
                }
            } else {
                node.refreshNode(monitor, this);
            }
            return new WebNavigatorNodeInfo(session, node);
        } catch (DBException e) {
            throw new DBWebException("Error refreshing navigator node '"  + nodePath + "'", e);
        }
    }

    @Override
    public WebStructContainers getStructContainers(
        String projectId,
        WebConnectionInfo connection,
        String contextId,
        String catalog
    ) throws DBWebException {
        DBPDataSource dataSource = connection.getDataSource();
        DBCExecutionContext executionContext = DBUtils.getDefaultContext(connection.getDataSource(), false);
        if (executionContext == null) {
            throw new DBWebException("No default execution context for " + connection.getName());
        }
        DBCExecutionContextDefaults<?, ?> contextDefaults = executionContext.getContextDefaults();

        WebStructContainers structContainers = new WebStructContainers();

        structContainers.setSupportsCatalogChange(contextDefaults != null && contextDefaults.supportsCatalogChange());
        structContainers.setSupportsSchemaChange(contextDefaults != null && contextDefaults.supportsSchemaChange());

        DBRProgressMonitor monitor = connection.getSession().getProgressMonitor();
        List<? extends DBSObject> dbsObjects = this.getCatalogs(
                monitor,
                connection.getDataSourceContainer().getDataSource(),
                contextDefaults);

        for (DBSObject dbsObject : dbsObjects) {
            if (!dataSource.getContainer().getNavigatorSettings().isShowSystemObjects()
                    && DBUtils.isSystemObject(dbsObject)) {
                continue;
            }

            WebNavigatorNodeInfo objectNode = this.getNodeFromObject(connection.getSession(), dbsObject);

            if (objectNode == null) {
                continue;
            }

            if (structContainers.getParentNode() == null) {
                structContainers.setParentNode(
                        new WebNavigatorNodeInfo(connection.getSession(), objectNode.getNode().getParentNode()));
            }

            if (dbsObject instanceof DBSCatalog) {
                WebCatalog webCatalog = new WebCatalog(objectNode);

                if (structContainers.getSupportsSchemaChange()
                        && ((contextDefaults.getDefaultCatalog() != null
                                && contextDefaults.getDefaultCatalog().getName().equals(dbsObject.getName()))
                                || dbsObject.getName().equals(catalog))) {
                    try {
                        Collection<? extends DBSObject> dbsObjectChildren = ((DBSObjectContainer) dbsObject)
                                .getChildren(monitor);

                        for (DBSObject dbsObjectChild : dbsObjectChildren) {
                            if (!dataSource.getContainer().getNavigatorSettings().isShowSystemObjects()
                                    && DBUtils.isSystemObject(dbsObjectChild)) {
                                continue;
                            }
                            if (dbsObjectChild instanceof DBSSchema) {
                                WebNavigatorNodeInfo schemaNodeInfo = this.getNodeFromObject(connection.getSession(),
                                        dbsObjectChild);

                                if (schemaNodeInfo != null) {
                                    webCatalog.getSchemaList().add(schemaNodeInfo);
                                }
                            }
                        }
                    } catch (DBException e) {
                        // throw new DBWebException("Error reading schema list", e);
                        // TODO: we need to log some message to console
                    }
                }

                structContainers.getCatalogList().add(webCatalog);
            } else if (dbsObject instanceof DBSSchema && structContainers.getSupportsSchemaChange()) {
                structContainers.getSchemaList().add(objectNode);
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
    protected WebNavigatorNodeInfo getNodeFromObject(WebSession session, DBSObject object) throws DBWebException {
        DBRProgressMonitor monitor = session.getProgressMonitor();
        DBNNode node = session.getNavigatorModelOrThrow().getNodeByObject(monitor, object, false);

        return node == null ? null : new WebNavigatorNodeInfo(session, node);
    }

    @Override
    public String renameNode(
        @NotNull WebSession session,
        @NotNull String nodePath,
        @NotNull String newName
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();

            DBNNode node = session.getNavigatorModelOrThrow().getNodeByPath(monitor, nodePath);
            if (node == null) {
                throw new DBWebException("Navigator node '"  + nodePath + "' not found");
            }
            checkProjectEditAccess(node, session);
            if (node.supportsRename()) {
                if (node instanceof DBNLocalFolder) {
                    return renameConnectionFolder(session, node, newName);
                }
                if (node instanceof DBNResourceManagerResource) {
                    return renameRmResourceNode(session, node, newName);
                }
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

    @NotNull
    private String renameConnectionFolder(@NotNull WebSession session, DBNNode node, @NotNull String newName) throws DBException {
        WebConnectionFolderUtils.validateConnectionFolder(newName);
        List<String> siblings = Arrays.stream(
            ((DBNLocalFolder) node).getLogicalParent().getChildren(session.getProgressMonitor()))
            .filter(n -> n instanceof DBNLocalFolder)
            .map(DBNNode::getName).toList();
        if (siblings.contains(newName)) {
            throw new DBWebException("Name " + newName + " is unavailable or invalid");
        }
        var oldNodePath = node.getNodeItemPath();
        node.rename(session.getProgressMonitor(), newName);
        var newNodePath = node.getNodeItemPath();
        addNavigatorNodeMoveEvent(session, node, oldNodePath, newNodePath);
        return node.getName();
    }

    private void addNavigatorNodeMoveEvent(@NotNull WebSession session, DBNNode node, String oldNodePath, String newNodePath) {
        WebEventUtils.addNavigatorNodeUpdatedEvent(
            node.getOwnerProject(),
            session,
            oldNodePath,
            WSConstants.EventAction.DELETE
        );
        WebEventUtils.addNavigatorNodeUpdatedEvent(
            node.getOwnerProject(),
            session,
            newNodePath,
            WSConstants.EventAction.CREATE
        );
    }

    @NotNull
    private String renameRmResourceNode(@NotNull WebSession session, DBNNode node, @NotNull String newName) throws DBException {
        if (newName.contains("/") || newName.contains("\\")) {
            throw new DBWebException("New node name has prohibited symbols: \\ /");
        }
        DBNResourceManagerResource rmNode = (DBNResourceManagerResource) node;
        // Get project id from node
        String projectId = rmNode.getResourceProject().getId();
        // Get paths from nodes
        String resourcePath = rmNode.getResourceFolder();
        node.rename(session.getProgressMonitor(), newName);
        var newPath = rmNode.getResourceFolder();
        addRmMoveEvent(session, projectId, resourcePath, newPath);
        return node.getName();
    }

    private void addRmMoveEvent(
        @NotNull WebSession session,
        String projectId,
        String oldResourcePath,
        String newResourcePath
    ) {
        WebEventUtils.addRmResourceUpdatedEvent(
            projectId,
            session,
            oldResourcePath,
            WSConstants.EventAction.DELETE,
            WSResourceProperty.NAME);
        WebEventUtils.addRmResourceUpdatedEvent(
            projectId,
            session,
            newResourcePath,
            WSConstants.EventAction.CREATE,
            WSResourceProperty.NAME);
    }

    @Override
    public int deleteNodes(
        @NotNull WebSession session,
        @NotNull List<String> nodePaths
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();
            String projectId = null;
            boolean containsFolderNodes = false;
            Map<DBNNode, DBEObjectMaker> nodes = new LinkedHashMap<>();
            DBNModel model = session.getNavigatorModelOrThrow();
            for (String path : nodePaths) {
                DBNNode node = model.getNodeByPath(monitor, path);
                if (node == null) {
                    throw new DBWebException("Navigator node '"  + path + "' not found");
                }
                checkProjectEditAccess(node, session);
                if (node instanceof DBNDatabaseNode) {
                    DBSObject object = ((DBNDatabaseNode) node).getObject();
                    DBEObjectMaker objectDeleter = DBWorkbench.getPlatform().getEditorsRegistry().getObjectManager(
                        object.getClass(), DBEObjectMaker.class);
                    if (objectDeleter == null || !objectDeleter.canDeleteObject(object)) {
                        throw new DBException("Object " + object + " delete is not supported");
                    }
                    nodes.put(node, objectDeleter);
                } else if (node instanceof DBNLocalFolder) {
                    containsFolderNodes = true;
                    projectId = node.getOwnerProject().getId();
                    nodes.put(node, null);
                } else if (node instanceof DBNResourceManagerResource) {
                    nodes.put(node, null);
                } else {
                    throw new DBWebException("Navigator node '"  + path + "' is not a database node");
                }
            }

            Map<String, Object> options = new LinkedHashMap<>();
            for (Map.Entry<DBNNode, DBEObjectMaker> ne : nodes.entrySet()) {
                DBNNode node = ne.getKey();
                if (node instanceof DBNDatabaseNode) {
                    DBSObject object = ((DBNDatabaseNode) node).getObject();
                    DBCExecutionContext executionContext = getCommandExecutionContext(object);
                    DBECommandContext commandContext = new WebCommandContext(executionContext, false);
                    ne.getValue().deleteObject(commandContext, object, options);
                    try {
                        commandContext.saveChanges(session.getProgressMonitor(), options);
                    } catch (DBException e) {
                        commandContext.resetChanges(true);
                        throw e;
                    }
                } else if (node instanceof DBNLocalFolder) {
                    var nodePath = node.getNodeItemPath();
                    node.getOwnerProject().getDataSourceRegistry().removeFolder(((DBNLocalFolder) node).getFolder(), false);
                    WebEventUtils.addNavigatorNodeUpdatedEvent(
                        session.getProjectById(projectId),
                        session,
                        nodePath,
                        WSConstants.EventAction.DELETE
                    );
                } else if (node instanceof DBNResourceManagerResource) {
                    DBNResourceManagerResource rmResource = ((DBNResourceManagerResource) node);
                    String resourceProjectId = rmResource.getResourceProject().getId();
                    String resourcePath = rmResource.getResourceFolder();
                    session.getRmController().deleteResource(resourceProjectId, resourcePath, true);
                    WebEventUtils.addRmResourceUpdatedEvent(
                        resourceProjectId,
                        session,
                        resourcePath,
                        WSConstants.EventAction.DELETE,
                        WSResourceProperty.NAME);
                }
            }
            if (containsFolderNodes) {
                WebServiceUtils.updateConfigAndRefreshDatabases(session, projectId);
            }
            return nodes.size();

        } catch (DBException e) {
            throw new DBWebException("Error deleting navigator nodes " + nodePaths, e);
        }
    }

    private void checkProjectEditAccess(DBNNode node, WebSession session) throws DBException {
        BaseWebProjectImpl project = (BaseWebProjectImpl) node.getOwnerProject();
        if (project == null || !hasNodeEditPermission(session, node, project.getRMProject())) {
            throw new DBException("Access denied");
        }
    }

    private boolean hasNodeEditPermission(WebSession session, DBNNode node, RMProject rmProject) {
        if (node instanceof DBNDataSource || node instanceof DBNLocalFolder) {
            return SMUtils.hasProjectPermission(session, rmProject, RMProjectPermission.DATA_SOURCES_EDIT);
        } else if (node instanceof DBNAbstractResourceManagerNode) {
            return SMUtils.hasProjectPermission(session, rmProject, RMProjectPermission.RESOURCE_EDIT);
        }
        return true;
    }

    @Override
    public boolean moveNodesToFolder(
        @NotNull WebSession session,
        @NotNull List<String> nodePaths,
        @NotNull String folderNodePath
    ) throws DBWebException {
        try {
            DBRProgressMonitor monitor = session.getProgressMonitor();
            DBNModel navigatorModel = session.getNavigatorModelOrThrow();
            DBNNode folderNode = navigatorModel.getNodeByPath(monitor, folderNodePath);
            if (folderNode == null) {
                throw new DBException("Folder node '" + folderNodePath + "' not found");
            }
            for (String path : nodePaths) {
                DBNNode node = navigatorModel.getNodeByPath(monitor, path);
                if (node == null) {
                    throw new DBWebException("Navigator node '"  + path + "' not found");
                }
                checkProjectEditAccess(node, session);
                if (node.getNodeUri().equals(folderNode.getNodeUri())) {
                    throw new DBWebException("Cannot move node inside itself");
                }
                if (node instanceof DBNDataSource dataSourceNode) {
                    DBPDataSourceFolder folder = null;
                    if (folderNode instanceof DBNLocalFolder localFolderNode) {
                        folder = localFolderNode.getFolder();
                    }
                    dataSourceNode.moveToFolder(folderNode.getOwnerProject(), folder);
                    node.getOwnerProject().getDataSourceRegistry().updateDataSource(
                        dataSourceNode.getDataSourceContainer());
                    WebEventUtils.addDataSourceUpdatedEvent(
                        node.getOwnerProject(),
                        session,
                        dataSourceNode.getDataSourceContainer().getId(),
                        WSConstants.EventAction.UPDATE,
                        WSDataSourceProperty.CONFIGURATION
                    );
                } else if (node instanceof DBNLocalFolder dbnLocalFolder) {
                    DBPDataSourceFolder parentFolder = null;
                    if (folderNode instanceof DBNLocalFolder parentFolderNode) {
                        parentFolder = parentFolderNode.getFolder();
                    }
                    if (parentFolder != null) {
                        List<String> siblings = Arrays.stream(parentFolder.getChildren())
                            .map(DBPDataSourceFolder::getName)
                            .collect(Collectors.toList());
                        if (siblings.contains(node.getName())) {
                            throw new DBWebException("Node " + folderNodePath + " contains folder with name '" + node.getName() + "'");
                        }
                    }
                    var oldNodePath = node.getNodeItemPath();
                    node.getOwnerProject().getDataSourceRegistry().moveFolder(
                        dbnLocalFolder.getFolder().getFolderPath(),
                        dbnLocalFolder.generateNewFolderPath(parentFolder, dbnLocalFolder.getNodeDisplayName())
                    );
                    node.getOwnerProject().getDataSourceRegistry().checkForErrors();
                    var newNodePath = node.getNodeItemPath();
                    WebServiceUtils.updateConfigAndRefreshDatabases(session, node.getOwnerProject().getId());
                    addNavigatorNodeMoveEvent(session, node, oldNodePath, newNodePath);
                } else if (node instanceof DBNResourceManagerResource) {
                    boolean rmNewNode = folderNode instanceof DBNAbstractResourceManagerNode;
                    DBNResourceManagerResource rmOldNode = (DBNResourceManagerResource) node;
                    if (!rmNewNode) {
                        throw new DBWebException("Navigator node '" + folderNodePath + "' is not a resource manager node");
                    }
                    // Get project id from node
                    String projectId = rmOldNode.getResourceProject().getId();
                    // Get paths from nodes
                    String newPath = rmOldNode.getResource().getName();
                    if (folderNode instanceof DBNResourceManagerResource) {
                        newPath = ((DBNResourceManagerResource) folderNode).getResourceFolder() + "/" + newPath;
                    }
                    String resourcePath = rmOldNode.getResourceFolder();
                    session.getRmController().moveResource(projectId, resourcePath, newPath);
                    addRmMoveEvent(session, projectId, resourcePath, newPath);
                } else {
                    throw new DBWebException("Navigator node '"  + path + "' is not a data source node");
                }
            }
            return true;
        } catch (DBException e) {
            throw new DBWebException("Error moving navigator nodes "  + nodePaths, e);
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
        throw new DBException("Node " + node.getNodeUri() + " rename is not supported");
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

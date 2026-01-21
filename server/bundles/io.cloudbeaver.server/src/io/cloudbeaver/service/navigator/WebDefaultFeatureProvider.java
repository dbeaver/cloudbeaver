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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.WebProjectImpl;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.rm.DBNResourceManagerProject;
import io.cloudbeaver.model.rm.DBNResourceManagerResource;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebDriverRegistry;
import io.cloudbeaver.server.WebAppUtils;
import io.cloudbeaver.service.security.SMUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPDataSourceFolder;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.connection.DBPDriver;
import org.jkiss.dbeaver.model.edit.DBEObjectMaker;
import org.jkiss.dbeaver.model.edit.DBEObjectRenamer;
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.navigator.fs.DBNPath;
import org.jkiss.dbeaver.model.navigator.meta.DBXTreeNode;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.rdb.DBSProcedure;
import org.jkiss.dbeaver.registry.ResourceTypeRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class WebDefaultFeatureProvider implements DBWFeatureProvider {
    public static final String NODE_FEATURE_ITEM = "item";
    public static final String NODE_FEATURE_LEAF = "leaf";
    public static final String NODE_FEATURE_CONTAINER = "container";
    public static final String NODE_FEATURE_SHARED = "shared";
    public static final String NODE_FEATURE_CAN_DELETE = "canDelete";
    public static final String NODE_FEATURE_CAN_FILTER = "canFilter";
    public static final String NODE_FEATURE_CAN_RENAME = "canRename";
    public static final String NODE_FEATURE_CAN_CREATE_CONNECTION_FROM_NODE = "canCreateConnectionFromNode";


    @NotNull
    @Override
    public List<String> getNodeFeatures(@NotNull WebSession webSession, @NotNull DBNNode node) {
        List<String> features = new ArrayList<>();
        boolean isLeaf = false;
        if (node instanceof DBNDatabaseItem databaseItem) {
            features.add(NODE_FEATURE_ITEM);
            DBSObject object = databaseItem.getObject();
            if (object instanceof DBSEntity || object instanceof DBSProcedure) {
                features.add(NODE_FEATURE_LEAF);
                isLeaf = true;
            }
        }
        if (node instanceof DBNContainer) {
            features.add(NODE_FEATURE_CONTAINER);
        }
        if (node instanceof DBNDataSource && hasNodePermission(webSession, node, RMProjectPermission.DATA_SOURCES_EDIT)) {
            features.add(NODE_FEATURE_CAN_RENAME);
        }
        boolean isShared = false;
        if (node instanceof DBNDatabaseNode && !isLeaf) {
            if (node instanceof DBNDataSource dataSource) {
                if (dataSource.getDataSourceContainer().getDataSource() != null) {
                    boolean hasNonFolderNode = DBXTreeNode.hasNonFolderNode(dataSource.getMeta().getChildren(null));
                    if (hasNonFolderNode) {
                        features.add(NODE_FEATURE_CAN_FILTER);
                    }
                }
            } else if (node instanceof DBNDatabaseItem item) {
                if (item.getDataSourceContainer().getDataSource() != null) {
                    boolean hasNonFolderNode = DBXTreeNode.hasNonFolderNode(item.getMeta().getChildren(null));
                    if (hasNonFolderNode) {
                        features.add(NODE_FEATURE_CAN_FILTER);
                    }
                }
            } else {
                features.add(NODE_FEATURE_CAN_FILTER);
            }
            isShared = !node.getOwnerProject().getName().equals(webSession.getUserId());
        } else if (node instanceof DBNLocalFolder dbnLocalFolder) {
            DBPDataSourceFolder folder = dbnLocalFolder.getFolder();
            DBPProject project = folder.getDataSourceRegistry().getProject();
            String projectName = project.getName();
            Set<DBPDataSourceFolder> tempFolders = folder.getDataSourceRegistry().getTemporaryFolders();
            isShared = !projectName.equals(webSession.getUserId()) || tempFolders.contains(folder);
            if (hasNodePermission(webSession, node, RMProjectPermission.DATA_SOURCES_EDIT)) {
                features.add(NODE_FEATURE_CAN_RENAME);
                features.add(NODE_FEATURE_CAN_DELETE);
            }
        }
        if (isShared) {
            features.add(NODE_FEATURE_SHARED);
        }
        if (node instanceof DBNDatabaseNode) {
            boolean canEditDatasources = hasNodePermission(webSession, node, RMProjectPermission.DATA_SOURCES_EDIT);
            DBSObject object = ((DBNDatabaseNode) node).getObject();
            if (object != null && canEditDatasources && !DBUtils.isReadOnly(object)) {
                DBEObjectMaker objectManager = DBWorkbench.getPlatform().getEditorsRegistry().getObjectManager(
                    object.getClass(), DBEObjectMaker.class);
                if (objectManager != null && objectManager.canDeleteObject(object)) {
                    features.add(NODE_FEATURE_CAN_DELETE);
                }
                if (objectManager instanceof DBEObjectRenamer renamer && renamer.canRenameObject(object)) {
                    if (!object.getDataSource().getContainer().getNavigatorSettings().isShowOnlyEntities()) {
                        features.add(NODE_FEATURE_CAN_RENAME);
                    }
                }
            }
        }
        if (node instanceof DBNRoot) {
            return features;
        }
        if (node instanceof DBNResourceManagerResource && !isDistributedSpecialFolderNode(webSession, node)) {
            if (hasNodePermission(webSession, node, RMProjectPermission.RESOURCE_EDIT)) {
                features.add(NODE_FEATURE_CAN_RENAME);
                features.add(NODE_FEATURE_CAN_DELETE);
            }
        }
        if (node instanceof DBNPath dbnPath) {
            if (canCreateConnectionFromFileName(dbnPath.getName())) {
                features.add(NODE_FEATURE_CAN_CREATE_CONNECTION_FROM_NODE);
            }
        }
        return features;
    }

    @NotNull
    private String getProjectId(@NotNull DBNNode node) {
        return node.getOwnerProject().getId();
    }

    private boolean canCreateConnectionFromFileName(String fileName) {
        String fileExtension = IOUtils.getFileExtension(fileName);
        if (CommonUtils.isEmpty(fileExtension)) {
            return false;
        }
        WebDriverRegistry driverRegistry = WebAppUtils.getWebApplication().getDriverRegistry();
        Set<DBPDriver> dbpDrivers = driverRegistry.getSupportedFileOpenExtension().get(fileExtension);
        if (dbpDrivers == null) {
            return false;
        }
        for (DBPDriver dbpDriver : dbpDrivers) {
            if (WebServiceUtils.isDriverEnabled(dbpDriver)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasNodePermission(@NotNull WebSession webSession, @NotNull DBNNode node, @NotNull RMProjectPermission permission) {
        WebProjectImpl project = webSession.getProjectById(node.getOwnerProject().getId());
        if (project == null) {
            return false;
        }
        RMProject rmProject = project.getRMProject();
        return SMUtils.hasProjectPermission(webSession, rmProject, permission);
    }

    private boolean isDistributedSpecialFolderNode(@NotNull WebSession webSession, @NotNull DBNNode node) {
        // do not send rename/delete features for distributed resource manager special folder
        if (!webSession.getApplication().isDistributed()
            || !(node instanceof DBNResourceManagerResource resourceNode)
            || !WebServiceUtils.isFolder(node)
        ) {
            return false;
        }
        // check only root folders
        if (!(node.getParentNode() instanceof DBNResourceManagerProject)) {
            return false;
        }
        var folderPath = resourceNode.getResourceFolder();
        return ResourceTypeRegistry.getInstance().getResourceTypeByRootPath(null, folderPath) != null;
    }
}

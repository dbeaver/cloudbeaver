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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.rm.DBNResourceManagerResource;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.edit.DBEObjectMaker;
import org.jkiss.dbeaver.model.edit.DBEObjectRenamer;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.*;
import org.jkiss.dbeaver.model.struct.DBSEntity;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.rdb.DBSProcedure;
import org.jkiss.dbeaver.registry.DataSourceFolder;
import org.jkiss.dbeaver.registry.DataSourceRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Web connection info
 */
public class WebNavigatorNodeInfo {
    public static final String NODE_FEATURE_ITEM = "item";
    public static final String NODE_FEATURE_LEAF = "leaf";
    public static final String NODE_FEATURE_CONTAINER = "container";
    public static final String NODE_FEATURE_SHARED = "shared";
    public static final String NODE_FEATURE_CAN_DELETE = "canDelete";
    public static final String NODE_FEATURE_CAN_RENAME = "canRename";
    private final WebSession session;
    private final DBNNode node;

    public WebNavigatorNodeInfo(WebSession session, DBNNode node) {
        this.session = session;
        this.node = node;
    }

    public DBNNode getNode() {
        return node;
    }

    ///////////////////////////////////
    // General properties
    ///////////////////////////////////

    @Property
    public String getId() {
        return node.getNodeItemPath();
    }

    @Property
    public String getName() {
        return node.getLocalizedName(session.getLocale());
    }

    @Property
    public String getFullName() {
        String nodeName;
        if (node instanceof DBNDatabaseNode && !(node instanceof DBNDataSource)) {
            DBSObject object = ((DBNDatabaseNode) node).getObject();
            nodeName = DBUtils.getObjectFullName(object, DBPEvaluationContext.UI);
        } else if (node instanceof DBNDataSource) {
            DBPDataSourceContainer object = ((DBNDataSource) node).getDataSourceContainer();
            nodeName = object.getName();
        } else {
            nodeName = node.getNodeTargetName();
        }
        return nodeName;
    }

    @Property
    public String getIcon() {
        return node.getNodeIconDefault().getLocation();
    }

    @Property
    public String getDescription() {
        return node.getNodeDescription();
    }

    @Property
    public String getNodeType() {
        return node.getNodeType();
    }

    @Property
    public boolean isFolder() {
        return (node instanceof DBNContainer && !(node instanceof DBNDataSource))
            || (node instanceof DBNResourceManagerResource
            && ((DBNResourceManagerResource) node).getResource().isFolder());
    }

    @Property
    public boolean isInline() {
        return node instanceof DBNDatabaseNode && ((DBNDatabaseNode) node).getMeta().isInline();
    }

    @Property
    public boolean isNavigable() {
        if (node instanceof DBNDatabaseNode) {
            DBNDatabaseNode databaseNode = (DBNDatabaseNode) this.node;
            if (!databaseNode.getMeta().isNavigable()) {
                return false;
            }
        }
        return true;
    }

    @Property
    public boolean isHasChildren() {
        return node.hasChildren(true);
    }

    @Association
    public String[] getFeatures() {
        List<String> features = new ArrayList<>();
        if (node instanceof DBNDatabaseItem) {
            features.add(NODE_FEATURE_ITEM);
            DBSObject object = ((DBNDatabaseItem) node).getObject();
            if (object instanceof DBSEntity || object instanceof DBSProcedure) {
                features.add(NODE_FEATURE_LEAF);
            }

        }
        if (node instanceof DBNContainer) {
            features.add(NODE_FEATURE_CONTAINER);
        }
        boolean isShared = false;
        if (node instanceof DBNDatabaseNode) {
            isShared = !((DBNDatabaseNode) node).getDataSourceContainer().isManageable();
        } else if (node instanceof DBNLocalFolder) {
            DataSourceFolder folder = (DataSourceFolder) ((DBNLocalFolder) node).getFolder();
            String projectName = folder.getDataSourceRegistry().getProject().getName();
            Set<DBPDataSourceFolder> tempFolders = ((DataSourceRegistry) folder.getDataSourceRegistry()).getTemporaryFolders();
            isShared = !projectName.equals(session.getUserId()) || tempFolders.contains(folder);
        }
        if (isShared) {
            features.add(NODE_FEATURE_SHARED);
        }

        if (node instanceof DBNDatabaseNode) {
            DBSObject object = ((DBNDatabaseNode) node).getObject();
            if (object != null) {
                DBEObjectMaker objectManager = DBWorkbench.getPlatform().getEditorsRegistry().getObjectManager(
                    object.getClass(), DBEObjectMaker.class);
                if (objectManager != null && objectManager.canDeleteObject(object)) {
                    features.add(NODE_FEATURE_CAN_DELETE);
                }
                if (objectManager instanceof DBEObjectRenamer && ((DBEObjectRenamer) objectManager).canRenameObject(object)) {
                    if (!object.getDataSource().getContainer().getNavigatorSettings().isShowOnlyEntities()) {
                        features.add(NODE_FEATURE_CAN_RENAME);
                    }
                }
            }
        } else if (isShared) {
            return features.toArray(new String[0]);
        } else if (node instanceof DBNLocalFolder) {
            features.add(NODE_FEATURE_CAN_RENAME);
            features.add(NODE_FEATURE_CAN_DELETE);
        } else if (node instanceof DBNResourceManagerResource) {
            features.add(NODE_FEATURE_CAN_DELETE);
            if (!isFolder()) {
                features.add(NODE_FEATURE_CAN_RENAME);
            }
        }

        return features.toArray(new String[0]);
    }

    ///////////////////////////////////
    // Details
    ///////////////////////////////////

    @Property
    public WebPropertyInfo[] getNodeDetails() throws DBWebException {
        if (node instanceof DBPObjectWithDetails) {
            try {
                DBPObject objectDetails = ((DBPObjectWithDetails) node).getObjectDetails(session.getProgressMonitor(), session.getSessionContext(), node);
                if (objectDetails != null) {
                    return WebServiceUtils.getObjectProperties(session, objectDetails);
                }
            } catch (DBException e) {
                throw new DBWebException("Error extracting node details", e);
            }
        }
        return null;
    }

    ///////////////////////////////////
    // Objects
    ///////////////////////////////////

    @Property
    public WebDatabaseObjectInfo getObject() {
        if (node instanceof DBNDatabaseNode) {
            DBSObject object = ((DBNDatabaseNode) node).getObject();
            return object == null ? null : new WebDatabaseObjectInfo(session, object);
        }
        return null;
    }

    @Override
    public String toString() {
        return node.getNodeItemPath();
    }
}

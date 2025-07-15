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

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.WebPropertyInfo;
import io.cloudbeaver.model.fs.FSUtils;
import io.cloudbeaver.model.rm.DBNResourceManagerResource;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebObjectFeatureProviderDescriptor;
import io.cloudbeaver.registry.WebObjectFeatureRegistry;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.fs.DBFUtils;
import org.jkiss.dbeaver.model.meta.Association;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNDataSource;
import org.jkiss.dbeaver.model.navigator.DBNDatabaseNode;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNUtils;
import org.jkiss.dbeaver.model.navigator.fs.DBNFileSystem;
import org.jkiss.dbeaver.model.navigator.fs.DBNPathBase;
import org.jkiss.dbeaver.model.struct.DBSObject;
import org.jkiss.dbeaver.model.struct.DBSObjectFilter;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Web connection info
 */
public class WebNavigatorNodeInfo {
    private static final Log log = Log.getLog(WebNavigatorNodeInfo.class);
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
    @Deprecated(forRemoval = true)
    public String getId() {
        return node.getNodeItemPath();
    }

    @Property
    public String getUri() {
        return node.getNodeUri();
    }

    @Property
    public String getName() {
        return node.getLocalizedName(session.getLocale());
    }

    @Property
    public String getPlainName() { // for renaming node
        String plainName = null;
        if (node instanceof DBNDatabaseNode) {
            plainName = ((DBNDatabaseNode) node).getPlainNodeName(true, false);
        }
        if (node instanceof DBNResourceManagerResource) {
            plainName = IOUtils.getFileNameWithoutExtension(Path.of(getName()));
        }
        return CommonUtils.equalObjects(plainName, getName()) ? null : plainName;
    }

    @Property
    public String getProjectId() {
        DBPProject ownerProject = node.getOwnerProjectOrNull();
        return ownerProject == null ? null : ownerProject.getId();
    }

    @Property
    @Deprecated
    public String getFullName() {
        String nodeName;
        if (node instanceof DBNDatabaseNode dbNode && !(node instanceof DBNDataSource)) {
            DBSObject object = dbNode.getObject();
            nodeName = DBUtils.getObjectFullName(object, DBPEvaluationContext.UI);
        } else if (node instanceof DBNDataSource dataSource) {
            DBPDataSourceContainer object = dataSource.getDataSourceContainer();
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
        return WebServiceUtils.isFolder(node);
    }

    @Property
    public boolean isInline() {
        return node instanceof DBNDatabaseNode && ((DBNDatabaseNode) node).getMeta().isInline();
    }

    @Property
    public boolean isNavigable() {
        if (node instanceof DBNDatabaseNode) {
            DBNDatabaseNode databaseNode = (DBNDatabaseNode) this.node;
            return databaseNode.getMeta().isNavigable();
        }
        return true;
    }

    @Property
    public boolean isFiltered() {
        return node.isFiltered();
    }

    @Property
    public boolean isHasChildren() {
        return node.hasChildren(true);
    }

    @Association
    public String[] getFeatures() {
        List<String> features = new ArrayList<>();
        for (WebObjectFeatureProviderDescriptor provider : WebObjectFeatureRegistry.getInstance().getProviders()) {
            features.addAll(provider.getInstance().getNodeFeatures(session, node));
        }
        return features.toArray(new String[0]);
    }

    ///////////////////////////////////
    // Details
    ///////////////////////////////////

    @Property
    public WebPropertyInfo[] getNodeDetails() throws DBWebException {
        if (node instanceof DBPObjectWithDetails objectWithDetails) {
            try {
                DBPObject objectDetails = objectWithDetails.getObjectDetails(
                    session.getProgressMonitor(), session.getSessionContext(), node);
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
        if (node instanceof DBNDatabaseNode dbNode) {
            DBSObject object = dbNode.getObject();
            return object == null ? null : new WebDatabaseObjectInfo(session, object);
        }
        return null;
    }

    @Property
    public String getObjectId() {
        if (node instanceof DBNPathBase dbnPath) {
            return DBFUtils.getUriFromPath(dbnPath.getPath()).toString();
        } else if (node instanceof DBNFileSystem dbnFs) {
            return FSUtils.makeUniqueFsId(dbnFs.getFileSystem());
        }
        return null;
    }

    @Property
    public DBSObjectFilter getFilter() throws DBWebException {
        if (!(node instanceof DBNDatabaseNode dbNode)) {
            throw new DBWebException("Invalid navigator node type: "  + node.getClass().getName());
        }
        try {
            DBSObjectFilter filter = dbNode.getNodeFilter(
                DBNUtils.getValidItemsMeta(session.getProgressMonitor(), dbNode),
                true);
            return filter == null || filter.isEmpty() || !filter.isEnabled() ? null : filter;
        } catch (DBException e) {
            throw new DBWebException(e);
        }
    }

    @Override
    public String toString() {
        return node.getNodeUri();
    }
}

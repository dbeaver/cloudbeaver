/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */

package io.cloudbeaver.model.rm;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBIcon;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;

public class DBNResourceManagerResource extends DBNAbstractResourceManagerNode {
    private static final Log log = Log.getLog(DBNResourceManagerResource.class);

    private final RMResource resource;

    DBNResourceManagerResource(DBNNode parentNode, RMResource resource) {
        super(parentNode);
        this.resource = resource;
    }

    @Override
    public String getNodeType() {
        return "rm.resource";
    }

    @Override
    public String getNodeName() {
        return resource.getName();
    }

    @Override
    public String getNodeDescription() {
        return null;
    }

    @Override
    public DBPImage getNodeIcon() {
        return resource.isFolder() ? DBIcon.TREE_FOLDER : DBIcon.TREE_FILE;
    }

    @Override
    protected boolean allowsChildren() {
        return resource.isFolder();
    }

    @Override
    public DBNNode[] getChildren(DBRProgressMonitor monitor) throws DBException {
        if (children == null) {
            List<DBNResourceManagerResource> rfList = new ArrayList<>();
            for (RMResource resource : getResourceController().listResources(
                getResourceProject().getId(), getResourceFolder(), null, false, false, false)) {
                rfList.add(new DBNResourceManagerResource(this, resource));
            }

            children = rfList.toArray(new DBNResourceManagerResource[0]);
        }
        return children;
    }

    public String getResourceFolder() {
        StringBuilder folder = new StringBuilder();
        for (DBNNode parent = this; parent != null; parent = parent.getParentNode()) {
            if (parent instanceof DBNResourceManagerResource) {
                if (folder.length() > 0) folder.insert(0, '/');
                folder.insert(0, parent.getName());
            } else {
                break;
            }
        }
        return folder.length() == 0 ? null : folder.toString();
    }

    public RMProject getResourceProject() throws DBException {
        for (DBNNode parent = getParentNode(); parent != null; parent = parent.getParentNode()) {
            if (parent instanceof DBNResourceManagerProject) {
                return ((DBNResourceManagerProject) parent).getProject();
            }
        }
        throw new DBException("Can't detect resource project node");
    }

    protected RMController getResourceController() throws DBException {
        for (DBNNode parent = getParentNode(); parent != null; parent = parent.getParentNode()) {
            if (parent instanceof DBNResourceManagerRoot) {
                return ((DBNResourceManagerRoot) parent).getResourceController();
            }
        }
        throw new DBException("Can't detect resource root node");
    }

    @Override
    public String getNodeItemPath() {
        return getParentNode().getNodeItemPath() + "/" + getNodeName();
    }

    @Override
    public DBNNode refreshNode(DBRProgressMonitor monitor, Object source) throws DBException {
        this.children = null;
        return super.refreshNode(monitor, source);
    }
    @Override
    public boolean supportsRename() {
        return true;
    }

    @Override
    public void rename(DBRProgressMonitor monitor, String newName) throws DBException {
        try {
            if (newName.indexOf('.') == -1) {
                String resourceName = resource.getName();
                int indexOfExt = resourceName.indexOf('.');
                if (indexOfExt > 0) {
                    String ext = resourceName.substring(indexOfExt + 1);
                    if (!CommonUtils.isEmpty(ext)) {
                        newName += "." + ext;
                    }
                }
            }
            if (!newName.equals(resource.getName())) {
                String oldPath = getResourceFolder();
                resource.setName(newName);
                getResourceController().moveResource(getResourceProject().getId(), oldPath, getResourceFolder());

            }
        } catch (Exception e) {
            throw new DBException("Can't rename resource", e);
        }
    }

    @Override
    public String toString() {
        return getNodeName();
    }

    @Nullable
    @Override
    public DBPObject getObjectDetails(@NotNull DBRProgressMonitor monitor, @NotNull SMSessionContext sessionContext, @NotNull Object dataSource) throws DBException {
        return resource;
    }

    public RMResource getResource() {
        return resource;
    }
}

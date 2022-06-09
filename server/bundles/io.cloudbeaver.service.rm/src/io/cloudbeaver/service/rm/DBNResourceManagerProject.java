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

package io.cloudbeaver.service.rm;

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

import java.util.ArrayList;
import java.util.List;

public class DBNResourceManagerProject extends DBNAbstractResourceManagerNode {
    private static final Log log = Log.getLog(DBNResourceManagerProject.class);

    private final RMProject project;

    DBNResourceManagerProject(DBNResourceManagerRoot parentNode, RMProject project) {
        super(parentNode);
        this.project = project;
    }

    public RMProject getProject() {
        return project;
    }

    @Override
    public String getNodeType() {
        return "rm.project";
    }

    @Override
    public String getNodeName() {
        return project.getName();
    }

    @Override
    public String getNodeDescription() {
        return project.getDescription();
    }

    @Override
    public DBPImage getNodeIcon() {
        return DBIcon.PROJECT;
    }

    @Override
    protected boolean allowsChildren() {
        return true;
    }

    @Override
    public DBNResourceManagerResource[] getChildren(DBRProgressMonitor monitor) throws DBException {
        if (children == null) {
            List<DBNResourceManagerResource> rfList = new ArrayList<>();
            for (RMResource resource : getResourceController().listResources(
                project.getId(), null, null, false, false)) {

                rfList.add(new DBNResourceManagerResource(this, resource));
            }

            children = rfList.toArray(new DBNResourceManagerResource[0]);
        }
        return children;
    }

    public RMController getResourceController() {
        return ((DBNResourceManagerRoot) getParentNode()).getResourceController();
    }

    @Override
    public String getNodeItemPath() {
        return getParentNode().getNodeItemPath() + "/" + getNodeName();
    }

    @Override
    public DBNNode refreshNode(DBRProgressMonitor monitor, Object source) throws DBException {
        children = null;
        return this;
    }

    @Override
    public String toString() {
        return getNodeName();
    }

    @Nullable
    @Override
    public DBPObject getObjectDetails(@NotNull DBRProgressMonitor monitor, @NotNull SMSessionContext sessionContext, @NotNull Object dataSource) throws DBException {
        return project;
    }
}

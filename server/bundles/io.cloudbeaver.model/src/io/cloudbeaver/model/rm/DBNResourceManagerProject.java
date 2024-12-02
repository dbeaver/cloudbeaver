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

package io.cloudbeaver.model.rm;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBIcon;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.utils.CommonUtils;

import java.util.ArrayList;
import java.util.List;

public class DBNResourceManagerProject extends DBNAbstractResourceManagerNode {

    private final RMProject project;

    DBNResourceManagerProject(DBNResourceManagerRoot parentNode, RMProject project) {
        super(parentNode);
        this.project = project;
    }

    public RMProject getProject() {
        return project;
    }

    @NotNull
    @Override
    public String getName() {
        return project.getId();
    }

    @NotNull
    @Override
    public String getNodeId() {
        return project.getId();
    }

    @Override
    public String getNodeType() {
        return "rm.project";
    }

    @Override
    public String getNodeDisplayName() {
        return project.getDisplayName();
    }

    @Override
    public String getLocalizedName(String locale) {
        return getNodeDisplayName();
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
    public DBNResourceManagerResource[] getChildren(@NotNull DBRProgressMonitor monitor) throws DBException {
        if (children == null && !monitor.isForceCacheUsage()) {
            List<DBNResourceManagerResource> rfList = new ArrayList<>();
            for (RMResource resource : getResourceController().listResources(
                project.getId(), null, null, true, false, false)) {

                rfList.add(new DBNResourceManagerResource(this, resource));
            }

            children = rfList.toArray(new DBNResourceManagerResource[0]);
        }
        return children;
    }

    protected RMController getResourceController() {
        return ((DBNResourceManagerRoot) getParentNode()).getResourceController();
    }

    @Deprecated
    @Override
    public String getNodeItemPath() {
        return getParentNode().getNodeItemPath() + "/" + getName();
    }

    @Override
    public DBNNode refreshNode(DBRProgressMonitor monitor, Object source) throws DBException {
        children = null;
        return this;
    }

    @Nullable
    @Override
    public DBPProject getOwnerProjectOrNull() {
        List<? extends DBPProject> globalProjects = getModel().getModelProjects();
        if (globalProjects != null) {
            for (DBPProject modelProject : globalProjects) {
                if (CommonUtils.equalObjects(modelProject.getId(), project.getId())) {
                    return modelProject;
                }
            }
        }
        return null;
    }

    @Nullable
    @Override
    public DBPObject getObjectDetails(@NotNull DBRProgressMonitor monitor, @NotNull SMSessionContext sessionContext, @NotNull Object dataSource) throws DBException {
        return project;
    }

    @Override
    public String toString() {
        return getNodeDisplayName();
    }

}

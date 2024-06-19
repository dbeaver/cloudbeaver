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

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPHiddenObject;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNRoot;
import org.jkiss.dbeaver.model.rm.*;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;

public class DBNResourceManagerRoot extends DBNNode implements DBPHiddenObject, RMEventListener {

    private static final Log log = Log.getLog(DBNResourceManagerRoot.class);

    private DBNResourceManagerProject[] projects;
    private RMController resourceController;

    public DBNResourceManagerRoot(DBNRoot parentNode) {
        super(parentNode);
    }

    public RMController getResourceController() {
        return resourceController;
    }

    @Override
    public String getNodeType() {
        return "rm";
    }

    @NotNull
    @Override
    public String getNodeId() {
        return "rm";
    }

    @Override
    public String getNodeDisplayName() {
        return "resources";
    }

    @Override
    public String getNodeDescription() {
        return "Resources";
    }

    @Override
    public DBPImage getNodeIcon() {
        return null;
    }

    @Override
    protected boolean allowsChildren() {
        return true;
    }

    @Override
    public DBNResourceManagerProject[] getChildren(@NotNull DBRProgressMonitor monitor) throws DBException {
        if (projects == null && !monitor.isForceCacheUsage()) {
            List<? extends DBPProject> projectList = getParentNode().getModel().getModelProjects();
            if (CommonUtils.isEmpty(projectList)) {
                return new DBNResourceManagerProject[0];
            }
            SMSession session = null;
            for (DBPProject project : projectList) {
                session = getParentNode().getModel().getModelAuthContext().getSpaceSession(monitor, project.getWorkspace(), false);
                if (session instanceof WebSession) {
                    break;
                }
            }
            if (!(session instanceof WebSession)) {
                throw new DBException("Can't obtain credentials provider for resource manager");
            }
            List<DBNResourceManagerProject> projectNodes = new ArrayList<>();
            resourceController = ((WebSession) session).getRmController();
            RMEventManager.addEventListener(this);
            for (RMProject project : resourceController.listAccessibleProjects()) {
                projectNodes.add(new DBNResourceManagerProject(this, project));
            }

            projects = projectNodes.toArray(new DBNResourceManagerProject[0]);
        }
        return projects;
    }

    @Deprecated
    @Override
    public String getNodeItemPath() {
        // Path doesn't include project name
        return NodePathType.ext.getPrefix() + getNodeDisplayName();
    }

    @Override
    public DBNNode refreshNode(DBRProgressMonitor monitor, Object source) throws DBException {
        projects = null;
        return this;
    }

    @Override
    public boolean isHidden() {
        return true;
    }

    @Override
    public void handleRMEvent(RMEvent event) {
        var action = event.getAction();
        switch (action) {
            case RESOURCE_DELETE:
                deleteResourceNode(event.getProject(), event.getResourcePath());
                break;
            case RESOURCE_ADD:
                addResourceNode(event.getProject(), event.getResourcePath());
                break;
            case PROJECT_ADD:
                addProjectNode(event.getProject());
                break;
        }
    }

    @Override
    protected void dispose(boolean reflect) {
        RMEventManager.removeEventListener(this);
        super.dispose(reflect);
    }

    private void deleteResourceNode(RMProject project, String resourcePath) {
        if (resourcePath == null) {
            return;
        }
        var projectNode = getProjectNode(project);
        var rmResourcePath = Arrays.stream(resourcePath.split("/"))
            .filter(CommonUtils::isNotEmpty)
            .toList();
        projectNode.ifPresent(
            dbnResourceManagerProject -> dbnResourceManagerProject.removeChildResourceNode(new ArrayDeque<>(
                rmResourcePath))
        );
    }

    @NotNull
    private Optional<DBNResourceManagerProject> getProjectNode(RMProject project) {
        return Arrays.stream(projects)
            .filter(rmProjectNode -> rmProjectNode.getProject().getId().equals(project.getId()))
            .findFirst();
    }

    private void addResourceNode(RMProject project, String resourcePath) {
        if (resourcePath == null) {
            return;
        }
        var projectNode = getProjectNode(project);
        try {
            var rmResourcePath = Arrays.asList(getResourceController().getResourcePath(project.getId(), resourcePath));
            projectNode.ifPresent(dbnResourceManagerProject -> dbnResourceManagerProject.addChildResourceNode(new ArrayDeque<>(rmResourcePath)));
        } catch (DBException e) {
            log.error("Cannot add new node to resource manager tree", e);
        }
    }

    private void addProjectNode(RMProject project) {
        projects = ArrayUtils.add(DBNResourceManagerProject.class, projects, new DBNResourceManagerProject(this, project));
    }
}

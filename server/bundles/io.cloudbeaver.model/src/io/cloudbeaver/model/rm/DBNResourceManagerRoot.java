/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp
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

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPHiddenObject;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.SMSession;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.navigator.DBNRoot;
import org.jkiss.dbeaver.model.rm.*;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.websocket.event.WSEventType;
import org.jkiss.dbeaver.model.websocket.event.WSProjectEvent;
import org.jkiss.dbeaver.model.websocket.event.resource.RMEventListener;
import org.jkiss.dbeaver.model.websocket.event.resource.RMEventManager;
import org.jkiss.dbeaver.model.websocket.event.resource.WSResourceUpdatedEvent;
import org.jkiss.utils.ArrayUtils;

import java.util.*;

public class DBNResourceManagerRoot extends DBNNode implements DBPHiddenObject, RMEventListener {

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

    @Override
    public String getNodeName() {
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
    public DBNResourceManagerProject[] getChildren(DBRProgressMonitor monitor) throws DBException {
        if (projects == null) {
            List<? extends DBPProject> projectList = getParentNode().getModel().getModelProjects();
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

    @Override
    public String getNodeItemPath() {
        // Path doesn't include project name
        return NodePathType.ext.getPrefix() + getNodeName();
    }

    @Override
    public DBNNode refreshNode(DBRProgressMonitor monitor, Object source) throws DBException {
        projects = null;
        return this;
    }

    @Override
    public String toString() {
        return getNodeName();
    }

    @Override
    public boolean isHidden() {
        return true;
    }

    @Override
    public void handleRMEvent(WSProjectEvent event) {
        var action = WSEventType.valueById(event.getId());
        switch (action) {
            case RM_RESOURCE_DELETED:
                deleteResourceNode(event.getProjectId(), List.of(((WSResourceUpdatedEvent) event).getResourceParsedPath()));
                break;
            case RM_RESOURCE_CREATED:
                addResourceNode(event.getProjectId(), List.of(((WSResourceUpdatedEvent) event).getResourceParsedPath()));
                break;
            case RM_PROJECT_ADDED:
                addProjectNode(event.getProjectId());
                break;
            case RM_PROJECT_REMOVED:
                deleteProjectNode(event.getProjectId());
                break;
        }
    }

    private void deleteResourceNode(String projectId, List<RMResource> resourcePath) {
        var projectNode = getProjectNode(projectId);
        projectNode.ifPresent(dbnResourceManagerProject -> dbnResourceManagerProject.removeChildResourceNode(new ArrayDeque<>(resourcePath)));
    }

    @NotNull
    private Optional<DBNResourceManagerProject> getProjectNode(String projectId) {
        return Arrays.stream(projects)
            .filter(rmProjectNode -> rmProjectNode.getProject().getId().equals(projectId))
            .findFirst();
    }

    private void addResourceNode(String projectId, List<RMResource> resourcePath) {
        var projectNode = getProjectNode(projectId);
        projectNode.ifPresent(dbnResourceManagerProject -> dbnResourceManagerProject.addChildResourceNode(new ArrayDeque<>(resourcePath)));
    }

    private void addProjectNode(String projectId) {
        var rmProject = new RMProject(projectId.split("_")[1]);
        rmProject.setId(projectId);
        rmProject.setType(RMProjectType.SHARED);
        projects = ArrayUtils.add(DBNResourceManagerProject.class, projects, new DBNResourceManagerProject(this, rmProject));
    }

    private void deleteProjectNode(String projectId) {
        var projectNode = getProjectNode(projectId);
        projectNode.ifPresent(project -> ArrayUtils.remove(DBNResourceManagerProject.class, projects, project));
    }
}

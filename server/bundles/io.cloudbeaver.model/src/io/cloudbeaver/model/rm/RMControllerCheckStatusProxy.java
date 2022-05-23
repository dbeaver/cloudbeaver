package io.cloudbeaver.model.rm;

import io.cloudbeaver.model.app.WebApplication;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.rm.RMController;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMResource;

public class RMControllerCheckStatusProxy implements RMController {
    private final RMController rmController;
    private final WebApplication webApplication;

    public RMControllerCheckStatusProxy(RMController rmController, WebApplication webApplication) {
        this.rmController = rmController;
        this.webApplication = webApplication;
    }

    @NotNull
    @Override
    public RMProject[] listAccessibleProjects() throws DBException {
        checkIsRmEnabled();
        return rmController.listAccessibleProjects();
    }

    @NotNull
    @Override
    public RMProject[] listSharedProjects() throws DBException {
        checkIsRmEnabled();
        return rmController.listSharedProjects();
    }

    @Override
    public void createProject(@NotNull RMProject project) throws DBException {
        checkIsRmEnabled();
        rmController.createProject(project);
    }

    @Override
    public void deleteProject(@NotNull String projectId) throws DBException {
        checkIsRmEnabled();
        rmController.deleteProject(projectId);
    }

    @NotNull
    @Override
    public RMResource[] listResources(@NotNull String projectId, @Nullable String folder, @Nullable String nameMask, boolean readProperties, boolean readHistory) throws DBException {
        checkIsRmEnabled();
        return rmController.listResources(projectId, folder, nameMask, readProperties, readHistory);
    }

    @Override
    public String createResource(@NotNull String projectId, @NotNull String resourcePath, boolean isFolder) throws DBException {
        checkIsRmEnabled();
        return rmController.createResource(projectId, resourcePath, isFolder);
    }

    @Override
    public String moveResource(@NotNull String projectId, @NotNull String oldResourcePath, @NotNull String newResourcePath) throws DBException {
        checkIsRmEnabled();
        return rmController.moveResource(projectId, oldResourcePath, newResourcePath);
    }

    @Override
    public void deleteResource(@NotNull String projectId, @NotNull String resourcePath, boolean recursive) throws DBException {
        checkIsRmEnabled();
        rmController.deleteResource(projectId, resourcePath, recursive);
    }

    @NotNull
    @Override
    public byte[] getResourceContents(@NotNull String projectId, @NotNull String resourcePath) throws DBException {
        checkIsRmEnabled();
        return rmController.getResourceContents(projectId, resourcePath);
    }

    @NotNull
    @Override
    public String setResourceContents(@NotNull String projectId, @NotNull String resourcePath, @NotNull byte[] data) throws DBException {
        checkIsRmEnabled();
        return rmController.setResourceContents(projectId, resourcePath, data);
    }

    private void checkIsRmEnabled() throws DBException {
        if (!webApplication.getAppConfiguration().isResourceManagerEnabled()) {
            throw new DBException("Resource Manager disabled");
        }
    }
}

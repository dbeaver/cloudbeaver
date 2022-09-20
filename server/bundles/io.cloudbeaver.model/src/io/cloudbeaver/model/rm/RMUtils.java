package io.cloudbeaver.model.rm;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.app.BaseWebApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.runtime.DBWorkbench;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class RMUtils {

    public static Path getRootPath() {
        return DBWorkbench.getPlatform().getWorkspace().getAbsolutePath();
    }

    public static Path getUserProjectsPath() {
        return getRootPath().resolve(DBWConstants.USER_PROJECTS_FOLDER);
    }

    public static Path getSharedProjectsPath() {
        return getRootPath().resolve(DBWConstants.SHARED_PROJECTS_FOLDER);
    }

    @NotNull
    public static Path getProjectPath(RMProject project) {
        switch (project.getType()) {
            case GLOBAL:
                return getRootPath().resolve(BaseWebApplication.getInstance().getDefaultProjectName());
            case SHARED:
                return getSharedProjectsPath().resolve(project.getName());
            default:
                return getUserProjectsPath().resolve(project.getName());
        }
    }

    public static Set<String> parseProjectPermissions(Set<String> permissions) {
       return permissions.stream()
           .map(RMProjectPermission::fromPermission).filter(Objects::nonNull)
           .flatMap(permission -> permission.getAllPermissions().stream())
           .collect(Collectors.toSet());
    }

    public static RMProject createAnonymousProject() {
        RMProject project = new RMProject("anonymous");
        project.setId("anonymous");
        project.setType(RMProject.Type.USER);
        project.setProjectPermissions(RMProjectPermission.DATA_SOURCES_EDIT.getAllPermissions());
        return project;
    }
}

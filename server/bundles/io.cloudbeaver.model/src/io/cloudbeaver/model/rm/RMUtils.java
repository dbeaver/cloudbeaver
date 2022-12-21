package io.cloudbeaver.model.rm;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.app.BaseWebApplication;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.CommonUtils;

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

    /**
     * Different types of project have different location on the workspace. Method returns path to the project.
     *
     * @param projectId project name or other identifier
     * @return path to the project based on the name of projects and prefixes that it contains
     */
    @NotNull
    public static Path getProjectPathByName(@NotNull String projectId) throws DBException {
        int divPos = projectId.indexOf("_");
        if (divPos <= 0) {
            throw new DBException("Bad project ID");
        }

        String prefix = projectId.substring(0, divPos);
        String projectName = projectId.substring(divPos + 1);
        switch (RMProjectType.getByPrefix(prefix)) {
            case GLOBAL:
                String defaultProjectName = BaseWebApplication.getInstance().getDefaultProjectName();
                if (CommonUtils.isEmpty(defaultProjectName)) {
                    throw new DBException("Global projects are not supported");
                }
                return getRootPath().resolve(defaultProjectName);
            case SHARED:
                return getSharedProjectsPath().resolve(projectName);
            default:
                return getUserProjectsPath().resolve(projectName);
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
        project.setType(RMProjectType.USER);
        project.setProjectPermissions(RMProjectPermission.DATA_SOURCES_EDIT.getAllPermissions().toArray(new String[0]));
        return project;
    }
}

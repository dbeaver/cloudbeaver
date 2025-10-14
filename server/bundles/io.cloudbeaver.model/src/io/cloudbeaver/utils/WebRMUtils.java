package io.cloudbeaver.utils;

import io.cloudbeaver.model.rm.local.RMProjectName;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectType;
import org.jkiss.utils.CommonUtils;

public class WebRMUtils {

    public static RMProject createRmProjectFromWebProject(@NotNull DBPProject project) {
        RMProject rmProject = new RMProject();
        rmProject.setId(project.getId());
        rmProject.setName(project.getName());
        rmProject.setDescription(project.getDescription());
        rmProject.setType(parseProjectNameUnsafe(rmProject.getId()).getType());
        return rmProject;
    }

    public static RMProjectName parseProjectName(@NotNull String projectId) throws DBException {
        if (CommonUtils.isEmpty(projectId)) {
            throw new DBException("Project id is empty");
        }
        return parseProjectNameUnsafe(projectId);
    }

    public static RMProjectName parseProjectNameUnsafe(String projectId) {
        String prefix;
        String name;
        int divPos = projectId.indexOf("_");
        if (divPos < 0) {
            prefix = RMProjectType.USER.getPrefix();
            name = projectId;
        } else {
            prefix = projectId.substring(0, divPos);
            name = projectId.substring(divPos + 1);
        }
        return new RMProjectName(prefix, name);
    }
}

package io.cloudbeaver.service.rm.model;

import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.*;

public class RMProjectPermissions {
    private final Map<String, Set<String>> projectPermissions = new HashMap<>();

    public RMProjectPermissions(List<Map<String, Object>> params) {
        for (Map<String, Object> userPerms : params) {
            String subjectId = JSONUtils.getString(userPerms, "projectId");
            Set<String> permissions = new HashSet<>(JSONUtils.getStringList(userPerms, "permissions"));
            this.projectPermissions.put(subjectId, permissions);
        }
    }

    public Map<String, Set<String>> getProjectPermissions() {
        return projectPermissions;
    }
}

package io.cloudbeaver.service.rm.model;

import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.*;

public class RMSubjectProjectPermissions {
    private final Map<String, Set<String>> subjectPermissions = new HashMap<>();

    public RMSubjectProjectPermissions(List<Map<String, Object>> params) {
        for (Map<String, Object> userPerms : params) {
            String subjectId = JSONUtils.getString(userPerms, "subjectId");
            Set<String> permissions = new HashSet<>(JSONUtils.getStringList(userPerms, "permissions"));
            this.subjectPermissions.put(subjectId, permissions);
        }
    }

    public Map<String, Set<String>> getSubjectPermissions() {
        return subjectPermissions;
    }
}

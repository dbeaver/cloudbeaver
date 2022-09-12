package io.cloudbeaver.service.rm.model;

import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.*;

public class RMSubjectProjectPermissions {
    private final Map<String, Set<String>> subjectPermissions = new HashMap<>();

    public RMSubjectProjectPermissions(Map<String, Object> params) {
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String subjectId = entry.getKey();
            Map<String, Object> subjectParams = JSONUtils.getObject(params, subjectId);
            Set<String> permissions = new HashSet<>(JSONUtils.getStringList(subjectParams, "permissions"));
            this.subjectPermissions.put(subjectId, permissions);
        }
    }

    public Map<String, Set<String>> getSubjectPermissions() {
        return subjectPermissions;
    }
}

package io.cloudbeaver.service.security.external.remote.model.subjects;

import java.util.List;

public class DCDataSourceSubjectAccessUpdateRequest {
    private final List<String> subjectIds;

    public DCDataSourceSubjectAccessUpdateRequest(List<String> subjectIds) {
        this.subjectIds = subjectIds;
    }

    public List<String> getSubjectIds() {
        return subjectIds;
    }
}

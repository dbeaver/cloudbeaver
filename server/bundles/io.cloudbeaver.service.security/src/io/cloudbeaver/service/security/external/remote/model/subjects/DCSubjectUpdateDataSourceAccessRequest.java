package io.cloudbeaver.service.security.external.remote.model.subjects;

import org.jkiss.code.NotNull;

import java.util.List;

public class DCSubjectUpdateDataSourceAccessRequest {
    @NotNull
    private final List<String> dataSourceIds;

    public DCSubjectUpdateDataSourceAccessRequest(@NotNull List<String> dataSourceIds) {
        this.dataSourceIds = dataSourceIds;
    }

    @NotNull
    public List<String> getDataSourceIds() {
        return dataSourceIds;
    }
}

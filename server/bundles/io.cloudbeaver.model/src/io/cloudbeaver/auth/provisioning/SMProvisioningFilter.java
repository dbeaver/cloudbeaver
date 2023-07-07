package io.cloudbeaver.auth.provisioning;

import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.json.JSONUtils;

import java.util.Map;

public class SMProvisioningFilter {
    @Nullable
    private final Integer offset;
    @Nullable
    private final Integer limit;

    public SMProvisioningFilter(Map<String, Object> params) {
        if (params == null) {
            this.offset = null;
            this.limit = null;
        } else {
            this.offset = JSONUtils.getInteger(params, "offset");
            this.limit = JSONUtils.getInteger(params, "limit");
        }
    }

    @Nullable
    public Integer getOffset() {
        return offset;
    }

    @Nullable
    public Integer getLimit() {
        return limit;
    }
}

package io.cloudbeaver.auth.provisioning;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.security.user.SMUserInfo;

import java.util.List;
import java.util.Map;

public interface SMProvisioner {
    @NotNull
    List<SMUserInfo> listExternalUsers(
        @NotNull WebSession webSession,
        @NotNull Map<String, String> filter,
        @Nullable Integer page,
        @Nullable Integer pageSize
    );
}

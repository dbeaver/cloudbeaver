package io.cloudbeaver.auth.provisioning;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.security.user.SMUserProvisioning;

import java.util.List;

public interface SMProvisioner {
    @NotNull
    List<SMUserProvisioning> listExternalUsers(
        @NotNull WebSession webSession,
        @NotNull SMProvisioningFilter filter
    );
}

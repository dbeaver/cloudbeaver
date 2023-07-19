package io.cloudbeaver.auth.provisioning;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.user.SMUserProvisioning;

import java.util.List;

public interface SMProvisioner {
    @NotNull
    List<SMUserProvisioning> listExternalUsers(
        @NotNull WebSession webSession,
        @NotNull SMAuthProviderCustomConfiguration customConfiguration,
        @NotNull SMProvisioningFilter filter
    ) throws DBWebException;
}

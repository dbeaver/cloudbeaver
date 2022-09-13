package io.cloudbeaver.service.security;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebPermissionDescriptor;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.rm.RMConstants;
import org.jkiss.dbeaver.model.security.SMConstants;

import java.util.ArrayList;
import java.util.List;

public class SMUtils {
    public static boolean isAdmin(SMCredentialsProvider webSession) {
        return webSession.hasPermission(DBWConstants.PERMISSION_ADMIN);
    }

    public static boolean isRMAdmin(SMCredentialsProvider webSession) {
        return isAdmin(webSession) || webSession.hasPermission(RMConstants.PERMISSION_RM_ADMIN);
    }

    public static List<AdminPermissionInfo> findPermissions(@NotNull String permissionsScope) {
        List<AdminPermissionInfo> permissionInfos = new ArrayList<>();
        for (WebServiceDescriptor wsd : WebServiceRegistry.getInstance().getWebServices()) {
            for (WebPermissionDescriptor pd : wsd.getPermissions()) {
                if (permissionsScope.equals(pd.getScope())) {
                    permissionInfos.add(new AdminPermissionInfo(pd));
                }
            }
        }
        return permissionInfos;
    }
}

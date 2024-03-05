/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.service.security;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.registry.WebPermissionDescriptor;
import io.cloudbeaver.registry.WebServiceDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.service.admin.AdminPermissionInfo;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.rm.RMConstants;
import org.jkiss.dbeaver.model.rm.RMProject;
import org.jkiss.dbeaver.model.rm.RMProjectPermission;
import org.jkiss.dbeaver.model.security.exception.SMAccessTokenExpiredException;
import org.jkiss.dbeaver.model.security.exception.SMRefreshTokenExpiredException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

public class SMUtils {
    public static boolean isAdmin(SMCredentialsProvider webSession) {
        return webSession.hasPermission(DBWConstants.PERMISSION_ADMIN);
    }

    public static boolean isAdmin(@NotNull Set<String> permissions) {
        return permissions.contains(DBWConstants.PERMISSION_ADMIN);
    }

    public static boolean isRMAdmin(SMCredentialsProvider webSession) {
        return isAdmin(webSession) || webSession.hasPermission(RMConstants.PERMISSION_RM_ADMIN);
    }

    public static boolean isRMAdmin(@NotNull Set<String> permissions) {
        return isAdmin(permissions) || permissions.contains(RMConstants.PERMISSION_RM_ADMIN);
    }

    public static boolean hasProjectPermission(
        SMCredentialsProvider credentialsProvider,
        RMProject project,
        RMProjectPermission projectPermission
    ) {
        return isRMAdmin(credentialsProvider) || project.hasProjectPermission(projectPermission.getPermissionId());
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
        permissionInfos.sort(Comparator.comparing(AdminPermissionInfo::getLabel));
        return permissionInfos;
    }

    public static boolean isRefreshTokenExpiredExceptionWasHandled(Throwable ex) {
        if (ex instanceof SMRefreshTokenExpiredException) {
            return true;
        }

        Throwable cause = ex;
        while ((cause = cause.getCause()) != null) {
            if (cause instanceof SMRefreshTokenExpiredException) {
                return true;
            }
        }
        return false;
    }

    public static boolean isAccessTokenExpiredExceptionWasHandled(Throwable ex) {
        if (ex instanceof SMAccessTokenExpiredException) {
            return true;
        }

        Throwable cause = ex;
        while ((cause = cause.getCause()) != null) {
            if (cause instanceof SMAccessTokenExpiredException) {
                return true;
            }
        }
        return false;
    }
}

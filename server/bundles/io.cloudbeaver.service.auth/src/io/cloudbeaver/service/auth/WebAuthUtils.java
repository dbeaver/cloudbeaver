/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.auth;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.server.CBApplication;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.security.SMController;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

public final class WebAuthUtils {
    private WebAuthUtils() {
    }

    @NotNull
    public static SMAuthInfo initiateAuthentication(
        @NotNull WebSession webSession,
        @NotNull String providerId,
        @Nullable String providerConfigurationId,
        @Nullable Map<String, Object> authParameters,
        boolean forceSessionsLogout
    ) throws DBException {
        if (CommonUtils.isEmpty(providerId)) {
            throw new DBWebException("Missing auth provider parameter");
        }
        WebAuthProviderDescriptor authProviderDescriptor = WebAuthProviderRegistry.getInstance()
            .getAuthProvider(providerId);
        if (authProviderDescriptor.isTrusted()) {
            throw new DBWebException(authProviderDescriptor.getLabel() + " not allowed for authorization via GQL API");
        }

        SMController securityController = webSession.getSecurityController();
        String currentSmSessionId = (webSession.getUser() == null || CBApplication.getInstance().isConfigurationMode())
            ? null
            : webSession.getUserContext().getSmSessionId();
        return securityController.authenticate(
            webSession.getSessionId(),
            currentSmSessionId,
            webSession.getSessionParameters(),
            WebSession.CB_SESSION_TYPE,
            providerId,
            providerConfigurationId,
            authParameters,
            forceSessionsLogout
        );
    }
}

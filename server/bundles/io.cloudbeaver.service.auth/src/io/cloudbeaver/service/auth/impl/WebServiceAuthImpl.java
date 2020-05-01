/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver.service.auth.impl;

import io.cloudbeaver.DBWServerController;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebServiceRegistry;
import io.cloudbeaver.server.CBPlatform;
import io.cloudbeaver.service.auth.DBWServiceAuth;
import io.cloudbeaver.service.auth.WebAuthInfo;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Map;

/**
 * Web service implementation
 */
public class WebServiceAuthImpl implements DBWServiceAuth {

    @Override
    public WebAuthInfo authLogin(WebSession webSession, String providerId, Map<String, Object> authParameters) throws DBWebException {
        if (CommonUtils.isEmpty(providerId)) {
            throw new DBWebException("Missing auth provider parameter");
        }
        WebAuthProviderDescriptor authProvider = WebServiceRegistry.getInstance().getAuthProvider(providerId);
        if (authProvider == null) {
            throw new DBWebException("Invalid auth provider '" + providerId + "'");
        }
        DBWServerController serverController = CBPlatform.getInstance().getApplication().getServerController();
        try {
            String userId = serverController.findUserByCredentials(authProvider, authParameters);
            if (userId == null) {
                // User doesn't exist. We can create new user automatically if auth provider supports this
                throw new DBWebException("Invalid user credentials");
            }
            Map<String, Object> userCredentials = serverController.getUserCredentials(userId, authProvider);
            Object authToken = authProvider.getInstance().openSession(
                Collections.emptyMap(),
                userCredentials,
                authParameters);
            WebAuthInfo authInfo = new WebAuthInfo();
            authInfo.setUserId(userId);
            authInfo.setLoginTime(OffsetDateTime.now());
            authInfo.setAuthProvider(authProvider.getId());
            authInfo.setAuthToken(authToken);
            authInfo.setMessage("Logged using " + authProvider.getLabel() + " provider");

            return authInfo;
        } catch (DBException e) {
            throw new DBWebException("User authentication failed", e);
        }
    }

    @Override
    public void authLogout(WebSession webSession) throws DBWebException {

    }
}

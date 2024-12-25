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
package io.cloudbeaver.auth;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;

import java.util.Map;

/**
 * Federated auth provider.
 * Provides links to external auth resource
 */
public interface SMAuthProviderFederated extends SMSignOutLinkProvider {

    @NotNull
    String getSignInLink(String id) throws DBException;

    @Override
    default String getUserSignOutLink(
        @NotNull SMAuthProviderCustomConfiguration providerConfig,
        @NotNull Map<String, Object> userCredentials
    ) throws DBException {
        return getCommonSignOutLink(providerConfig.getId(), providerConfig.getParameters());
    }

    @Nullable
    String getMetadataLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException;

    @Nullable
    String getAcsLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException;

    @Nullable
    String getEntityIdLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException;

    @Nullable
    default String getRedirectLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException {
        return null;
    }

}

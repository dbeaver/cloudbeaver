/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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

import java.util.Map;

/**
 * Federated auth provider.
 * Provides links to external auth resource
 */
public interface SMWAuthProviderFederated {

    /**
     * Returns new identifying credentials which can be used to find/create user in database
     */
    @NotNull
    String getSignInLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException;


    @NotNull
    String getSignOutLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException;

    @Nullable
    String getMetadataLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException;

    @Nullable
    default String getRedirectLink(String id, @NotNull Map<String, Object> providerConfig) throws DBException {
        return null;
    }

}

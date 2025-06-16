/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;

import java.util.Map;

public interface SMSignOutLinkProvider {

    /**
     * @return a common link for logout, not related with the user context
     */
    @NotNull
    String getCommonSignOutLink(
        @NotNull String providerId,
        @NotNull Map<String, Object> providerConfig,
        @NotNull String origin
    ) throws DBException;

    String getUserSignOutLink(
        @NotNull SMAuthProviderCustomConfiguration providerConfig,
        @NotNull Map<String, Object> userCredentials,
        @NotNull String origin
    ) throws DBException;
}

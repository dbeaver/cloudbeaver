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
package io.cloudbeaver;

import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.utils.CommonUtils;

import java.util.Map;

/**
 * Auth provider
 */
public interface DBWAuthProviderExternal<AUTH_SESSION> extends DBWAuthProvider<AUTH_SESSION> {

    /**
     * Returns new identifying credentials which can be used to find/create user in database
     */
    @NotNull
    Map<String, Object> readExternalCredentials(
        Map<String, Object> providerConfig, // Auth provider configuration (e.g. 3rd party auth server address)
        Map<String, Object> authParameters // Passed auth parameters (e.g. user name or password)
    ) throws DBException;

    @NotNull
    WebUser registerNewUser(DBWSecurityController securityController, Map<String, Object> providerConfig, Map<String, Object> credentials) throws DBException;

    @Nullable
    String getUserDisplayName(Map<String, Object> providerConfig, Map<String, Object> credentials);

}

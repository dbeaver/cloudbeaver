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
package io.cloudbeaver.auth.provider.local;

import io.cloudbeaver.DBWAuthProvider;
import io.cloudbeaver.server.CBDatabase;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.utils.SecurityUtils;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

/**
 * Auth provider
 */
public class LocalAuthProvider implements DBWAuthProvider<LocalAuthToken> {

    public static final String PROVIDER_ID = "local";
    public static final String CRED_PASSWORD = "password";

    @Override
    public LocalAuthToken openSession(String userName, Map<String, Object> providerConfig, Map<String, Object> userCredentials, Map<String, Object> authParameters) throws DBException {
        try (Connection dbCon = CBDatabase.getInstance().openConnection()) {

        } catch (SQLException e) {
            throw new DBCException("Error authenticating user", e);
        }
        return new LocalAuthToken(userName);
    }

    @Override
    public void closeSession(LocalAuthToken localAuthToken) throws DBException {

    }

    @Override
    public void refreshSession(LocalAuthToken localAuthToken) throws DBException {

    }

    public static String makeClientPasswordHash(String userName, String password) {
        return SecurityUtils.makeDigest(userName, password);
    }

    public static String makeServerPasswordHash(String userName, String password) {
        return SecurityUtils.makeDigest(userName, password);
    }

}

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

import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.exec.DBCException;

import java.util.Map;
import java.util.Set;

/**
 * Admin interface
 */
public interface DBWSecurityController {

    ///////////////////////////////////////////
    // Users

    void createUser(WebUser user) throws DBCException;

    void deleteUser(String userId) throws DBCException;

    void setUserRoles(String userId, String[] roleIds, String grantorId) throws DBCException;

    @NotNull
    WebRole[] getUserRoles(String userId) throws DBCException;

    WebUser getUserById(String userId) throws DBCException;

    @NotNull
    WebUser[] findUsers(String userNameMask) throws DBCException;

    ///////////////////////////////////////////
    // Credentials

    /**
     * Sets user redentials for specified provider
     */
    void setUserCredentials(String userId, WebAuthProviderDescriptor authProvider, Map<String, Object> credentials) throws DBCException;

    /**
     * Find user with matching credentials.
     * It doesn't check credentials like passwords, just searches user id by identifying credentials.
     */
    @Nullable
    String getUserByCredentials(WebAuthProviderDescriptor authProvider, Map<String, Object> authParameters) throws DBCException;

    /**
     * Get user credentials for specified provider
     */
    Map<String, Object> getUserCredentials(String userId, WebAuthProviderDescriptor authProvider) throws DBCException;

    ///////////////////////////////////////////
    // Roles

    @NotNull
    WebRole[] readAllRoles() throws DBCException;

    WebRole[] findRoles(String roleName) throws DBCException;

    void createRole(WebRole role) throws DBCException;

    void deleteRole(String roleId) throws DBCException;

    ///////////////////////////////////////////
    // Permissions

    void setSubjectPermissions(String subjectId, String[] permissionIds, String grantorId) throws DBCException;

    @NotNull
    Set<String> getSubjectPermissions(String subjectId) throws DBCException;

    @NotNull
    Set<String> getUserPermissions(String userId) throws DBCException;

    ///////////////////////////////////////////
    // Sessions

    boolean isSessionPersisted(String id) throws DBCException;

    void createSession(WebSession session) throws DBCException;

    void updateSession(WebSession session) throws DBCException;

    ///////////////////////////////////////////
    // Permissions

    @NotNull
    DBWConnectionGrant[] getSubjectConnectionAccess(@NotNull String[] subjectId) throws DBCException;
    void setSubjectConnectionAccess(@NotNull String subjectId, @NotNull String[] connectionIds, String grantor) throws DBCException;

    @NotNull
    DBWConnectionGrant[] getConnectionSubjectAccess(String connectionId) throws DBCException;
    void setConnectionSubjectAccess(@NotNull String connectionId, @Nullable String[] subjects, @Nullable String grantorId) throws DBCException;

    ///////////////////////////////////////////
    // Utils

    static DBWSecurityController getInstance() {
        return CBPlatform.getInstance().getApplication().getSecurityController();
    }

}

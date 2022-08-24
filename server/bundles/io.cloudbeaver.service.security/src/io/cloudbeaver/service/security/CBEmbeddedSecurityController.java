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
package io.cloudbeaver.service.security;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.auth.SMWAuthProviderFederated;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.model.app.WebAuthConfiguration;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.service.security.db.CBDatabase;
import io.cloudbeaver.service.security.internal.AuthAttemptSessionInfo;
import io.cloudbeaver.service.security.internal.RefreshTokenInfo;
import io.cloudbeaver.utils.WebAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.impl.jdbc.exec.JDBCTransaction;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.*;
import org.jkiss.dbeaver.model.security.exception.SMAccessTokenExpiredException;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.dbeaver.model.security.exception.SMRefreshTokenExpiredException;
import org.jkiss.dbeaver.model.security.user.SMAuthPermissions;
import org.jkiss.dbeaver.model.security.user.SMObjectPermissions;
import org.jkiss.dbeaver.model.security.user.SMRole;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.SecurityUtils;

import java.lang.reflect.Type;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Server controller
 */
public class CBEmbeddedSecurityController implements SMAdminController, SMAuthenticationManager {

    private static final Log log = Log.getLog(CBEmbeddedSecurityController.class);

    private static final int TOKEN_MINUTES_ALIVE_TIME = 20;
    private static final int REFRESH_TOKEN_HOURS_ALIVE_TIME = 24;

    protected static final String CHAR_BOOL_TRUE = "Y";
    protected static final String CHAR_BOOL_FALSE = "N";

    private static final String SUBJECT_USER = "U";
    private static final String SUBJECT_ROLE = "R";
    private static final Type MAP_STRING_OBJECT_TYPE = new TypeToken<Map<String, Object>>() {
    }.getType();
    private static final Gson gson = new GsonBuilder().create();

    protected final WebApplication application;
    protected final CBDatabase database;
    protected final SMCredentialsProvider credentialsProvider;

    public CBEmbeddedSecurityController(WebApplication application, CBDatabase database, SMCredentialsProvider credentialsProvider) {
        this.application = application;
        this.database = database;
        this.credentialsProvider = credentialsProvider;
    }

    private boolean isSubjectExists(String subjectId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT 1 FROM CB_AUTH_SUBJECT WHERE SUBJECT_ID=?")) {
                dbStat.setString(1, subjectId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    return dbResult.next();
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error while searching credentials", e);
        }
    }

    ///////////////////////////////////////////
    // Users

    @Override
    public void createUser(String userId, Map<String, String> metaParameters) throws DBException {
        if (isSubjectExists(userId)) {
            throw new DBCException("User or role '" + userId + "' already exists");
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                createAuthSubject(dbCon, userId, SUBJECT_USER);
                try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER(USER_ID,IS_ACTIVE,CREATE_TIME) VALUES(?,?,?)")) {
                    dbStat.setString(1, userId);
                    dbStat.setString(2, CHAR_BOOL_TRUE);
                    dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                    dbStat.execute();
                }
                if (!CommonUtils.isEmpty(metaParameters)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_META(USER_ID,META_ID,META_VALUE) VALUES(?,?,?)")) {
                        dbStat.setString(1, userId);
                        for (Map.Entry<String, String> mp : metaParameters.entrySet()) {
                            dbStat.setString(2, mp.getKey());
                            dbStat.setString(3, mp.getValue());
                            dbStat.execute();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user in database", e);
        }
    }

    @Override
    public void deleteUser(String userId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                deleteAuthSubject(dbCon, userId);
                JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_USER WHERE USER_ID=?", userId);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error deleting user from database", e);
        }
    }

    @Override
    public void setUserRoles(String userId, String[] roleIds, String grantorId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_USER_ROLE WHERE USER_ID=?", userId);
                if (!ArrayUtils.isEmpty(roleIds)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_ROLE(USER_ID,ROLE_ID,GRANT_TIME,GRANTED_BY) VALUES(?,?,?,?)")) {
                        for (String roleId : roleIds) {
                            dbStat.setString(1, userId);
                            dbStat.setString(2, roleId);
                            dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                            dbStat.setString(4, grantorId);
                            dbStat.execute();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user roles in database", e);
        }
    }

    @NotNull
    @Override
    public SMRole[] getUserRoles(String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT R.* FROM CB_USER_ROLE UR,CB_ROLE R " +
                    "WHERE UR.USER_ID=? AND UR.ROLE_ID=R.ROLE_ID")) {
                dbStat.setString(1, userId);
                List<SMRole> roles = new ArrayList<>();
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        roles.add(fetchRole(dbResult));
                    }
                }
                return roles.toArray(new SMRole[0]);
            }
        } catch (SQLException e) {
            throw new DBCException("Error while reading user roles", e);
        }
    }

    @Override
    public SMUser getUserById(String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            SMUser user;
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT * FROM CB_USER WHERE USER_ID=?")) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        String userName = dbResult.getString(1);
                        String active = dbResult.getString(2);
                        user = new SMUser(userName, CHAR_BOOL_TRUE.equals(active));
                    } else {
                        return null;
                    }
                }
            }
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT META_ID,META_VALUE FROM CB_USER_META WHERE USER_ID=?")) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        user.setMetaParameter(
                            dbResult.getString(1),
                            dbResult.getString(2)
                        );
                    }
                }
            }
            return user;
        } catch (SQLException e) {
            throw new DBCException("Error while searching credentials", e);
        }
    }

    @NotNull
    @Override
    public SMUser[] findUsers(String userNameMask) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Map<String, SMUser> result = new LinkedHashMap<>();
            // Read users
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT * FROM CB_USER" +
                (CommonUtils.isEmpty(userNameMask) ? "\nORDER BY USER_ID" : " WHERE USER_ID=?"))) {
                if (!CommonUtils.isEmpty(userNameMask)) {
                    dbStat.setString(1, userNameMask);
                }
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String userId = dbResult.getString(1);
                        String active = dbResult.getString(2);
                        result.put(userId, new SMUser(userId, CHAR_BOOL_TRUE.equals(active)));
                    }
                }
            }
            // Read metas
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT USER_ID,META_ID,META_VALUE FROM CB_USER_META" +
                (CommonUtils.isEmpty(userNameMask) ? "" : " WHERE USER_ID=?"))) {
                if (!CommonUtils.isEmpty(userNameMask)) {
                    dbStat.setString(1, userNameMask);
                }
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String userId = dbResult.getString(1);
                        SMUser user = result.get(userId);
                        if (user != null) {
                            user.setMetaParameter(
                                dbResult.getString(2),
                                dbResult.getString(3)
                            );
                        }
                    }
                }
            }
            return result.values().toArray(new SMUser[0]);
        } catch (SQLException e) {
            throw new DBCException("Error while loading users", e);
        }
    }

    @Override
    public void setUserMeta(String userId, Map<String, Object> metaParameters) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                // Delete old metas
                try (PreparedStatement dbStat = dbCon.prepareStatement("DELETE FROM CB_USER_META WHERE USER_ID=?")) {
                    dbStat.setString(1, userId);
                    dbStat.execute();
                }
                if (!metaParameters.isEmpty()) {
                    // Insert new metas
                    try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_META(USER_ID,META_ID,META_VALUE) VALUES(?,?,?)")) {
                        dbStat.setString(1, userId);
                        for (Map.Entry<String, Object> mpe : metaParameters.entrySet()) {
                            dbStat.setString(2, mpe.getKey());
                            dbStat.setString(3, CommonUtils.toString(mpe.getValue()));
                            dbStat.execute();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error while loading users", e);
        }
    }

    @Override
    public Map<String, Object> getUserParameters(String userId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Map<String, Object> result = new LinkedHashMap<>();
            // Read users
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT * FROM CB_USER_PARAMETERS  WHERE USER_ID=?")) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        result.put(
                            dbResult.getString(2),
                            dbResult.getString(3));
                    }
                }
            }
            return result;
        } catch (SQLException e) {
            throw new DBCException("Error while loading users", e);
        }
    }

    @Override
    public void setUserParameter(String userId, String name, Object value) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                if (value == null) {
                    // Delete old metas
                    try (PreparedStatement dbStat = dbCon.prepareStatement("DELETE FROM CB_USER_PARAMETERS WHERE USER_ID=? AND PARAM_ID=?")) {
                        dbStat.setString(1, userId);
                        dbStat.setString(2, name);
                        dbStat.execute();
                    }
                } else {
                    // Update/Insert parameter
                    boolean updated;
                    try (PreparedStatement dbStat = dbCon.prepareStatement("UPDATE CB_USER_PARAMETERS SET PARAM_VALUE=? WHERE USER_ID=? AND PARAM_ID=?")) {
                        dbStat.setString(1, CommonUtils.toString(value));
                        dbStat.setString(2, userId);
                        dbStat.setString(3, name);
                        updated = dbStat.executeUpdate() > 0;
                    }
                    if (!updated) {
                        try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_PARAMETERS (USER_ID,PARAM_ID,PARAM_VALUE) VALUES(?,?,?)")) {
                            dbStat.setString(1, userId);
                            dbStat.setString(2, name);
                            dbStat.setString(3, CommonUtils.toString(value));
                            dbStat.executeUpdate();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error while updating user configuration", e);
        }
    }

    public void enableUser(String userId, boolean enabled) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement("UPDATE CB_USER SET IS_ACTIVE=? WHERE USER_ID=?")) {
                dbStat.setString(1, enabled ? CHAR_BOOL_TRUE : CHAR_BOOL_FALSE);
                dbStat.setString(2, userId);
                dbStat.executeUpdate();
            }
        } catch (SQLException e) {
            throw new DBCException("Error while updating user configuration", e);
        }
    }

    ///////////////////////////////////////////
    // Credentials

    private static SMAuthCredentialsProfile getCredentialProfileByParameters(AuthProviderDescriptor authProvider, Set<String> keySet) {
        List<SMAuthCredentialsProfile> credentialProfiles = authProvider.getCredentialProfiles();
        if (credentialProfiles.size() > 1) {
            for (SMAuthCredentialsProfile profile : credentialProfiles) {
                if (profile.getCredentialParameters().size() == keySet.size()) {
                    boolean matches = true;
                    for (String paramName : keySet) {
                        if (profile.getCredentialParameter(paramName) == null) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        return profile;
                    }
                }
            }
        }
        return credentialProfiles.get(0);
    }

    @Override
    public void setUserCredentials(@NotNull String userId, @NotNull String authProviderId, @NotNull Map<String, Object> credentials) throws DBException {
        var existUserByCredentials = findUserByCredentials(authProviderId, credentials);
        if (existUserByCredentials != null && !existUserByCredentials.equals(userId)) {
            throw new DBException("Another user is already linked to the specified credentials");
        }
        List<String[]> transformedCredentials;
        AuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        try {
            SMAuthCredentialsProfile credProfile = getCredentialProfileByParameters(authProvider, credentials.keySet());
            transformedCredentials = credentials.entrySet().stream().map(cred -> {
                String propertyName = cred.getKey();
                AuthPropertyDescriptor property = credProfile.getCredentialParameter(propertyName);
                if (property == null) {
                    return null;
                }
                String encodedValue = CommonUtils.toString(cred.getValue());
                encodedValue = property.getEncryption().encrypt(userId, encodedValue);
                return new String[]{propertyName, encodedValue};
            }).collect(Collectors.toList());
        } catch (Exception e) {
            throw new DBCException(e.getMessage(), e);
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_USER_CREDENTIALS WHERE USER_ID=? AND PROVIDER_ID=?", userId, authProvider.getId());
                if (!CommonUtils.isEmpty(credentials)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_CREDENTIALS(USER_ID,PROVIDER_ID,CRED_ID,CRED_VALUE) VALUES(?,?,?,?)")) {
                        for (String[] cred : transformedCredentials) {
                            if (cred == null) {
                                continue;
                            }
                            dbStat.setString(1, userId);
                            dbStat.setString(2, authProvider.getId());
                            dbStat.setString(3, cred[0]);
                            dbStat.setString(4, cred[1]);
                            dbStat.execute();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user credentials in database", e);
        }
    }

    @Nullable
    private String findUserByCredentials(String authProviderId, Map<String, Object> authParameters) throws DBCException {
        AuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        Map<String, Object> identCredentials = new LinkedHashMap<>();
        for (AuthPropertyDescriptor prop : authProvider.getCredentialParameters(authParameters.keySet())) {
            if (prop.isIdentifying()) {
                String propId = CommonUtils.toString(prop.getId());
                Object paramValue = authParameters.get(propId);
                if (paramValue == null) {
                    throw new DBCException("Authentication parameter '" + prop.getId() + "' is missing");
                }
                if (prop.getEncryption() == AuthPropertyEncryption.hash) {
                    throw new DBCException("Hash encryption can't be used in identifying credentials");
                }
                identCredentials.put(propId, paramValue);
            }
        }
        if (identCredentials.isEmpty()) {
            return null;
        }
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT U.USER_ID,U.IS_ACTIVE FROM CB_USER U,CB_USER_CREDENTIALS UC\n");
        for (int joinNum = 0; joinNum < identCredentials.size() - 1; joinNum++) {
            sql.append(",CB_USER_CREDENTIALS UC").append(joinNum + 2);
        }
        sql.append("WHERE U.USER_ID=UC.USER_ID AND UC.PROVIDER_ID=? AND UC.CRED_ID=? AND UC.CRED_VALUE=?");
        for (int joinNum = 0; joinNum < identCredentials.size() - 1; joinNum++) {
            String joinAlias = "UC" + (joinNum + 2);
            sql.append(" AND ")
                .append(joinAlias).append(".USER_ID=UC.USER_ID")
                .append(joinAlias).append(".PROVIDER_ID=UC.PROVIDER_ID AND ")
                .append(joinAlias).append("CRED_ID=? AND ")
                .append(joinAlias).append("CRED_VALUE=?");
        }
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(sql.toString())) {
                dbStat.setString(1, authProvider.getId());
                int param = 2;
                for (Map.Entry<String, Object> credEntry : identCredentials.entrySet()) {
                    dbStat.setString(param++, credEntry.getKey());
                    dbStat.setString(param++, CommonUtils.toString(credEntry.getValue()));
                }

                try (ResultSet dbResult = dbStat.executeQuery()) {
                    String userId = null;
                    boolean isActive = false;
                    while (dbResult.next()) {
                        String credUserId = dbResult.getString(1);
                        isActive = CHAR_BOOL_TRUE.equals(dbResult.getString(2));
                        if (userId == null) {
                            userId = credUserId;
                        } else if (!userId.equals(credUserId)) {
                            log.error("Multiple users associated with the same credentials! " + credUserId + ", " + userId);
                        }
                    }

                    if (userId != null && !isActive) {
                        throw new DBCException("User account is locked");
                    }

                    return userId;
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error while searching credentials", e);
        }
    }

    @Override
    public Map<String, Object> getUserCredentials(String userId, String authProviderId) throws DBCException {
        AuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT CRED_ID,CRED_VALUE FROM CB_USER_CREDENTIALS\n" +
                    "WHERE USER_ID=? AND PROVIDER_ID=?")) {
                dbStat.setString(1, userId);

                dbStat.setString(2, authProvider.getId());

                try (ResultSet dbResult = dbStat.executeQuery()) {
                    Map<String, Object> credentials = new LinkedHashMap<>();

                    while (dbResult.next()) {
                        credentials.put(dbResult.getString(1), dbResult.getString(2));
                    }

                    return credentials;
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving role in database", e);
        }
    }

    @Override
    public String[] getUserLinkedProviders(@NotNull String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT DISTINCT PROVIDER_ID FROM CB_USER_CREDENTIALS\n" +
                    "WHERE USER_ID=?")) {
                dbStat.setString(1, userId);

                try (ResultSet dbResult = dbStat.executeQuery()) {
                    List<String> providerIds = new ArrayList<>();

                    while (dbResult.next()) {
                        providerIds.add(dbResult.getString(1));
                    }

                    return providerIds.toArray(new String[0]);
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving role in database", e);
        }
    }

    ///////////////////////////////////////////
    // Roles

    @NotNull
    @Override
    public SMRole[] readAllRoles() throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Map<String, SMRole> roles = new LinkedHashMap<>();
            try (Statement dbStat = dbCon.createStatement()) {
                try (ResultSet dbResult = dbStat.executeQuery("SELECT * FROM CB_ROLE ORDER BY ROLE_ID")) {
                    while (dbResult.next()) {
                        SMRole role = fetchRole(dbResult);
                        roles.put(role.getRoleId(), role);
                    }
                }
                try (ResultSet dbResult = dbStat.executeQuery("SELECT SUBJECT_ID,PERMISSION_ID\n" +
                    "FROM CB_AUTH_PERMISSIONS AP,CB_ROLE R\n" +
                    "WHERE AP.SUBJECT_ID=R.ROLE_ID\n")) {
                    while (dbResult.next()) {
                        SMRole role = roles.get(dbResult.getString(1));
                        if (role != null) {
                            role.addPermission(dbResult.getString(2));
                        }
                    }
                }
            }
            return roles.values().toArray(new SMRole[0]);
        } catch (SQLException e) {
            throw new DBCException("Error reading roles from database", e);
        }
    }

    @Override
    public SMRole findRole(String roleId) throws DBCException {
        return Arrays.stream(readAllRoles())
            .filter(r -> r.getRoleId().equals(roleId))
            .findFirst().orElse(null);
    }

    @NotNull
    @Override
    public String[] getRoleSubjects(String roleId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT USER_ID FROM CB_USER_ROLE WHERE ROLE_ID=?")) {
                dbStat.setString(1, roleId);
                List<String> subjects = new ArrayList<>();
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        subjects.add(dbResult.getString(1));
                    }
                }
                return subjects.toArray(new String[0]);
            }
        } catch (SQLException e) {
            throw new DBCException("Error while reading role subjects", e);
        }
    }

    @NotNull
    private SMRole fetchRole(ResultSet dbResult) throws SQLException {
        return new SMRole(dbResult.getString("ROLE_ID"),
            dbResult.getString("ROLE_NAME"),
            dbResult.getString("ROLE_DESCRIPTION")
        );
    }

    @Override
    public void createRole(String roleId, String name, String description, String grantor) throws DBCException {
        if (isSubjectExists(roleId)) {
            throw new DBCException("User or role '" + roleId + "' already exists");
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                createAuthSubject(dbCon, roleId, SUBJECT_ROLE);
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO CB_ROLE(ROLE_ID,ROLE_NAME,ROLE_DESCRIPTION,CREATE_TIME) VALUES(?,?,?,?)")) {
                    dbStat.setString(1, roleId);
                    dbStat.setString(2, CommonUtils.notEmpty(name));
                    dbStat.setString(3, CommonUtils.notEmpty(description));
                    dbStat.setTimestamp(4, new Timestamp(System.currentTimeMillis()));
                    dbStat.execute();
                }

                insertPermissions(dbCon, roleId,
                    new String[] {DBWConstants.PERMISSION_PUBLIC} , grantor);

                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving role in database", e);
        }
    }

    @Override
    public void updateRole(String roleId, String name, String description) throws DBCException {
        if (!isSubjectExists(roleId)) {
            throw new DBCException("Role '" + roleId + "' doesn't exists");
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "UPDATE CB_ROLE SET ROLE_NAME=?,ROLE_DESCRIPTION=? WHERE ROLE_ID=?")) {
                    dbStat.setString(1, CommonUtils.notEmpty(name));
                    dbStat.setString(2, CommonUtils.notEmpty(description));
                    dbStat.setString(3, roleId);
                    if (dbStat.executeUpdate() <= 0) {
                        throw new DBCException("Role '" + roleId + "' doesn't exist");
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error updating role info in database", e);
        }
    }

    @Override
    public void deleteRole(String roleId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT COUNT(*) FROM CB_USER_ROLE WHERE ROLE_ID=?")) {
                dbStat.setString(1, roleId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        int userCount = dbResult.getInt(1);
                        if (userCount > 0) {
                            throw new DBCException("Role can't be deleted. There are " + userCount + " user(s) who have this role. Un-assign role first.");
                        }
                    }
                }
            }

            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                deleteAuthSubject(dbCon, roleId);
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "DELETE FROM CB_ROLE WHERE ROLE_ID=?")) {
                    dbStat.setString(1, roleId);
                    dbStat.execute();
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error deleting role from database", e);
        }
    }

    ///////////////////////////////////////////
    // Permissions

    @Override
    public void setSubjectPermissions(String subjectId, List<String> permissionIds, String grantorId) throws DBException {
//        validatePermissions(SMConstants.SUBJECT_PERMISSION_SCOPE, permissionIds);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_AUTH_PERMISSIONS WHERE SUBJECT_ID=?", subjectId);
                insertPermissions(dbCon, subjectId, permissionIds.toArray(String[]::new), grantorId);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving role permissions in database", e);
        }
    }

    private void insertPermissions(Connection dbCon, String subjectId, String[] permissionIds, String grantorId) throws SQLException {
        if (!ArrayUtils.isEmpty(permissionIds)) {
            try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_AUTH_PERMISSIONS(SUBJECT_ID,PERMISSION_ID,GRANT_TIME,GRANTED_BY) VALUES(?,?,?,?)")) {
                for (String permission : permissionIds) {
                    dbStat.setString(1, subjectId);
                    dbStat.setString(2, permission);
                    dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                    dbStat.setString(4, grantorId);
                    dbStat.execute();
                }
            }
        }
    }

    @NotNull
    @Override
    public Set<String> getSubjectPermissions(String subjectId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            Set<String> permissions = new HashSet<>();
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT PERMISSION_ID FROM CB_AUTH_PERMISSIONS WHERE SUBJECT_ID=?")) {
                dbStat.setString(1, subjectId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        permissions.add(dbResult.getString(1));
                    }
                }
            }
            return permissions;
        } catch (SQLException e) {
            throw new DBCException("Error saving role in database", e);
        }
    }

    @NotNull
    @Override
    public Set<String> getUserPermissions(String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            Set<String> permissions = new HashSet<>();
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT DISTINCT AP.PERMISSION_ID FROM CB_AUTH_PERMISSIONS AP,CB_USER_ROLE UR\n" +
                    "WHERE UR.ROLE_ID=AP.SUBJECT_ID AND UR.USER_ID=?")) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        permissions.add(dbResult.getString(1));
                    }
                }
            }
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT PERMISSION_ID FROM CB_AUTH_PERMISSIONS WHERE SUBJECT_ID=?")) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        permissions.add(dbResult.getString(1));
                    }
                }
            }
            permissions.addAll(getSubjectPermissions(userId));
            return permissions;
        } catch (SQLException e) {
            throw new DBCException("Error reading user permissions", e);
        }
    }

    ///////////////////////////////////////////
    // Sessions

    @Override
    public boolean isSessionPersisted(String id) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT 1 FROM CB_SESSION WHERE SESSION_ID=?")) {
                dbStat.setString(1, id);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        return true;
                    }
                }
            }
            return false;
        } catch (SQLException e) {
            throw new DBCException("Error reading session persistence state", e);
        }
    }

    private String createSmSession(
        @NotNull String appSessionId,
        @Nullable String userId,
        @NotNull Map<String, Object> parameters,
        @NotNull SMSessionType sessionType,
        Connection dbCon
    ) throws SQLException, DBException {
        var sessionId = UUID.randomUUID().toString();
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO CB_SESSION(SESSION_ID, APP_SESSION_ID, USER_ID,CREATE_TIME,LAST_ACCESS_TIME,"
                + "LAST_ACCESS_REMOTE_ADDRESS,LAST_ACCESS_USER_AGENT,LAST_ACCESS_INSTANCE_ID, SESSION_TYPE) "
                + "VALUES(?,?,?,?,?,?,?,?,?)")) {
            dbStat.setString(1, sessionId);
            dbStat.setString(2, appSessionId);
            if (userId != null) {
                dbStat.setString(3, userId);
            } else {
                dbStat.setNull(3, Types.VARCHAR);
            }

            Timestamp currentTS = new Timestamp(System.currentTimeMillis());
            dbStat.setTimestamp(4, currentTS);
            dbStat.setTimestamp(5, currentTS);
            if (parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS) != null) {
                dbStat.setString(6, parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS).toString());
            } else {
                dbStat.setNull(6, Types.VARCHAR);
            }
            if (parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT) != null) {
                dbStat.setString(7, parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT).toString());
            } else {
                dbStat.setNull(7, Types.VARCHAR);
            }
            dbStat.setString(8, database.getInstanceId());
            dbStat.setString(9, sessionType.getSessionType());
            dbStat.execute();
            return sessionId;
        }
    }

    @Override
    public SMAuthInfo authenticateAnonymousUser(@NotNull String appSessionId, @NotNull Map<String, Object> sessionParameters, @NotNull SMSessionType sessionType) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                var smSessionId = createSmSession(appSessionId, null, sessionParameters, sessionType, dbCon);
                var smTokens = generateNewSessionToken(smSessionId, null, dbCon);
                var permissions = getAnonymousUserPermissions();
                txn.commit();
                return SMAuthInfo.success(
                    UUID.randomUUID().toString(),
                    smTokens.getSmAccessToken(),
                    smTokens.getSmRefreshToken(),
                    new SMAuthPermissions(null, smSessionId, permissions), Map.of()
                );
            }
        } catch (SQLException e) {
            throw new DBException(e.getMessage(), e);
        }
    }

    private Set<String> getAnonymousUserPermissions() throws DBException {
        var anonymousUserRole = ((WebApplication) DBWorkbench.getPlatform().getApplication()).getAppConfiguration().getAnonymousUserRole();
        return getSubjectPermissions(anonymousUserRole);
    }

    @Override
    public SMAuthInfo authenticate(
        @NotNull String appSessionId,
        @Nullable String previousSmSessionId,
        @NotNull Map<String, Object> sessionParameters,
        @NotNull SMSessionType sessionType,
        @NotNull String authProviderId,
        @Nullable String authProviderConfigurationId,
        @NotNull Map<String, Object> userCredentials
    ) throws DBException {
        var authProgressMonitor = new VoidProgressMonitor();
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                Map<String, Object> securedUserIdentifyingCredentials = userCredentials;
                AuthProviderDescriptor authProviderDescriptor = getAuthProvider(authProviderId);
                var authProviderInstance = authProviderDescriptor.getInstance();
                if (SMAuthProviderExternal.class.isAssignableFrom(authProviderInstance.getClass())) {
                    var authProviderExternal = (SMAuthProviderExternal<?>) authProviderInstance;
                    securedUserIdentifyingCredentials = authProviderExternal.authExternalUser(authProgressMonitor, Map.of(), userCredentials);
                }

                var filteredUserCreds = filterSecuredUserData(
                    securedUserIdentifyingCredentials,
                    authProviderDescriptor
                );

                var authAttemptId = createNewAuthAttempt(
                    SMAuthStatus.IN_PROGRESS,
                    authProviderId,
                    authProviderConfigurationId,
                    filteredUserCreds,
                    appSessionId,
                    previousSmSessionId,
                    sessionType,
                    sessionParameters
                );

                if (SMWAuthProviderFederated.class.isAssignableFrom(authProviderInstance.getClass())) {
                    //async auth
                    var authProviderFederated = (SMWAuthProviderFederated) authProviderInstance;
                    var redirectUrl = buildRedirectLink(
                        authProviderFederated.getSignInLink(authProviderConfigurationId, Map.of()),
                        authAttemptId);
                    return SMAuthInfo.inProgress(authAttemptId, redirectUrl, filteredUserCreds);
                }
                txn.commit();
                return finishAuthentication(
                    SMAuthInfo.inProgress(authAttemptId, null, Map.of(authProviderId, securedUserIdentifyingCredentials)),
                    true,
                    false
                );
            }
        } catch (SQLException e) {
            throw new DBException(e.getMessage(), e);
        }
    }

    private Map<String, Object> filterSecuredUserData(
        Map<String, Object> userIdentifyingCredentials,
        AuthProviderDescriptor authProviderDescriptor
    ) {
        SMAuthCredentialsProfile credProfile = getCredentialProfileByParameters(authProviderDescriptor, userIdentifyingCredentials.keySet());
        return userIdentifyingCredentials.entrySet()
            .stream()
            .filter((cred) -> {
                AuthPropertyDescriptor property = credProfile.getCredentialParameter(cred.getKey());

                return property != null && property.getEncryption() == AuthPropertyEncryption.none;
                })
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private String createNewAuthAttempt(
        SMAuthStatus status,
        String authProviderId,
        String authProviderConfigurationId,
        Map<String, Object> authData,
        String appSessionId,
        String prevSessionId,
        SMSessionType sessionType,
        Map<String, Object> sessionParameters
    ) throws DBException {
        String authAttemptId = UUID.randomUUID().toString();
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO CB_AUTH_ATTEMPT(AUTH_ID,AUTH_STATUS,APP_SESSION_ID,SESSION_TYPE,APP_SESSION_STATE,SESSION_ID) " +
                        "VALUES(?,?,?,?,?,?)")) {
                    dbStat.setString(1, authAttemptId);
                    dbStat.setString(2, status.toString());
                    dbStat.setString(3, appSessionId);
                    dbStat.setString(4, sessionType.getSessionType());
                    dbStat.setString(5, gson.toJson(sessionParameters));
                    if (prevSessionId != null && isSmSessionNotExpired(prevSessionId)) {
                        dbStat.setString(6, prevSessionId);
                    } else {
                        dbStat.setNull(6, Types.VARCHAR);
                    }
                    dbStat.execute();
                }

                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO CB_AUTH_ATTEMPT_INFO(AUTH_ID,AUTH_PROVIDER_ID,AUTH_PROVIDER_CONFIGURATION_ID,AUTH_STATE) " +
                        "VALUES(?,?,?,?)")) {
                    dbStat.setString(1, authAttemptId);
                    dbStat.setString(2, authProviderId);
                    dbStat.setString(3, authProviderConfigurationId);
                    dbStat.setString(4, gson.toJson(authData));
                    dbStat.execute();
                }
                txn.commit();
            }
            return authAttemptId;
        } catch (SQLException e) {
            throw new DBException(e.getMessage(), e);
        }
    }

    private boolean isSmSessionNotExpired(String prevSessionId) {
        //TODO: implement after we start tracking user logout
        return true;
    }

    @Override
    public void updateAuthStatus(@NotNull String authId,
                                 @NotNull SMAuthStatus authStatus,
                                 @NotNull Map<String, Object> authInfo,
                                 @Nullable String error) throws DBException {
        var existAuthInfo = getAuthStatus(authId);
        if (existAuthInfo.getAuthStatus() != SMAuthStatus.IN_PROGRESS) {
            throw new SMException("Authorization already finished and cannot be updated");
        }
        var authSessionInfo = readAuthAttemptSessionInfo(authId);
        updateAuthStatus(authId, authStatus, authInfo, error, authSessionInfo.getSmSessionId());
    }

    private void updateAuthStatus(@NotNull String authId,
                                  @NotNull SMAuthStatus authStatus,
                                  @NotNull Map<String, Object> authInfo,
                                  @Nullable String error,
                                  @Nullable String smSessionId) throws DBException {
        try (Connection dbCon = database.openConnection();
            JDBCTransaction txn = new JDBCTransaction(dbCon)) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE CB_AUTH_ATTEMPT SET AUTH_STATUS=?,AUTH_ERROR=?,SESSION_ID=? WHERE AUTH_ID=?")) {
                dbStat.setString(1, authStatus.toString());
                if (error != null) {
                    dbStat.setString(2, error);
                } else {
                    dbStat.setNull(2, Types.VARCHAR);
                }
                if (smSessionId != null) {
                    dbStat.setString(3, smSessionId);
                } else {
                    dbStat.setNull(3, Types.VARCHAR);
                }
                dbStat.setString(4, authId);
                if (dbStat.executeUpdate() <= 0) {
                    throw new DBCException("Auth attempt '" + authId + "' doesn't exist");
                }
            }

            for (Map.Entry<String, Object> entry : authInfo.entrySet()) {
                String providerId = entry.getKey();
                String authJson = gson.toJson(entry.getValue());
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "UPDATE CB_AUTH_ATTEMPT_INFO SET AUTH_STATE=? WHERE AUTH_ID=? AND AUTH_PROVIDER_ID=?")) {
                    dbStat.setString(1, authJson);
                    dbStat.setString(2, authId);
                    dbStat.setString(3, providerId);
                    if (dbStat.executeUpdate() <= 0) {
                        try (PreparedStatement dbStatIns = dbCon.prepareStatement(
                            "INSERT INTO CB_AUTH_ATTEMPT_INFO (AUTH_ID,AUTH_PROVIDER_ID,AUTH_STATE) VALUES(?,?,?)")) {
                            dbStatIns.setString(1, authId);
                            dbStatIns.setString(2, providerId);
                            dbStatIns.setString(3, authJson);
                            dbStatIns.execute();
                        }
                    }
                }
            }
            txn.commit();
        } catch (SQLException e) {
            throw new DBCException("Error updating auth status", e);
        }
    }

    @Override
    public SMAuthInfo getAuthStatus(@NotNull String authId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            SMAuthStatus smAuthStatus;
            String authError;
            String smSessionId;
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT AUTH_STATUS,AUTH_ERROR,SESSION_ID FROM CB_AUTH_ATTEMPT WHERE AUTH_ID=?"
            )) {
                dbStat.setString(1, authId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (!dbResult.next()) {
                        throw new SMException("Auth attempt " + authId + " not found");
                    }
                    smAuthStatus = SMAuthStatus.valueOf(dbResult.getString(1));
                    authError = dbResult.getString(2);
                    smSessionId = dbResult.getString(3);
                }
            }
            Map<String, Object> authData = new LinkedHashMap<>();
            String redirectUrl = null;
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT AUTH_PROVIDER_ID,AUTH_PROVIDER_CONFIGURATION_ID,AUTH_STATE FROM CB_AUTH_ATTEMPT_INFO "
                    + "WHERE AUTH_ID=? ORDER BY CREATE_TIME"
            )) {
                dbStat.setString(1, authId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String authProviderId = dbResult.getString(1);
                        String authProviderConfiguration = dbResult.getString(2);
                        Map<String, Object> authProviderData = gson.fromJson(dbResult.getString(3), MAP_STRING_OBJECT_TYPE);
                        if (authProviderConfiguration != null) {
                            var authProviderInstance = getAuthProvider(authProviderId).getInstance();
                            if (SMWAuthProviderFederated.class.isAssignableFrom(authProviderInstance.getClass())) {
                                redirectUrl = buildRedirectLink(
                                    ((SMWAuthProviderFederated) authProviderInstance).getRedirectLink(authProviderConfiguration, Map.of()),
                                    authId
                                );
                            }
                        }
                        authData.put(authProviderId, authProviderData);
                    }
                }
            }

            if (smAuthStatus != SMAuthStatus.SUCCESS) {
                switch (smAuthStatus) {
                    case IN_PROGRESS:
                        return SMAuthInfo.inProgress(authId, redirectUrl, authData);
                    case ERROR:
                        return SMAuthInfo.error(authId, authError);
                    case EXPIRED:
                        return SMAuthInfo.expired(authId);
                    default:
                        throw new SMException("Unknown auth status:" + smAuthStatus);
                }
            }

            SMTokens smTokens = findTokenBySmSession(smSessionId);
            SMAuthPermissions authPermissions = getTokenPermissions(smTokens.getSmAccessToken());
            var successAuthStatus = SMAuthInfo.success(
                authId,
                smTokens.getSmAccessToken(),
                smTokens.getSmRefreshToken(),
                authPermissions,
                authData
            );
            updateAuthStatus(authId, SMAuthStatus.EXPIRED, authData, null, authPermissions.getSessionId());
            return successAuthStatus;

        } catch (SQLException e) {
            throw new DBException("Error while read auth info", e);
        }
    }

    @Override
    public void logout() throws DBException {
        var currentUserCreds = getCurrentUserCreds();
        invalidateUserTokens(currentUserCreds.getSmToken());
    }

    @Override
    public SMTokens refreshSession(@NotNull String refreshToken) throws DBException {
        var currentUserCreds = getCurrentUserCreds();
        var currentUserAccessToken = currentUserCreds.getSmToken();

        var expectedRefreshTokenInfo = findRefreshToken(currentUserAccessToken);

        if (!expectedRefreshTokenInfo.getRefreshToken().equals(refreshToken)) {
            throw new SMException("Invalid refresh token");
        }

        try (var dbCon = database.openConnection()) {
            invalidateUserTokens(currentUserAccessToken);
            return generateNewSessionToken(expectedRefreshTokenInfo.getSessionId(), currentUserCreds.getUserId(), dbCon);
        } catch (SQLException e) {
            throw new DBException("Error refreshing sm session", e);
        }
    }

    private void invalidateUserTokens(String smToken) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_AUTH_TOKEN WHERE TOKEN_ID=?", smToken);
        } catch (SQLException e) {
            throw new DBCException("Session invalidation failed", e);
        }
    }

    private SMCredentials getCurrentUserCreds() throws SMException {
        var currentUserCreds = credentialsProvider.getActiveUserCredentials();
        if (currentUserCreds == null) {
            throw new SMException("Unauthorized");
        }
        return currentUserCreds;
    }

    private SMTokens findTokenBySmSession(String smSessionId) throws DBException {
        try (Connection dbCon = database.openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement("SELECT TOKEN_ID, REFRESH_TOKEN_ID FROM CB_AUTH_TOKEN WHERE SESSION_ID=?")
        ) {
            dbStat.setString(1, smSessionId);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new SMException("Token not found");
                }
                return new SMTokens(dbResult.getString(1), dbResult.getString(2));
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading token info in database", e);
        }
    }

    private RefreshTokenInfo findRefreshToken(String smAccessToken) throws DBException {
        try (Connection dbCon = database.openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement(
                 "SELECT REFRESH_TOKEN_ID,SESSION_ID,REFRESH_TOKEN_EXPIRATION_TIME FROM CB_AUTH_TOKEN WHERE TOKEN_ID=?"
             )
        ) {
            dbStat.setString(1, smAccessToken);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new SMException("Refresh token not found");
                }
                var refreshToken = dbResult.getString(1);
                var sessionId = dbResult.getString(2);
                var expiredDate = dbResult.getTimestamp(3);
                if (Timestamp.from(Instant.now()).after(expiredDate)) {
                    throw new SMRefreshTokenExpiredException("Refresh token expired");
                }
                return new RefreshTokenInfo(refreshToken, sessionId);
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading token info in database", e);
        }
    }

    @Override
    public SMAuthInfo finishAuthentication(@NotNull String authId) throws DBException {
        SMAuthInfo authInfo = getAuthStatus(authId);
        return finishAuthentication(authInfo, false, true);
    }

    private SMAuthInfo finishAuthentication(@NotNull SMAuthInfo authInfo,  boolean forceExpireAuthAfterSuccess, boolean saveSecuredCreds) throws DBException {
        String authId = authInfo.getAuthAttemptId();
        if (authInfo.getAuthStatus() != SMAuthStatus.IN_PROGRESS) {
            throw new SMException("Authorization has already been completed with status: " + authInfo.getAuthStatus());
        }
        Set<String> authProviderIds = authInfo.getAuthData().keySet();
        if (authProviderIds.isEmpty()) {
            throw new SMException("Authorization providers are not defined");
        }

        var finishAuthMonitor = new VoidProgressMonitor();
        AuthAttemptSessionInfo authAttemptSessionInfo = readAuthAttemptSessionInfo(authId);
        boolean isMainAuthSession = authAttemptSessionInfo.getSmSessionId() == null;

        SMTokens smTokens = null;
        SMAuthPermissions permissions = null;
        if (!isMainAuthSession) {
            //this is an additional authorization and we should to return the original permissions and  userId
            smTokens = findTokenBySmSession(authAttemptSessionInfo.getSmSessionId());
            permissions = getTokenPermissions(smTokens.getSmAccessToken());
        }
        String activeUserId = permissions == null ? null : permissions.getUserId();

        Map<String, Object> storedUserData = new LinkedHashMap<>();
        for (String authProviderId : authProviderIds) {
            var userCredentials = (Map<String, Object>) authInfo.getAuthData().get(authProviderId);
            var userIdFromCreds = findOrCreateExternalUserByCredentials(
                authProviderId,
                authAttemptSessionInfo.getSessionParams(),
                userCredentials,
                finishAuthMonitor,
                activeUserId,
                activeUserId == null
            );

            if (userIdFromCreds == null) {
                var error = "Invalid user credentials";
                updateAuthStatus(authId, SMAuthStatus.ERROR, authInfo.getAuthData(), error);
                return SMAuthInfo.error(authId, error);
            }
            if (activeUserId == null) {
                activeUserId = userIdFromCreds;
            }
            storedUserData.put(
                authProviderId,
                saveSecuredCreds ? userCredentials : filterSecuredUserData(userCredentials, getAuthProvider(authProviderId))
            );
        }

        if (smTokens == null && permissions == null) {
            try (Connection dbCon = database.openConnection()) {
                try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                    String smSessionId;
                    if (authAttemptSessionInfo.getSmSessionId() == null) {
                        smSessionId = createSmSession(
                            authAttemptSessionInfo.getAppSessionId(),
                            activeUserId,
                            authAttemptSessionInfo.getSessionParams(),
                            authAttemptSessionInfo.getSessionType(),
                            dbCon
                        );
                    } else {
                        smSessionId = authAttemptSessionInfo.getSmSessionId();
                    }
                    smTokens = generateNewSessionToken(smSessionId, activeUserId, dbCon);
                    permissions = new SMAuthPermissions(activeUserId, smSessionId, getUserPermissions(activeUserId));
                    txn.commit();
                }
            } catch (SQLException e) {
                var error = "Error during token generation";
                updateAuthStatus(authId, SMAuthStatus.ERROR, authInfo.getAuthData(), error);
                throw new SMException(error, e);
            }
        }
        var authStatus = forceExpireAuthAfterSuccess ? SMAuthStatus.EXPIRED : SMAuthStatus.SUCCESS;
        updateAuthStatus(authId, authStatus, storedUserData, null, permissions.getSessionId());
        return SMAuthInfo.success(
            authId,
            smTokens.getSmAccessToken(),
            //refresh token must be sent only once
            isMainAuthSession ? smTokens.getSmRefreshToken() : null,
            permissions,
            authInfo.getAuthData()
        );
    }

    private AuthAttemptSessionInfo readAuthAttemptSessionInfo(@NotNull String authId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT APP_SESSION_ID,SESSION_TYPE,APP_SESSION_STATE,SESSION_ID FROM CB_AUTH_ATTEMPT WHERE AUTH_ID=?"
            )) {
                dbStat.setString(1, authId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (!dbResult.next()) {
                        throw new SMException("Auth attempt not found");
                    }
                    String appSessionId = dbResult.getString(1);
                    SMSessionType sessionType = new SMSessionType(dbResult.getString(2));
                    Map<String, Object> sessionParams = gson.fromJson(
                        dbResult.getString(3), MAP_STRING_OBJECT_TYPE
                    );
                    String smSessionId = dbResult.getString(4);

                    return new AuthAttemptSessionInfo(appSessionId, smSessionId, sessionType, sessionParams);
                }
            }
        } catch (SQLException e) {
            throw new DBException("Error while read auth info", e);
        }
    }

    private String findOrCreateExternalUserByCredentials(
        @NotNull String authProviderId,
        @NotNull Map<String, Object> sessionParameters,
        @NotNull Map<String, Object> userCredentials,
        @NotNull DBRProgressMonitor progressMonitor,
        @Nullable String activeUserId,
        boolean createNewUserIfNotExist
    ) throws DBException {
        AuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        SMAuthProvider<?> smAuthProviderInstance = authProvider.getInstance();
        String userId = findUserByCredentials(authProviderId, userCredentials);
        String userIdFromCredentials;
        try {
            userIdFromCredentials = smAuthProviderInstance.validateLocalAuth(progressMonitor, this, Map.of(), userCredentials, null);
        } catch (DBException e) {
            log.debug("Local auth validation error", e);
            return null;
        }
        if (activeUserId != null && userId != null && !activeUserId.equals(userId)) {
            log.debug("User '" + activeUserId + "' is authenticated in '"
                + authProviderId + "' auth provider with credentials of user '"
                + userIdFromCredentials + "'");
        }
        if (userId == null && createNewUserIfNotExist) {
            if (!(authProvider.getInstance() instanceof SMAuthProviderExternal<?>)) {
                return null;
            }

            userId = userIdFromCredentials;
            if (!isSubjectExists(userId)) {
                var newUser = new SMUser(userId);
                createUser(newUser.getUserId(), newUser.getMetaParameters());
                String defaultRoleName = WebAppUtils.getWebApplication().getAppConfiguration().getDefaultUserRole();
                if (!CommonUtils.isEmpty(defaultRoleName)) {
                    setUserRoles(userId, new String[]{defaultRoleName}, userId);
                }
            }
            setUserCredentials(userId, authProviderId, userCredentials);
        } else if (userId == null) {
            userId = userIdFromCredentials;
        }
        if (authProvider.isTrusted()) {
            if (WebAppUtils.getWebApplication().isMultiNode()) {
                throw new SMException("Authorization through trusted provider is not available in multi node");
            }
            Object reverseProxyUserRoles = sessionParameters.get(SMConstants.SESSION_PARAM_TRUSTED_USER_ROLES);
            if (reverseProxyUserRoles instanceof List) {
                setUserRoles(userId, ((List<?>) reverseProxyUserRoles).stream().map(Object::toString).toArray(String[]::new), userId);
            }
        }
        return userId;
    }

    protected SMTokens generateNewSessionToken(
        @NotNull String smSessionId,
        @Nullable String userId,
        @NotNull Connection dbCon
    ) throws SQLException, DBException {
        JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_AUTH_TOKEN WHERE SESSION_ID=?", smSessionId);
        return generateNewSessionTokens(smSessionId, userId, dbCon);
    }

    private SMTokens generateNewSessionTokens(@NotNull String smSessionId,
                                              @Nullable String userId,
                                              @NotNull Connection dbCon) throws SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO CB_AUTH_TOKEN(TOKEN_ID,SESSION_ID,USER_ID,EXPIRATION_TIME,REFRESH_TOKEN_ID,REFRESH_TOKEN_EXPIRATION_TIME) " +
                "VALUES(?,?,?,?,?,?)")) {

            String smAccessToken = SecurityUtils.generatePassword(32);
            dbStat.setString(1, smAccessToken);
            dbStat.setString(2, smSessionId);
            if (userId == null) {
                dbStat.setNull(3, Types.VARCHAR);
            } else {
                dbStat.setString(3, userId);
            }
            var accessTokenExpirationTime = Timestamp.valueOf(LocalDateTime.now().plusMinutes(TOKEN_MINUTES_ALIVE_TIME));
            dbStat.setTimestamp(4, accessTokenExpirationTime);

            String smRefreshToken = SecurityUtils.generatePassword(32);
            dbStat.setString(5, smRefreshToken);
            var refreshTokenExpirationTime = Timestamp.valueOf(LocalDateTime.now().plusHours(REFRESH_TOKEN_HOURS_ALIVE_TIME));
            dbStat.setTimestamp(6, refreshTokenExpirationTime);

            dbStat.execute();
            return new SMTokens(smAccessToken, smRefreshToken);
        }
    }

    @Override
    public SMAuthPermissions getTokenPermissions(String token) throws DBException {
        String userId;
        String sessionId;
        try (Connection dbCon = database.openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement("SELECT USER_ID, EXPIRATION_TIME, SESSION_ID FROM CB_AUTH_TOKEN WHERE TOKEN_ID=?");
        ) {
            dbStat.setString(1, token);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new SMException("Invalid token");
                }
                userId = dbResult.getString(1);
                var expiredDate = dbResult.getTimestamp(2);
                if (application.isMultiNode() && Timestamp.from(Instant.now()).after(expiredDate)) {
                    throw new SMAccessTokenExpiredException("Token expired");
                }
                sessionId = dbResult.getString(3);
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading token info in database", e);
        }
        var permissions = userId == null ? getAnonymousUserPermissions() : getUserPermissions(userId);
        return new SMAuthPermissions(userId, sessionId, permissions);
    }

    @Override
    public SMAuthProviderDescriptor[] getAvailableAuthProviders() throws DBException {
        if (!(application.getAppConfiguration() instanceof WebAuthConfiguration)) {
            throw new DBException("Web application doesn't support external authentication");
        }
        WebAuthConfiguration appConfiguration = (WebAuthConfiguration) application.getAppConfiguration();
        Set<SMAuthProviderCustomConfiguration> customConfigurations = appConfiguration.getAuthCustomConfigurations();
        List<SMAuthProviderDescriptor> providers = AuthProviderRegistry.getInstance().getAuthProviders().stream()
            .filter(ap ->
                !ap.isTrusted() &&
                    appConfiguration.isAuthProviderEnabled(ap.getId()) &&
                    (!ap.isConfigurable() || hasProviderConfiguration(ap, customConfigurations)))
            .map(AuthProviderDescriptor::createDescriptorBean).collect(Collectors.toList());

        if (!CommonUtils.isEmpty(customConfigurations)) {
            // Attach custom configs to providers
            for (SMAuthProviderDescriptor provider : providers) {
                for (SMAuthProviderCustomConfiguration cc : customConfigurations) {
                    if (!cc.isDisabled() && cc.getProvider().equals(provider.getId())) {
                        cc = new SMAuthProviderCustomConfiguration(cc);
                        // Do not pass secure parameters
                        cc.setParameters(Map.of());
                        provider.addCustomConfiguration(cc);
                    }
                }
            }
        }
        return providers.toArray(new SMAuthProviderDescriptor[0]);
    }

    private static boolean hasProviderConfiguration(AuthProviderDescriptor ap, Set<SMAuthProviderCustomConfiguration> customConfigurations) {
        for (SMAuthProviderCustomConfiguration cc : customConfigurations) {
            if (!cc.isDisabled() && cc.getProvider().equals(ap.getId())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void updateSession(@NotNull String sessionId, @Nullable String userId, @NotNull Map<String, Object> parameters) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE CB_SESSION SET USER_ID=?,LAST_ACCESS_TIME=?,LAST_ACCESS_REMOTE_ADDRESS=?,LAST_ACCESS_USER_AGENT=?,LAST_ACCESS_INSTANCE_ID=? WHERE SESSION_ID=?")) {
                if (userId == null) {
                    dbStat.setNull(1, Types.VARCHAR);
                } else {
                    dbStat.setString(1, userId);
                }
                dbStat.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
                if (parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS) != null) {
                    dbStat.setString(3, CommonUtils.truncateString(parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS).toString(), 128));
                } else {
                    dbStat.setNull(3, Types.VARCHAR);
                }
                if (parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT) != null) {
                    dbStat.setString(4, CommonUtils.truncateString(parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT).toString(), 255));
                } else {
                    dbStat.setNull(4, Types.VARCHAR);
                }
                dbStat.setString(5, database.getInstanceId());

                dbStat.setString(6, sessionId);
                if (dbStat.executeUpdate() <= 0) {
                    throw new DBCException("Session not exists in database");
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error updating session in database", e);
        }
    }

    ///////////////////////////////////////////
    // Access management
    @Override
    public void setObjectPermissions(
        @NotNull Set<String> objectIds,
        @NotNull SMObjectType objectType,
        @NotNull Set<String> subjectIds,
        @NotNull Set<String> permissions,
        @NotNull String grantor
    ) throws DBException {
        if (CommonUtils.isEmpty(subjectIds) || CommonUtils.isEmpty(objectIds)) {
            return;
        }
//        validatePermissions(objectType.getObjectType(), permissions);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                var sqlBuilder = new StringBuilder("DELETE FROM CB_OBJECT_PERMISSIONS WHERE SUBJECT_ID IN (");
                appendStringParameters(sqlBuilder, subjectIds.toArray(String[]::new));
                sqlBuilder.append(") AND OBJECT_TYPE=? ")
                    .append("AND OBJECT_ID IN (");
                appendStringParameters(sqlBuilder, objectIds.toArray(String[]::new));
                sqlBuilder.append(")");
                JDBCUtils.executeStatement(dbCon, sqlBuilder.toString(), objectType.getObjectType());
                if (!CommonUtils.isEmpty(permissions)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement(
                        "INSERT INTO CB_OBJECT_PERMISSIONS(OBJECT_ID,OBJECT_TYPE,GRANT_TIME,GRANTED_BY,SUBJECT_ID,PERMISSION) "
                            + "VALUES(?,?,?,?,?,?)")) {
                        for (String objectId : objectIds) {
                            dbStat.setString(1, objectId);
                            dbStat.setString(2, objectType.getObjectType());
                            dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                            dbStat.setString(4, grantor);
                            for (String subjectId : subjectIds) {
                                dbStat.setString(5, subjectId);
                                for (String permission : permissions) {
                                    dbStat.setString(6, permission);
                                    dbStat.execute();
                                }
                            }
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error granting object permissions", e);
        }
    }

    @Override
    public void deleteAllObjectPermissions(@NotNull String objectId, @NotNull SMObjectType objectType) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon,
                "DELETE FROM CB_OBJECT_PERMISSIONS WHERE OBJECT_TYPE=? AND OBJECT_ID=?",
                objectType.getObjectType(),
                objectId
            );

        } catch (SQLException e) {
            throw new DBCException("Error deleting object permissions", e);
        }
    }

    @Override
    public void deleteAllSubjectObjectPermissions(@NotNull String subjectId, @NotNull SMObjectType objectType) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon,
                "DELETE FROM CB_OBJECT_PERMISSIONS WHERE OBJECT_TYPE=? AND SUBJECT_ID=?",
                objectType.getObjectType(),
                subjectId
            );

        } catch (SQLException e) {
            throw new DBCException("Error deleting subject permissions", e);
        }
    }

    @NotNull
    @Override
    public List<SMObjectPermissions> getAllAvailableObjectsPermissions(@NotNull String subjectId, @NotNull SMObjectType objectType) throws DBException {
        Set<String> allSubjects = getAllLinkedSubjects(subjectId);
        try (Connection dbCon = database.openConnection()) {
            {
                var sqlBuilder = new StringBuilder("SELECT OBJECT_ID,PERMISSION FROM CB_OBJECT_PERMISSIONS ");
                sqlBuilder.append("WHERE SUBJECT_ID IN (");
                appendStringParameters(sqlBuilder, allSubjects.toArray(String[]::new));
                sqlBuilder.append(") AND OBJECT_TYPE=?");
                try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder.toString())) {
                    dbStat.setString(1, objectType.getObjectType());

                    var permissionsByObjectId = new LinkedHashMap<String, Set<String>>();
                    try (ResultSet dbResult = dbStat.executeQuery()) {
                        while (dbResult.next()) {
                            var objectId = dbResult.getString(1);
                            permissionsByObjectId.computeIfAbsent(objectId, key -> new HashSet<>()).add(dbResult.getString(2));
                        }
                    }
                    return permissionsByObjectId.entrySet()
                        .stream()
                        .map(entry -> new SMObjectPermissions(entry.getKey(), entry.getValue()))
                        .collect(Collectors.toList());
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading projects permissions", e);
        }
    }

    private Set<String> getAllLinkedSubjects(String subjectId) throws DBException {
        Set<String> allSubjects = new HashSet<>();
        allSubjects.add(subjectId);
        var userRoleIds = Arrays.stream(getUserRoles(subjectId))
            .map(SMRole::getRoleId)
            .collect(Collectors.toSet());
        allSubjects.addAll(userRoleIds);
        return allSubjects;
    }

    @NotNull
    @Override
    public SMObjectPermissions getObjectPermissions(
        @NotNull String subjectId,
        @NotNull String objectId,
        @NotNull SMObjectType objectType
    ) throws DBException {
        Set<String> allSubjects = getAllLinkedSubjects(subjectId);
        try (Connection dbCon = database.openConnection()) {
            {
                var sqlBuilder = new StringBuilder("SELECT PERMISSION FROM CB_OBJECT_PERMISSIONS ");
                sqlBuilder.append("WHERE SUBJECT_ID IN (");
                appendStringParameters(sqlBuilder, allSubjects.toArray(String[]::new));
                sqlBuilder.append(") AND OBJECT_TYPE=? AND OBJECT_ID=?");

                try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder.toString())) {
                    dbStat.setString(1, objectType.getObjectType());
                    dbStat.setString(2, objectId);

                    var permissions = new HashSet<String>();
                    try (ResultSet dbResult = dbStat.executeQuery()) {
                        while (dbResult.next()) {
                            permissions.add(dbResult.getString(1));
                        }
                    }
                    return new SMObjectPermissions(objectId, permissions);
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading projects permissions", e);
        }
    }

    @NotNull
    @Override
    public List<SMObjectPermissionsGrant> getObjectPermissionGrants(
        @NotNull String objectId,
        @NotNull SMObjectType smObjectType
    ) throws DBException {
        var grantedPermissionsBySubjectId = new HashMap<String, SMObjectPermissionsGrant.Builder>();
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT OP.SUBJECT_ID,S.SUBJECT_TYPE, OP.PERMISSION\n" +
                    "FROM CB_OBJECT_PERMISSIONS OP,CB_AUTH_SUBJECT S\n" +
                    "WHERE S.SUBJECT_ID = OP.SUBJECT_ID AND OP.OBJECT_TYPE=? AND OP.OBJECT_ID=?")) {
                dbStat.setString(1, smObjectType.getObjectType());
                dbStat.setString(2, objectId);
                List<SMDataSourceGrant> result = new ArrayList<>();
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String subjectId = dbResult.getString(1);
                        SMSubjectType subjectType = SMSubjectType.fromCode(dbResult.getString(2));
                        String permission = dbResult.getString(3);
                        grantedPermissionsBySubjectId.computeIfAbsent(
                            subjectId,
                            key -> SMObjectPermissionsGrant.builder(subjectId, subjectType, objectId)
                        ).addPermission(permission);
                    }
                }
                return grantedPermissionsBySubjectId.values().stream()
                    .map(SMObjectPermissionsGrant.Builder::build)
                    .collect(Collectors.toList());
            }

        } catch (SQLException e) {
            throw new DBCException("Error reading granted object permissions ", e);
        }
    }

    @Override
    public List<SMObjectPermissionsGrant> getSubjectObjectPermissionGrants(@NotNull String subjectId, @NotNull SMObjectType smObjectType) throws DBException {
        var allLinkedSubjects = getAllLinkedSubjects(subjectId);
        var grantedPermissionsByObjectId = new HashMap<String, SMObjectPermissionsGrant.Builder>();
        try (Connection dbCon = database.openConnection()) {
            var sqlBuilder = new StringBuilder("SELECT OP.OBJECT_ID,S.SUBJECT_TYPE,OP.PERMISSION\n")
                .append("FROM CB_OBJECT_PERMISSIONS OP,CB_AUTH_SUBJECT S\n")
                .append("WHERE S.SUBJECT_ID = OP.SUBJECT_ID AND OP.SUBJECT_ID IN (");
            appendStringParameters(sqlBuilder, allLinkedSubjects.toArray(String[]::new));
            sqlBuilder.append(") AND OP.OBJECT_TYPE=?");
            try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder.toString())) {
                dbStat.setString(1, smObjectType.getObjectType());
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String objectId = dbResult.getString(1);
                        SMSubjectType subjectType = SMSubjectType.fromCode(dbResult.getString(2));
                        String permission = dbResult.getString(3);
                        grantedPermissionsByObjectId.computeIfAbsent(
                            objectId,
                            key -> SMObjectPermissionsGrant.builder(subjectId, subjectType, objectId)
                        ).addPermission(permission);
                    }
                }
                return grantedPermissionsByObjectId.values().stream()
                    .map(SMObjectPermissionsGrant.Builder::build)
                    .collect(Collectors.toList());
            }

        } catch (SQLException e) {
            throw new DBCException("Error reading granted object permissions ", e);
        }
    }

    private void appendStringParameters(StringBuilder sql, @NotNull String[] subjectIds) {
        for (int i = 0; i < subjectIds.length; i++) {
            String id = subjectIds[i];
            if (i > 0) sql.append(",");
            sql.append("'").append(id.replace("'", "''")).append("'");
        }
    }

    public void shutdown() {
        database.shutdown();
    }

    public void finishConfiguration(
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<WebAuthInfo> authInfoList
    ) throws DBException {
        database.finishConfiguration(adminName, adminPassword, authInfoList);
    }

    ///////////////////////////////////////////
    // Utils

    public void initializeMetaInformation() throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                Set<String> registeredProviders = new HashSet<>();
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "SELECT PROVIDER_ID FROM CB_AUTH_PROVIDER")) {
                    try (ResultSet dbResult = dbStat.executeQuery()) {
                        while (dbResult.next()) {
                            registeredProviders.add(dbResult.getString(1));
                        }
                    }
                }
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO CB_AUTH_PROVIDER(PROVIDER_ID,IS_ENABLED) VALUES(?,'Y')")) {
                    for (AuthProviderDescriptor authProvider : AuthProviderRegistry.getInstance().getAuthProviders()) {
                        if (!registeredProviders.contains(authProvider.getId())) {
                            dbStat.setString(1, authProvider.getId());
                            dbStat.executeUpdate();
                            log.debug("Auth provider '" + authProvider.getId() + "' registered");
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error initializing security manager meta info", e);
        }
    }

    private void createAuthSubject(Connection dbCon, String subjectId, String subjectType) throws SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_AUTH_SUBJECT(SUBJECT_ID,SUBJECT_TYPE) VALUES(?,?)")) {
            dbStat.setString(1, subjectId);
            dbStat.setString(2, subjectType);
            dbStat.execute();
        }
    }

    private void deleteAuthSubject(Connection dbCon, String subjectId) throws SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement("DELETE FROM CB_AUTH_SUBJECT WHERE SUBJECT_ID=?")) {
            dbStat.setString(1, subjectId);
            dbStat.execute();
        }
    }

    private AuthProviderDescriptor getAuthProvider(String authProviderId) throws DBCException {
        AuthProviderDescriptor authProvider = AuthProviderRegistry.getInstance().getAuthProvider(authProviderId);
        if (authProvider == null) {
            throw new DBCException("Auth provider not found: " + authProviderId);
        }
        return authProvider;
    }

    private String buildRedirectLink(String originalLink, String authId) {
        return originalLink + "?authId=" + authId;
    }

}

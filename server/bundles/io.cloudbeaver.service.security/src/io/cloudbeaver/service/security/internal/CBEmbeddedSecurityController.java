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
package io.cloudbeaver.service.security.internal;

import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.auth.SMAuthProviderExternal;
import io.cloudbeaver.model.app.WebApplication;
import io.cloudbeaver.service.security.internal.db.CBDatabase;
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
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.dbeaver.model.security.user.SMAuthPermissions;
import org.jkiss.dbeaver.model.security.user.SMRole;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.jkiss.dbeaver.registry.auth.AuthProviderDescriptor;
import org.jkiss.dbeaver.registry.auth.AuthProviderRegistry;
import org.jkiss.dbeaver.runtime.DBWorkbench;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.SecurityUtils;

import java.sql.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Server controller
 */
public class CBEmbeddedSecurityController implements SMAdminController {

    private static final Log log = Log.getLog(CBEmbeddedSecurityController.class);

    private static final int TOKEN_HOURS_ALIVE_TIME = 1;

    private static final String CHAR_BOOL_TRUE = "Y";
    private static final String CHAR_BOOL_FALSE = "N";

    private static final String SUBJECT_USER = "U";
    private static final String SUBJECT_ROLE = "R";


    private final CBDatabase database;

    public CBEmbeddedSecurityController(CBDatabase database) {
        this.database = database;
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
    public void createUser(String userId, Map<String, String> metaParameters) throws DBCException {
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

    private static SMAuthCredentialsProfile getCredentialProfileByParameters(SMAuthProviderDescriptor authProvider, Set<String> keySet) {
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
    public void setSubjectPermissions(String subjectId, List<String> permissionIds, String grantorId) throws DBCException {
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
            throw new DBCException("Error reading session state", e);
        }
    }

    private void createSessionIfNotExist(@NotNull String appSessionId, @Nullable String userId, @NotNull Map<String, Object> parameters, @NotNull SMSessionType sessionType, Connection dbCon) throws SQLException, DBException {
        if (isSessionPersisted(appSessionId)) {
            return;
        }
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO CB_SESSION(SESSION_ID,USER_ID,CREATE_TIME,LAST_ACCESS_TIME,LAST_ACCESS_REMOTE_ADDRESS,LAST_ACCESS_USER_AGENT,LAST_ACCESS_INSTANCE_ID, SESSION_TYPE) " +
                "VALUES(?,?,?,?,?,?,?,?)")) {
            dbStat.setString(1, appSessionId);
            if (userId != null) {
                dbStat.setString(2, userId);
            } else {
                dbStat.setNull(2, Types.VARCHAR);
            }

            Timestamp currentTS = new Timestamp(System.currentTimeMillis());
            dbStat.setTimestamp(3, currentTS);
            dbStat.setTimestamp(4, currentTS);
            if (parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS) != null) {
                dbStat.setString(5, parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS).toString());
            } else {
                dbStat.setNull(5, Types.VARCHAR);
            }
            if (parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT) != null) {
                dbStat.setString(6, parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT).toString());
            } else {
                dbStat.setNull(6, Types.VARCHAR);
            }
            dbStat.setString(7, database.getInstanceId());
            dbStat.setString(8, sessionType.getSessionType());
            dbStat.execute();
        }
    }

    @Override
    public SMAuthInfo authenticateAnonymousUser(@NotNull String appSessionId, @NotNull Map<String, Object> sessionParameters, @NotNull SMSessionType sessionType) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                createSessionIfNotExist(appSessionId, null, sessionParameters, sessionType, dbCon);
                var token = generateAuthToken(appSessionId, null, dbCon);
                var permissions = getAnonymousUserPermissions();
                txn.commit();
                return new SMAuthInfo(token, new SMAuthPermissions(null, appSessionId, permissions));
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
    public SMAuthInfo authenticate(@NotNull String appSessionId, @NotNull Map<String, Object> sessionParameters, @NotNull SMSessionType sessionType, @NotNull String authProviderId, @NotNull Map<String, Object> userCredentials) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                var userId = findOrCreateExternalUserByCredentials(authProviderId,
                    sessionParameters,
                    userCredentials,
                    new VoidProgressMonitor());
                if (userId == null) {
                    throw new SMException("Invalid user credentials");
                }
                createSessionIfNotExist(appSessionId, userId, sessionParameters, sessionType, dbCon);
                var token = generateAuthToken(appSessionId, userId, dbCon);
                var permissions = getUserPermissions(userId);
                txn.commit();
                return new SMAuthInfo(token, new SMAuthPermissions(userId, appSessionId, permissions));
            }
        } catch (SQLException e) {
            throw new DBException(e.getMessage(), e);
        }
    }

    private String findOrCreateExternalUserByCredentials(@NotNull String authProviderId,
                                                         @NotNull Map<String, Object> sessionParameters,
                                                         @NotNull Map<String, Object> userCredentials,
                                                         @NotNull DBRProgressMonitor progressMonitor) throws DBException {
        AuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        SMAuthProvider<?> smAuthProviderInstance = authProvider.getInstance();
        String userId = findUserByCredentials(authProviderId, userCredentials);
        String userIdFromCredentials;
        try {
            userIdFromCredentials = smAuthProviderInstance.validateLocalAuth(progressMonitor, this, Map.of(), userCredentials, null);
        } catch (DBException e) {
            return null;
        }
        if (userId == null) {
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

    private String generateAuthToken(@NotNull String appSessionId, @Nullable String userId, @NotNull Connection dbCon) throws SQLException {
        JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_AUTH_TOKEN WHERE SESSION_ID=?", appSessionId);
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO CB_AUTH_TOKEN(TOKEN_ID, SESSION_ID, USER_ID, EXPIRATION_TIME) " +
                "VALUES(?,?,?,?)")) {

            String authToken = SecurityUtils.generatePassword(32);
            dbStat.setString(1, authToken);
            dbStat.setString(2, appSessionId);
            if (userId == null) {
                dbStat.setNull(3, Types.VARCHAR);
            } else {
                dbStat.setString(3, userId);
            }
            var expirationTime = Timestamp.valueOf(LocalDateTime.now().plusHours(TOKEN_HOURS_ALIVE_TIME));
            dbStat.setTimestamp(4, expirationTime);
            dbStat.execute();
            return authToken;
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
                if (Timestamp.from(Instant.now()).after(expiredDate)) {
                    throw new SMException("Token expired");
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

    @NotNull
    @Override
    public SMDataSourceGrant[] getSubjectConnectionAccess(@NotNull String[] subjectIds) throws DBException {
        if (subjectIds.length == 0) {
            return new SMDataSourceGrant[0];
        }
        List<String> allSubjects = new ArrayList<>();
        Collections.addAll(allSubjects, subjectIds);

        try (Connection dbCon = database.openConnection()) {
            {
                StringBuilder sql = new StringBuilder("SELECT ROLE_ID FROM CB_USER_ROLE WHERE USER_ID IN (");
                appendStringParameters(sql, subjectIds);
                sql.append(")");

                try (Statement dbStat = dbCon.createStatement()) {
                    try (ResultSet dbResult = dbStat.executeQuery(sql.toString())) {
                        while (dbResult.next()) {
                            allSubjects.add(dbResult.getString(1));
                        }
                    }
                }
            }
            {
                StringBuilder sql = new StringBuilder("SELECT DA.DATASOURCE_ID,DA.SUBJECT_ID,S.SUBJECT_TYPE FROM CB_DATASOURCE_ACCESS DA,\n" +
                    "CB_AUTH_SUBJECT S\nWHERE S.SUBJECT_ID = DA.SUBJECT_ID AND DA.SUBJECT_ID IN (");
                appendStringParameters(sql, allSubjects.toArray(new String[0]));
                sql.append(")");

                if (allSubjects.isEmpty()) {
                    return new SMDataSourceGrant[0];
                }
                try (Statement dbStat = dbCon.createStatement()) {
                    List<SMDataSourceGrant> result = new ArrayList<>();
                    try (ResultSet dbResult = dbStat.executeQuery(sql.toString())) {
                        while (dbResult.next()) {
                            result.add(new SMDataSourceGrant(
                                dbResult.getString(1),
                                dbResult.getString(2),
                                SMSubjectType.fromCode(dbResult.getString(3))));
                        }
                    }
                    return result.toArray(new SMDataSourceGrant[0]);
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading datasource access", e);
        }
    }

    @Override
    public void setSubjectConnectionAccess(@NotNull String subjectId, @NotNull List<String> connectionIds, String grantorId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                JDBCUtils.executeStatement(dbCon,
                    "DELETE FROM CB_DATASOURCE_ACCESS WHERE SUBJECT_ID=?", subjectId);
                if (!CommonUtils.isEmpty(connectionIds)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement(
                        "INSERT INTO CB_DATASOURCE_ACCESS(SUBJECT_ID,GRANT_TIME,GRANTED_BY,DATASOURCE_ID) VALUES(?,?,?,?)")) {
                        dbStat.setString(1, subjectId);
                        dbStat.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
                        dbStat.setString(3, grantorId);
                        for (String connectionId : connectionIds) {
                            dbStat.setString(4, connectionId);
                            dbStat.execute();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error granting datasource access", e);
        }
    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getConnectionSubjectAccess(String connectionId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            {
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "SELECT DA.SUBJECT_ID,S.SUBJECT_TYPE\n" +
                        "FROM CB_DATASOURCE_ACCESS DA,CB_AUTH_SUBJECT S\n" +
                        "WHERE S.SUBJECT_ID = DA.SUBJECT_ID AND DA.DATASOURCE_ID=?")) {
                    dbStat.setString(1, connectionId);
                    List<SMDataSourceGrant> result = new ArrayList<>();
                    try (ResultSet dbResult = dbStat.executeQuery()) {
                        while (dbResult.next()) {
                            result.add(new SMDataSourceGrant(
                                connectionId,
                                dbResult.getString(1),
                                SMSubjectType.fromCode(dbResult.getString(2))));
                        }
                    }
                    return result.toArray(new SMDataSourceGrant[0]);
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading datasource access", e);
        }
    }

    @Override
    public void setConnectionSubjectAccess(@NotNull String connectionId, @Nullable String[] subjects, @Nullable String grantorId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                // Delete all permissions
                JDBCUtils.executeStatement(dbCon,
                    "DELETE FROM CB_DATASOURCE_ACCESS WHERE DATASOURCE_ID=?", connectionId);
                if (!ArrayUtils.isEmpty(subjects)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement(
                        "INSERT INTO CB_DATASOURCE_ACCESS(DATASOURCE_ID,GRANT_TIME,GRANTED_BY,SUBJECT_ID) VALUES(?,?,?,?)")) {
                        dbStat.setString(1, connectionId);
                        dbStat.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
                        dbStat.setString(3, grantorId);
                        for (String subject : subjects) {
                            dbStat.setString(4, subject);
                            dbStat.execute();
                        }
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error granting datasource access", e);
        }
    }

    private void appendStringParameters(StringBuilder sql, @NotNull String[] subjectIds) {
        for (int i = 0; i < subjectIds.length; i++) {
            String id = subjectIds[i];
            if (i > 0) sql.append(",");
            sql.append("'").append(id.replace("'", "''")).append("'");
        }
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
            throw new DBCException("Error reading session state", e);
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

}

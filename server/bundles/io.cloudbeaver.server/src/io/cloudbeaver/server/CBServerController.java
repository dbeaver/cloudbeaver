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
package io.cloudbeaver.server;

import io.cloudbeaver.DBWServerController;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderPropertyDescriptor;
import io.cloudbeaver.registry.WebAuthProviderPropertyEncryption;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Server controller
 */
class CBServerController implements DBWServerController {

    private static final Log log = Log.getLog(CBServerController.class);

    private final CBDatabase database;

    CBServerController(CBDatabase database) {
        this.database = database;
    }

    @Override
    public void createUser(WebUser user) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER(USER_ID,IS_ACTIVE,CREATE_TIME) VALUES(?,?,?)")) {
                dbStat.setString(1, user.getUserId());
                dbStat.setString(2, "Y");
                dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                dbStat.execute();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user in database", e);
        }
    }

    @Override
    public void deleteUser(String userId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_USER WHERE USER_ID=?", userId);
        } catch (SQLException e) {
            throw new DBCException("Error deleting user from database", e);
        }
    }

    @Override
    public void setUserRoles(String userId, String[] roleIds, String grantorId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
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
        } catch (SQLException e) {
            throw new DBCException("Error saving user roles in database", e);
        }
    }

    @Override
    public void setUserCredentials(String userId, WebAuthProviderDescriptor authProvider, Map<String, Object> credentials) throws DBCException {
        List<String[]> transformedCredentials;
        try {
            transformedCredentials = credentials.entrySet().stream().map(cred -> {
                String propertyName = cred.getKey();
                WebAuthProviderPropertyDescriptor property = authProvider.getProperty(propertyName);
                if (property == null) {
                    throw new IllegalArgumentException("Invalid auth provider '" + authProvider.getId() + "' property '" + propertyName + "'");
                }
                String encodedValue = CommonUtils.toString(cred.getValue());
                encodedValue = property.getEncryption().encrypt(userId, encodedValue);
                return new String[] {propertyName, encodedValue };
            }).collect(Collectors.toList());
        } catch (Exception e) {
            throw new DBCException("Error passing properties to provider", e);
        }
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_USER_CREDENTIALS WHERE USER_ID=? AND PROVIDER_ID=?", userId, authProvider.getId());
            if (!CommonUtils.isEmpty(credentials)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_CREDENTIALS(USER_ID,PROVIDER_ID,CRED_ID,CRED_VALUE) VALUES(?,?,?,?)")) {
                    for (String[] cred : transformedCredentials) {
                        dbStat.setString(1, userId);
                        dbStat.setString(2, authProvider.getId());
                        dbStat.setString(3, cred[0]);
                        dbStat.setString(4, cred[1]);
                        dbStat.execute();
                    }
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user credentials in database", e);
        }
    }

    @Override
    public String findUserByCredentials(WebAuthProviderDescriptor authProvider, Map<String, Object> authParameters) throws DBCException {
        Map<String, Object> identCredentials = new LinkedHashMap<>();
        for (WebAuthProviderPropertyDescriptor prop : authProvider.getProperties()) {
            if (prop.isIdentifying()) {
                String propId = CommonUtils.toString(prop.getId());
                Object paramValue = authParameters.get(propId);
                if (paramValue == null) {
                    throw new DBCException("Authentication parameter '" + prop.getId() + "' is missing");
                }
                if (prop.getEncryption() == WebAuthProviderPropertyEncryption.hash) {
                    throw new DBCException("Hash encryption can't be used in identifying credentials");
                }
                identCredentials.put(propId, paramValue);
            }
        }
        if (identCredentials.isEmpty()) {
            throw new DBCException("No identifying credentials in provider '" + authProvider.getId() + "'");
        }
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT UC.USER_ID FROM CB_USER_CREDENTIALS UC\n");
        for (int joinNum = 0; joinNum < identCredentials.size() - 1; joinNum++) {
            String joinAlias = "UC" + (joinNum + 2);
            sql.append(",CB_USER_CREDENTIALS ").append(joinAlias).append(" ON ")
                .append(joinAlias).append(".USER_ID=UC.USER_ID")
                .append(joinAlias).append(".PROVIDER_ID=UC.PROVIDER_ID AND ")
                .append(joinAlias).append("CRED_ID=? AND ")
                .append(joinAlias).append("CRED_VALUE=?");
        }
        sql.append("WHERE UC.CRED_ID=? AND UC.CRED_VALUE=? AND UC.PROVIDER_ID=?");
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(sql.toString())) {
                int param = 1;
                for (Map.Entry<String, Object> credEntry : identCredentials.entrySet()) {
                    dbStat.setString(param++, credEntry.getKey());
                    dbStat.setString(param++, CommonUtils.toString(credEntry.getValue()));
                }
                dbStat.setString(param, authProvider.getId());

                try (ResultSet dbResult = dbStat.executeQuery()) {
                    String userId = null;
                    while (dbResult.next()) {
                        String credUserId = dbResult.getString(1);
                        if (userId == null) {
                            userId = credUserId;
                        } else if (!userId.equals(credUserId)) {
                            log.error("Multiple users associated with the same credentials! " + credUserId + ", " + userId);
                        }
                    }
                    return userId;
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error while searching credentials", e);
        }
    }

    @Override
    public Map<String, Object> getUserCredentials(String userId, WebAuthProviderDescriptor authProvider) throws DBCException {
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
    public WebRole[] readAllRoles() throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Map<String, WebRole> roles = new LinkedHashMap<>();
            try (Statement dbStat = dbCon.createStatement()) {
                try (ResultSet dbResult = dbStat.executeQuery("SELECT * FROM CB_ROLE ORDER BY ROLE_ID")) {
                    while (dbResult.next()) {
                        WebRole role = new WebRole();
                        role.setId(dbResult.getString("ROLE_ID"));
                        role.setName(dbResult.getString("ROLE_NAME"));
                        role.setDescription(dbResult.getString("ROLE_DESCRIPTION"));
                        roles.put(role.getId(), role);
                    }
                }
                try (ResultSet dbResult = dbStat.executeQuery("SELECT ROLE_ID,PERMISSION_ID FROM CB_ROLE_PERMISSIONS")) {
                    while (dbResult.next()) {
                        WebRole role = roles.get(dbResult.getString(1));
                        if (role != null) {
                            role.addPermission(dbResult.getString(2));
                        }
                    }
                }
            }
            return roles.values().toArray(new WebRole[0]);
        } catch (SQLException e) {
            throw new DBCException("Error saving role in database", e);
        }
    }

    @Override
    public void createRole(WebRole role) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_ROLE(ROLE_ID,ROLE_NAME,ROLE_DESCRIPTION,CREATE_TIME) VALUES(?,?,?,?)")) {
                dbStat.setString(1, role.getId());
                dbStat.setString(2, CommonUtils.notEmpty(role.getName()));
                dbStat.setString(3, CommonUtils.notEmpty(role.getDescription()));
                dbStat.setTimestamp(4, new Timestamp(System.currentTimeMillis()));
                dbStat.execute();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving role in database", e);
        }
    }

    @Override
    public void deleteRole(String roleId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_ROLE WHERE ROLE_ID=?", roleId);
        } catch (SQLException e) {
            throw new DBCException("Error deleting role from database", e);
        }
    }

    @Override
    public void setRolePermissions(String roleId, String[] permissionIds, String grantorId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_ROLE_PERMISSIONS WHERE ROLE_ID=?", roleId);
            if (!ArrayUtils.isEmpty(permissionIds)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_ROLE_PERMISSIONS(ROLE_ID,PERMISSION_ID,GRANT_TIME,GRANTED_BY) VALUES(?,?,?,?)")) {
                    for (String permission : permissionIds) {
                        dbStat.setString(1, roleId);
                        dbStat.setString(2, permission);
                        dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                        dbStat.setString(4, grantorId);
                        dbStat.execute();
                    }
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving role permissions in database", e);
        }
    }

    @Override
    public Set<String> getRolePermissions(String roleId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Set<String> permissions = new HashSet<>();
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT PERMISSION_ID FROM CB_ROLE_PERMISSIONS WHERE ROLE_ID=?")) {
                dbStat.setString(1, roleId);
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

    @Override
    public Set<String> getUserPermissions(String userId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Set<String> permissions = new HashSet<>();
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT PERMISSION_ID FROM CB_ROLE_PERMISSIONS RP,CB_USER_ROLE UR\n" +
                    "WHERE RP.ROLE_ID=UR.ROLE_ID AND UR.USER_ID=?")) {
                dbStat.setString(1, userId);
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
}

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
import org.jkiss.dbeaver.model.DBConstants;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCFeatureNotSupportedException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.sql.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Server controller
 */
class CBServerController implements DBWServerController {

    private final CBDatabase database;

    public CBServerController(CBDatabase database) {
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
    public void setUserCredentials(String userId, String authProviderId, Map<String, Object> credentials) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon, "DELETE FROM CB_USER_CREDENTIALS WHERE USER_ID=? AND PROVIDER_ID=?", userId, authProviderId);
            if (!CommonUtils.isEmpty(credentials)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO CB_USER_CREDENTIALS(USER_ID,PROVIDER_ID,CRED_ID,CRED_VALUE) VALUES(?,?,?,?)")) {
                    for (Map.Entry<String, Object> cred : credentials.entrySet()) {
                        dbStat.setString(1, userId);
                        dbStat.setString(2, authProviderId);
                        dbStat.setString(3, cred.getKey());
                        dbStat.setString(4, CommonUtils.toString(cred.getValue()));
                        dbStat.execute();
                    }
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user credentials in database", e);
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

}

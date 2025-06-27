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
package io.cloudbeaver.service.security;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.auth.*;
import io.cloudbeaver.model.app.ServletAuthApplication;
import io.cloudbeaver.model.app.ServletAuthConfiguration;
import io.cloudbeaver.model.config.SMControllerConfiguration;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.registry.WebMetaParametersRegistry;
import io.cloudbeaver.service.security.bruteforce.BruteForceUtils;
import io.cloudbeaver.service.security.bruteforce.UserLoginRecord;
import io.cloudbeaver.service.security.db.CBDatabase;
import io.cloudbeaver.service.security.internal.AuthAttemptSessionInfo;
import io.cloudbeaver.service.security.internal.SMTokenInfo;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPConnectionInformation;
import org.jkiss.dbeaver.model.DBPPage;
import org.jkiss.dbeaver.model.auth.*;
import org.jkiss.dbeaver.model.data.json.JSONUtils;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.impl.jdbc.exec.JDBCTransaction;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.security.*;
import org.jkiss.dbeaver.model.security.exception.SMAccessTokenExpiredException;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.dbeaver.model.security.exception.SMRefreshTokenExpiredException;
import org.jkiss.dbeaver.model.security.user.*;
import org.jkiss.dbeaver.model.sql.SQLUtils;
import org.jkiss.dbeaver.model.websocket.event.WSUserCloseSessionsEvent;
import org.jkiss.dbeaver.model.websocket.event.WSUserDeletedEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSObjectPermissionEvent;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSSubjectPermissionEvent;
import org.jkiss.dbeaver.model.websocket.event.session.WSAuthEvent;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.SecurityUtils;

import java.lang.reflect.Type;
import java.net.URI;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Server controller
 */
public class CBEmbeddedSecurityController<T extends ServletAuthApplication>
    implements SMAdminController, SMAuthenticationManager {

    private static final Log log = Log.getLog(CBEmbeddedSecurityController.class);

    protected static final String CHAR_BOOL_TRUE = "Y";
    protected static final String CHAR_BOOL_FALSE = "N";

    private static final Type MAP_STRING_OBJECT_TYPE = new TypeToken<Map<String, Object>>() {
    }.getType();
    private static final Gson gson = new GsonBuilder().create();

    protected final T application;
    protected final CBDatabase database;
    protected final SMCredentialsProvider credentialsProvider;

    protected final SMControllerConfiguration smConfig;

    public CBEmbeddedSecurityController(
        T application,
        CBDatabase database,
        SMCredentialsProvider credentialsProvider,
        SMControllerConfiguration smConfig
    ) {
        this.application = application;
        this.database = database;
        this.credentialsProvider = credentialsProvider;
        this.smConfig = smConfig;
    }

    private boolean isSubjectExists(String subjectId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT 1 FROM {table_prefix}CB_AUTH_SUBJECT WHERE SUBJECT_ID=?")
            ) {
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

    /**
     * Creates user. Saves user id in database in lower-case.
     */
    @Override
    public void createUser(
        @NotNull String userId,
        @Nullable Map<String, String> metaParameters,
        boolean enabled,
        @Nullable String defaultAuthRole
    ) throws DBException {
        userId = userId.toLowerCase(); // creating new users only with lowercase
        validateAndCreateUser(userId, metaParameters, enabled, defaultAuthRole);
    }

    protected void validateAndCreateUser(
        @NotNull String userId,
        @Nullable Map<String, String> metaParameters,
        boolean enabled,
        @Nullable String defaultAuthRole
    ) throws DBException {
        if (CommonUtils.isEmpty(userId)) {
            throw new DBCException("Empty user name is not allowed");
        }
        if (isSubjectExists(userId)) {
            throw new DBCException("User or team '" + userId + "' already exists");
        }
        log.debug("Create user: " + userId);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                insertUser(dbCon, userId, metaParameters, enabled, defaultAuthRole);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user in database", e);
        }
    }

    /**
     * Creates user. Saves user id in database as it is.
     */
    protected void insertUser(
        @NotNull Connection dbCon,
        @NotNull String userId,
        @Nullable Map<String, String> metaParameters,
        boolean enabled,
        @Nullable String defaultAuthRole
    ) throws DBException, SQLException {
        createAuthSubject(dbCon, userId, SMSubjectType.user, true);
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO {table_prefix}CB_USER" +
                "(USER_ID,IS_ACTIVE,CREATE_TIME,DEFAULT_AUTH_ROLE) VALUES(?,?,?,?)")
        ) {
            dbStat.setString(1, userId);
            dbStat.setString(2, enabled ? CHAR_BOOL_TRUE : CHAR_BOOL_FALSE);
            dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
            if (CommonUtils.isEmpty(defaultAuthRole)) {
                dbStat.setNull(4, Types.VARCHAR);
            } else {
                dbStat.setString(4, defaultAuthRole);
            }
            dbStat.execute();
            log.info(String.format("New user created: [userId=%s]", userId));
        }
        saveSubjectMetas(dbCon, userId, metaParameters);
        String defaultTeamName = getDefaultUserTeam();
        if (!CommonUtils.isEmpty(defaultTeamName)) {
            setUserTeams(dbCon, userId, new String[]{defaultTeamName}, userId);
        }
    }

    @Override
    public void importUsers(@NotNull SMUserImportList userImportList) throws DBException {
       try (var dbCon = database.openConnection()) {
            importUsers(dbCon, userImportList);
       } catch (SQLException e) {
           log.error("Failed attempt import user: " + e.getMessage());
       }
    }

    protected void importUsers(@NotNull Connection connection, @NotNull SMUserImportList userImportList)
        throws DBException, SQLException {
        outer:
        for (SMUserProvisioning user : userImportList.getUsers()) {
            String authRole = user.getAuthRole() == null ? userImportList.getAuthRole() : user.getAuthRole();
            String userId = user.getUserId();
            Map<String, String> metaParameters = user.getMetaParameters();
            if (CommonUtils.isNotEmpty(metaParameters.get(SMStandardMeta.META_USER_ID))) {
                userId = metaParameters.get(SMStandardMeta.META_USER_ID);
            }
            for (String possibleUserId : List.of(userId, userId.toLowerCase())) {
                if (isSubjectExists(possibleUserId)) {
                    log.info("User already exist : " + possibleUserId);
                    setUserAuthRole(connection, possibleUserId, authRole);
                    enableUser(connection, possibleUserId, true, null, null);
                    continue outer;
                }
            }
            insertUser(connection, userId.toLowerCase(), metaParameters, true, authRole);
        }
    }

    @Override
    public void deleteUser(String userId) throws DBCException {
        invalidateAllUserTokens(userId);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                deleteAuthSubject(dbCon, userId);
                JDBCUtils.executeStatement(
                    dbCon,
                    "DELETE FROM {table_prefix}CB_USER WHERE USER_ID=?",
                    userId
                );
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error deleting user from database", e);
        }
        var event = new WSUserDeletedEvent(userId);
        application.getEventController().addEvent(event);
        log.info(String.format("User deleted: [userId=%s]", userId));
    }

    public void setUserTeams(String userId, String[] teamIds, String grantorId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                setUserTeams(dbCon, userId, teamIds, grantorId);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user teams in database", e);
        }
        addSubjectPermissionsUpdateEvent(userId, SMSubjectType.user);
    }

    public void addUserTeams(@NotNull String userId, @NotNull String[] teamIds, @NotNull String grantorId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                addUserTeams(dbCon, userId, teamIds, grantorId);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving user teams in database", e);
        }
        addSubjectPermissionsUpdateEvent(userId, SMSubjectType.user);
    }

    public void deleteUserTeams(@NotNull String userId, @NotNull String[] teamIds) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                deleteUserTeams(dbCon, userId, teamIds);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error delete user teams in database", e);
        }
        addSubjectPermissionsUpdateEvent(userId, SMSubjectType.user);
    }

    @Override
    public void setUserTeamRole(
        @NotNull String userId,
        @NotNull String teamId,
        @Nullable String teamRole
    ) throws DBException {
        if (!isSubjectExists(userId)) {
            throw new DBCException("User '" + userId + "' doesn't exists");
        }
        if (!isSubjectExists(teamId)) {
            throw new DBCException("Team '" + teamId + "' doesn't exists");
        }

        try (
            var dbCon = database.openConnection();
            PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE {table_prefix}CB_USER_TEAM " +
                    "SET TEAM_ROLE=? WHERE USER_ID=? AND TEAM_ID=?")
        ) {
            JDBCUtils.setStringOrNull(dbStat, 1, teamRole);
            dbStat.setString(2, userId);
            dbStat.setString(3, teamId);
            dbStat.execute();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        log.info(String.format(
            "User set team role: [userId=%s,teamId=%s, role=%s]",
            userId,
            teamId,
            teamRole
        ));
    }

    //TODO implement add/delete user teams api
    protected void setUserTeams(@NotNull Connection dbCon, String userId, String[] teamIds, String grantorId)
        throws SQLException {

        String deleteUserTeamsSql = "DELETE FROM {table_prefix}CB_USER_TEAM WHERE USER_ID=?";

        if (!ArrayUtils.isEmpty(teamIds)) {
            deleteUserTeamsSql =
                deleteUserTeamsSql + " AND TEAM_ID NOT IN (" + SQLUtils.generateParamList(teamIds.length) + ")";
        }
        try (PreparedStatement dbStat = dbCon.prepareStatement(deleteUserTeamsSql)) {
            int index = 1;
            dbStat.setString(index++, userId);
            for (String teamId : teamIds) {
                dbStat.setString(index++, teamId);
            }
            dbStat.execute();
        }

        String defaultUserTeam = getDefaultUserTeam();
        if (CommonUtils.isNotEmpty(defaultUserTeam) && !ArrayUtils.contains(teamIds, defaultUserTeam)) {
            teamIds = ArrayUtils.add(String.class, teamIds, defaultUserTeam);
        }
        if (!ArrayUtils.isEmpty(teamIds)) {
            Set<String> currentUserTeams = getCurrentUserTeams(dbCon, userId);

            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "INSERT INTO {table_prefix}CB_USER_TEAM" +
                    "(USER_ID,TEAM_ID,GRANT_TIME,GRANTED_BY) VALUES(?,?,?,?)")
            ) {
                for (String teamId : teamIds) {
                    if (currentUserTeams.contains(teamId)) {
                        continue;
                    }
                    dbStat.setString(1, userId);
                    dbStat.setString(2, teamId);
                    dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                    dbStat.setString(4, grantorId);
                    dbStat.execute();
                }
            }
        }
    }

    @NotNull
    private Set<String> getCurrentUserTeams(@NotNull Connection dbCon, String userId) throws SQLException {
        return new HashSet<>(JDBCUtils.queryStrings(
            dbCon,
            "SELECT TEAM_ID FROM {table_prefix}CB_USER_TEAM WHERE USER_ID=?",
            userId
        ));
    }

    protected void addUserTeams(
        @NotNull Connection dbCon,
        @NotNull String userId,
        @NotNull String[] teamIds,
        @NotNull String grantorId
    ) throws SQLException {
        if (ArrayUtils.isEmpty(teamIds)) {
            return;
        }

        String defaultUserTeam = getDefaultUserTeam();
        if (CommonUtils.isNotEmpty(defaultUserTeam) && !ArrayUtils.contains(teamIds, defaultUserTeam)) {
            teamIds = ArrayUtils.add(String.class, teamIds, defaultUserTeam);
        }

        Set<String> currentUserTeams = getCurrentUserTeams(dbCon, userId);

        List<String> resultTeamIds = new ArrayList<>();
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO {table_prefix}CB_USER_TEAM" +
                "(USER_ID,TEAM_ID,GRANT_TIME,GRANTED_BY) VALUES(?,?,?,?)")
        ) {
            for (String teamId : teamIds) {
                if (currentUserTeams.contains(teamId)) {
                    continue;
                }
                resultTeamIds.add(teamId);
                dbStat.setString(1, userId);
                dbStat.setString(2, teamId);
                dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                dbStat.setString(4, grantorId);
                dbStat.execute();
            }
        }
        log.info(String.format(
            "User added to team: [userId=%s,team=%s, grantorUserId=%s]",
            userId,
            String.join(",", resultTeamIds),
            grantorId
        ));
    }

    protected void deleteUserTeams(
        @NotNull Connection dbCon,
        @NotNull String userId,
        @NotNull String[] teamIds
    ) throws SQLException {
        String deleteUserTeamsSql = "DELETE FROM {table_prefix}CB_USER_TEAM WHERE USER_ID=? " +
                "AND TEAM_ID IN (" + SQLUtils.generateParamList(teamIds.length) + ")";

        try (PreparedStatement dbStat = dbCon.prepareStatement(deleteUserTeamsSql)) {
            int index = 1;
            dbStat.setString(index, userId);
            for (String teamId : teamIds) {
                index++;
                dbStat.setString(index, teamId);
            }
            dbStat.execute();
        }
        log.info(String.format("User deleted from team: [userId=%s,teamIds=%s]", userId, String.join(",", teamIds)));
    }

    @NotNull
    @Override
    public SMUserTeam[] getUserTeams(String userId) throws DBException {
        Map<String, SMUserTeam> teams = new LinkedHashMap<>();
        try (Connection dbCon = database.openConnection()) {
            String defaultUserTeam = getDefaultUserTeam();
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT R.*,S.IS_SECRET_STORAGE,UR.TEAM_ROLE FROM {table_prefix}CB_USER_TEAM UR, {table_prefix}CB_TEAM R, " +
                    "{table_prefix}CB_AUTH_SUBJECT S " +
                        "WHERE UR.USER_ID=? AND UR.TEAM_ID = R.TEAM_ID " +
                        "AND S.SUBJECT_ID IN (R.TEAM_ID,?)")
            ) {
                dbStat.setString(1, userId);
                dbStat.setString(2, defaultUserTeam);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        var team = fetchTeam(dbResult);
                        String teamRole = dbResult.getString("TEAM_ROLE");
                        teams.put(team.getTeamId(), new SMUserTeam(team, teamRole));
                    }
                }
            }
            readSubjectsMetas(dbCon, SMSubjectType.team, null, teams);
            return teams.values().toArray(new SMUserTeam[0]);
        } catch (SQLException e) {
            throw new DBCException("Error while reading user teams", e);
        }
    }

    private Set<String> getAllLinkedSubjects(Connection dbCon, String subjectId) throws SQLException {
        Set<String> allSubjects = new HashSet<>();
        allSubjects.add(subjectId);
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "SELECT TEAM_ID FROM {table_prefix}CB_USER_TEAM UR WHERE USER_ID=?")
        ) {
            dbStat.setString(1, subjectId);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                while (dbResult.next()) {
                    allSubjects.add(dbResult.getString(1));
                }
            }
        }
        return allSubjects;
    }

    @NotNull
    @Override
    public SMUserTeam[] getCurrentUserTeams() throws DBException {
        return getUserTeams(getUserIdOrThrow());
    }

    @Override
    public SMUser getUserById(String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            SMUser user;
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                """
                    SELECT U.USER_ID,U.IS_ACTIVE,U.DEFAULT_AUTH_ROLE,S.IS_SECRET_STORAGE,U.CHANGE_DATE,U.DISABLED_BY,U.DISABLE_REASON
                    FROM {table_prefix}CB_USER U, {table_prefix}CB_AUTH_SUBJECT S
                    WHERE U.USER_ID=? AND U.USER_ID=S.SUBJECT_ID""")
            ) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        user = fetchUser(dbResult, true);
                    } else {
                        return null;
                    }
                }
            }
            readSubjectMetas(dbCon, user);
            // Teams
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT TEAM_ID FROM {table_prefix}CB_USER_TEAM WHERE USER_ID=?")
            ) {
                String defaultUserTeam = getDefaultUserTeam();
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    Set<String> teamIDs = new LinkedHashSet<>();
                    while (dbResult.next()) {
                        teamIDs.add(dbResult.getString(1));
                    }
                    teamIDs.add(defaultUserTeam);
                    user.setUserTeams(teamIDs.toArray(new String[0]));
                }
            }
            return user;
        } catch (SQLException e) {
            throw new DBCException("Error while searching credentials", e);
        }
    }

    @NotNull
    @Override
    public SMUser getCurrentUser() throws DBException {
        return getUserById(getUserIdOrThrow());
    }

    @Override
    public int countUsers(@NotNull SMUserFilter filter) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT COUNT(*) FROM {table_prefix}CB_USER" + buildUsersFilter(filter))) {
                setUsersFilterValues(dbStat, filter, 1);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        return dbResult.getInt(1);
                    } else {
                        return 0;
                    }
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error while counting users", e);
        }
    }

    @NotNull
    @Override
    public SMUser[] findUsers(String userNameMask) throws DBCException {
        return findUsers(new SMUserFilter(userNameMask, null, new DBPPage(0, Integer.MAX_VALUE)));
    }

    @NotNull
    @Override
    public SMUser[] findUsers(@NotNull SMUserFilter filter)
        throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            Map<String, SMUser> result = new LinkedHashMap<>();
            // Read users
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT USER_ID,IS_ACTIVE,DEFAULT_AUTH_ROLE,CHANGE_DATE,DISABLED_BY,"
                    + "DISABLE_REASON FROM {table_prefix}CB_USER"
                    + buildUsersFilter(filter) + "\nORDER BY USER_ID " + getOffsetLimitPart(filter))) {
                setUsersFilterValues(dbStat, filter, 1);

                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        SMUser user = fetchUser(dbResult, false);
                        result.put(user.getUserId(), user);
                    }
                }
            }
            if (result.isEmpty()) {
                return new SMUser[0];
            }

            readSubjectsMetas(dbCon, SMSubjectType.user, filter.getUserIdMask(), result);
            String teamsSql =
                "SELECT USER_ID,TEAM_ID FROM {table_prefix}CB_USER_TEAM\n" +
                "WHERE USER_ID IN (" + SQLUtils.generateParamList(result.size()) + ")";
            // Read teams
            try (PreparedStatement dbStat = dbCon.prepareStatement(teamsSql)) {
                int parameterIndex = 1;
                for (String userId : result.keySet()) {
                    dbStat.setString(parameterIndex++, userId);
                }
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String userId = dbResult.getString(1);
                        String teamId = dbResult.getString(2);
                        SMUser user = result.get(userId);
                        if (user != null) {
                            String[] teams = ArrayUtils.add(String.class, user.getUserTeams(), teamId);
                            user.setUserTeams(teams);
                        }
                    }
                }
            }
            return result.values().toArray(new SMUser[0]);
        } catch (SQLException e) {
            throw new DBCException("Error while loading users", e);
        }
    }

    private String getOffsetLimitPart(@NotNull SMUserFilter filter) {
        return database.getDialect().getOffsetLimitQueryPart(filter.getPage().getOffset(), filter.getPage().getLimit());
    }

    private String buildUsersFilter(SMUserFilter filter) {
        StringBuilder where = new StringBuilder();
        List<String> whereParts = new ArrayList<>();
        if (!CommonUtils.isEmpty(filter.getUserIdMask())) {
            whereParts.add("USER_ID LIKE ?");
        }
        if (filter.getEnabledState() != null) {
            whereParts.add("IS_ACTIVE=?");
        }
        if (!whereParts.isEmpty()) {
            where.append(whereParts.stream().collect(Collectors.joining(" AND ", " WHERE ", "")));
        }
        return where.toString();
    }

    private int setUsersFilterValues(PreparedStatement dbStat, SMUserFilter filter, int parameterIndex)
            throws SQLException {
        if (!CommonUtils.isEmpty(filter.getUserIdMask())) {
            dbStat.setString(parameterIndex++, "%" + filter.getUserIdMask() + "%");
        }
        if (filter.getEnabledState() != null) {
            dbStat.setString(parameterIndex++, filter.getEnabledState() ? CHAR_BOOL_TRUE : CHAR_BOOL_FALSE);
        }

        return parameterIndex;
    }

    private void cleanupSubjectMeta(Connection dbCon, String subjectId) throws SQLException {
        // Delete old metas
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "DELETE FROM {table_prefix}CB_SUBJECT_META WHERE SUBJECT_ID=?")
        ) {
            dbStat.setString(1, subjectId);
            dbStat.execute();
        }
    }

    private void readSubjectMetas(Connection dbCon, SMSubject subject) throws SQLException {
        // Metas
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "SELECT META_ID,META_VALUE FROM {table_prefix}CB_SUBJECT_META WHERE SUBJECT_ID=?")
        ) {
            dbStat.setString(1, subject.getSubjectId());
            try (ResultSet dbResult = dbStat.executeQuery()) {
                while (dbResult.next()) {
                    subject.setMetaParameter(
                        dbResult.getString(1),
                        dbResult.getString(2)
                    );
                }
            }
        }
    }

    private void readSubjectsMetas(Connection dbCon, SMSubjectType subjectType, String userIdMask,
                                   Map<String, ? extends SMSubject> result) throws SQLException {
        // Read metas
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "SELECT m.SUBJECT_ID,m.META_ID,m.META_VALUE FROM {table_prefix}CB_AUTH_SUBJECT s, " +
                "{table_prefix}CB_SUBJECT_META m\n" +
                "WHERE s.SUBJECT_TYPE=? AND s.SUBJECT_ID=m.SUBJECT_ID" +
                (CommonUtils.isEmpty(userIdMask) ? "" : " AND s.SUBJECT_ID LIKE ?"))
        ) {
            dbStat.setString(1, subjectType.getCode());
            if (!CommonUtils.isEmpty(userIdMask)) {
                dbStat.setString(2, "%" + userIdMask + "%");
            }
            try (ResultSet dbResult = dbStat.executeQuery()) {
                while (dbResult.next()) {
                    String subjectId = dbResult.getString(1);
                    SMSubject subject = result.get(subjectId);
                    if (subject != null) {
                        subject.setMetaParameter(
                            dbResult.getString(2),
                            dbResult.getString(3)
                        );
                    }
                }
            }
        }
    }

    private void saveSubjectMetas(Connection dbCon, String subjectId, Map<String, String> metaParameters) throws SQLException {
        if (!CommonUtils.isEmpty(metaParameters)) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "INSERT INTO {table_prefix}CB_SUBJECT_META(SUBJECT_ID,META_ID,META_VALUE) VALUES(?,?,?)")
            ) {
                dbStat.setString(1, subjectId);
                for (Map.Entry<String, String> mp : metaParameters.entrySet()) {
                    dbStat.setString(2, mp.getKey());
                    dbStat.setString(3, mp.getValue());
                    dbStat.execute();
                }
            }
        }
    }

    @Override
    public Map<String, Object> getCurrentUserParameters() throws DBCException {
        String userId = getUserIdOrThrow();
        try (Connection dbCon = database.openConnection()) {
            Map<String, Object> result = new LinkedHashMap<>();
            // Read users
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT * FROM {table_prefix}CB_USER_PREFERENCES WHERE USER_ID=?")
            ) {
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
    public void setCurrentUserParameter(@NotNull String name, @Nullable Object value) throws DBException {
        String userId = getUserIdOrThrow();
        try (Connection dbCon = database.openConnection();
             JDBCTransaction txn = new JDBCTransaction(dbCon)
        ) {
            updateUserParameterValue(dbCon, userId, name, value);
            txn.commit();
        } catch (SQLException e) {
            throw new DBCException("Error while updating user configuration", e);
        }
    }

    private void updateUserParameterValue(
        @NotNull Connection dbCon, @NotNull String userId, @NotNull String name, @Nullable Object value
    ) throws SQLException {
        if (value == null) {
            // Delete old metas
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "DELETE FROM {table_prefix}CB_USER_PREFERENCES WHERE USER_ID=? AND PREFERENCE_ID=?")
            ) {
                dbStat.setString(1, userId);
                dbStat.setString(2, name);
                dbStat.execute();
            }
        } else {
            // Update/Insert parameter
            boolean updated;
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE {table_prefix}CB_USER_PREFERENCES SET PREFERENCE_VALUE=? WHERE USER_ID=? AND PREFERENCE_ID=?")
            ) {
                dbStat.setString(1, CommonUtils.toString(value));
                dbStat.setString(2, userId);
                dbStat.setString(3, name);
                updated = dbStat.executeUpdate() > 0;
            }
            if (!updated) {
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO {table_prefix}CB_USER_PREFERENCES (USER_ID,PREFERENCE_ID,PREFERENCE_VALUE) VALUES(?,?,?)")
                ) {
                    dbStat.setString(1, userId);
                    dbStat.setString(2, name);
                    dbStat.setString(3, CommonUtils.toString(value));
                    dbStat.executeUpdate();
                }
            }
        }
    }

    @Override
    public void setCurrentUserParameters(@NotNull Map<String, Object> parameters) throws DBException {
        String userId = getUserIdOrThrow();
        try (Connection dbCon = database.openConnection();
             JDBCTransaction txn = new JDBCTransaction(dbCon)
        ) {
            for (Map.Entry<String, Object> parameter : parameters.entrySet()) {
                updateUserParameterValue(dbCon, userId, parameter.getKey(), parameter.getValue());
            }
            txn.commit();
        } catch (SQLException e) {
            throw new DBCException("Error while updating user configuration", e);
        }
    }

    public void enableUser(
        @NotNull String userId,
        boolean enabled,
        @Nullable String disabledBy,
        @Nullable String disableReason
    ) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            enableUser(dbCon, userId, enabled, disabledBy, disableReason);
        } catch (SQLException e) {
            throw new DBCException("Error while updating user configuration", e);
        }
    }

    protected void enableUser(
        @NotNull Connection dbCon,
        @NotNull String userId,
        boolean enabled,
        @Nullable String disabledBy,
        @Nullable String disableReason
    ) throws SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "UPDATE {table_prefix}CB_USER SET IS_ACTIVE=?, CHANGE_DATE=?, DISABLED_BY=?, DISABLE_REASON=? WHERE USER_ID=?")) {
            dbStat.setString(1, enabled ? CHAR_BOOL_TRUE : CHAR_BOOL_FALSE);
            dbStat.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
            JDBCUtils.setStringOrNull(dbStat, 3, enabled ? null : disabledBy);
            JDBCUtils.setStringOrNull(dbStat, 4, enabled ? null : disableReason);
            dbStat.setString(5, userId);
            dbStat.executeUpdate();
        }
        log.info(String.format("User updated: [userId=%s, isActive=%s, reason=%s]", userId, enabled, disableReason));
    }

    @Override
    public void setUserAuthRole(@NotNull String userId, @Nullable String authRole) throws DBException {
        if (credentialsProvider.getActiveUserCredentials() != null
            && userId.equals(credentialsProvider.getActiveUserCredentials().getUserId()
        )) {
            throw new SMException("User cannot change his own role");
        }
        try (Connection dbCon = database.openConnection()) {
            setUserAuthRole(dbCon, userId, authRole);
        } catch (SQLException e) {
            throw new DBCException("Error while updating user authentication role", e);
        }
        addSubjectPermissionsUpdateEvent(userId, SMSubjectType.user);
    }

    public void setUserAuthRole(@NotNull Connection dbCon, @NotNull String userId, @Nullable String authRole)
        throws DBException, SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "UPDATE {table_prefix}CB_USER SET DEFAULT_AUTH_ROLE=? WHERE USER_ID=?")) {
            if (authRole == null) {
                dbStat.setNull(1, Types.VARCHAR);
            } else {
                dbStat.setString(1, authRole);
            }
            dbStat.setString(2, userId);
            if (dbStat.executeUpdate() <= 0) {
                throw new SMException("User not found");
            }
            log.info(String.format("User set auth role: [userId=%s,role=%s]", userId, authRole));
        }
    }


    ///////////////////////////////////////////
    // Credentials

    private static SMAuthCredentialsProfile getCredentialProfileByParameters(WebAuthProviderDescriptor authProvider, Set<String> keySet) {
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
    public void setCurrentUserCredentials(
        @NotNull String authProviderId,
        @NotNull Map<String, Object> credentials
    ) throws DBException {
        String userId = getUserIdOrThrow();
        setUserCredentials(userId, authProviderId, credentials);
    }

    @Override
    public void setUserCredentials(
        @NotNull String userId,
        @NotNull String authProviderId,
        @NotNull Map<String, Object> credentials
    ) throws DBException {
        var existUserByCredentials = findUserByCredentials(getAuthProvider(authProviderId), credentials, false);
        if (existUserByCredentials != null && !existUserByCredentials.equals(userId)) {
            throw new DBException("Another user is already linked to the specified credentials");
        }
        List<String[]> transformedCredentials;
        WebAuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        if (authProvider.isCaseInsensitive() && !isSubjectExists(userId) && isSubjectExists(userId.toLowerCase())) {
            log.warn("User with id '" + userId + "' not found, credentials will be set for the user: " + userId.toLowerCase());
            userId = userId.toLowerCase();
        }
        try {
            SMAuthCredentialsProfile credProfile = getCredentialProfileByParameters(authProvider, credentials.keySet());
            String finalUserId = userId;
            transformedCredentials = credentials.entrySet().stream().map(cred -> {
                String propertyName = cred.getKey();
                AuthPropertyDescriptor property = credProfile.getCredentialParameter(propertyName);
                if (property == null) {
                    return null;
                }
                String encodedValue = CommonUtils.toString(cred.getValue());
                encodedValue = property.getEncryption().encrypt(finalUserId, encodedValue);
                return new String[]{propertyName, encodedValue};
            }).toList();
        } catch (Exception e) {
            throw new DBCException(e.getMessage(), e);
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                JDBCUtils.executeStatement(
                    dbCon,
                    "DELETE FROM {table_prefix}CB_USER_CREDENTIALS WHERE USER_ID=? AND PROVIDER_ID=?",
                    userId,
                    authProvider.getId()
                );
                if (!CommonUtils.isEmpty(credentials)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement(
                        "INSERT INTO {table_prefix}CB_USER_CREDENTIALS" +
                            "(USER_ID,PROVIDER_ID,CRED_ID,CRED_VALUE) VALUES(?,?,?,?)")
                    ) {
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
        log.info(String.format("Set credentials for user: [userId=%s,providerId=%s]", userId, authProviderId));
    }

    @Override
    public void deleteUserCredentials(@NotNull String userId, @NotNull String authProviderId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(
                dbCon,
                "DELETE FROM {table_prefix}CB_USER_CREDENTIALS WHERE USER_ID=? AND PROVIDER_ID=?",
                userId,
                authProviderId
            );
        } catch (SQLException e) {
            throw new DBCException("Error deleting user credentials", e);
        }
        log.info(String.format("User credentials deleted: [userId=%s, providerId=%s]", userId, authProviderId));
    }

    @Nullable
    private String findUserByCredentials(
        @NotNull WebAuthProviderDescriptor authProvider,
        @NotNull Map<String, Object> authParameters,
        boolean onlyActive // throws exception if user is inactive
    ) throws DBException {
        String userId = findUserByCredentials(authProvider, authParameters, onlyActive, false);
        if (userId == null && authProvider.isCaseInsensitive()) {
            // try to find user id with lower case is auth provider is case-insensitive
            return findUserByCredentials(authProvider, authParameters, onlyActive, true);
        }
        return userId;
    }

    @Nullable
    private String findUserByCredentials(
        @NotNull WebAuthProviderDescriptor authProvider,
        @NotNull Map<String, Object> authParameters,
        boolean onlyActive,
        boolean isCaseInsensitive
    ) throws DBCException {
        Map<String, String> identCredentials = new LinkedHashMap<>();
        String[] propNames = authParameters.keySet().toArray(new String[0]);
        for (AuthPropertyDescriptor prop : authProvider.getCredentialParameters(propNames)) {
            if (prop.isIdentifying()) {
                String propId = CommonUtils.toString(prop.getId());
                if (authParameters.get(propId) == null) {
                    throw new DBCException("Authentication parameter '" + prop.getId() + "' is missing");
                }
                if (prop.getEncryption() == AuthPropertyEncryption.hash) {
                    throw new DBCException("Hash encryption can't be used in identifying credentials");
                }
                String paramValue = CommonUtils.toString(authParameters.get(propId));
                identCredentials.put(
                    propId,
                    isCaseInsensitive ? paramValue.toLowerCase() : paramValue
                );
            }
        }
        if (identCredentials.isEmpty()) {
            return null;
        }
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT U.USER_ID,U.IS_ACTIVE FROM {table_prefix}CB_USER U, {table_prefix}CB_USER_CREDENTIALS UC\n");
        for (int joinNum = 0; joinNum < identCredentials.size() - 1; joinNum++) {
            sql.append(", {table_prefix}CB_USER_CREDENTIALS UC").append(joinNum + 2);
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
                for (Map.Entry<String, String> credEntry : identCredentials.entrySet()) {
                    dbStat.setString(param++, credEntry.getKey());
                    dbStat.setString(param++, credEntry.getValue());
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

                    if (userId != null && onlyActive && !isActive) {
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
        WebAuthProviderDescriptor authProvider = getAuthProvider(authProviderId);
        Map<String, Object> creds = getUserCredentials(authProvider, userId);
        if (creds.isEmpty() && authProvider.isCaseInsensitive()) {
            return getUserCredentials(authProvider, userId.toLowerCase());
        }
        return creds;
    }

    @NotNull
    private Map<String, Object> getUserCredentials(WebAuthProviderDescriptor authProvider, String userId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT CRED_ID,CRED_VALUE FROM {table_prefix}CB_USER_CREDENTIALS\n" +
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
            throw new DBCException("Error reading user credentials", e);
        }
    }

    @NotNull
    @Override
    public Map<String, Object> getCurrentUserCredentials(@NotNull String authProviderId) throws DBException {
        return getUserCredentials(getUserIdOrThrow(), authProviderId);
    }

    @Override
    public String[] getCurrentUserLinkedProviders() throws DBException {
        return getUserLinkedProviders(getUserIdOrThrow());
    }

    @Override
    public String[] getUserLinkedProviders(@NotNull String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT DISTINCT PROVIDER_ID FROM {table_prefix}CB_USER_CREDENTIALS\n WHERE USER_ID=?")) {
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
            throw new DBCException("Error reading user linked providers", e);
        }
    }

    @NotNull
    @Override
    public SMPropertyDescriptor[] getMetaParametersBySubjectType(SMSubjectType subjectType) {
        // First add global metas
        List<DBPPropertyDescriptor> props = new ArrayList<>(
            WebMetaParametersRegistry.getInstance().getMetaParameters(subjectType));

        // Add metas from enabled auth providers
        ServletAuthConfiguration authConfiguration = application.getAuthConfiguration();
        for (String apId : authConfiguration.getEnabledAuthProviders()) {
            WebAuthProviderDescriptor ap = WebAuthProviderRegistry.getInstance().getAuthProvider(apId);
            if (ap != null) {
                List<DBPPropertyDescriptor> metaProps = ap.getMetaParameters(SMSubjectType.team);
                if (!CommonUtils.isEmpty(metaProps)) {
                    props.addAll(metaProps);
                }
            }
        }

        return props.stream()
            .map(SMPropertyDescriptor::new)
            .toArray(SMPropertyDescriptor[]::new);
    }

    ///////////////////////////////////////////
    // Teams

    @NotNull
    @Override
    public SMTeam[] readAllTeams() throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            String defaultUserTeam = getDefaultUserTeam();
            Map<String, SMTeam> teams = new LinkedHashMap<>();
            String query =
                """
                    SELECT T.*, S.IS_SECRET_STORAGE FROM {table_prefix}CB_TEAM T, \
                    {table_prefix}CB_AUTH_SUBJECT S \
                    WHERE T.TEAM_ID IN (S.SUBJECT_ID, ?) ORDER BY TEAM_ID""";
            try (PreparedStatement dbPreparedStatement = dbCon.prepareStatement(query)) {
                dbPreparedStatement.setString(1, defaultUserTeam);
                try (ResultSet dbResult = dbPreparedStatement.executeQuery()) {
                    while (dbResult.next()) {
                        SMTeam team = fetchTeam(dbResult);
                        teams.put(team.getTeamId(), team);
                    }
                }
            }
            query = """
                SELECT SUBJECT_ID,PERMISSION_ID
                FROM {table_prefix}CB_AUTH_PERMISSIONS AP, {table_prefix}CB_TEAM R
                WHERE AP.SUBJECT_ID IN (R.TEAM_ID,?)
                """;
            try (PreparedStatement dbPreparedStatement = dbCon.prepareStatement(query)) {
                dbPreparedStatement.setString(1, defaultUserTeam);
                try (ResultSet dbResult = dbPreparedStatement.executeQuery()) {
                    while (dbResult.next()) {
                        SMTeam team = teams.get(dbResult.getString(1));
                        if (team != null) {
                            team.addPermission(dbResult.getString(2));
                        }
                    }
                }
            }
            readSubjectsMetas(dbCon, SMSubjectType.team, null, teams);
            return teams.values().toArray(new SMTeam[0]);
        } catch (SQLException e) {
            throw new DBCException("Error reading teams from database", e);
        }
    }

    @Override
    public SMTeam findTeam(@NotNull String teamId) throws DBCException {
        return Arrays.stream(readAllTeams())
            .filter(r -> r.getTeamId().equals(teamId))
            .findFirst().orElse(null);
    }

    @NotNull
    @Override
    public String[] getTeamMembers(String teamId) throws DBException {
        return getTeamMembersInfo(teamId).stream().map(SMTeamMemberInfo::userId).toArray(String[]::new);
    }

    @NotNull
    @Override
    public List<SMTeamMemberInfo> getTeamMembersInfo(@NotNull String teamId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            Map<String, String> usersRoles = new LinkedHashMap<>();
            if (getDefaultUserTeam().equals(teamId)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT USER_ID FROM {table_prefix}CB_USER")) {
                    try (ResultSet dbResult = dbStat.executeQuery()) {
                        while (dbResult.next()) {
                            usersRoles.put(dbResult.getString(1), null);
                        }
                    }
                }
            }
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT USER_ID,TEAM_ROLE FROM {table_prefix}CB_USER_TEAM WHERE TEAM_ID=?")
            ) {
                dbStat.setString(1, teamId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String userId = dbResult.getString(1);
                        String teamRole = dbResult.getString(2);
                        usersRoles.put(userId, teamRole);
                    }
                }
            }
            return usersRoles.entrySet()
                .stream()
                .map(entry -> new SMTeamMemberInfo(entry.getKey(), entry.getValue()))
                .toList();
        } catch (SQLException e) {
            throw new DBCException("Error while reading team members", e);
        }
    }

    @NotNull
    private SMTeam fetchTeam(ResultSet dbResult) throws SQLException {
        return new SMTeam(
            dbResult.getString("TEAM_ID"),
            dbResult.getString("TEAM_NAME"),
            dbResult.getString("TEAM_DESCRIPTION"),
            stringToBoolean(dbResult.getString("IS_SECRET_STORAGE"))
        );
    }

    @NotNull
    private SMUser fetchUser(ResultSet dbResult, boolean checkSecretStorage) throws SQLException {
        Timestamp timestamp = dbResult.getTimestamp("CHANGE_DATE");
        Instant disableDate = timestamp != null ? timestamp.toInstant() : null;
        return new SMUser(
            dbResult.getString("USER_ID"),
            stringToBoolean(dbResult.getString("IS_ACTIVE")),
            dbResult.getString("DEFAULT_AUTH_ROLE"),
            !checkSecretStorage || stringToBoolean(dbResult.getString("IS_SECRET_STORAGE")),
            disableDate,
            dbResult.getString("DISABLED_BY"),
            dbResult.getString("DISABLE_REASON")
        );
    }

    @Override
    public SMTeam createTeam(
        @NotNull String teamId,
        @Nullable String name,
        @Nullable String description,
        @NotNull String grantor
    ) throws DBCException {
        if (CommonUtils.isEmpty(teamId)) {
            throw new DBCException("Empty team name is not allowed");
        }
        teamId = teamId.toLowerCase();
        if (isSubjectExists(teamId)) {
            throw new DBCException("User or team '" + teamId + "' already exists");
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                createAuthSubject(dbCon, teamId, SMSubjectType.team, true);
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO {table_prefix}CB_TEAM" +
                        "(TEAM_ID,TEAM_NAME,TEAM_DESCRIPTION,CREATE_TIME) VALUES(?,?,?,?)")) {
                    dbStat.setString(1, teamId);
                    dbStat.setString(2, CommonUtils.notEmpty(name));
                    dbStat.setString(3, CommonUtils.notEmpty(description));
                    dbStat.setTimestamp(4, new Timestamp(System.currentTimeMillis()));
                    dbStat.execute();
                }

                insertPermissions(dbCon,
                    teamId,
                    getDefaultTeamPermissions(),
                    grantor
                );

                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving team in database", e);
        }
        SMTeam smTeam = new SMTeam(teamId, name, description, true);
        for (String permission : getDefaultTeamPermissions()) {
            smTeam.addPermission(permission);
        }
        return smTeam;
    }

    protected String[] getDefaultTeamPermissions() {
        return new String[0];
    }

    @Override
    public void updateTeam(String teamId, String name, String description) throws DBCException {
        if (!isSubjectExists(teamId)) {
            throw new DBCException("Team '" + teamId + "' doesn't exists");
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "UPDATE {table_prefix}CB_TEAM SET TEAM_NAME=?,TEAM_DESCRIPTION=? WHERE TEAM_ID=?")) {
                    dbStat.setString(1, CommonUtils.notEmpty(name));
                    dbStat.setString(2, CommonUtils.notEmpty(description));
                    dbStat.setString(3, teamId);
                    if (dbStat.executeUpdate() <= 0) {
                        throw new DBCException("Team '" + teamId + "' doesn't exist");
                    }
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error updating team info in database", e);
        }
    }

    @Override
    public void deleteTeam(String teamId, boolean force) throws DBCException {
        String defaultUsersTeam = getDefaultUserTeam();
        if (CommonUtils.isNotEmpty(defaultUsersTeam) && defaultUsersTeam.equals(teamId)) {
            throw new DBCException("Default users team cannot be deleted");
        }
        try (Connection dbCon = database.openConnection()) {
            if (!force) {
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "SELECT COUNT(*) FROM {table_prefix}CB_USER_TEAM WHERE TEAM_ID=?")
                ) {
                    dbStat.setString(1, teamId);
                    try (ResultSet dbResult = dbStat.executeQuery()) {
                        if (dbResult.next()) {
                            int userCount = dbResult.getInt(1);
                            if (userCount > 0) {
                                throw new DBCException("Team can't be deleted. There are " + userCount +
                                    " user(s) who have this team. Un-assign team first.");
                            }
                        }
                    }
                }
            }
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                if (force) {
                    JDBCUtils.executeStatement(
                        dbCon,
                        "DELETE FROM {table_prefix}CB_USER_TEAM WHERE TEAM_ID=?",
                        teamId
                    );
                }
                deleteAuthSubject(dbCon, teamId);
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "DELETE FROM {table_prefix}CB_TEAM WHERE TEAM_ID=?")) {
                    dbStat.setString(1, teamId);
                    dbStat.execute();
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error deleting team from database", e);
        }
        if (force) {
            addSubjectPermissionsUpdateEvent(teamId, SMSubjectType.team);
        }
    }

    ///////////////////////////////////////////
    // Subject functions

    @Override
    public void setSubjectMetas(@NotNull String subjectId, @NotNull Map<String, String> metaParameters) throws DBException {
        validateSubjectMetaValues(metaParameters);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                cleanupSubjectMeta(dbCon, subjectId);
                if (!metaParameters.isEmpty()) {
                    saveSubjectMetas(dbCon, subjectId, metaParameters);
                }
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error while loading users", e);
        }
    }

    private void validateSubjectMetaValues(@NotNull Map<String, String> metaParameters) throws DBException {
        Optional<String> invalidValues = metaParameters.values()
            .stream()
            .filter(metaValue -> metaValue != null && metaValue.length() > 1024) // META_VALUE has max length of 1024
            .findAny();
        if (invalidValues.isPresent()) {
            throw new DBException("One or more meta parameters contain invalid values. Please check the input and try again");
        }
    }

    @Override
    public void setSubjectPermissions(String subjectId, List<String> permissionIds, String grantorId) throws DBException {
//        validatePermissions(SMConstants.SUBJECT_PERMISSION_SCOPE, permissionIds);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                JDBCUtils.executeStatement(dbCon,
                    "DELETE FROM {table_prefix}CB_AUTH_PERMISSIONS WHERE SUBJECT_ID=?",
                    subjectId);
                insertPermissions(dbCon, subjectId, permissionIds.toArray(String[]::new), grantorId);
                txn.commit();
            }
        } catch (SQLException e) {
            throw new DBCException("Error saving subject permissions in database", e);
        }
        addSubjectPermissionsUpdateEvent(subjectId, null);
    }

    private void insertPermissions(Connection dbCon, String subjectId, String[] permissionIds, String grantorId) throws SQLException {
        if (!ArrayUtils.isEmpty(permissionIds)) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "INSERT INTO {table_prefix}CB_AUTH_PERMISSIONS" +
                    "(SUBJECT_ID,PERMISSION_ID,GRANT_TIME,GRANTED_BY) VALUES(?,?,?,?)")
            ) {
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
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT PERMISSION_ID FROM {table_prefix}CB_AUTH_PERMISSIONS WHERE SUBJECT_ID=?")) {
                dbStat.setString(1, subjectId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        permissions.add(dbResult.getString(1));
                    }
                }
            }
            return permissions;
        } catch (SQLException e) {
            throw new DBCException("Error reading subject permissions", e);
        }
    }

    @NotNull
    @Override
    public Set<String> getUserPermissions(String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            Set<String> permissions = new HashSet<>();
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT DISTINCT AP.PERMISSION_ID FROM {table_prefix}CB_AUTH_PERMISSIONS AP, {table_prefix}CB_USER_TEAM UR\n" +
                    "WHERE UR.TEAM_ID = AP.SUBJECT_ID AND UR.USER_ID=?"
            )) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        permissions.add(dbResult.getString(1));
                    }
                }
            }
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT PERMISSION_ID FROM {table_prefix}CB_AUTH_PERMISSIONS WHERE SUBJECT_ID=?")
            ) {
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

    protected Set<String> getUserPermissions(String userId, String authRole) throws DBException {
        return getUserPermissions(userId);
    }

    ///////////////////////////////////////////
    // Sessions

    @Override
    public boolean isSessionPersisted(String id) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement("SELECT 1 FROM {table_prefix}CB_SESSION WHERE SESSION_ID=?")) {
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
    ) throws SQLException {
        var sessionId = UUID.randomUUID().toString();
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO {table_prefix}CB_SESSION(SESSION_ID, APP_SESSION_ID, USER_ID,CREATE_TIME,LAST_ACCESS_TIME," +
                "LAST_ACCESS_REMOTE_ADDRESS,LAST_ACCESS_USER_AGENT,LAST_ACCESS_INSTANCE_ID, SESSION_TYPE) " +
                "VALUES(?,?,?,?,?,?,?,?,?)"
        )) {
            dbStat.setString(1, sessionId);
            dbStat.setString(2, appSessionId);
            JDBCUtils.setStringOrNull(dbStat, 3, userId);

            Timestamp currentTS = new Timestamp(System.currentTimeMillis());
            dbStat.setTimestamp(4, currentTS);
            dbStat.setTimestamp(5, currentTS);
            JDBCUtils.setStringOrNull(dbStat, 6, CommonUtils.truncateString(CommonUtils.toString(
                parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS), null), 128));
            JDBCUtils.setStringOrNull(dbStat, 7, CommonUtils.truncateString(CommonUtils.toString(
                parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT), null), 255));
            dbStat.setString(8, database.getInstanceId());
            dbStat.setString(9, sessionType.getSessionType());
            dbStat.execute();
            return sessionId;
        }
    }

    @Override
    public SMAuthInfo authenticateAnonymousUser(@NotNull String appSessionId, @NotNull Map<String, Object> sessionParameters, @NotNull SMSessionType sessionType) throws DBException {
        if (!application.getAppConfiguration().isAnonymousAccessEnabled()) {
            throw new SMException("Anonymous access restricted");
        }
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                var smSessionId = createSmSession(appSessionId, null, sessionParameters, sessionType, dbCon);
                var smTokens = generateNewSessionToken(smSessionId, null, null, dbCon, false);
                var permissions = getAnonymousUserPermissions();
                txn.commit();
                return SMAuthInfo.successMainSession(
                    UUID.randomUUID().toString(),
                    smTokens.getSmAccessToken(),
                    smTokens.getSmRefreshToken(),
                    new SMAuthPermissions(null, smSessionId, permissions),
                    Map.of(),
                    null,
                    appSessionId
                );
            }
        } catch (SQLException e) {
            throw new DBException(e.getMessage(), e);
        }
    }

    private Set<String> getAnonymousUserPermissions() throws DBException {
        var anonymousUserTeam = application.getAppConfiguration().getAnonymousUserTeam();
        return getSubjectPermissions(anonymousUserTeam);
    }

    @Override
    public SMAuthInfo authenticate(
        @NotNull String appSessionId,
        @Nullable String previousSmSessionId,
        @NotNull Map<String, Object> sessionParameters,
        @NotNull SMSessionType sessionType,
        @NotNull String authProviderId,
        @Nullable String authProviderConfigurationId,
        @NotNull Map<String, Object> userCredentials,
        boolean forceSessionsLogout
    ) throws DBException {
        if (isProviderDisabled(authProviderId, authProviderConfigurationId)) {
            throw new SMException("Unsupported authentication provider: " + authProviderId);
        }
        var authProgressMonitor = new LoggingProgressMonitor(log);
        boolean isMainSession = previousSmSessionId == null;
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                Map<String, Object> securedUserIdentifyingCredentials = userCredentials;
                WebAuthProviderDescriptor authProviderDescriptor = getAuthProvider(authProviderId);
                var authProviderInstance = authProviderDescriptor.getInstance();

                SMAuthProviderCustomConfiguration providerConfig = authProviderConfigurationId == null
                    ? null
                    : application.getAuthConfiguration().getAuthProviderConfiguration(authProviderConfigurationId);

                var filteredUserCreds = filterSecuredUserData(
                    securedUserIdentifyingCredentials,
                    authProviderDescriptor
                );
                String authAttemptId;
                if (SMAuthProviderExternal.class.isAssignableFrom(authProviderInstance.getClass())) {
                    var authProviderExternal = (SMAuthProviderExternal<?>) authProviderInstance;
                    try {
                        securedUserIdentifyingCredentials = authProviderExternal.authExternalUser(
                            authProgressMonitor,
                            providerConfig,
                            userCredentials
                        );
                    } catch (DBException e) {
                       createNewAuthAttempt(
                            SMAuthStatus.ERROR,
                            authProviderId,
                            authProviderConfigurationId,
                            filteredUserCreds,
                            appSessionId,
                            previousSmSessionId,
                            sessionType,
                            sessionParameters,
                            isMainSession,
                            forceSessionsLogout
                        );
                        throw e;
                    }
                }
                boolean isFederatedAuth = SMAuthProviderFederated.class.isAssignableFrom(authProviderInstance.getClass());
                if (isFederatedAuth) {
                    String userOrigin = JSONUtils.getString(userCredentials, SMConstants.USER_ORIGIN);
                    if (CommonUtils.isEmpty(userOrigin)) {
                        throw new SMException("User origin not found in authentication data");
                    }
                    filteredUserCreds.put(SMConstants.USER_ORIGIN, modifyOrigin(userOrigin));
                }
                authAttemptId = createNewAuthAttempt(
                    SMAuthStatus.IN_PROGRESS,
                    authProviderId,
                    authProviderConfigurationId,
                    filteredUserCreds,
                    appSessionId,
                    previousSmSessionId,
                    sessionType,
                    sessionParameters,
                    isMainSession,
                    forceSessionsLogout
                );

                if (isFederatedAuth) {
                    String userOrigin = JSONUtils.getString(filteredUserCreds, SMConstants.USER_ORIGIN);
                    //async auth
                    var authProviderFederated = (SMAuthProviderFederated) authProviderInstance;
                    String signInLink = buildRedirectLink(
                        authProviderFederated.getSignInLink(authProviderConfigurationId, userOrigin),
                        authAttemptId
                    );
                    String signOutLink = authProviderFederated.getCommonSignOutLink(authProviderConfigurationId,
                        providerConfig.getParameters(), userOrigin
                    );
                    Map<SMAuthConfigurationReference, Object> authData = Map.of(
                        new SMAuthConfigurationReference(authProviderId, authProviderConfigurationId),
                        filteredUserCreds
                    );
                    return SMAuthInfo.inProgress(
                        authAttemptId,
                        signInLink,
                        signOutLink,
                        authData,
                        isMainSession,
                        forceSessionsLogout,
                        appSessionId
                    );
                }
                txn.commit();
                return finishAuthentication(
                    SMAuthInfo.inProgress(
                        authAttemptId,
                        null,
                        null,
                        Map.of(
                            new SMAuthConfigurationReference(authProviderId, authProviderConfigurationId),
                            securedUserIdentifyingCredentials
                        ),
                        isMainSession,
                        forceSessionsLogout,
                        appSessionId
                    ),
                    true,
                    forceSessionsLogout
                );
            }
        } catch (SQLException e) {
            throw new DBException(e.getMessage(), e);
        }
    }

    @NotNull
    protected String modifyOrigin(@NotNull String origin) {
        StringBuilder finalOrigin = new StringBuilder();
        URI uri = URI.create(origin);
        finalOrigin.append(uri.getScheme())
            .append("://")
            .append(uri.getHost());
        if (uri.getPort() > 0 && application.getServerPort() != uri.getPort()) {
            finalOrigin.append(":").append(application.getServerPort());
        } else {
            return origin;
        }
        finalOrigin.append(uri.getPath());

        return finalOrigin.toString();
    }

    private Map<String, Object> filterSecuredUserData(
        Map<String, Object> userIdentifyingCredentials,
        WebAuthProviderDescriptor authProviderDescriptor
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
        Map<String, Object> sessionParameters,
        boolean isMainSession,
        boolean forceSessionsLogout
    ) throws DBException {
        String authAttemptId = UUID.randomUUID().toString();
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                WebAuthProviderDescriptor authProviderDescriptor = getAuthProvider(authProviderId);
                if (smConfig.isCheckBruteforce()
                    && authProviderDescriptor.getInstance() instanceof SMBruteForceProtected bruteforceProtected) {
                    Object inputUsername = bruteforceProtected.getInputUsername(authData);
                    if (inputUsername != null) {
                        BruteForceUtils.checkBruteforce(smConfig,
                            getLatestUserLogins(dbCon, authProviderId, inputUsername.toString()));
                    }
                }
                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO {table_prefix}CB_AUTH_ATTEMPT" +
                        "(AUTH_ID,AUTH_STATUS,APP_SESSION_ID,SESSION_TYPE,APP_SESSION_STATE,"
                        + "SESSION_ID,IS_MAIN_AUTH,AUTH_USERNAME,FORCE_SESSION_LOGOUT,IS_SERVICE_AUTH) "
                        +
                        "VALUES(?,?,?,?,?,?,?,?,?,?)"
                )) {
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
                    dbStat.setString(7, isMainSession ? CHAR_BOOL_TRUE : CHAR_BOOL_FALSE);
                    if (this.getAuthProvider(authProviderId).getInstance() instanceof SMBruteForceProtected bruteforceProtected) {
                        Object inputUsername = bruteforceProtected.getInputUsername(authData);
                        if (inputUsername != null) {
                            dbStat.setString(8, inputUsername.toString());
                        } else {
                            dbStat.setString(8, null);
                        }
                    } else {
                        dbStat.setString(8, null);
                    }
                    dbStat.setString(9, booleanToString(forceSessionsLogout));
                    boolean isServiceAuth = isMainSession && authProviderDescriptor.isServiceProvider();
                    dbStat.setString(10, booleanToString(isServiceAuth));
                    dbStat.execute();
                }

                try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "INSERT INTO {table_prefix}CB_AUTH_ATTEMPT_INFO" +
                        "(AUTH_ID,AUTH_PROVIDER_ID,AUTH_PROVIDER_CONFIGURATION_ID,AUTH_STATE) " +
                        "VALUES(?,?,?,?)"
                )) {
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

    private List<UserLoginRecord> getLatestUserLogins(Connection dbCon, String authProviderId, String inputLogin) throws SQLException {
        List<UserLoginRecord> userLoginRecords = new ArrayList<>();
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "SELECT" +
                "    attempt.AUTH_STATUS," +
                "    attempt.CREATE_TIME" +
                " FROM" +
                "    {table_prefix}CB_AUTH_ATTEMPT attempt" +
                "        JOIN" +
                "    {table_prefix}CB_AUTH_ATTEMPT_INFO info ON attempt.AUTH_ID = info.AUTH_ID" +
                " WHERE AUTH_PROVIDER_ID = ? AND AUTH_USERNAME = ? AND attempt.CREATE_TIME > ?" +
                " ORDER BY attempt.CREATE_TIME DESC " +
                database.getDialect().getOffsetLimitQueryPart(0, smConfig.getMaxFailedLogin())
        )) {
            dbStat.setString(1, authProviderId);
            dbStat.setString(2, inputLogin);
            dbStat.setTimestamp(3,
                Timestamp.valueOf(LocalDateTime.now().minusSeconds(smConfig.getBlockLoginPeriod())));
            try (ResultSet dbResult = dbStat.executeQuery()) {
                while (dbResult.next()) {
                    UserLoginRecord loginDto = new UserLoginRecord(
                        SMAuthStatus.valueOf(dbResult.getString(1)),
                        dbResult.getTimestamp(2).toLocalDateTime()
                    );
                    userLoginRecords.add(loginDto);
                }
            }
        }
        return userLoginRecords;
    }

    private boolean isSmSessionNotExpired(String prevSessionId) {
        //TODO: implement after we start tracking user logout
        return true;
    }

    @Override
    public void updateAuthStatus(
        @NotNull String authId,
        @NotNull SMAuthStatus authStatus,
        @NotNull Map<SMAuthConfigurationReference, Object> authInfo,
        @Nullable String error,
        @Nullable String errorCode
    ) throws DBException {
        var existAuthInfo = getAuthStatus(authId);
        if (existAuthInfo.getAuthStatus() != SMAuthStatus.IN_PROGRESS) {
            throw new SMException("Authorization already finished and cannot be updated");
        }
        var authSessionInfo = readAuthAttemptSessionInfo(authId);
        updateAuthStatus(authId, authStatus, authInfo, error, authSessionInfo.getSmSessionId(), errorCode);
        if (authStatus == SMAuthStatus.ERROR) {
            SMAuthInfo errorInfo = getAuthStatus(authId, false);
            application.getEventController().addEvent(
                new WSAuthEvent(errorInfo)
            );
        }
    }

    private void updateAuthStatus(
        @NotNull String authId,
        @NotNull SMAuthStatus authStatus,
        @NotNull Map<SMAuthConfigurationReference, Object> authInfo,
        @Nullable String error,
        @Nullable String smSessionId,
        @Nullable String errorCode
    ) throws DBException {
        try (Connection dbCon = database.openConnection(); JDBCTransaction txn = new JDBCTransaction(dbCon)) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE {table_prefix}CB_AUTH_ATTEMPT SET AUTH_STATUS=?,AUTH_ERROR=?,SESSION_ID=?,ERROR_CODE=? WHERE AUTH_ID=?"
            )) {
                dbStat.setString(1, authStatus.toString());
                JDBCUtils.setStringOrNull(dbStat, 2, error);
                JDBCUtils.setStringOrNull(dbStat, 3, smSessionId);
                JDBCUtils.setStringOrNull(dbStat, 4, errorCode);
                dbStat.setString(5, authId);
                if (dbStat.executeUpdate() <= 0) {
                    throw new DBCException("Auth attempt '" + authId + "' doesn't exist");
                }
            }

            for (Map.Entry<SMAuthConfigurationReference, Object> entry : authInfo.entrySet()) {
                SMAuthConfigurationReference providerId = entry.getKey();
                String authJson = gson.toJson(entry.getValue());
                boolean configIdExist = providerId.getAuthProviderConfigurationId() != null;
                String sqlBuilder = "UPDATE {table_prefix}CB_AUTH_ATTEMPT_INFO SET AUTH_STATE=? " +
                                    "WHERE AUTH_ID=? AND AUTH_PROVIDER_ID=? AND " +
                                    (configIdExist ? "AUTH_PROVIDER_CONFIGURATION_ID=?" : "AUTH_PROVIDER_CONFIGURATION_ID IS NULL");
                try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder)) {
                    dbStat.setString(1, authJson);
                    dbStat.setString(2, authId);
                    dbStat.setString(3, providerId.getAuthProviderId());
                    if (configIdExist) {
                        dbStat.setString(4, providerId.getAuthProviderConfigurationId());
                    }
                    if (dbStat.executeUpdate() <= 0) {
                        try (PreparedStatement dbStatIns = dbCon.prepareStatement(
                        "INSERT INTO {table_prefix}CB_AUTH_ATTEMPT_INFO " +
                            "(AUTH_ID,AUTH_PROVIDER_ID,AUTH_PROVIDER_CONFIGURATION_ID,AUTH_STATE) "
                            + "VALUES(?,?,?,?)")
                        ) {
                            dbStatIns.setString(1, authId);
                            dbStatIns.setString(2, providerId.getAuthProviderId());
                            dbStatIns.setString(3, providerId.getAuthProviderConfigurationId());
                            dbStatIns.setString(4, authJson);
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
        var smAuthInfo = getAuthStatus(authId, false);
        if (smAuthInfo.getAuthStatus() == SMAuthStatus.SUCCESS) {
            updateAuthStatus(authId,
                SMAuthStatus.EXPIRED,
                smAuthInfo.getAuthData(),
                null,
                smAuthInfo.getAuthPermissions().getSessionId(),
                smAuthInfo.getErrorCode()
            );
        }
        return smAuthInfo;
    }

    private SMAuthInfo getAuthStatus(@NotNull String authId, boolean readExpiredData) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            SMAuthStatus smAuthStatus;
            String authError;
            String smSessionId;
            String errorCode;
            boolean forceSessionsLogout;
            boolean isMainAuth;
            String appSessionId;
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT AUTH_STATUS,AUTH_ERROR,SESSION_ID,IS_MAIN_AUTH,ERROR_CODE,FORCE_SESSION_LOGOUT,APP_SESSION_ID" +
                    " FROM {table_prefix}CB_AUTH_ATTEMPT WHERE AUTH_ID=?"
            )) {
                dbStat.setString(1, authId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (!dbResult.next()) {
                        throw new SMException("Auth attempt " + authId + " not found");
                    }
                    smAuthStatus = SMAuthStatus.valueOf(dbResult.getString(1));
                    authError = dbResult.getString(2);
                    smSessionId = dbResult.getString(3);
                    isMainAuth = CHAR_BOOL_TRUE.equals(dbResult.getString(4));
                    errorCode = dbResult.getString(5);
                    forceSessionsLogout = CHAR_BOOL_TRUE.equals(dbResult.getString(6));
                    appSessionId = dbResult.getString(7);
                }
            }
            Map<SMAuthConfigurationReference, Object> authData = new LinkedHashMap<>();
            String signInLink = null;
            String signOutLink = null;

            try (PreparedStatement dbStat = dbCon.prepareStatement(
                """
                    SELECT AUTH_PROVIDER_ID,AUTH_PROVIDER_CONFIGURATION_ID,AUTH_STATE \
                    FROM {table_prefix}CB_AUTH_ATTEMPT_INFO \
                    WHERE AUTH_ID=? ORDER BY CREATE_TIME"""
            )) {
                dbStat.setString(1, authId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String authProviderId = dbResult.getString(1);
                        String authProviderConfiguration = dbResult.getString(2);
                        Map<String, Object> authProviderData = gson.fromJson(dbResult.getString(3), MAP_STRING_OBJECT_TYPE);
                        if (authProviderConfiguration != null) {
                            WebAuthProviderDescriptor authProviderDescriptor = getAuthProvider(authProviderId);
                            var authProviderInstance = authProviderDescriptor.getInstance();
                            if (authProviderInstance instanceof SMAuthProviderFederated providerFederated) {
                                String userOrigin = JSONUtils.getString(authProviderData, SMConstants.USER_ORIGIN);
                                if(CommonUtils.isNotEmpty(userOrigin)){
                                    signInLink = buildRedirectLink(
                                        providerFederated.getRedirectLink(authProviderConfiguration, Map.of(), userOrigin),
                                        authId
                                    );
                                    signOutLink = providerFederated.getUserSignOutLink(
                                        application.getAuthConfiguration()
                                            .getAuthProviderConfiguration(authProviderConfiguration),
                                        authProviderData, userOrigin
                                    );
                                }
                            }

                        }
                        authData.put(new SMAuthConfigurationReference(authProviderId, authProviderConfiguration), authProviderData);
                    }
                }
            }

            if (smAuthStatus != SMAuthStatus.SUCCESS) {
                return switch (smAuthStatus) {
                    case IN_PROGRESS ->
                        SMAuthInfo.inProgress(authId, signInLink, signOutLink, authData, isMainAuth, forceSessionsLogout, appSessionId);
                    case ERROR -> SMAuthInfo.error(authId, authError, isMainAuth, errorCode, appSessionId);
                    case EXPIRED -> SMAuthInfo.expired(authId, readExpiredData ? authData : Map.of(), isMainAuth, appSessionId);
                    default -> throw new SMException("Unknown auth status:" + smAuthStatus);
                };
            }

            SMTokens smTokens = findTokenBySmSession(smSessionId);
            SMAuthPermissions authPermissions = getTokenPermissions(smTokens.getSmAccessToken());

            if (isMainAuth) {
                String authRole = readTokenAuthRole(smTokens.getSmAccessToken());
                return SMAuthInfo.successMainSession(
                    authId,
                    smTokens.getSmAccessToken(),
                    smTokens.getSmRefreshToken(),
                    authPermissions,
                    authData,
                    authRole,
                    appSessionId
                );
            } else {
                //TODO remove permissions from child session
                return SMAuthInfo.successChildSession(authId, authPermissions, authData, appSessionId);
            }
        } catch (SQLException e) {
            throw new DBException("Error while read auth info", e);
        }
    }

    @Override
    @Nullable
    public SMAuthInfo restoreUserSession(@NotNull String appSessionId) throws DBException {
        var latestActiveSmTokens = findTokenByAppSession(appSessionId);
        if (latestActiveSmTokens == null) {
            return null;
        }
        var latestSmSessionId = latestActiveSmTokens.getSessionId();

        List<SMAuthInfo> allLatestAuthData = findAllSmSessionAuthData(latestSmSessionId);
        Map<SMAuthConfigurationReference, Object> mergedData = new HashMap<>();
        for (SMAuthInfo authData : allLatestAuthData) {
            mergedData.putAll(authData.getAuthData());
        }
        return SMAuthInfo.successMainSession(
            "restore_session_attempt_" + UUID.randomUUID(),
            latestActiveSmTokens.getAccessToken(),
            latestActiveSmTokens.getRefreshToken(),
            getTokenPermissions(latestActiveSmTokens.getAccessToken()),
            mergedData,
            readTokenAuthRole(latestActiveSmTokens.getAccessToken()),
            appSessionId
        );
    }

    private List<SMAuthInfo> findAllSmSessionAuthData(String smSessionId) throws DBException {

        try (var dbCon = database.openConnection()) {
            List<String> authAttemptIds = JDBCUtils.queryStrings(dbCon,
                "SELECT AUTH_ID FROM {table_prefix}CB_AUTH_ATTEMPT " +
                    "WHERE SESSION_ID=? AND AUTH_STATUS IN (?,?) ORDER BY CREATE_TIME",
                smSessionId, SMAuthStatus.SUCCESS.name(), SMAuthStatus.EXPIRED.name()
            );
            List<SMAuthInfo> result = new ArrayList<>();
            for (String authAttemptId : authAttemptIds) {
                result.add(getAuthStatus(authAttemptId, true));
            }
            return result;
        } catch (SQLException e) {
            throw new DBException("Error reading sm session auth data", e);
        }
    }

    @Override
    public void logout() throws DBException {
        var currentUserCreds = getCurrentUserCreds();
        invalidateUserTokens(currentUserCreds.getSmAccessToken());
    }

    @Override
    public SMTokens refreshSession(@NotNull String refreshToken) throws DBException {
        var currentUserCreds = getCurrentUserCreds();
        var currentUserAccessToken = currentUserCreds.getSmAccessToken();

        SMTokenInfo smTokenInfo = readAccessTokenInfo(currentUserAccessToken);

        if (!smTokenInfo.getRefreshToken().equals(refreshToken)) {
            throw new SMException("Invalid refresh token");
        }

        try (var dbCon = database.openConnection()) {
            invalidateUserTokens(currentUserAccessToken);
            return generateNewSessionToken(
                smTokenInfo.getSessionId(),
                smTokenInfo.getUserId(),
                updateUserAuthRoleIfNeeded(smTokenInfo.getUserId(), null), dbCon, smTokenInfo.isServiceToken()
            );
        } catch (SQLException e) {
            throw new DBException("Error refreshing sm session", e);
        }
    }

    private void invalidateUserTokens(String smToken) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(
                dbCon, "DELETE FROM {table_prefix}CB_AUTH_TOKEN WHERE TOKEN_ID=?", smToken);
        } catch (SQLException e) {
            throw new DBCException("Session invalidation failed", e);
        }
    }

    @Override
    public void invalidateAllTokens() throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(
                dbCon, "DELETE FROM {table_prefix}CB_AUTH_TOKEN");
        } catch (SQLException e) {
            throw new DBCException("Session invalidation failed", e);
        }
        application.getEventController().addEvent(new WSUserCloseSessionsEvent(List.of(), getSmSessionId(), getUserId()));
    }

    private void invalidateAllUserTokens(@NotNull String userId) throws DBCException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(
                dbCon, "DELETE FROM {table_prefix}CB_AUTH_TOKEN WHERE USER_ID=?", userId);
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

    @NotNull
    private SMTokens findTokenBySmSession(String smSessionId) throws DBException {
        try (Connection dbCon = database.openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement(
                 "SELECT TOKEN_ID, REFRESH_TOKEN_ID FROM {table_prefix}CB_AUTH_TOKEN WHERE SESSION_ID=?")
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

    @Nullable
    private SMTokenInfo findTokenByAppSession(@NotNull String appSessionId) throws DBException {
        try (var dbCon = database.openConnection();
             var dbStat = dbCon.prepareStatement(
                 """
                     SELECT CAT.TOKEN_ID FROM {table_prefix}CB_AUTH_TOKEN CAT \
                       JOIN {table_prefix}CB_SESSION CS ON CAT.SESSION_ID = CS.SESSION_ID \
                       WHERE CS.APP_SESSION_ID = ? AND CAT.USER_ID IS NOT NULL \
                       AND CAT.EXPIRATION_TIME > CURRENT_TIMESTAMP\
                       ORDER BY CAT.EXPIRATION_TIME DESC"""
             )
        ) {
            dbStat.setString(1, appSessionId);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    return null;
                }
                String smAccessToken = dbResult.getString(1);
                return readAccessTokenInfo(smAccessToken);
            }
        } catch (SQLException e) {
            throw new DBException("Error finding active session creds", e);
        }
    }

    private SMTokenInfo readAccessTokenInfo(String smAccessToken) throws DBException {
        try (Connection dbCon = database.openConnection();
            PreparedStatement dbStat = dbCon.prepareStatement(
                """
                    SELECT REFRESH_TOKEN_ID,SESSION_ID,USER_ID,REFRESH_TOKEN_EXPIRATION_TIME,AUTH_ROLE,IS_SERVICE\
                     FROM {table_prefix}CB_AUTH_TOKEN WHERE TOKEN_ID=?"""
            )
        ) {
            dbStat.setString(1, smAccessToken);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new SMException("Refresh token not found");
                }
                var refreshToken = dbResult.getString(1);
                var sessionId = dbResult.getString(2);
                var userId = dbResult.getString(3);
                var expiredDate = dbResult.getTimestamp(4);
                var authRole = dbResult.getString(5);
                if (isTokenExpired(expiredDate)) {
                    throw new SMRefreshTokenExpiredException("Refresh token expired");
                }
                boolean isService = stringToBoolean(dbResult.getString(6));
                return new SMTokenInfo(smAccessToken, refreshToken, sessionId, userId, authRole, isService);
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading token info in database", e);
        }
    }

    private boolean isTokenExpired(Timestamp tokenExpiredDate) {
        return Timestamp.from(Instant.now()).after(tokenExpiredDate);
    }

    @Override
    public SMAuthInfo finishAuthentication(@NotNull String authId) throws DBException {
        SMAuthInfo authInfo = getAuthStatus(authId);
        SMAuthInfo finalAuthInfo = finishAuthentication(authInfo, false, authInfo.isForceSessionsLogout());
        application.getEventController().addEvent(new WSAuthEvent(finalAuthInfo));
        return finalAuthInfo;
    }

    protected SMAuthInfo finishAuthentication(
        @NotNull SMAuthInfo authInfo,
        boolean isSyncAuth,
        boolean forceSessionsLogout
    ) throws DBException {
        boolean isAsyncAuth = !isSyncAuth;
        String authId = authInfo.getAuthAttemptId();
        if (authInfo.getAuthStatus() != SMAuthStatus.IN_PROGRESS) {
            throw new SMException("Authorization has already been completed with status: " + authInfo.getAuthStatus());
        }
        Set<SMAuthConfigurationReference> authProviderIds = authInfo.getAuthData().keySet();
        if (authProviderIds.isEmpty()) {
            throw new SMException("Authorization providers are not defined");
        }

        DBRProgressMonitor finishAuthMonitor = new LoggingProgressMonitor(log);
        AuthAttemptSessionInfo authAttemptSessionInfo = readAuthAttemptSessionInfo(authId);
        boolean isMainAuthSession = authAttemptSessionInfo.isMainAuth();

        SMTokens smTokens = null;
        SMAuthPermissions permissions = null;
        String activeUserId = null;
        if (!isMainAuthSession) {
            var accessToken = findTokenBySmSession(authAttemptSessionInfo.getSmSessionId()).getSmAccessToken();
            //this is an additional authorization, and we should to return the original permissions and  userId
            permissions = getTokenPermissions(accessToken);
            activeUserId = permissions.getUserId();
        }

        // we don't want to store sensitive information in the database,
        // but we can send it once to the user in sync auth
        Map<SMAuthConfigurationReference, Object> dbStoredUserData = new LinkedHashMap<>();
        Map<SMAuthConfigurationReference, Object> sentToUserAuthData = new LinkedHashMap<>();

        SMTeam[] allTeams = null;
        SMAuthProviderCustomConfiguration providerConfig = null;
        String detectedAuthRole = null;
        for (SMAuthConfigurationReference authConfiguration : authProviderIds) {
            String authProviderId = authConfiguration.getAuthProviderId();
            WebAuthProviderDescriptor authProvider = getAuthProvider(authProviderId);

            {
                // Read auth provider configuration.
                // Note: if there are several auth providers in a row then we'll reuse provider config from previous one.
                // This is how federated auth + native auth providers work as a couple.
                String providerConfigId = readProviderConfigId(authInfo.getAuthAttemptId(), authProvider.getId());
                if (providerConfigId != null) {
                    var providerCustomConfig =
                        application.getAuthConfiguration().getAuthProviderConfiguration(providerConfigId);
                    if (providerCustomConfig != null) {
                        providerConfig = providerCustomConfig;
                    }
                }
            }

            Map<String, Object> providerAuthData = new LinkedHashMap<>(
                (Map<String, Object>) authInfo.getAuthData().get(authConfiguration)
            );


            if (isMainAuthSession) {
                SMAutoAssign autoAssign =
                    getAutoAssignUserData(authProvider, providerConfig, providerAuthData, finishAuthMonitor);
                if (autoAssign != null) {
                    detectedAuthRole = autoAssign.getAuthRole();
                }

                var userIdFromCreds = findOrCreateExternalUserByCredentials(
                    authProvider,
                    authAttemptSessionInfo.getSessionParams(),
                    providerAuthData,
                    finishAuthMonitor,
                    activeUserId,
                    activeUserId == null,
                    detectedAuthRole,
                    providerConfig
                );

                if (userIdFromCreds == null) {
                    var error = "Invalid user credentials";
                    updateAuthStatus(authId, SMAuthStatus.ERROR, dbStoredUserData, error, null);
                    return SMAuthInfo.error(authId, error, isMainAuthSession, null, authInfo.getAppSessionId());
                }

                if (autoAssign != null && !CommonUtils.isEmpty(autoAssign.getExternalTeamIds())) {
                    if (allTeams == null) {
                        allTeams = readAllTeams();
                    }
                    autoUpdateUserTeams(authProvider, autoAssign, userIdFromCreds, allTeams);
                }

                if (activeUserId == null) {
                    activeUserId = userIdFromCreds;
                }
                if (autoAssign != null && CommonUtils.isNotEmpty(autoAssign.getAuthRoleAssignReason())) {
                    log.info(activeUserId + " authenticated with role " + autoAssign.getAuthRole() + ", reason: " + autoAssign.getAuthRoleAssignReason());
                }
            }
            dbStoredUserData.put(
                authConfiguration,
                isAsyncAuth
                    ? providerAuthData
                    : filterSecuredUserData(providerAuthData, getAuthProvider(authProviderId))
            );
            sentToUserAuthData.put(
                authConfiguration,
                isAsyncAuth || (authProvider.getInstance() instanceof SMAuthProviderExternal<?>)
                    ? providerAuthData
                    : filterSecuredUserData(providerAuthData, getAuthProvider(authProviderId))
            );
            if (authProvider.getInstance() instanceof SMAuthProviderExternal<?> authProviderExternal) {
                authProviderExternal.postAuthentication();
            }
        }

        String tokenAuthRole = updateUserAuthRoleIfNeeded(activeUserId, detectedAuthRole);
        if (isMainAuthSession) {
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

                    if (forceSessionsLogout && CommonUtils.isNotEmpty(activeUserId) && isMainAuthSession) {
                        killAllExistsUserSessions(activeUserId);
                    }
                    smTokens = generateNewSessionToken(
                        smSessionId,
                        activeUserId,
                        tokenAuthRole,
                        dbCon,
                        authAttemptSessionInfo.isServiceAuth()
                    );

                    permissions = new SMAuthPermissions(
                        activeUserId, smSessionId, getUserPermissions(activeUserId, tokenAuthRole)
                    );
                    txn.commit();
                }
            } catch (SQLException e) {
                var error = "Error during token generation";
                updateAuthStatus(authId, SMAuthStatus.ERROR, dbStoredUserData, error, null);
                throw new SMException(error, e);
            }
        }
        var authStatus = isSyncAuth ? SMAuthStatus.EXPIRED : SMAuthStatus.SUCCESS;
        updateAuthStatus(authId, authStatus, dbStoredUserData, null, permissions.getSessionId(), null);

        if (isMainAuthSession) {
            return SMAuthInfo.successMainSession(
                authId,
                smTokens.getSmAccessToken(),
                //refresh token must be sent only from main session
                smTokens.getSmRefreshToken(),
                permissions,
                sentToUserAuthData,
                tokenAuthRole,
                authInfo.getAppSessionId()
            );
        } else {
            return SMAuthInfo.successChildSession(
                authId,
                permissions,
                sentToUserAuthData,
                authInfo.getAppSessionId()
            );
        }
    }

    private void autoUpdateUserTeams(
        WebAuthProviderDescriptor authProvider,
        SMAutoAssign autoAssign,
        String userId,
        SMTeam[] allTeams
    ) throws DBException {
        if (!(authProvider.getInstance() instanceof SMAuthProviderAssigner authProviderAssigner)) {
            return;
        }

        String externalTeamIdMetadataFieldName = authProviderAssigner.getExternalTeamIdMetadataFieldName();
        if (!CommonUtils.isEmpty(externalTeamIdMetadataFieldName)) {
            String[] newTeamIds = autoAssign.getExternalTeamIds()
                .stream()
                .flatMap(externalTeamId -> findTeamByExternalTeamId(
                    allTeams,
                    externalTeamIdMetadataFieldName,
                    externalTeamId
                ).stream())
                .map(SMTeam::getTeamId)
                .toArray(String[]::new);
            SMUserTeam[] oldUserTeams = getUserTeams(userId);
            Set<String> oldUserTeamIdSet = Arrays.stream(oldUserTeams).map(SMTeam::getTeamId).collect(Collectors.toSet());
            oldUserTeamIdSet.remove(getDefaultUserTeam());
            Set<String> newUserTeamIdSet = Arrays.stream(newTeamIds).collect(Collectors.toSet());
            if (oldUserTeamIdSet.equals(newUserTeamIdSet)) {
                //do not need to update teams and send events
                return;
            }
            if (!ArrayUtils.isEmpty(newTeamIds)) {
                setUserTeams(
                    userId,
                    newTeamIds,
                    userId
                );
            }
        }
    }

    @Nullable
    private SMAutoAssign getAutoAssignUserData(
        WebAuthProviderDescriptor authProvider,
        SMAuthProviderCustomConfiguration providerConfig,
        Map<String, Object> userData,
        DBRProgressMonitor monitor
    ) throws DBException {
        var authProviderInstance = authProvider.getInstance();
        if (!(authProviderInstance instanceof SMAuthProviderAssigner)) {
            return null;
        }
        return ((SMAuthProviderAssigner) authProviderInstance).detectAutoAssignments(monitor, providerConfig, userData);
    }

    @NotNull
    private List<SMTeam> findTeamByExternalTeamId(SMTeam[] allTeams, String externalGroupParameterName, String groupId) {
        List<SMTeam> result = new ArrayList<>();
        for (SMTeam team : allTeams) {
            String teamGroupId = team.getMetaParameters().get(externalGroupParameterName);
            if (CommonUtils.equalObjects(teamGroupId, groupId)) {
                result.add(team);
            }
        }
        return result;
    }


    private String readProviderConfigId(String authAttemptId, String authProviderId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT AUTH_PROVIDER_CONFIGURATION_ID FROM {table_prefix}CB_AUTH_ATTEMPT_INFO WHERE AUTH_ID=? AND AUTH_PROVIDER_ID=?"
            )) {
                dbStat.setString(1, authAttemptId);
                dbStat.setString(2, authProviderId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (!dbResult.next()) {
                        return null;
                    }
                    return dbResult.getString(1);

                }
            }
        } catch (SQLException e) {
            throw new DBException("Failed to read auth provider configuration", e);
        }
    }


    @Nullable
    protected String readUserAuthRole(String userId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "SELECT DEFAULT_AUTH_ROLE FROM {table_prefix}CB_USER WHERE USER_ID=?"
            )) {
                dbStat.setString(1, userId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (!dbResult.next()) {
                        throw new SMException("User not found");
                    }
                    return dbResult.getString(1);

                }
            }
        } catch (SQLException e) {
            throw new DBException("Failed to update user auth role", e);
        }
    }

    protected String updateUserAuthRoleIfNeeded(@Nullable String userId, @Nullable String authRole) throws DBException {
        if (userId == null) {
            return null;
        }
        var currentAuthRole = readUserAuthRole(userId);
        String expectedAuthRole = resolveUserAuthRole(currentAuthRole, authRole);
        if (!Objects.equals(currentAuthRole, expectedAuthRole)) {
            setUserAuthRole(userId, expectedAuthRole);
        }
        return expectedAuthRole;
    }

    private AuthAttemptSessionInfo readAuthAttemptSessionInfo(@NotNull String authId) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                """
                    SELECT APP_SESSION_ID,SESSION_TYPE,APP_SESSION_STATE,SESSION_ID,IS_MAIN_AUTH,IS_SERVICE_AUTH \
                    FROM {table_prefix}CB_AUTH_ATTEMPT WHERE AUTH_ID=?"""
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
                    boolean isMainAuth = stringToBoolean(dbResult.getString(5));
                    boolean isServiceAuth = stringToBoolean(dbResult.getString(6));

                    return new AuthAttemptSessionInfo(
                        appSessionId,
                        smSessionId,
                        sessionType,
                        sessionParams, isMainAuth, isServiceAuth
                    );
                }
            }
        } catch (SQLException e) {
            throw new DBException("Error while read auth info", e);
        }
    }

    private String findOrCreateExternalUserByCredentials(
        @NotNull WebAuthProviderDescriptor authProvider,
        @NotNull Map<String, Object> sessionParameters,
        @NotNull Map<String, Object> userCredentials,
        @NotNull DBRProgressMonitor progressMonitor,
        @Nullable String activeUserId,
        boolean createNewUserIfNotExist,
        @Nullable String authRole,
        SMAuthProviderCustomConfiguration providerConfig
    ) throws DBException {
        SMAuthProvider<?> smAuthProviderInstance = authProvider.getInstance();

        String userId = findUserByCredentials(authProvider, userCredentials, true);
        String userIdFromCredentials;
        try {
            userIdFromCredentials = smAuthProviderInstance.validateLocalAuth(progressMonitor, this, providerConfig, userCredentials, null);
        } catch (DBException e) {
            log.debug("Local auth validation error", e);
            return null;
        }
        if (activeUserId != null && userId != null && !activeUserId.equals(userId)) {
            log.debug("User '" + activeUserId + "' is authenticated in '"
                + authProvider.getId() + "' auth provider with credentials of user '"
                + userIdFromCredentials + "'");
        }
        if (userId == null && createNewUserIfNotExist) {
            if (!(authProvider.getInstance() instanceof SMAuthProviderExternal<?>)) {
                return null;
            }

            userId = authProvider.isCaseInsensitive() ? userIdFromCredentials.toLowerCase() : userIdFromCredentials;
            if (!isSubjectExists(userId)) {
                log.debug("Create user: " + userId);
                validateAndCreateUser(
                    userId,
                    (Map<String, String>) userCredentials.get(SMStandardMeta.KEY_META_PARAMS),
                    true,
                    resolveUserAuthRole(null, authRole)
                );
            }
            setUserCredentials(userId, authProvider.getId(), userCredentials);
        } else if (userId == null) {
            userId = userIdFromCredentials;
        }
        if (authProvider.isTrusted()) {
            Object reverseProxyUserRole = sessionParameters.get(SMConstants.SESSION_PARAM_TRUSTED_USER_ROLE);
            if (reverseProxyUserRole instanceof String rpAuthRole) {
                setUserAuthRole(userId, rpAuthRole);
            }
            Object reverseProxyUserTeams = sessionParameters.get(SMConstants.SESSION_PARAM_TRUSTED_USER_TEAMS);
            if (reverseProxyUserTeams instanceof List) {
                setUserTeams(userId, ((List<?>) reverseProxyUserTeams).stream().map(Object::toString).toArray(String[]::new), userId);
            }
        }
        return userId;
    }

    @Nullable
    protected String resolveUserAuthRole(
        @Nullable String currentAuthRole,
        @Nullable String newAuthRole
    ) throws SMException {
        return newAuthRole == null ? currentAuthRole : newAuthRole;
    }

    protected SMTokens generateNewSessionToken(
        @NotNull String smSessionId,
        @Nullable String userId,
        @Nullable String authRole,
        @NotNull Connection dbCon,
        boolean isServiceToken
    ) throws SQLException, DBException {
        JDBCUtils.executeStatement(
            dbCon, "DELETE FROM {table_prefix}CB_AUTH_TOKEN WHERE SESSION_ID=?", smSessionId);
        try (
            PreparedStatement dbStat = dbCon.prepareStatement("INSERT INTO {table_prefix}CB_AUTH_TOKEN"
                + "(TOKEN_ID,SESSION_ID,USER_ID,AUTH_ROLE,EXPIRATION_TIME,REFRESH_TOKEN_ID,REFRESH_TOKEN_EXPIRATION_TIME,IS_SERVICE) "
                + "VALUES(?,?,?,?,?,?,?,?)")
        ) {

            String smAccessToken = SecurityUtils.generatePassword(32);
            dbStat.setString(1, smAccessToken);
            dbStat.setString(2, smSessionId);
            JDBCUtils.setStringOrNull(dbStat, 3, userId);
            JDBCUtils.setStringOrNull(dbStat, 4, authRole);
            var accessTokenExpirationTime = Timestamp.valueOf(LocalDateTime.now().plusMinutes(smConfig.getAccessTokenTtl()));
            dbStat.setTimestamp(5, accessTokenExpirationTime);

            String smRefreshToken = SecurityUtils.generatePassword(32);
            dbStat.setString(6, smRefreshToken);
            var refreshTokenExpirationTime = Timestamp.valueOf(LocalDateTime.now().plusMinutes(smConfig.getRefreshTokenTtl()));
            dbStat.setTimestamp(7, refreshTokenExpirationTime);
            dbStat.setString(8, booleanToString(isServiceToken));

            dbStat.execute();
            return new SMTokens(smAccessToken, smRefreshToken);
        }
    }

    protected void killAllExistsUserSessions(
        @NotNull String userId
    ) throws SQLException, DBException {
        LocalDateTime currentTime = LocalDateTime.now();
        List<String> smSessionsId = findActiveUserSessions(userId, currentTime, false)
            .stream()
            .map(SMActiveSession::sessionId)
            .collect(Collectors.toList());
        if (!smSessionsId.isEmpty()) {
            deleteSessionsTokens(smSessionsId);
            application.getEventController().addEvent(new WSUserCloseSessionsEvent(smSessionsId, getSmSessionId(), userId));
        }
    }

    /**
     *  Count active user's sm sessions
     */
    @NotNull
    public List<SMActiveSession> findActiveUserSessions(
            @NotNull String userId,
            @NotNull LocalDateTime currentTime,
            boolean isService
    ) throws DBException {
        var activeSessions = new ArrayList<SMActiveSession>();
        try (var dbCon = database.openConnection()) {
            try (
                PreparedStatement dbStat = dbCon.prepareStatement(
                    "SELECT DISTINCT CAT.SESSION_ID, CAT.EXPIRATION_TIME " +
                        "FROM {table_prefix}CB_AUTH_TOKEN CAT " +
                        "JOIN {table_prefix}CB_AUTH_ATTEMPT CAA ON CAA.SESSION_ID = CAT.SESSION_ID WHERE " +
                        "CAT.USER_ID=? AND CAA.AUTH_STATUS=? AND CAT.EXPIRATION_TIME>? AND CAT.IS_SERVICE=? " +
                        "ORDER BY CAT.EXPIRATION_TIME"
                    )
            ) {
                dbStat.setString(1, userId);
                //count only tokens actually used by users
                dbStat.setString(2, SMAuthStatus.EXPIRED.name());
                dbStat.setTimestamp(3, Timestamp.valueOf(currentTime));
                dbStat.setString(4, booleanToString(isService));
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        var sessionId = dbResult.getString(1);
                        var expirationTime = dbResult.getTimestamp(2);
                        activeSessions.add(new SMActiveSession(sessionId, expirationTime));
                    }
                }
                return activeSessions;
            }
        } catch (SQLException e) {
            throw new DBException("Error counting active user's session", e);
        }
    }

    private void deleteSessionsTokens(@NotNull List<String> sessionsId) throws DBException {
        try (var dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                    "DELETE FROM {table_prefix}CB_AUTH_TOKEN WHERE SESSION_ID = ?")
            ) {
                for (String sessionId : sessionsId) {
                    dbStat.setString(1, sessionId);
                    dbStat.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new DBException("Error delete active user's session", e);
        }
    }

    @Override
    public SMAuthPermissions getTokenPermissions() throws DBException {
        SMCredentials activeUserCredentials = credentialsProvider.getActiveUserCredentials();
        if (activeUserCredentials == null || activeUserCredentials.getSmAccessToken() == null) {
            throw new SMException("User not authenticated");
        }
        return getTokenPermissions(activeUserCredentials.getSmAccessToken());
    }

    @NotNull
    private SMAuthPermissions getTokenPermissions(@NotNull String token) throws DBException {
        String userId;
        String sessionId;
        String authRole;
        try (Connection dbCon = database.openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement(
                 """
                     SELECT USER_ID, EXPIRATION_TIME, SESSION_ID, AUTH_ROLE FROM {table_prefix}CB_AUTH_TOKEN \
                     WHERE TOKEN_ID=?""")
        ) {
            dbStat.setString(1, token);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new SMException("Error reading permissions: input token not recognized.");
                }
                userId = dbResult.getString(1);
                var expiredDate = dbResult.getTimestamp(2);
                if (application.isMultiNode() && isTokenExpired(expiredDate)) {
                    throw new SMAccessTokenExpiredException("Error reading permissions: token has expired");
                }
                sessionId = dbResult.getString(3);
                authRole = dbResult.getString(4);
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading token info in database", e);
        }
        var permissions = userId == null ? getAnonymousUserPermissions() : getUserPermissions(userId, authRole);
        return new SMAuthPermissions(userId, sessionId, permissions);
    }

    @Override
    public SMAuthProviderDescriptor[] getAvailableAuthProviders() throws DBException {
        ServletAuthConfiguration appConfiguration = application.getAuthConfiguration();
        Set<SMAuthProviderCustomConfiguration> customConfigurations = appConfiguration.getAuthCustomConfigurations();
        List<SMAuthProviderDescriptor> providers = WebAuthProviderRegistry.getInstance().getAuthProviders().stream()
            .filter(ap ->
                !ap.isTrusted() && !ap.isAuthHidden() &&
                    appConfiguration.isAuthProviderEnabled(ap.getId()) &&
                    (!ap.isConfigurable() || hasProviderConfiguration(ap, customConfigurations)))
            .map(WebAuthProviderDescriptor::createDescriptorBean).toList();

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

    private static boolean hasProviderConfiguration(WebAuthProviderDescriptor ap, Set<SMAuthProviderCustomConfiguration> customConfigurations) {
        for (SMAuthProviderCustomConfiguration cc : customConfigurations) {
            if (!cc.isDisabled() && cc.getProvider().equals(ap.getId())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void updateSession(@NotNull String sessionId, @NotNull Map<String, Object> parameters) throws DBCException {
        String userId = getUserIdOrNull();
        try (Connection dbCon = database.openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                """
                    UPDATE {table_prefix}CB_SESSION \
                    SET USER_ID=?,LAST_ACCESS_TIME=?,LAST_ACCESS_REMOTE_ADDRESS=?,LAST_ACCESS_USER_AGENT=?,LAST_ACCESS_INSTANCE_ID=? \
                    WHERE SESSION_ID=?""")) {
                JDBCUtils.setStringOrNull(dbStat, 1, userId);
                dbStat.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
                JDBCUtils.setStringOrNull(dbStat, 3, CommonUtils.truncateString(CommonUtils.toString(
                    parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_ADDRESS), null), 128));
                JDBCUtils.setStringOrNull(dbStat, 4, CommonUtils.truncateString(CommonUtils.toString(
                    parameters.get(SMConstants.SESSION_PARAM_LAST_REMOTE_USER_AGENT), null), 255));
                dbStat.setString(5, database.getInstanceId());

                dbStat.setString(6, sessionId);
                if (dbStat.executeUpdate() <= 0) {
                    throw new DBCException("Session '" + sessionId + "' not found in database");
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
        if (CommonUtils.isEmpty(objectIds)) {
            subjectIds.forEach(id -> addSubjectPermissionsUpdateEvent(id, null));
            return;
        } else if (CommonUtils.isEmpty(subjectIds)) {
            addObjectPermissionsUpdateEvent(objectIds, objectType);
            return;
        }
        Set<String> filteredSubjects = getFilteredSubjects(subjectIds);
//        validatePermissions(objectType, permissions);
        try (Connection dbCon = database.openConnection()) {
            try (JDBCTransaction txn = new JDBCTransaction(dbCon)) {
                var sqlBuilder = new StringBuilder("DELETE FROM {table_prefix}CB_OBJECT_PERMISSIONS WHERE SUBJECT_ID IN (");
                appendStringParameters(sqlBuilder, subjectIds);
                sqlBuilder.append(") AND OBJECT_TYPE=? ")
                    .append("AND OBJECT_ID IN (");
                appendStringParameters(sqlBuilder, objectIds);
                sqlBuilder.append(")");
                JDBCUtils.executeStatement(dbCon, sqlBuilder.toString(), objectType.name());
                if (!CommonUtils.isEmpty(permissions)) {
                    try (PreparedStatement dbStat = dbCon.prepareStatement(
                        """
                            INSERT INTO {table_prefix}CB_OBJECT_PERMISSIONS\
                            (OBJECT_ID,OBJECT_TYPE,GRANT_TIME,GRANTED_BY,SUBJECT_ID,PERMISSION) \
                            VALUES(?,?,?,?,?,?)""")) {
                        for (String objectId : objectIds) {
                            dbStat.setString(1, objectId);
                            dbStat.setString(2, objectType.name());
                            dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                            dbStat.setString(4, grantor);
                            for (String subjectId : subjectIds) {
                                if (!filteredSubjects.contains(subjectId)) {
                                    log.error("Subject '" + subjectId + "' is not found in database");
                                    continue;
                                }
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
            addObjectPermissionsUpdateEvent(objectIds, objectType);
        } catch (SQLException e) {
            throw new DBCException("Error granting object permissions", e);
        }
    }


    @Override
    public void addObjectPermissions(
        @NotNull Set<String> objectIds,
        @NotNull SMObjectType objectType,
        @NotNull Set<String> subjectIds,
        @NotNull Set<String> permissions,
        @NotNull String grantor
    ) throws DBException {
        if (CommonUtils.isEmpty(objectIds) || CommonUtils.isEmpty(subjectIds) || CommonUtils.isEmpty(permissions)) {
            return;
        }
        Set<String> filteredSubjects = getFilteredSubjects(subjectIds);
        try (Connection dbCon = database.openConnection();
             JDBCTransaction txn = new JDBCTransaction(dbCon);
             PreparedStatement dbStat = dbCon.prepareStatement(
                 """
                     INSERT INTO {table_prefix}CB_OBJECT_PERMISSIONS\
                     (OBJECT_ID,OBJECT_TYPE,GRANT_TIME,GRANTED_BY,SUBJECT_ID,PERMISSION) \
                     VALUES(?,?,?,?,?,?)""")
        ) {
            for (String objectId : objectIds) {
                dbStat.setString(1, objectId);
                dbStat.setString(2, objectType.name());
                dbStat.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                dbStat.setString(4, grantor);
                for (String subjectId : subjectIds) {
                    if (!filteredSubjects.contains(subjectId)) {
                        log.error("Subject '" + subjectId + "' is not found in database");
                        continue;
                    }
                    dbStat.setString(5, subjectId);
                    for (String permission : permissions) {
                        dbStat.setString(6, permission);
                        dbStat.execute();
                    }
                }
                txn.commit();
            }
            addObjectPermissionsUpdateEvent(objectIds, objectType);
        } catch (SQLException e) {
            throw new DBCException("Error granting object permissions", e);
        }
    }

    @Override
    public void deleteObjectPermissions(
        @NotNull Set<String> objectIds,
        @NotNull SMObjectType objectType,
        @NotNull Set<String> subjectIds,
        @NotNull Set<String> permissions
    ) throws DBException {
        if (CommonUtils.isEmpty(objectIds) || CommonUtils.isEmpty(subjectIds) || CommonUtils.isEmpty(permissions)) {
            return;
        }
        String sql = "DELETE FROM {table_prefix}CB_OBJECT_PERMISSIONS WHERE " +
            "OBJECT_TYPE=?" +
            " AND " +
            "OBJECT_ID IN (" + SQLUtils.generateParamList(objectIds.size()) + ")" +
            " AND " +
            "SUBJECT_ID IN (" + SQLUtils.generateParamList(subjectIds.size()) + ")" +
            " AND " +
            "PERMISSION IN (" + SQLUtils.generateParamList(permissions.size()) + ")";

        try (
            Connection dbCon = database.openConnection();
            PreparedStatement dbStat = dbCon.prepareStatement(sql)
        ) {
            int index = 1;
            dbStat.setString(index++, objectType.name());
            for (String objectId : objectIds) {
                dbStat.setString(index++, objectId);
            }
            for (String subjectId : subjectIds) {
                dbStat.setString(index++, subjectId);
            }
            for (String permission : permissions) {
                dbStat.setString(index++, permission);
            }
            dbStat.execute();
            addObjectPermissionsDeleteEvent(objectIds, objectType);
        } catch (SQLException e) {
            throw new DBCException("Error granting object permissions", e);
        }
    }


    private void addSubjectPermissionsUpdateEvent(@NotNull String subjectId, @Nullable SMSubjectType subjectType) {
        if (subjectType == null) {
            subjectType = getSubjectType(subjectId);
        }
        if (subjectType == null) {
            log.error("Subject type is not found for subject '" + subjectId + "'");
            return;
        }
        var event = WSSubjectPermissionEvent.update(
            getSmSessionId(),
            getUserId(),
            subjectType,
            subjectId
        );
        application.getEventController().addEvent(event);
    }

    private void addObjectPermissionsUpdateEvent(@NotNull Set<String> objectIds, @NotNull SMObjectType objectType) {
        for (var objectId : objectIds) {
            var event = WSObjectPermissionEvent.update(
                getSmSessionId(),
                getUserId(),
                objectType,
                objectId
            );
            application.getEventController().addEvent(event);
        }
    }

    private void addObjectPermissionsDeleteEvent(@NotNull Set<String> objectIds, @NotNull SMObjectType objectType) {
        for (var objectId : objectIds) {
            var event = WSObjectPermissionEvent.delete(
                getSmSessionId(),
                getUserId(),
                objectType,
                objectId
            );
            application.getEventController().addEvent(event);
        }
    }

    @Override
    public void deleteAllObjectPermissions(@NotNull String objectId, @NotNull SMObjectType objectType) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon,
                "DELETE FROM {table_prefix}CB_OBJECT_PERMISSIONS WHERE OBJECT_TYPE=? AND OBJECT_ID=?",
                objectType.name(),
                objectId
            );

        } catch (SQLException e) {
            throw new DBCException("Error deleting object permissions", e);
        }
    }

    @Override
    public boolean hasAccessToUsers(@NotNull String teamRole, @NotNull Set<String> userIds) throws DBException {
        if (CommonUtils.isEmpty(userIds)) {
            return true;
        }
        String currentUserId = getUserIdOrThrow();
        var currentPermissions = getUserPermissions(currentUserId);
        if (currentPermissions.contains(DBWConstants.PERMISSION_ADMIN)) {
            return true;
        }

        String sql = "SELECT COUNT(DISTINCT UT.USER_ID) FROM {table_prefix}CB_USER_TEAM UT " +
            "WHERE TEAM_ID IN (SELECT TEAM_ID FROM {table_prefix}CB_USER_TEAM WHERE USER_ID = ? and TEAM_ROLE = ?) " +
            "AND UT.USER_ID IN(" + SQLUtils.generateParamList(userIds.size()) + ")";
        try (var dbCon = database.openConnection();
             var dbStat = dbCon.prepareStatement(sql)
        ) {
            dbStat.setString(1, currentUserId);
            dbStat.setString(2, teamRole);
            int index = 3;
            for (String userId : userIds) {
                dbStat.setString(index++, userId);
            }
            try (ResultSet dbResult = dbStat.executeQuery()) {
                if (dbResult.next()) {
                    int matchesUsersCount = dbResult.getInt(1);
                    return matchesUsersCount == userIds.size();
                } else {
                    return false;
                }
            }
        } catch (SQLException e) {
            throw new DBCException("Error validating user access", e);
        }
    }

    @Override
    public void deleteAllSubjectObjectPermissions(@NotNull String subjectId, @NotNull SMObjectType objectType) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon,
                "DELETE FROM {table_prefix}CB_OBJECT_PERMISSIONS WHERE OBJECT_TYPE=? AND SUBJECT_ID=?",
                objectType.name(),
                subjectId
            );

        } catch (SQLException e) {
            throw new DBCException("Error deleting subject permissions", e);
        }
    }

    @NotNull
    private String getSubjectId() {
        SMCredentials activeUserCredentials = credentialsProvider.getActiveUserCredentials();

        if (activeUserCredentials == null || activeUserCredentials.getUserId() == null) {
            return application.getAppConfiguration().getAnonymousUserTeam();
        } else {
            return activeUserCredentials.getUserId();
        }
    }

    @NotNull
    @Override
    public List<SMObjectPermissions> getAllAvailableObjectsPermissions(@NotNull SMObjectType objectType) throws DBException {

        String subjectId = getSubjectId();
        try (Connection dbCon = database.openConnection()) {
            Set<String> allSubjects = getAllLinkedSubjects(dbCon, subjectId);
            {
                var sqlBuilder = new StringBuilder("SELECT OBJECT_ID,PERMISSION FROM {table_prefix}CB_OBJECT_PERMISSIONS ");
                sqlBuilder.append("WHERE SUBJECT_ID IN (");
                appendStringParameters(sqlBuilder, allSubjects);
                sqlBuilder.append(") AND OBJECT_TYPE=?");
                try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder.toString())) {
                    dbStat.setString(1, objectType.name());

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

    @NotNull
    @Override
    public SMObjectPermissions getObjectPermissions(
        @NotNull String subjectId,
        @NotNull String objectId,
        @NotNull SMObjectType objectType
    ) throws DBException {
        try (Connection dbCon = database.openConnection()) {
            Set<String> allSubjects = getAllLinkedSubjects(dbCon, subjectId);
            {
                var sqlBuilder = new StringBuilder("SELECT PERMISSION FROM {table_prefix}CB_OBJECT_PERMISSIONS ");
                sqlBuilder.append("WHERE SUBJECT_ID IN (");
                appendStringParameters(sqlBuilder, allSubjects);
                sqlBuilder.append(") AND OBJECT_TYPE=? AND OBJECT_ID=?");

                try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder.toString())) {
                    dbStat.setString(1, objectType.name());
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
                """
                    SELECT OP.SUBJECT_ID,S.SUBJECT_TYPE, OP.PERMISSION
                    FROM {table_prefix}CB_OBJECT_PERMISSIONS OP, {table_prefix}CB_AUTH_SUBJECT S
                    WHERE S.SUBJECT_ID = OP.SUBJECT_ID AND OP.OBJECT_TYPE=? AND OP.OBJECT_ID=?""")) {
                dbStat.setString(1, smObjectType.name());
                dbStat.setString(2, objectId);
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
        var grantedPermissionsByObjectId = new HashMap<String, SMObjectPermissionsGrant.Builder>();
        try (Connection dbCon = database.openConnection()) {
            var allLinkedSubjects = getAllLinkedSubjects(dbCon, subjectId);
            var sqlBuilder =
                new StringBuilder("SELECT OP.OBJECT_ID,S.SUBJECT_TYPE,S.SUBJECT_ID,OP.PERMISSION\n")
                    .append("FROM {table_prefix}CB_OBJECT_PERMISSIONS OP, {table_prefix}CB_AUTH_SUBJECT S\n")
                    .append("WHERE S.SUBJECT_ID = OP.SUBJECT_ID AND OP.SUBJECT_ID IN (");
            appendStringParameters(sqlBuilder, allLinkedSubjects);
            sqlBuilder.append(") AND OP.OBJECT_TYPE=?");
            try (PreparedStatement dbStat = dbCon.prepareStatement(sqlBuilder.toString())) {
                dbStat.setString(1, smObjectType.name());
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        String objectId = dbResult.getString(1);
                        SMSubjectType subjectType = SMSubjectType.fromCode(dbResult.getString(2));
                        String permissionSubjectId = dbResult.getString(3);
                        String permission = dbResult.getString(4);
                        grantedPermissionsByObjectId.computeIfAbsent(
                            objectId,
                            key -> SMObjectPermissionsGrant.builder(permissionSubjectId, subjectType, objectId)
                        ).addPermission(permission);
                    }
                }
                return grantedPermissionsByObjectId.values().stream()
                    .map(SMObjectPermissionsGrant.Builder::build)
                    .toList();
            }

        } catch (SQLException e) {
            throw new DBCException("Error reading granted object permissions ", e);
        }
    }

    private static void appendStringParameters(StringBuilder sql, @NotNull Collection<String> subjectIds) {
        boolean first = true;
        for (String id : subjectIds) {
            if (!first) sql.append(",");
            first = false;
            sql.append("'").append(id.replace("'", "''")).append("'");
        }
    }

    public void shutdown() {
        database.shutdown();
    }

    public void finishConfiguration(
        @NotNull String adminName,
        @Nullable String adminPassword,
        @NotNull List<AuthInfo> authInfoList
    ) throws DBException {
        database.finishConfiguration(adminName, adminPassword, authInfoList);
    }

    ///////////////////////////////////////////
    // Utils

    protected String readTokenAuthRole(String smAccessToken) throws DBException {
        try (Connection dbCon = database.openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement("SELECT AUTH_ROLE FROM {table_prefix}CB_AUTH_TOKEN WHERE TOKEN_ID=?")
        ) {
            dbStat.setString(1, smAccessToken);
            try (var dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new SMException("Error reading subject role: input token not recognized.");
                }
                return dbResult.getString(1);
            }
        } catch (SQLException e) {
            throw new DBCException("Error reading subject role in database", e);
        }
    }

    private void createAuthSubject(
        Connection dbCon,
        String subjectId,
        SMSubjectType subjectType,
        boolean secretStorage
    ) throws SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "INSERT INTO {table_prefix}CB_AUTH_SUBJECT(SUBJECT_ID,SUBJECT_TYPE,IS_SECRET_STORAGE) " +
                "VALUES (?,?,?)")) {
            dbStat.setString(1, subjectId);
            dbStat.setString(2, subjectType.getCode());
            dbStat.setString(3, booleanToString(secretStorage));
            dbStat.execute();
        }
    }

    public static String booleanToString(boolean value) {
        return value ? CHAR_BOOL_TRUE : CHAR_BOOL_FALSE;
    }

    public static boolean stringToBoolean(@Nullable String value) {
        return CHAR_BOOL_TRUE.equals(value);
    }

    private void deleteAuthSubject(Connection dbCon, String subjectId) throws SQLException {
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "DELETE FROM {table_prefix}CB_AUTH_SUBJECT WHERE SUBJECT_ID=?")
        ) {
            dbStat.setString(1, subjectId);
            dbStat.execute();
        }
    }

    @NotNull
    protected WebAuthProviderDescriptor getAuthProvider(String authProviderId) throws DBCException {
        WebAuthProviderDescriptor authProvider = WebAuthProviderRegistry.getInstance().getAuthProvider(authProviderId);
        if (authProvider == null) {
            throw new DBCException("Auth provider not found: " + authProviderId);
        }
        return authProvider;
    }

    private String buildRedirectLink(@NotNull String originalLink, @NotNull String authId) {
        return originalLink + "?authId=" + authId;
    }


    @NotNull
    protected String getUserIdOrThrow() throws SMException {
        String userId = getUserIdOrNull();
        if (userId == null) {
            throw new SMException("User not authenticated");
        }
        return userId;
    }

    @Nullable
    protected String getUserIdOrNull() {
        SMCredentials activeUserCredentials = credentialsProvider.getActiveUserCredentials();
        if (activeUserCredentials == null || activeUserCredentials.getUserId() == null) {
            return null;
        }
        return activeUserCredentials.getUserId();
    }

    private boolean isProviderDisabled(@NotNull String providerId, @Nullable String authConfigurationId) {
        ServletAuthConfiguration appConfiguration = application.getAuthConfiguration();
        if (!appConfiguration.isAuthProviderEnabled(providerId)) {
            return true;
        }
        if (authConfigurationId != null) {
            SMAuthProviderCustomConfiguration configuration =
                appConfiguration.getAuthProviderConfiguration(authConfigurationId);
            return configuration == null || configuration.isDisabled();
        }
        return false;
    }

    public void clearOldAuthAttemptInfo() throws DBException {
        try (Connection dbCon = database.openConnection()) {
            JDBCUtils.executeStatement(dbCon,
                "DELETE FROM {table_prefix}CB_AUTH_ATTEMPT_INFO " +
                    "WHERE EXISTS " +
                    "(SELECT 1 FROM {table_prefix}CB_AUTH_ATTEMPT AA " +
                    "LEFT JOIN {table_prefix}CB_AUTH_TOKEN CAT ON AA.SESSION_ID = CAT.SESSION_ID " +
                    "WHERE (CAT.REFRESH_TOKEN_EXPIRATION_TIME < ? OR CAT.EXPIRATION_TIME IS NULL) " +
                    "AND AA.AUTH_ID={table_prefix}CB_AUTH_ATTEMPT_INFO.AUTH_ID " +
                    "AND AUTH_STATUS='" + SMAuthStatus.EXPIRED + "') " +
                    "AND CREATE_TIME<?",
                Timestamp.valueOf(LocalDateTime.now()),
                Timestamp.valueOf(LocalDateTime.now().minusMinutes(smConfig.getExpiredAuthAttemptInfoTtl()))
            );
        } catch (SQLException e) {
            throw new DBCException("Error deleting auth attempt info", e);
        }
    }

    public Set<String> getFilteredSubjects(Set<String> allSubjects) {
        try (Connection dbCon = database.openConnection()) {
            Set<String> result = new HashSet<>();
            String sqlBuilder =
                "SELECT SUBJECT_ID FROM {table_prefix}CB_AUTH_SUBJECT U " +
                "WHERE SUBJECT_ID IN (" + SQLUtils.generateParamList(allSubjects.size()) + ")";
            try (var dbStat = dbCon.prepareStatement(sqlBuilder)) {
                int parameterIndex = 1;
                for (String subjectId : allSubjects) {
                    dbStat.setString(parameterIndex++, subjectId);
                }
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    while (dbResult.next()) {
                        result.add(dbResult.getString(1));
                    }
                }
            }
            return result;
        } catch (SQLException e) {
            log.error("Error getting all subject ids from database", e);
            return Set.of();
        }
    }

    private SMSubjectType getSubjectType(@NotNull String subjectId) {
        try (Connection dbCon = database.openConnection()) {
            String sqlBuilder = "SELECT SUBJECT_TYPE FROM {table_prefix}CB_AUTH_SUBJECT U WHERE SUBJECT_ID = ?";
            try (var dbStat = dbCon.prepareStatement(sqlBuilder)) {
                dbStat.setString(1, subjectId);
                try (ResultSet dbResult = dbStat.executeQuery()) {
                    if (dbResult.next()) {
                        return SMSubjectType.fromCode(dbResult.getString(1));
                    }
                }
            }
            return null;
        } catch (SQLException e) {
            log.error("Error getting all subject ids from database", e);
            return null;
        }
    }

    @Nullable
    private String getSmSessionId() {
        var credentials = credentialsProvider.getActiveUserCredentials();
        return credentials == null ? null : credentials.getSmSessionId();
    }

    @Nullable
    private String getUserId() {
        var credentials = credentialsProvider.getActiveUserCredentials();
        return credentials == null ? null : credentials.getUserId();
    }

    @NotNull
    private String getDefaultUserTeam() {
        return application.getAppConfiguration().getDefaultUserTeam();
    }

    @NotNull
    @Override
    public DBPConnectionInformation getInternalDatabaseInformation() {
        return database.getMetaDataInfo();
    }
}

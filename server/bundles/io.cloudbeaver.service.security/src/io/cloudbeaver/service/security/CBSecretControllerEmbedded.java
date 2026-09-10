/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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

import io.cloudbeaver.service.security.db.CBDatabase;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.auth.SMCredentialsProvider;
import org.jkiss.dbeaver.model.auth.SMSessionContext;
import org.jkiss.dbeaver.model.exec.DBCFeatureNotSupportedException;
import org.jkiss.dbeaver.model.impl.jdbc.JDBCUtils;
import org.jkiss.dbeaver.model.secret.DBSSecretController;
import org.jkiss.dbeaver.model.secret.DBSSecretControllerAuthorized;
import org.jkiss.dbeaver.model.secret.DBSSecretObject;
import org.jkiss.dbeaver.model.secret.DBSSecretValue;
import org.jkiss.utils.CommonUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class CBSecretControllerEmbedded implements DBSSecretControllerAuthorized {
    public static final String ID = "cb-embedded";

    private static final Log log = Log.getLog(CBSecretControllerEmbedded.class);
    private static final String ENCODING_PLAINTEXT = "PLAINTEXT";

    private SMCredentialsProvider credentialsProvider;

    @Override
    public long getSupportedFeatures() {
        return DBSSecretController.FEATURE_PRIVATE_SECRETS_VIEW |
            DBSSecretController.FEATURE_PRIVATE_SECRETS_EDIT;
    }

    @Nullable
    @Override
    public String getPrivateSecretValue(@NotNull String secretId) throws DBException {
        try (Connection dbCon = getDatabase().openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement(
                 "SELECT SECRET_VALUE,ENCODING_TYPE FROM {table_prefix}CB_SUBJECT_SECRETS " +
                     "WHERE SUBJECT_ID=? AND SECRET_ID=?"
             )) {
            dbStat.setString(1, getCurrentUserId());
            dbStat.setString(2, secretId);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                if (dbResult.next()) {
                    return decodeSecretValue(dbResult.getString(1), dbResult.getString(2));
                }
                return null;
            }
        } catch (SQLException e) {
            throw new DBException("Error reading secret value", e);
        }
    }

    @Override
    public void setPrivateSecretValue(@NotNull String secretId, @Nullable String secretValue) throws DBException {
        String userId = getCurrentUserId();
        if (secretValue == null) {
            deleteSecretValue(userId, secretId);
            return;
        }
        EncodedValue encodedSecretValue = encodeSecretValue(secretValue);
        try (Connection dbCon = getDatabase().openConnection()) {
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE {table_prefix}CB_SUBJECT_SECRETS " +
                    "SET SECRET_VALUE=?,ENCODING_TYPE=? WHERE SUBJECT_ID=? AND SECRET_ID=?")
            ) {
                dbStat.setString(1, encodedSecretValue.value());
                dbStat.setString(2, encodedSecretValue.encodingType());
                dbStat.setString(3, userId);
                dbStat.setString(4, secretId);
                if (dbStat.executeUpdate() > 0) {
                    return;
                }
            }
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "INSERT INTO {table_prefix}CB_SUBJECT_SECRETS" +
                    "(SUBJECT_ID,SECRET_ID,SECRET_VALUE,ENCODING_TYPE) VALUES(?,?,?,?)")
            ) {
                dbStat.setString(1, userId);
                dbStat.setString(2, secretId);
                dbStat.setString(3, encodedSecretValue.value());
                dbStat.setString(4, encodedSecretValue.encodingType());
                dbStat.executeUpdate();
            }
        } catch (SQLException e) {
            throw new DBException("Error saving secret value", e);
        }
    }

    @Override
    public void setPrivateSecretValue(@NotNull DBSSecretObject secretObject, @NotNull DBSSecretValue secretValue)
        throws DBException {
        setSubjectSecretValue(getCurrentUserId(), secretObject, secretValue);
    }

    @Override
    public void setSubjectSecretValue(
        @NotNull String subjectId,
        @NotNull DBSSecretObject secretObject,
        @NotNull DBSSecretValue secretValue
    ) throws DBException {
        if (secretValue.getSubjectId() != null && !subjectId.equals(secretValue.getSubjectId())) {
            throw new DBException("Subject id mismatch");
        }
        try (Connection dbCon = getDatabase().openConnection()) {
            if (!isSubjectSupportsSecrets(dbCon, subjectId)) {
                throw new DBException("Subject does not support secrets");
            }
            if (secretValue.getValue() == null) {
                deleteSecretValue(subjectId, secretValue.getId());
                return;
            }
            EncodedValue encodedSecretValue = encodeSecretValue(secretValue.getValue());
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "UPDATE {table_prefix}CB_SUBJECT_SECRETS " +
                    "SET SECRET_VALUE=?,ENCODING_TYPE=?,PROJECT_ID=?,OBJECT_ID=?,OBJECT_TYPE=? " +
                    "WHERE SUBJECT_ID=? AND SECRET_ID=?"
                )) {
                dbStat.setString(1, encodedSecretValue.value());
                dbStat.setString(2, encodedSecretValue.encodingType());
                dbStat.setString(3, secretObject.getProjectId());
                dbStat.setString(4, secretObject.getSecretObjectId());
                dbStat.setString(5, secretObject.getSecretObjectType());
                dbStat.setString(6, subjectId);
                dbStat.setString(7, secretValue.getId());
                if (dbStat.executeUpdate() > 0) {
                    return;
                }
            }
            try (PreparedStatement dbStat = dbCon.prepareStatement(
                "INSERT INTO {table_prefix}CB_SUBJECT_SECRETS" +
                    "(SUBJECT_ID,SECRET_ID,SECRET_VALUE,ENCODING_TYPE,PROJECT_ID,OBJECT_ID,OBJECT_TYPE) " +
                    "VALUES(?,?,?,?,?,?,?)")
            ) {
                dbStat.setString(1, subjectId);
                dbStat.setString(2, secretValue.getId());
                dbStat.setString(3, encodedSecretValue.value());
                dbStat.setString(4, encodedSecretValue.encodingType());
                dbStat.setString(5, secretObject.getProjectId());
                dbStat.setString(6, secretObject.getSecretObjectId());
                dbStat.setString(7, secretObject.getSecretObjectType());
                dbStat.executeUpdate();
            }
        } catch (SQLException e) {
            throw new DBException("Error saving secret value", e);
        }
    }

    @Override
    public void deleteObjectSecrets(@NotNull DBSSecretObject secretObject) throws DBException {
        log.info("Delete all object secrets " + String.join(":", secretObject.getSecretObjectId(),
            secretObject.getSecretObjectType(), secretObject.getProjectId())
        );
        try (var dbCon = getDatabase().openConnection()) {
            JDBCUtils.executeStatement(
                dbCon,
                "DELETE FROM {table_prefix}CB_SUBJECT_SECRETS " +
                    "WHERE PROJECT_ID=? AND OBJECT_TYPE=? AND OBJECT_ID=?",
                secretObject.getProjectId(),
                secretObject.getSecretObjectType(),
                secretObject.getSecretObjectId()
            );
        } catch (SQLException e) {
            throw new DBException("Error deleting secrets from database", e);
        }
    }

    @Override
    public void deleteSubjectSecrets(@NotNull String subjectId) throws DBException {
        try (var dbCon = getDatabase().openConnection()) {
            JDBCUtils.executeStatement(
                dbCon,
                "DELETE FROM {table_prefix}CB_SUBJECT_SECRETS WHERE SUBJECT_ID=?",
                subjectId
            );
        } catch (SQLException e) {
            throw new DBException("Error deleting secrets from database", e);
        }
    }

    @Override
    public void deleteProjectSecrets(@NotNull String projectId) throws DBException {
        try (var dbCon = getDatabase().openConnection()) {
            JDBCUtils.executeStatement(
                dbCon,
                "DELETE FROM {table_prefix}CB_SUBJECT_SECRETS WHERE PROJECT_ID=?",
                projectId
            );
        } catch (SQLException e) {
            throw new DBException("Error deleting secrets from database", e);
        }
    }

    @NotNull
    @Override
    public List<DBSSecretValue> discoverCurrentUserSecrets(@NotNull DBSSecretObject secretObject) throws DBException {
        throw new DBCFeatureNotSupportedException("Secrets discovery not supported");
    }

    @Override
    public void flushChanges() throws DBException {
    }

    @Override
    public void authorize(
        @Nullable SMCredentialsProvider credentialsProvider,
        @Nullable SMSessionContext smSessionContext
    ) {
        this.credentialsProvider = credentialsProvider;
    }

    @NotNull
    protected SMCredentialsProvider getCredentialsProvider() throws DBException {
        if (credentialsProvider == null) {
            throw new DBException("Secret controller is not authorized");
        }
        return credentialsProvider;
    }

    @NotNull
    protected String getCurrentUserId() throws DBException {
        var credentials = getCredentialsProvider().getActiveUserCredentials();
        if (credentials == null || CommonUtils.isEmpty(credentials.getUserId())) {
            throw new DBException("Empty user id");
        }
        return credentials.getUserId();
    }

    protected void deleteSecretValue(@NotNull String subjectId, @NotNull String secretId) throws DBException {
        try (Connection dbCon = getDatabase().openConnection();
             PreparedStatement dbStat = dbCon.prepareStatement(
                 "DELETE FROM {table_prefix}CB_SUBJECT_SECRETS WHERE SUBJECT_ID=? AND SECRET_ID=?"
             )) {
            dbStat.setString(1, subjectId);
            dbStat.setString(2, secretId);
            dbStat.executeUpdate();
        } catch (SQLException e) {
            throw new DBException("Error deleting secret value", e);
        }
    }

    protected boolean isSubjectSupportsSecrets(@NotNull Connection dbCon, @NotNull String subjectId)
        throws SQLException, DBException {
        try (PreparedStatement dbStat = dbCon.prepareStatement(
            "SELECT IS_SECRET_STORAGE FROM {table_prefix}CB_AUTH_SUBJECT WHERE SUBJECT_ID=?")
        ) {
            dbStat.setString(1, subjectId);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    throw new DBException("Subject not exists: " + subjectId);
                }
                return CBEmbeddedSecurityController.stringToBoolean(dbResult.getString(1));
            }
        }
    }

    @NotNull
    protected EncodedValue encodeSecretValue(@NotNull String value) throws DBException {
        return new EncodedValue(value, ENCODING_PLAINTEXT);
    }

    @NotNull
    protected String decodeSecretValue(@NotNull String value, @NotNull String encodingType) throws DBException {
        if (!ENCODING_PLAINTEXT.equals(encodingType)) {
            throw new DBException("Unsupported secret encoding: " + encodingType);
        }
        return value;
    }

    @NotNull
    protected CBDatabase getDatabase() throws DBException {
        CBDatabase database = EmbeddedSecurityControllerFactory.getDbInstance();
        if (database == null) {
            throw new DBException("Embedded database is not initialized");
        }
        return database;
    }

    protected record EncodedValue(@NotNull String value, @NotNull String encodingType) {
        public EncodedValue {
        }
    }
}

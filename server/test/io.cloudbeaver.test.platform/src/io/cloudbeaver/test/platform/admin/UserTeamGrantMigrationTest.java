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
package io.cloudbeaver.test.platform.admin;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.DBWConstants;
import io.cloudbeaver.model.app.ServletAppConfiguration;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.config.WebDatabaseConfig;
import io.cloudbeaver.service.security.db.CBDatabase;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.ext.h2.model.H2SQLDialect;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMTeamGrantType;
import org.jkiss.dbeaver.model.security.user.SMTeam;
import org.jkiss.dbeaver.model.sql.db.InternalProxyConnection;
import org.jkiss.dbeaver.registry.DataSourceProviderRegistry;
import org.jkiss.dbeaver.registry.storage.H2Migrator;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.sql.Connection;
import java.sql.Driver;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Runs the packaged migration scripts on private, connection-scoped H2 databases. */
public class UserTeamGrantMigrationTest extends CloudbeaverMockTest {
    private static final String DEFAULT_TEAM = "configured-default";
    private static final String OTHER_TEAM = "other-team";
    private static final String ADMIN_TEAM = "admin";
    private static final String CUSTOM_ADMIN_TEAM = "custom-administrators";
    private static final Timestamp GRANT_TIME = Timestamp.valueOf("2025-01-02 03:04:05");

    @Test
    public void migrates29Through31ThenNormalizesDefaultGrants() throws Exception {
        TestDatabase database = new TestDatabase(DEFAULT_TEAM);
        try (Connection connection = database.connect()) {
            createVersion29Fixture(connection);
            insertLegacyGrant(connection, "legacy-user", DEFAULT_TEAM);
            insertLegacyGrant(connection, "legacy-user", OTHER_TEAM);
            insertLegacyGrant(connection, "legacy-user", ADMIN_TEAM);
            insertLegacyGrant(connection, "legacy-user", CUSTOM_ADMIN_TEAM);
            insertLegacyGrant(connection, "manual-user", DEFAULT_TEAM, ADMIN_TEAM);
            insertLegacyGrant(connection, "manual-user", OTHER_TEAM, ADMIN_TEAM);
            var metadata = readGrantMetadata(connection);

            database.migrate(connection);

            assertVersion31(connection);
            assertEquals(Map.of(
                "legacy-user/" + DEFAULT_TEAM, SMTeamGrantType.UNKNOWN,
                "legacy-user/" + OTHER_TEAM, SMTeamGrantType.UNKNOWN,
                "legacy-user/" + ADMIN_TEAM, SMTeamGrantType.MANUAL,
                "legacy-user/" + CUSTOM_ADMIN_TEAM, SMTeamGrantType.MANUAL,
                "manual-user/" + DEFAULT_TEAM, SMTeamGrantType.MANUAL,
                "manual-user/" + OTHER_TEAM, SMTeamGrantType.MANUAL
            ), readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));

            database.normalize(connection);

            Map<String, SMTeamGrantType> normalized = Map.of(
                "legacy-user/" + DEFAULT_TEAM, SMTeamGrantType.DEFAULT,
                "legacy-user/" + OTHER_TEAM, SMTeamGrantType.UNKNOWN,
                "legacy-user/" + ADMIN_TEAM, SMTeamGrantType.MANUAL,
                "legacy-user/" + CUSTOM_ADMIN_TEAM, SMTeamGrantType.MANUAL,
                "manual-user/" + DEFAULT_TEAM, SMTeamGrantType.DEFAULT,
                "manual-user/" + OTHER_TEAM, SMTeamGrantType.MANUAL
            );
            assertEquals(normalized, readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));
            database.restart(connection);
            assertEquals(normalized, readGrantTypes(connection));
        }
    }

    @Test
    public void migrates30PreservingOtherTypesThenNormalizesEveryDefaultGrant() throws Exception {
        TestDatabase database = new TestDatabase(DEFAULT_TEAM);
        try (Connection connection = database.connect()) {
            createVersion30Fixture(connection);
            Map<String, SMTeamGrantType> migrated = new LinkedHashMap<>();
            Map<String, SMTeamGrantType> normalized = new LinkedHashMap<>();
            for (SMTeamGrantType type : SMTeamGrantType.values()) {
                for (String team : new String[]{DEFAULT_TEAM, OTHER_TEAM, ADMIN_TEAM, CUSTOM_ADMIN_TEAM}) {
                    for (boolean selfGranted : new boolean[]{true, false}) {
                        String user = type.name() + (selfGranted ? "-self" : "-other");
                        insertGrant(connection, user, team, type, selfGranted ? user : "historical-grantor");
                        String key = user + "/" + team;
                        boolean administrativeTeam = team.equals(ADMIN_TEAM) || team.equals(CUSTOM_ADMIN_TEAM);
                        SMTeamGrantType migratedType = type == SMTeamGrantType.MANUAL && !administrativeTeam && selfGranted
                            ? SMTeamGrantType.UNKNOWN : type;
                        migrated.put(key, migratedType);
                        normalized.put(key, DEFAULT_TEAM.equals(team) ? SMTeamGrantType.DEFAULT : migratedType);
                    }
                }
            }
            var metadata = readGrantMetadata(connection);

            database.migrate(connection);

            assertVersion31(connection);
            assertEquals(migrated, readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));

            database.normalize(connection);

            assertEquals(normalized, readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));

            // A later startup must not reapply migrations to new, genuinely manual grants.
            insertGrant(connection, "new-user", OTHER_TEAM, SMTeamGrantType.MANUAL);
            normalized.put("new-user/" + OTHER_TEAM, SMTeamGrantType.MANUAL);
            metadata = readGrantMetadata(connection);
            database.restart(connection);
            assertVersion31(connection);
            assertEquals(normalized, readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));
        }
    }

    @Test
    public void migrationWithoutConfiguredDefaultTeamLeavesUnknownGrants() throws Exception {
        TestDatabase database = new TestDatabase("");
        try (Connection connection = database.connect()) {
            createVersion30Fixture(connection);
            insertGrant(connection, "legacy-user", DEFAULT_TEAM, SMTeamGrantType.MANUAL);
            insertGrant(connection, "legacy-user", OTHER_TEAM, SMTeamGrantType.AUTH_PROVIDER);
            var metadata = readGrantMetadata(connection);

            // Exercise the production ordering: updateSchema, then validateInstancePersistentState.
            database.restart(connection);

            assertVersion31(connection);
            assertEquals(Map.of(
                "legacy-user/" + DEFAULT_TEAM, SMTeamGrantType.UNKNOWN,
                "legacy-user/" + OTHER_TEAM, SMTeamGrantType.AUTH_PROVIDER
            ), readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));
        }
    }

    @Test
    public void normalizesAdministrativeDefaultTeamWithoutChangingConfirmedSources() throws Exception {
        TestDatabase database = new TestDatabase(DEFAULT_TEAM);
        try (Connection connection = database.connect()) {
            createVersion30Fixture(connection);
            insertGrant(connection, "legacy-admin", ADMIN_TEAM, SMTeamGrantType.MANUAL);
            insertGrant(connection, "legacy-admin", CUSTOM_ADMIN_TEAM, SMTeamGrantType.MANUAL);
            insertGrant(connection, "legacy-admin", OTHER_TEAM, SMTeamGrantType.MANUAL);
            insertGrant(connection, "provider-admin", ADMIN_TEAM, SMTeamGrantType.AUTH_PROVIDER);
            insertGrant(connection, "default-user", DEFAULT_TEAM, SMTeamGrantType.MANUAL);
            var metadata = readGrantMetadata(connection);

            // Even a default team granting admin permission must remain DEFAULT after normalization.
            insertAdminPermission(connection, DEFAULT_TEAM);
            database.restart(connection);

            Map<String, SMTeamGrantType> expected = Map.of(
                "legacy-admin/" + ADMIN_TEAM, SMTeamGrantType.MANUAL,
                "legacy-admin/" + CUSTOM_ADMIN_TEAM, SMTeamGrantType.MANUAL,
                "legacy-admin/" + OTHER_TEAM, SMTeamGrantType.UNKNOWN,
                "provider-admin/" + ADMIN_TEAM, SMTeamGrantType.AUTH_PROVIDER,
                "default-user/" + DEFAULT_TEAM, SMTeamGrantType.DEFAULT
            );
            assertVersion31(connection);
            assertEquals(expected, readGrantTypes(connection));
            assertEquals(metadata, readGrantMetadata(connection));

            database.restart(connection);
            assertEquals(expected, readGrantTypes(connection));
        }
    }

    private static void createVersion29Fixture(@NotNull Connection connection) throws SQLException {
        // Only tables touched by migrations 30/31 and persistent-state validation are needed.
        try (var statement = connection.createStatement()) {
            statement.execute("CREATE TABLE CB_SCHEMA_INFO (MODULE_ID VARCHAR(10) NOT NULL, " +
                "VERSION INTEGER NOT NULL, UPDATE_TIME TIMESTAMP NOT NULL)");
            statement.execute("INSERT INTO CB_SCHEMA_INFO VALUES ('CB_CE', 29, CURRENT_TIMESTAMP)");
            statement.execute("CREATE TABLE CB_USER_TEAM (USER_ID VARCHAR(128) NOT NULL, " +
                "TEAM_ID VARCHAR(128) NOT NULL, TEAM_ROLE VARCHAR(128), GRANT_TIME TIMESTAMP NOT NULL, " +
                "GRANTED_BY VARCHAR(128) NOT NULL, PRIMARY KEY (USER_ID, TEAM_ID))");
            statement.execute("CREATE TABLE CB_AUTH_PERMISSIONS (SUBJECT_ID VARCHAR(128) NOT NULL, " +
                "PERMISSION_ID VARCHAR(64) NOT NULL, PRIMARY KEY (SUBJECT_ID, PERMISSION_ID))");
            statement.execute("CREATE TABLE CB_INSTANCE (INSTANCE_ID CHAR(36) PRIMARY KEY, " +
                "MAC_ADDRESS CHAR(12) NOT NULL, HOST_NAME VARCHAR(128) NOT NULL, " +
                "PRODUCT_NAME VARCHAR(100) NOT NULL, PRODUCT_VERSION VARCHAR(32) NOT NULL, " +
                "UPDATE_TIME TIMESTAMP NOT NULL)");
            statement.execute("CREATE TABLE CB_INSTANCE_DETAILS (INSTANCE_ID CHAR(36) NOT NULL, " +
                "FIELD_NAME VARCHAR(32) NOT NULL, FIELD_VALUE VARCHAR(255), " +
                "PRIMARY KEY (INSTANCE_ID, FIELD_NAME), FOREIGN KEY (INSTANCE_ID) REFERENCES CB_INSTANCE(INSTANCE_ID))");
        }
        insertAdminPermission(connection, ADMIN_TEAM);
        insertAdminPermission(connection, CUSTOM_ADMIN_TEAM);
    }

    private static void insertAdminPermission(@NotNull Connection connection, @NotNull String team) throws SQLException {
        try (var statement = connection.prepareStatement("INSERT INTO CB_AUTH_PERMISSIONS VALUES (?, ?)")) {
            statement.setString(1, team);
            statement.setString(2, DBWConstants.PERMISSION_ADMIN);
            statement.executeUpdate();
        }
    }

    private static void createVersion30Fixture(@NotNull Connection connection) throws SQLException {
        createVersion29Fixture(connection);
        try (var statement = connection.createStatement()) {
            statement.execute("ALTER TABLE CB_USER_TEAM ADD GRANT_TYPE VARCHAR(32) DEFAULT 'MANUAL' NOT NULL");
            statement.execute("UPDATE CB_SCHEMA_INFO SET VERSION=30");
        }
    }

    private static void insertLegacyGrant(
        @NotNull Connection connection,
        @NotNull String user,
        @NotNull String team
    ) throws SQLException {
        insertLegacyGrant(connection, user, team, user);
    }

    private static void insertLegacyGrant(
        @NotNull Connection connection,
        @NotNull String user,
        @NotNull String team,
        @NotNull String grantor
    ) throws SQLException {
        try (var statement = connection.prepareStatement(
            "INSERT INTO CB_USER_TEAM (USER_ID, TEAM_ID, TEAM_ROLE, GRANT_TIME, GRANTED_BY) VALUES (?, ?, ?, ?, ?)"
        )) {
            statement.setString(1, user);
            statement.setString(2, team);
            statement.setString(3, "team-role");
            statement.setTimestamp(4, GRANT_TIME);
            statement.setString(5, grantor);
            statement.executeUpdate();
        }
    }

    private static void insertGrant(
        @NotNull Connection connection,
        @NotNull String user,
        @NotNull String team,
        @NotNull SMTeamGrantType type
    ) throws SQLException {
        insertGrant(connection, user, team, type, user);
    }

    private static void insertGrant(
        @NotNull Connection connection,
        @NotNull String user,
        @NotNull String team,
        @NotNull SMTeamGrantType type,
        @NotNull String grantor
    ) throws SQLException {
        insertLegacyGrant(connection, user, team, grantor);
        try (var statement = connection.prepareStatement(
            "UPDATE CB_USER_TEAM SET GRANT_TYPE=? WHERE USER_ID=? AND TEAM_ID=?"
        )) {
            statement.setString(1, type.name());
            statement.setString(2, user);
            statement.setString(3, team);
            statement.executeUpdate();
        }
    }

    @NotNull
    private static Map<String, SMTeamGrantType> readGrantTypes(@NotNull Connection connection) throws SQLException {
        Map<String, SMTeamGrantType> grants = new LinkedHashMap<>();
        try (var statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT USER_ID, TEAM_ID, GRANT_TYPE FROM CB_USER_TEAM")) {
            while (rows.next()) {
                grants.put(rows.getString(1) + "/" + rows.getString(2), SMTeamGrantType.valueOf(rows.getString(3)));
            }
        }
        return grants;
    }

    @NotNull
    private static Map<String, GrantMetadata> readGrantMetadata(@NotNull Connection connection) throws SQLException {
        Map<String, GrantMetadata> metadata = new LinkedHashMap<>();
        try (var statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT USER_ID, TEAM_ID, TEAM_ROLE, GRANT_TIME, GRANTED_BY FROM CB_USER_TEAM")) {
            while (rows.next()) {
                metadata.put(
                    rows.getString(1) + "/" + rows.getString(2),
                    new GrantMetadata(rows.getString(3), rows.getTimestamp(4), rows.getString(5))
                );
            }
        }
        return metadata;
    }

    private record GrantMetadata(@NotNull String teamRole, @NotNull Timestamp grantTime, @NotNull String grantedBy) {
    }

    private static void assertVersion31(@NotNull Connection connection) throws SQLException {
        try (var statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT VERSION FROM CB_SCHEMA_INFO WHERE MODULE_ID='CB_CE'")) {
            assertTrue(rows.next());
            assertEquals(31, rows.getInt(1));
        }
    }

    private static class TestDatabase extends CBDatabase {
        TestDatabase(@NotNull String defaultTeam) throws DBException {
            super(mockApplication(defaultTeam), new WebDatabaseConfig());
            dialect = new H2SQLDialect();
            SMAdminController controller = Mockito.mock(SMAdminController.class);
            Mockito.when(controller.findTeam(defaultTeam)).thenReturn(Mockito.mock(SMTeam.class));
            setAdminSecurityController(controller);
        }

        @NotNull
        private static ServletApplication mockApplication(@NotNull String defaultTeam) {
            ServletApplication application = Mockito.mock(ServletApplication.class);
            ServletAppConfiguration config = Mockito.mock(ServletAppConfiguration.class);
            Mockito.when(config.getDefaultUserTeam()).thenReturn(defaultTeam);
            Mockito.when(application.getAppConfiguration()).thenReturn(config);
            return application;
        }

        @NotNull
        Connection connect() throws DBException, SQLException {
            var driver = DataSourceProviderRegistry.getInstance().findDriver(H2Migrator.V2_DRIVER_NAME);
            assertNotNull(driver, "Embedded H2 driver must be available in the test product");
            Driver jdbcDriver = driver.getDefaultDriverLoader().getDriverInstance(new VoidProgressMonitor());
            // No pool, file URL, configured application database, or DB_CLOSE_DELAY: closing destroys this DB.
            String url = "jdbc:h2:mem:grant-migration-" + UUID.randomUUID();
            databaseConfig.setUrl(url);
            Connection connection = jdbcDriver.connect(url, new Properties());
            assertNotNull(connection);
            return new InternalProxyConnection(connection, databaseConfig);
        }

        void migrate(@NotNull Connection connection) throws DBException {
            updateSchema(new VoidProgressMonitor(), connection);
        }

        void normalize(@NotNull Connection connection) throws Exception {
            validateInstancePersistentState(connection);
        }

        void restart(@NotNull Connection connection) throws Exception {
            initializeSchema(new VoidProgressMonitor(), connection);
        }
    }
}

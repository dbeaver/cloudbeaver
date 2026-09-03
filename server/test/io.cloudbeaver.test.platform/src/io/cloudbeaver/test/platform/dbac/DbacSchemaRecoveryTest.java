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
package io.cloudbeaver.test.platform.dbac;

import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.service.dbac.db.DbacRecoveryPolicy;
import io.cloudbeaver.service.dbac.db.DbacSchema;
import io.cloudbeaver.service.dbac.db.DbacSchemaConstants;
import io.cloudbeaver.service.dbac.db.DbacSchemaReport;
import io.cloudbeaver.service.dbac.db.DbacSchemaValidator;
import io.cloudbeaver.service.dbac.db.DbacSchemaVersionManager;
import io.cloudbeaver.service.security.EmbeddedSecurityControllerFactory;
import io.cloudbeaver.service.security.db.CBDatabase;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.connection.InternalDatabaseConfig;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.sql.db.InternalProxyConnection;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaManager;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaScriptSource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Recovery behaviour of the DBAC schema module on the H2 metadata database of the running test server.
 * <p>
 * H2 is the database that actually needs repairing: it does not roll back DDL, so a migration that fails
 * half-way leaves objects behind. It is also the database where repair is possible, because
 * {@code H2SQLDialect} does not implement {@code SQLDialectDDLExtension} and the translator therefore
 * leaves {@code IF NOT EXISTS} in place. {@code DbacScriptTranslationTest} pins both halves of that claim.
 * <p>
 * Every test works inside its own dedicated schema, so the metadata database of the running server is
 * never modified. No test drops or recreates an object to make an assertion pass.
 */
public class DbacSchemaRecoveryTest {

    private static final DBRProgressMonitor MONITOR = new LoggingProgressMonitor();

    private static CBDatabase database;

    @BeforeAll
    public static void startServer() throws Exception {
        CEAppStarter.startServerIfNotStarted();
        database = EmbeddedSecurityControllerFactory.getDbInstance();
        Assertions.assertNotNull(database, "CBDatabase instance must exist after server startup");
    }

    /** The metadata database of the test server must be the one this class reasons about. */
    @Test
    public void metadataDatabaseIsClassifiedAsReplayCapable() throws Exception {
        try (Connection connection = database.openConnection()) {
            Assertions.assertEquals(
                DbacRecoveryPolicy.REPLAY_CREATE_SCRIPT,
                DbacRecoveryPolicy.forDatabase(connection.getMetaData()),
                "These tests describe H2 behaviour; on any other metadata database they prove nothing");
        }
    }

    /**
     * Documents the behaviour that makes recovery necessary: H2 does not roll back DDL, so objects created
     * before a failure survive a rollback. This is the premise of every other test here.
     */
    @Test
    public void h2DoesNotRollBackDdl() throws Exception {
        String schema = freshSchema("DBAC_REC_DDL");
        try (Connection connection = database.openConnection()) {
            boolean autoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try (Statement dbStat = connection.createStatement()) {
                dbStat.execute("CREATE TABLE " + schema + ".DDL_ROLLBACK_PROBE (ID INTEGER)");
            }
            connection.rollback();
            connection.setAutoCommit(autoCommit);

            Assertions.assertTrue(
                tableExists(connection, schema, "DDL_ROLLBACK_PROBE"),
                "H2 is expected to keep DDL after a rollback. If this ever fails the recovery design "
                    + "can be revisited, but it must not be assumed without this evidence.");
        }
    }

    /**
     * A partially created schema (version table plus one data table, no module row) must be completed by
     * replaying the create migration, without manual cleanup and without object conflicts.
     */
    @Test
    public void partialSchemaIsRecoveredByReplay() throws Exception {
        String schema = freshSchema("DBAC_REC_PARTIAL");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);

            for (String statement : DbacTestSupport.createScriptStatements()) {
                if (mentions(statement, DbacSchemaConstants.VERSION_TABLE_NAME)
                    || mentions(statement, DbacSchemaConstants.TABLE_TW_CURRENT)) {
                    DbacTestSupport.execute(rawConnection, statement.replace("{table_prefix}", schema + "."));
                }
            }
            Assertions.assertNull(
                DbacTestSupport.readVersion(connection), "Precondition: no DBAC version row must exist");
            Assertions.assertFalse(DbacSchemaValidator.inspect(rawConnection, schema).isComplete());

            Assertions.assertEquals(
                DbacSchemaConstants.SCHEMA_NOT_PRESENT,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                "A partial installation on H2 must be classified as replayable");

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            DbacSchemaValidator.validate(rawConnection, schema);
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue(),
                "Version must be recorded exactly once after recovery");
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));
        }
    }

    /**
     * A complete structure whose version row was lost must also be repaired on H2 - here by replaying the
     * idempotent create script, which is a no-op for every object that already exists.
     */
    @Test
    public void completeStructureWithoutVersionRowIsRecovered() throws Exception {
        String schema = freshSchema("DBAC_REC_NOVERSION");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            Assertions.assertEquals(
                DbacSchemaConstants.SCHEMA_NOT_PRESENT,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            DbacSchemaValidator.validate(rawConnection, schema);
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue());
        }
    }

    /**
     * A migration that fails half-way must fail initialization, must leave the already applied H2 DDL
     * behind, and the next attempt with a working script must complete without manual cleanup.
     */
    @Test
    public void failedMigrationIsRecoverableOnNextStart() throws Exception {
        String schema = freshSchema("DBAC_REC_FAILED");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);

            SQLSchemaScriptSource brokenSource = DbacTestSupport.fixedScriptSource(
                statementFor(DbacSchemaConstants.VERSION_TABLE_NAME) + ";\n"
                    + statementFor(DbacSchemaConstants.TABLE_TW_CURRENT) + ";\n"
                    + "CREATE TABLE {table_prefix}DBAC_BROKEN (THIS IS NOT VALID SQL);\n");

            // DBException, not Exception: an environment failure such as a missing platform must fail the
            // test rather than be mistaken for a correctly refused migration.
            Assertions.assertThrows(
                DBException.class,
                () -> schemaManager(connection, config, brokenSource).updateSchema(MONITOR),
                "A broken migration must fail, never be reported as success");

            Assertions.assertNull(
                DbacTestSupport.readVersion(connection),
                "No version may be recorded for a failed migration");
            Assertions.assertTrue(
                tableExists(rawConnection, schema, DbacSchemaConstants.TABLE_TW_CURRENT),
                "H2 keeps the DDL applied before the failure - this is what recovery must cope with");

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            DbacSchemaValidator.validate(rawConnection, schema);
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue());
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));
        }
    }

    /** A recorded version with a structurally broken schema must not be accepted as healthy. */
    @Test
    public void recordedVersionWithBrokenStructureFailsClosed() throws Exception {
        String schema = freshSchema("DBAC_REC_BROKEN");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacSchemaValidator.validate(rawConnection, schema);

            DbacTestSupport.execute(rawConnection,
                "DROP TABLE " + schema + "." + DbacSchemaConstants.TABLE_AUDIT_EVENT);

            Assertions.assertThrows(
                DBException.class,
                () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                "A recorded version with a missing table must fail initialization");
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue(),
                "A failed structure check must not modify the recorded version");
        }
    }

    /**
     * Every kind of structural damage must be rejected. Existence of an object is never enough: the create
     * script uses IF NOT EXISTS, so a pre-existing table of the wrong shape would otherwise be accepted.
     */
    @Test
    public void validatorRejectsStructuralDamage() throws Exception {
        List<String[]> mutations = new ArrayList<>();
        mutations.add(new String[]{"wrong column type",
            "ALTER TABLE %s.DBAC_AUDIT_EVENT DROP COLUMN DENIAL_REASON",
            "ALTER TABLE %s.DBAC_AUDIT_EVENT ADD COLUMN DENIAL_REASON INTEGER"});
        mutations.add(new String[]{"wrong varchar length",
            "ALTER TABLE %s.DBAC_AUDIT_EVENT DROP COLUMN DENIAL_REASON",
            "ALTER TABLE %s.DBAC_AUDIT_EVENT ADD COLUMN DENIAL_REASON VARCHAR(63)"});
        mutations.add(new String[]{"wrong nullability",
            "ALTER TABLE %s.DBAC_AUDIT_EVENT ALTER COLUMN USER_ID SET NOT NULL"});
        mutations.add(new String[]{"missing column",
            "ALTER TABLE %s.DBAC_TW_CURRENT DROP COLUMN HOST_SNAPSHOT"});
        mutations.add(new String[]{"unexpected column",
            "ALTER TABLE %s.DBAC_TW_HISTORY ADD COLUMN SQL_TEXT VARCHAR(10)"});
        mutations.add(new String[]{"wrong primary key columns",
            "ALTER TABLE %s.DBAC_TW_HISTORY DROP PRIMARY KEY",
            "ALTER TABLE %s.DBAC_TW_HISTORY ADD PRIMARY KEY (GRANT_ID)"});
        mutations.add(new String[]{"wrong primary key order",
            "ALTER TABLE %s.DBAC_TW_CURRENT DROP PRIMARY KEY",
            "ALTER TABLE %s.DBAC_TW_CURRENT ADD PRIMARY KEY (PROJECT_ID, USER_ID, CONNECTION_ID)"});
        mutations.add(new String[]{"index on the wrong table",
            "DROP INDEX %s.DBAC_AUDIT_USER_IDX",
            "CREATE INDEX DBAC_AUDIT_USER_IDX ON %s.DBAC_TW_HISTORY (USER_ID, CHANGE_TIME)"});
        mutations.add(new String[]{"index on the wrong columns",
            "DROP INDEX %s.DBAC_AUDIT_USER_IDX",
            "CREATE INDEX DBAC_AUDIT_USER_IDX ON %s.DBAC_AUDIT_EVENT (ACTOR_ID, EVENT_TIME)"});
        mutations.add(new String[]{"index column order",
            "DROP INDEX %s.DBAC_AUDIT_USER_IDX",
            "CREATE INDEX DBAC_AUDIT_USER_IDX ON %s.DBAC_AUDIT_EVENT (EVENT_TIME, USER_ID)"});
        mutations.add(new String[]{"index uniqueness",
            "DROP INDEX %s.DBAC_AUDIT_USER_IDX",
            "CREATE UNIQUE INDEX DBAC_AUDIT_USER_IDX ON %s.DBAC_AUDIT_EVENT (USER_ID, EVENT_TIME)"});
        mutations.add(new String[]{"missing index",
            "DROP INDEX %s.DBAC_TW_HISTORY_CONN_IDX"});

        for (String[] mutation : mutations) {
            String schema = freshSchema("DBAC_REC_DAMAGED");
            try (Connection rawConnection = database.openConnection()) {
                InternalDatabaseConfig config = withSchema(schema);
                Connection connection = new InternalProxyConnection(rawConnection, config);
                schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
                Assertions.assertTrue(
                    DbacSchemaValidator.inspect(rawConnection, schema).isComplete(),
                    "Precondition for '" + mutation[0] + "': a fresh schema must validate");

                for (int i = 1; i < mutation.length; i++) {
                    DbacTestSupport.execute(rawConnection, String.format(mutation[i], schema));
                }

                DbacSchemaReport report = DbacSchemaValidator.inspect(rawConnection, schema);
                Assertions.assertFalse(
                    report.isComplete(), "Damage was accepted as valid: " + mutation[0]);
                Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                    "Startup must be refused for: " + mutation[0]);
            }
        }
    }

    /** An unsupported version value must fail instead of being silently accepted. */
    @Test
    public void unsupportedVersionValueFailsClosed() throws Exception {
        String schema = freshSchema("DBAC_REC_VERSION");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            for (int badVersion : new int[]{
                DbacSchemaConstants.RECOVERY_PENDING_VERSION, -1, DbacSchemaConstants.CURRENT_SCHEMA_VERSION + 1
            }) {
                try (PreparedStatement dbStat = connection.prepareStatement(
                    "UPDATE {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                        + " SET VERSION=? WHERE MODULE_ID=?")
                ) {
                    dbStat.setInt(1, badVersion);
                    dbStat.setString(2, DbacSchemaConstants.SCHEMA_ID);
                    dbStat.executeUpdate();
                }
                Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                    "Version " + badVersion + " must be rejected");
            }
        }
    }

    /** A DBAC version table in another schema must not be mistaken for this connection's schema. */
    @Test
    public void objectsOfAnotherSchemaAreNotMistakenForThisOne() throws Exception {
        String schemaA = freshSchema("DBAC_REC_OTHER_A");
        String schemaB = freshSchema("DBAC_REC_OTHER_B");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig configA = withSchema(schemaA);
            Connection connectionA = new InternalProxyConnection(rawConnection, configA);
            schemaManager(connectionA, configA, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacSchemaValidator.validate(rawConnection, schemaA);

            String previousSchema = rawConnection.getSchema();
            try {
                rawConnection.setSchema(schemaB);
                InternalDatabaseConfig configB = withSchema(schemaB);
                Connection connectionB = new InternalProxyConnection(rawConnection, configB);

                Assertions.assertEquals(
                    DbacSchemaConstants.SCHEMA_NOT_PRESENT,
                    versionManager().getCurrentSchemaVersion(MONITOR, connectionB, null),
                    "Schema B must be reported as fresh even though schema A holds a DBAC version table");

                schemaManager(connectionB, configB, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
                DbacSchemaValidator.validate(rawConnection, schemaB);
            } finally {
                rawConnection.setSchema(previousSchema);
            }

            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(
                new InternalProxyConnection(rawConnection, withSchema(schemaA))));
        }
    }

    /**
     * A schema name that only exists as a quoted mixed case identifier is refused with an explicit error,
     * because {@code {table_prefix}} is substituted without quoting and H2 folds unquoted names to upper
     * case. Failing here beats creating objects in a schema nobody asked for.
     */
    @Test
    public void quotedMixedCaseSchemaFailsClosed() throws Exception {
        String mixed = "DbacH2MixedCase";
        try (Connection rawConnection = database.openConnection()) {
            DbacTestSupport.execute(rawConnection, "DROP SCHEMA IF EXISTS \"" + mixed + "\" CASCADE");
            DbacTestSupport.execute(rawConnection, "CREATE SCHEMA \"" + mixed + "\"");
            try {
                Connection connection = new InternalProxyConnection(rawConnection, withSchema(mixed));
                DBException error = Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, mixed));
                Assertions.assertTrue(
                    error.getMessage().contains(mixed),
                    "The error must name the offending schema: " + error.getMessage());
            } finally {
                DbacTestSupport.execute(rawConnection, "DROP SCHEMA IF EXISTS \"" + mixed + "\" CASCADE");
            }
        }
    }

    /**
     * The version row moves forward only, and only from the version this build expects to find.
     * <p>
     * A blind {@code WHERE MODULE_ID=?} update would let a build shipping version N silently downgrade an
     * installation already at a higher version, leaving a schema that is newer than the row claims.
     */
    @Test
    public void versionRowIsNeverOverwrittenOrDowngraded() throws Exception {
        String schema = freshSchema("DBAC_REC_CAS");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            forceVersion(connection, 2);
            Assertions.assertThrows(
                DBException.class,
                () -> versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 1),
                "Recording version 1 over an installation at version 2 must fail closed");
            Assertions.assertEquals(
                2, DbacTestSupport.readVersion(connection).intValue(),
                "A refused downgrade must leave the row exactly as it was");
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));

            forceVersion(connection, 1);
            versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 1);
            Assertions.assertEquals(
                1, DbacTestSupport.readVersion(connection).intValue(),
                "Recording the version that is already there must stay a no-op");
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));

            versionManager(2).updateCurrentSchemaVersion(MONITOR, connection, schema, 2);
            Assertions.assertEquals(
                2, DbacTestSupport.readVersion(connection).intValue(),
                "The ordinary sequential upgrade must succeed through the compare-and-set");

            forceVersion(connection, 5);
            Assertions.assertThrows(
                DBException.class,
                () -> versionManager(5).updateCurrentSchemaVersion(MONITOR, connection, schema, 3),
                "A current version that is neither the target nor its predecessor must be left alone");
            Assertions.assertEquals(5, DbacTestSupport.readVersion(connection).intValue());
        }
    }

    /**
     * A version this build does not ship must never be written, and the refusal must come before any
     * database write or structure check.
     * <p>
     * Deliberately duplicated from {@code DbacSchemaPostgresTest}: that class is skipped whenever no
     * disposable PostgreSQL is reachable, which is the normal case in CI. A guard that only exists in a
     * class the regression suite skips is not in the regression suite.
     */
    @Test
    public void versionAboveTheShippedOneIsRefused() throws Exception {
        String schema = freshSchema("DBAC_REC_UPPER");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            Assertions.assertThrows(
                DBException.class,
                () -> versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 2),
                "A build shipping version 1 must not record version 2");
            Assertions.assertEquals(
                1, DbacTestSupport.readVersion(connection).intValue(),
                "The existing row must be left exactly as it was");
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));

            // With no row at all, nothing may be inserted either.
            DbacTestSupport.deleteVersionRow(connection);
            Assertions.assertThrows(
                DBException.class,
                () -> versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 2));
            Assertions.assertEquals(0, DbacTestSupport.countVersionRows(connection));

            // Break the structure, then ask again. Both the version bound and the structure check would
            // throw DBException here, so the message is what distinguishes them: if the bound is really
            // evaluated first, the failure names the version and never mentions the missing column.
            DbacTestSupport.execute(rawConnection,
                "ALTER TABLE " + schema + ".DBAC_TW_CURRENT DROP COLUMN HOST_SNAPSHOT");
            DBException error = Assertions.assertThrows(
                DBException.class,
                () -> versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 99));
            Assertions.assertTrue(
                error.getMessage().contains("Refusing to record DBAC schema version 99"),
                "The version bound must reject before the structure is examined, got: " + error.getMessage());
            Assertions.assertFalse(
                error.getMessage().contains("HOST_SNAPSHOT"),
                "A structure problem must not be what rejected this, got: " + error.getMessage());
            Assertions.assertEquals(0, DbacTestSupport.countVersionRows(connection));
        }
    }

    /**
     * An upgrade must not start unless every step of it has a script.
     * <p>
     * {@code SQLSchemaManager.upgradeSchemaVersion} does {@code if (ddlStream == null) continue;}, so a
     * missing script is skipped in silence: the schema ends up in a state no version describes, and every
     * later upgrade is blocked because the next compare-and-set expects a predecessor nobody wrote.
     * Duplicated from the PostgreSQL class for the reason given above.
     */
    @Test
    public void upgradeIsRefusedWhenAnUpdateScriptIsMissing() throws Exception {
        String schema = freshSchema("DBAC_REC_CHAIN");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            // A build shipping version 3 against an installation at version 1 needs scripts 2 and 3.
            Assertions.assertEquals(
                1,
                managerWithScripts(3, DbacTestSupport.updateScriptsExcept(-1))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "A complete chain must let the upgrade start");
            Assertions.assertThrows(
                DBException.class,
                () -> managerWithScripts(3, DbacTestSupport.updateScriptsExcept(2))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "A gap in the middle of the chain must refuse the start");
            Assertions.assertThrows(
                DBException.class,
                () -> managerWithScripts(3, DbacTestSupport.updateScriptsExcept(3))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "A missing last step must refuse the start");

            // The shipped source really does resolve version 1, so real installations are unaffected.
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));
        }
    }

    /**
     * {@code OBSOLETE_SCHEMA_VERSION} must stay 0, and the recovery signal must not sit below it.
     * <p>
     * {@code SQLSchemaManager.updateSchema} enters {@code dropSchema} when
     * {@code schemaVersionObsolete > 0 && currentSchemaVersion < schemaVersionObsolete}, and
     * {@code dropSchema} executes {@code DROP ALL OBJECTS} - on the shared metadata database, which also
     * holds the CloudBeaver CE tables. Raising the obsolete version would make
     * {@link DbacSchemaConstants#RECOVERY_PENDING_VERSION} satisfy that condition and destroy the whole
     * metadata database during an ordinary recovery. The constants carry comments saying so; this is the
     * assertion that makes the comment enforceable.
     */
    @Test
    public void obsoleteVersionMustStayZeroSoRecoveryCannotDropEverything() {
        Assertions.assertEquals(
            0, DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
            "OBSOLETE_SCHEMA_VERSION must stay 0: any higher value routes RECOVERY_PENDING_VERSION into "
                + "SQLSchemaManager.dropSchema, which runs DROP ALL OBJECTS on the metadata database");
        Assertions.assertTrue(
            DbacSchemaConstants.RECOVERY_PENDING_VERSION >= DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
            "The recovery signal must never be below the obsolete version");
        Assertions.assertTrue(
            DbacSchemaConstants.MINIMUM_STORED_VERSION > DbacSchemaConstants.RECOVERY_PENDING_VERSION,
            "The recovery signal must never be a storable version");
    }

    /** The in-memory recovery signal must never reach the version table. */
    @Test
    public void recoveryPendingVersionIsNeverStored() throws Exception {
        String schema = freshSchema("DBAC_REC_CAS_ZERO");
        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            for (int bad : new int[]{DbacSchemaConstants.RECOVERY_PENDING_VERSION, -1}) {
                Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().updateCurrentSchemaVersion(MONITOR, connection, schema, bad),
                    "Version " + bad + " must never be written");
            }
            Assertions.assertEquals(0, DbacTestSupport.countVersionRows(connection));
        }
    }

    /**
     * Two nodes released together after their version check must converge on one valid schema and exactly
     * one version row. The barrier is what makes this a race rather than two sequential runs.
     */
    @Test
    public void concurrentFirstInitializationConvergesToOneVersionRow() throws Exception {
        runRace(freshSchema("DBAC_REC_RACE"));
    }

    /** The same race, but starting from a partially installed schema that both nodes try to replay. */
    @Test
    public void concurrentPartialReplayConvergesToOneVersionRow() throws Exception {
        String schema = freshSchema("DBAC_REC_RACE_PARTIAL");
        try (Connection rawConnection = database.openConnection()) {
            for (String statement : DbacTestSupport.createScriptStatements()) {
                if (mentions(statement, DbacSchemaConstants.VERSION_TABLE_NAME)
                    || mentions(statement, DbacSchemaConstants.TABLE_TW_CURRENT)) {
                    DbacTestSupport.execute(rawConnection, statement.replace("{table_prefix}", schema + "."));
                }
            }
        }
        runRace(schema);
    }

    // ---------------------------------------------------------------- helpers

    private void runRace(String schema) throws Exception {
        CyclicBarrier barrier = new CyclicBarrier(2);
        List<AtomicReference<Throwable>> results = List.of(new AtomicReference<>(), new AtomicReference<>());
        // The runner retries a failed statement, so the exception that escapes can be a follow-up error.
        // Capture the genuine first one.
        List<AtomicReference<SQLException>> firstErrors =
            List.of(new AtomicReference<>(), new AtomicReference<>());
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            AtomicReference<Throwable> result = results.get(i);
            AtomicReference<SQLException> firstError = firstErrors.get(i);
            Thread thread = new Thread(() -> {
                // Each node uses its own connection, as separate JVMs would.
                try (Connection raw = database.openConnection()) {
                    InternalDatabaseConfig config = withSchema(schema);
                    Connection connection = DbacTestSupport.recording(
                        new InternalProxyConnection(raw, config), firstError);
                    new SQLSchemaManager(
                        DbacSchemaConstants.SCHEMA_ID,
                        DbacTestSupport.realScriptSource(),
                        monitor -> connection,
                        DbacTestSupport.barrier(versionManager(), barrier),
                        database.getDialect(),
                        DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                        DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
                        config,
                        null).updateSchema(MONITOR);
                } catch (Throwable e) {
                    result.set(e);
                }
            });
            threads.add(thread);
            thread.start();
        }
        for (Thread thread : threads) {
            thread.join(180_000);
            Assertions.assertFalse(thread.isAlive(), "A racing node did not finish within 180s");
        }

        int failures = 0;
        for (int i = 0; i < results.size(); i++) {
            Throwable error = results.get(i).get();
            if (error != null) {
                failures++;
                DbacTestSupport.assertAcceptableRaceFailure(
                    error, firstErrors.get(i).get(), DbacTestSupport.H2_RACE_SQL_STATES,
                    "concurrent migration in " + schema);
            }
        }
        // Same contract as the PostgreSQL race: if both nodes failed, the race resolved nothing and a
        // green result would only mean the retry below papered over it.
        Assertions.assertTrue(failures <= 1, "Both racing nodes failed, so the race resolved nothing");

        try (Connection rawConnection = database.openConnection()) {
            InternalDatabaseConfig config = withSchema(schema);
            Connection connection = new InternalProxyConnection(rawConnection, config);
            if (failures > 0) {
                // A loser is acceptable only if a plain retry then completes, as the next start would.
                schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            }
            DbacSchemaValidator.validate(rawConnection, schema);
            Assertions.assertEquals(
                1, DbacTestSupport.countVersionRows(connection),
                "Concurrent initialization must not create duplicate version rows");
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue(),
                "Recorded version must be the current one");
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                "The schema left by concurrent initialization must be usable on the next start");
        }
    }

    private static boolean mentions(String statement, String tableName) {
        return statement.toUpperCase(Locale.ROOT).contains(tableName);
    }

    /** Returns the real CREATE TABLE statement of one table, so partial states use exactly the real DDL. */
    private static String statementFor(String tableName) throws Exception {
        for (String statement : DbacTestSupport.createScriptStatements()) {
            String upper = statement.toUpperCase(Locale.ROOT);
            if (upper.contains("CREATE TABLE") && upper.contains(tableName)) {
                return statement;
            }
        }
        throw new IllegalStateException("CREATE TABLE statement not found for " + tableName);
    }

    private static DbacSchemaVersionManager versionManager() {
        return versionManager(DbacSchemaConstants.CURRENT_SCHEMA_VERSION);
    }

    /** A manager that believes the shipped version is {@code latest}, for multi-version CAS scenarios. */
    private static DbacSchemaVersionManager versionManager(int latest) {
        return managerWithScripts(latest, DbacSchema.getScriptSource());
    }

    /** A manager whose update-script chain is supplied by the test, for tripwire scenarios. */
    private static DbacSchemaVersionManager managerWithScripts(int latest, SQLSchemaScriptSource source) {
        return new DbacSchemaVersionManager(latest, DbacSchemaConstants.SCHEMA_ID, source);
    }

    /** Sets the stored version directly, bypassing the manager, to build a starting state. */
    private static void forceVersion(Connection connection, int version) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "UPDATE {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " SET VERSION=? WHERE MODULE_ID=?")) {
            dbStat.setInt(1, version);
            dbStat.setString(2, DbacSchemaConstants.SCHEMA_ID);
            if (dbStat.executeUpdate() > 0) {
                return;
            }
        }
        try (PreparedStatement dbStat = connection.prepareStatement(
            "INSERT INTO {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " (MODULE_ID,VERSION,UPDATE_TIME) VALUES(?,?,CURRENT_TIMESTAMP)")) {
            dbStat.setString(1, DbacSchemaConstants.SCHEMA_ID);
            dbStat.setInt(2, version);
            dbStat.executeUpdate();
        }
    }

    private static SQLSchemaManager schemaManager(
        Connection connection,
        InternalDatabaseConfig config,
        SQLSchemaScriptSource scriptSource
    ) {
        return new SQLSchemaManager(
            DbacSchemaConstants.SCHEMA_ID,
            scriptSource,
            monitor -> connection,
            versionManager(),
            database.getDialect(),
            DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
            DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
            config,
            null);
    }

    private static String freshSchema(String name) throws Exception {
        try (Connection connection = database.openConnection();
             Statement dbStat = connection.createStatement()
        ) {
            dbStat.execute("DROP SCHEMA IF EXISTS " + name + " CASCADE");
            dbStat.execute("CREATE SCHEMA " + name);
        }
        return name;
    }

    private static boolean tableExists(Connection connection, String schema, String tableName) throws SQLException {
        try (ResultSet dbResult = connection.getMetaData().getTables(
            null, schema.toUpperCase(Locale.ROOT), tableName, new String[]{"TABLE"})
        ) {
            return dbResult.next();
        }
    }

    private static InternalDatabaseConfig withSchema(String schema) {
        return DbacTestSupport.config(database.getDatabaseConfig(), schema);
    }
}

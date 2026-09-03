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

import io.cloudbeaver.service.dbac.db.DbacRecoveryPolicy;
import io.cloudbeaver.service.dbac.db.DbacSchema;
import io.cloudbeaver.service.dbac.db.DbacSchemaConstants;
import io.cloudbeaver.service.dbac.db.DbacSchemaReport;
import io.cloudbeaver.service.dbac.db.DbacSchemaValidator;
import io.cloudbeaver.service.dbac.db.DbacSchemaVersionManager;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.ext.postgresql.model.PostgreDialect;
import org.jkiss.dbeaver.model.connection.InternalDatabaseConfig;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.sql.SQLDialect;
import org.jkiss.dbeaver.model.sql.db.InternalProxyConnection;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaManager;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.utils.CommonUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicReference;

/**
 * PostgreSQL verification of the DBAC schema module, run against the real {@link PostgreDialect}.
 * <p>
 * Using a stand-in dialect here would make the whole class meaningless: the behaviour that shapes the
 * PostgreSQL recovery design - the translator removing {@code IF NOT EXISTS} from {@code CREATE TABLE} -
 * only happens because {@code PostgreDialect} implements {@code SQLDialectDDLExtension}. Every migration
 * below therefore goes through {@code SQLSchemaManager} with that dialect, exactly as the server does.
 * <p>
 * Runs only against a disposable PostgreSQL at the configured URL, never a shared or production database.
 * Start one with:
 * {@code docker run -d --name dbac-pg-test -e POSTGRES_PASSWORD=dbactest -e POSTGRES_DB=dbactest
 * -p 55432:5432 postgres:16-alpine}
 * <p>
 * <b>Required mode.</b> With {@code -Ddbac.test.postgres.required=true} a missing driver, an unreachable
 * server or any other setup failure is a test failure rather than a skip, so "PostgreSQL verified" can
 * never be claimed by a run that quietly skipped everything.
 */
public class DbacSchemaPostgresTest {

    private static final String URL = System.getProperty(
        "dbac.test.postgres.url", "jdbc:postgresql://localhost:55432/dbactest");
    private static final String USER = System.getProperty("dbac.test.postgres.user", "postgres");
    private static final String PASSWORD = System.getProperty("dbac.test.postgres.password", "dbactest");

    /** When true, an unavailable PostgreSQL fails the run instead of skipping it. */
    private static final boolean REQUIRED =
        CommonUtils.toBoolean(System.getProperty("dbac.test.postgres.required"));

    private static final DBRProgressMonitor MONITOR = new LoggingProgressMonitor();

    /** The production dialect. Registered for driver {@code postgres-jdbc} as {@code dialect="postgresql"}. */
    private static final SQLDialect DIALECT = new PostgreDialect();

    private static final String[] TEST_SCHEMAS = {
        "dbac_pg_fresh", "dbac_pg_recovery", "dbac_pg_partial", "dbac_pg_broken", "dbac_pg_failed",
        "dbac_pg_objects", "dbac_pg_other_a", "dbac_pg_other_b", "dbac_pg_race", "dbac_pg_race2",
        "dbac_pg_damaged", "dbac_pg_replay", "dbac_pg_cas", "dbac_pg_cas_zero",
        "dbac_pg_savepoint", "dbac_pg_savepoint2", "dbac_pg_savepoint3", "dbac_pg_sqlstate",
        "dbac_pg_upper", "dbac_pg_chain"
    };

    private static Driver driver;

    @BeforeAll
    public static void checkPostgresAvailable() throws Exception {
        try {
            File jar = findDriverJar();
            if (jar == null) {
                throw new IllegalStateException("PostgreSQL JDBC driver jar not found under deploy/drivers");
            }
            URLClassLoader loader = new URLClassLoader(
                new URL[]{jar.toURI().toURL()}, Driver.class.getClassLoader());
            Driver candidate = (Driver) Class.forName("org.postgresql.Driver", true, loader)
                .getDeclaredConstructor().newInstance();
            try (Connection probe = candidate.connect(URL, credentials())) {
                if (probe == null) {
                    throw new IllegalStateException("Driver did not accept " + URL);
                }
            }
            driver = candidate;
        } catch (Exception e) {
            if (REQUIRED) {
                throw new IllegalStateException(
                    "dbac.test.postgres.required=true but the disposable PostgreSQL at " + URL
                        + " is not usable: " + DbacTestSupport.describe(e), e);
            }
            // Skipping is allowed so an ordinary developer build does not require a container, but it must
            // never be mistaken for a pass. Nothing in this class is verified after this point, and a
            // report may not claim PostgreSQL support on the strength of a run that landed here.
            String notice = "POSTGRESQL NOT VERIFIED: every test in DbacSchemaPostgresTest was skipped because "
                + URL
                + " is not usable (" + e.getMessage() + "). Re-run with -Ddbac.test.postgres.required=true"
                + " to turn this into a failure.";
            System.out.println("[DBAC] " + notice);
            Assumptions.abort(notice);
        }
    }

    @AfterAll
    public static void dropTestSchemas() throws Exception {
        if (driver == null) {
            return;
        }
        try (Connection connection = connect(); Statement dbStat = connection.createStatement()) {
            for (String schema : TEST_SCHEMAS) {
                dbStat.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
            }
        }
    }

    /** The dialect this class uses must be the one the server would pick for a PostgreSQL metadata DB. */
    @Test
    public void theDialectUnderTestIsTheProductionPostgresDialect() throws Exception {
        Assertions.assertEquals("postgresql", DIALECT.getDialectId());
        try (Connection raw = connect()) {
            Assertions.assertEquals(
                DbacRecoveryPolicy.VERSION_ROW_ONLY,
                DbacRecoveryPolicy.forDatabase(raw.getMetaData()),
                "PostgreSQL must be classified as a database that cannot replay the create script");
        }
    }

    /** A first installation must produce the whole schema and record version 1 exactly once. */
    @Test
    public void freshInstallCreatesTheWholeSchema() throws Exception {
        String schema = freshSchema("dbac_pg_fresh");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);

            Assertions.assertEquals(
                DbacSchemaConstants.SCHEMA_NOT_PRESENT,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            DbacSchemaValidator.validate(raw, schema);
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue());
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));
        }
    }

    /**
     * The core of the PostgreSQL recovery policy.
     * <p>
     * A complete structure whose version row was lost must be repaired by recording the version alone. The
     * script source used here throws if the create script is even opened, so this proves the absence of a
     * replay rather than assuming it.
     */
    @Test
    public void versionOnlyRecoveryNeverReopensTheCreateScript() throws Exception {
        String schema = freshSchema("dbac_pg_recovery");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);
            Assertions.assertNull(
                DbacTestSupport.readVersion(connection), "Precondition: the version row must be gone");

            // The structure is complete, so this must be classified as version-only recovery.
            Assertions.assertEquals(
                DbacSchemaConstants.RECOVERY_PENDING_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                "A complete PostgreSQL structure without a version row must route into the upgrade branch");

            schemaManager(connection, config, DbacTestSupport.createScriptIsForbidden()).updateSchema(MONITOR);

            DbacSchemaValidator.validate(raw, schema);
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue(),
                "The version must be recorded and committed by the upgrade path");
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));

            // And the next start must be an ordinary start, not another recovery.
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));
        }
    }

    /**
     * A partially installed schema must fail closed on PostgreSQL. There is no safe automatic repair: the
     * create script cannot be replayed, and guessing which objects are missing would be worse.
     */
    @Test
    public void partialInstallationFailsClosed() throws Exception {
        String schema = freshSchema("dbac_pg_partial");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);

            for (String statement : DbacTestSupport.createScriptStatements()) {
                if (mentions(statement, DbacSchemaConstants.VERSION_TABLE_NAME)
                    || mentions(statement, DbacSchemaConstants.TABLE_TW_CURRENT)) {
                    DbacTestSupport.execute(raw, statement.replace("{table_prefix}", schema + "."));
                }
            }

            Assertions.assertThrows(
                DBException.class,
                () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                "A partial PostgreSQL installation must not be repaired automatically");
            // DBException, not Exception: a NullPointerException from a missing platform must fail the
            // test rather than be mistaken for a correct refusal.
            Assertions.assertThrows(
                DBException.class,
                () -> schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR),
                "The whole migration must fail, not just the version check");

            // Nothing may have been added, and above all nothing may have been dropped.
            DbacSchemaReport report = DbacSchemaValidator.inspect(raw, schema);
            Assertions.assertTrue(
                report.presentTables().contains(DbacSchemaConstants.TABLE_TW_CURRENT),
                "A failed check must never drop the objects that are there");
            Assertions.assertFalse(report.isComplete());
        }
    }

    /** A recorded version must never be trusted over the actual structure. */
    @Test
    public void recordedVersionWithBrokenStructureFailsClosed() throws Exception {
        String schema = freshSchema("dbac_pg_broken");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            DbacTestSupport.execute(raw,
                "DROP TABLE " + schema + "." + DbacSchemaConstants.TABLE_AUDIT_EVENT);

            Assertions.assertThrows(
                DBException.class,
                () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue(),
                "A failed structure check must not modify the recorded version");
        }
    }

    /** Structural damage of every kind must be rejected, and never repaired by dropping anything. */
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
            "ALTER TABLE %s.DBAC_TW_HISTORY DROP CONSTRAINT dbac_tw_history_pkey",
            "ALTER TABLE %s.DBAC_TW_HISTORY ADD PRIMARY KEY (GRANT_ID)"});
        mutations.add(new String[]{"wrong primary key order",
            "ALTER TABLE %s.DBAC_TW_CURRENT DROP CONSTRAINT dbac_tw_current_pkey",
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
            String schema = freshSchema("dbac_pg_damaged");
            try (Connection raw = connect()) {
                InternalDatabaseConfig config = configFor(schema);
                Connection connection = new InternalProxyConnection(raw, config);
                schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
                Assertions.assertTrue(
                    DbacSchemaValidator.inspect(raw, schema).isComplete(),
                    "Precondition for '" + mutation[0] + "': a fresh schema must validate");

                for (int i = 1; i < mutation.length; i++) {
                    DbacTestSupport.execute(raw, String.format(mutation[i], schema));
                }

                DbacSchemaReport report = DbacSchemaValidator.inspect(raw, schema);
                Assertions.assertFalse(
                    report.isComplete(), "Damage was accepted as valid: " + mutation[0]);
                Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                    "Startup must be refused for: " + mutation[0]);
            }
        }
    }

    /**
     * PostgreSQL rolls DDL back, so a broken migration must leave nothing behind and the next attempt with
     * a working script must succeed without manual cleanup.
     */
    @Test
    public void failedMigrationRollsBackAndRecovers() throws Exception {
        String schema = freshSchema("dbac_pg_failed");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);

            SQLSchemaScriptSource broken = DbacTestSupport.fixedScriptSource(
                "CREATE TABLE {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                    + " (MODULE_ID VARCHAR(64) NOT NULL, VERSION INTEGER NOT NULL,"
                    + " UPDATE_TIME TIMESTAMP NOT NULL, PRIMARY KEY (MODULE_ID));\n"
                    + "CREATE TABLE {table_prefix}DBAC_BROKEN (THIS IS NOT VALID SQL);\n");

            // The recorded first error is what proves the migration actually ran and then failed on the
            // broken statement. Without it, "the schema is empty afterwards" is equally consistent with
            // the migration never having started at all.
            AtomicReference<SQLException> firstError = new AtomicReference<>();
            Connection recorded = DbacTestSupport.recording(connection, firstError);
            Assertions.assertThrows(
                DBException.class,
                () -> schemaManager(recorded, config, broken).updateSchema(MONITOR),
                "A broken migration must fail");
            Assertions.assertNotNull(
                firstError.get(),
                "The migration must have reached the database and failed there");
            Assertions.assertEquals(
                "42601", firstError.get().getSQLState(),
                "The first failure must be the syntax error of the broken statement, not something else: "
                    + DbacTestSupport.describe(firstError.get()));

            Assertions.assertTrue(
                DbacSchemaValidator.inspect(raw, schema).isAbsent(),
                "PostgreSQL has transactional DDL: a failed migration must leave the schema empty");

            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacSchemaValidator.validate(raw, schema);
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));
        }
    }

    /** Every object must land in the requested schema, and index names must stay unqualified. */
    @Test
    public void objectsAreCreatedInsideTheRequestedSchema() throws Exception {
        String schema = freshSchema("dbac_pg_objects");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);

            Assertions.assertEquals(4, count(raw,
                "SELECT count(*) FROM information_schema.tables WHERE table_schema=? AND table_name LIKE 'dbac%'",
                schema), "All four DBAC tables must be in " + schema);
            Assertions.assertEquals(6, count(raw,
                "SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname LIKE 'dbac%idx'",
                schema), "All six DBAC indexes must be in " + schema);
        }
    }

    /** A DBAC schema in a sibling schema must never be mistaken for this connection's schema. */
    @Test
    public void otherSchemaIsNotMistakenForThisOne() throws Exception {
        String schemaA = freshSchema("dbac_pg_other_a");
        String schemaB = freshSchema("dbac_pg_other_b");
        try (Connection raw = connect()) {
            InternalDatabaseConfig configA = configFor(schemaA);
            Connection connectionA = new InternalProxyConnection(raw, configA);
            schemaManager(connectionA, configA, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacSchemaValidator.validate(raw, schemaA);

            raw.setSchema(schemaB);
            InternalDatabaseConfig configB = configFor(schemaB);
            Connection connectionB = new InternalProxyConnection(raw, configB);

            // Also covers the "no configured schema" case: the connection's own schema must be used.
            Assertions.assertEquals(
                DbacSchemaConstants.SCHEMA_NOT_PRESENT,
                versionManager().getCurrentSchemaVersion(MONITOR, connectionB, null),
                "Empty schema B must be reported as fresh although schema A holds a DBAC version table");

            schemaManager(connectionB, configB, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacSchemaValidator.validate(raw, schemaB);
        }
    }

    /**
     * A schema name that only exists as a quoted mixed case identifier cannot be supported: the runner
     * substitutes {@code {table_prefix}} without quoting, so PostgreSQL would fold it to a different name.
     * The module rejects it with an explicit message instead of creating objects somewhere unexpected.
     */
    @Test
    public void quotedMixedCaseSchemaFailsClosed() throws Exception {
        String mixed = "DbacPgMixedCase";
        try (Connection raw = connect()) {
            DbacTestSupport.execute(raw, "DROP SCHEMA IF EXISTS \"" + mixed + "\" CASCADE");
            DbacTestSupport.execute(raw, "CREATE SCHEMA \"" + mixed + "\"");
            try {
                InternalDatabaseConfig config = configFor(mixed);
                Connection connection = new InternalProxyConnection(raw, config);
                DBException error = Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().getCurrentSchemaVersion(MONITOR, connection, mixed));
                Assertions.assertTrue(
                    error.getMessage().contains(mixed),
                    "The error must name the offending schema: " + error.getMessage());
            } finally {
                DbacTestSupport.execute(raw, "DROP SCHEMA IF EXISTS \"" + mixed + "\" CASCADE");
            }
        }
    }

    /**
     * The version row moves forward only, and only from the version this build expects to find.
     * <p>
     * A blind {@code WHERE MODULE_ID=?} update would let a build shipping version N silently downgrade an
     * installation already at a higher version. The schema would then be newer than the row claims, and
     * the next start would re-run migrations that have already been applied.
     */
    @Test
    public void versionRowIsNeverOverwrittenOrDowngraded() throws Exception {
        // An installation at version 2, and a build that records version 1.
        withInstalledSchema("dbac_pg_cas", (raw, connection, schema) -> {
            forceVersion(connection, 2);
            Assertions.assertThrows(
                DBException.class,
                () -> versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 1),
                "Recording version 1 over an installation at version 2 must fail closed");
            Assertions.assertEquals(
                2, DbacTestSupport.readVersion(connection).intValue(),
                "A refused downgrade must leave the row exactly as it was");
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));

            // Recording the version that is already there stays a no-op.
            forceVersion(connection, 1);
            versionManager(1).updateCurrentSchemaVersion(MONITOR, connection, schema, 1);
            Assertions.assertEquals(1, DbacTestSupport.readVersion(connection).intValue());
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));

            // The ordinary sequential upgrade succeeds through the compare-and-set.
            versionManager(2).updateCurrentSchemaVersion(MONITOR, connection, schema, 2);
            Assertions.assertEquals(2, DbacTestSupport.readVersion(connection).intValue());

            // A current version that is neither the target nor its predecessor is left alone.
            forceVersion(connection, 5);
            Assertions.assertThrows(
                DBException.class,
                () -> versionManager(5).updateCurrentSchemaVersion(MONITOR, connection, schema, 3));
            Assertions.assertEquals(5, DbacTestSupport.readVersion(connection).intValue());
        });
    }

    /**
     * A version this build does not ship must never be written, and the refusal must come before any
     * database write or structure check.
     */
    @Test
    public void versionAboveTheShippedOneIsRefused() throws Exception {
        withInstalledSchema("dbac_pg_upper", (raw, connection, schema) -> {
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
            Assertions.assertEquals(
                0, DbacTestSupport.countVersionRows(connection), "No row may be created");

            // Break the structure, then ask again. Both the version bound and the structure check would
            // throw DBException here, so the message is what distinguishes them: if the bound is really
            // evaluated first, the failure names the version and never mentions the missing column.
            DbacTestSupport.execute(raw,
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
        });
    }

    /**
     * An upgrade must not start unless every step of it has a script.
     * <p>
     * {@code SQLSchemaManager.upgradeSchemaVersion} does {@code if (ddlStream == null) continue;}, so a
     * missing script is skipped in silence: the schema ends up in a state no version describes, and every
     * later upgrade is blocked because the next compare-and-set expects a predecessor nobody wrote.
     */
    @Test
    public void upgradeIsRefusedWhenAnUpdateScriptIsMissing() throws Exception {
        withInstalledSchema("dbac_pg_chain", (raw, connection, schema) -> {
            // A build shipping version 3 against an installation at version 1 needs scripts 2 and 3.
            Assertions.assertEquals(
                1,
                managerWithScripts(3, updateScriptsExcept(-1))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "A complete chain must let the upgrade start");
            Assertions.assertThrows(
                DBException.class,
                () -> managerWithScripts(3, updateScriptsExcept(2))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "A gap in the middle of the chain must refuse the start");
            Assertions.assertThrows(
                DBException.class,
                () -> managerWithScripts(3, updateScriptsExcept(3))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "A missing last step must refuse the start");

            // The shipped source really does resolve version 1, so real installations are unaffected.
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));

            // The version-only recovery path reports an upgrade too, and is guarded by the same check.
            DbacTestSupport.deleteVersionRow(connection);
            Assertions.assertEquals(
                DbacSchemaConstants.RECOVERY_PENDING_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema));
            Assertions.assertThrows(
                DBException.class,
                () -> managerWithScripts(1, updateScriptsExcept(1))
                    .getCurrentSchemaVersion(MONITOR, connection, schema),
                "Version-only recovery must not start without dbac_schema_update_1.sql");
        });
    }

    /** The in-memory recovery signal must never reach the version table. */
    @Test
    public void recoveryPendingVersionIsNeverStored() throws Exception {
        withInstalledSchema("dbac_pg_cas_zero", (raw, connection, schema) -> {
            DbacTestSupport.deleteVersionRow(connection);
            for (int bad : new int[]{DbacSchemaConstants.RECOVERY_PENDING_VERSION, -1}) {
                Assertions.assertThrows(
                    DBException.class,
                    () -> versionManager().updateCurrentSchemaVersion(MONITOR, connection, schema, bad),
                    "Version " + bad + " must never be written");
            }
            Assertions.assertEquals(0, DbacTestSupport.countVersionRows(connection));
        });
    }

    /**
     * A concurrent insert must be absorbed without leaving the transaction aborted.
     * <p>
     * The decisive assertion is the statement executed on the same connection afterwards: on PostgreSQL a
     * unique violation that was not undone through a savepoint leaves the transaction in
     * {@code 25P02 in_failed_sql_transaction}, and every later statement fails. This is the branch the
     * savepoint exists for, driven deterministically rather than left to a real race.
     */
    @Test
    public void concurrentVersionInsertIsAbsorbedWithoutBreakingTheTransaction() throws Exception {
        String schema = freshSchema("dbac_pg_savepoint");
        try (Connection raw = connect(); Connection other = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            raw.setAutoCommit(false);
            Connection racing = DbacTestSupport.insertVersionRowConcurrently(
                connection, other, schema, DbacSchemaConstants.CURRENT_SCHEMA_VERSION);

            versionManager().updateCurrentSchemaVersion(
                MONITOR, racing, schema, DbacSchemaConstants.CURRENT_SCHEMA_VERSION);

            Assertions.assertTrue(
                DbacTestSupport.isUsable(raw, schema),
                "The transaction must survive the unique violation; without the savepoint this is 25P02");
            raw.commit();
            raw.setAutoCommit(true);
            Assertions.assertEquals(1, DbacTestSupport.countVersionRows(connection));
        }
    }

    /** A concurrent writer that recorded a different version must never be overwritten. */
    @Test
    public void concurrentVersionInsertWithADifferentVersionFailsClosed() throws Exception {
        String schema = freshSchema("dbac_pg_savepoint2");
        try (Connection raw = connect(); Connection other = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            raw.setAutoCommit(false);
            Connection racing = DbacTestSupport.insertVersionRowConcurrently(connection, other, schema, 7);

            Assertions.assertThrows(
                DBException.class,
                () -> versionManager().updateCurrentSchemaVersion(
                    MONITOR, racing, schema, DbacSchemaConstants.CURRENT_SCHEMA_VERSION),
                "Recording 1 over a concurrently written 7 must be refused");
            Assertions.assertTrue(
                DbacTestSupport.isUsable(raw, schema),
                "Even the refusal must leave the transaction usable");
            raw.rollback();
            raw.setAutoCommit(true);
            Assertions.assertEquals(
                7, DbacTestSupport.readVersion(connection).intValue(),
                "The other node's version must be left exactly as it was");
        }
    }

    /** Any SQLSTATE other than 23505 must escape unchanged; it must not be read as a lost race. */
    @Test
    public void nonUniqueViolationOnVersionInsertIsPropagated() throws Exception {
        String schema = freshSchema("dbac_pg_sqlstate");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            Connection failing = DbacTestSupport.failVersionInsertWith(connection, "08006");
            SQLException thrown = Assertions.assertThrows(
                SQLException.class,
                () -> versionManager().updateCurrentSchemaVersion(
                    MONITOR, failing, schema, DbacSchemaConstants.CURRENT_SCHEMA_VERSION),
                "A connection failure must not be absorbed as a concurrent write");
            Assertions.assertEquals(
                "08006", thrown.getSQLState(), "The original exception must be propagated unchanged");
            Assertions.assertEquals(
                0, DbacTestSupport.countVersionRows(connection), "No version may have been recorded");
        }
    }

    /** If the savepoint cannot be rolled back, the node must fail rather than claim success. */
    @Test
    public void savepointRollbackFailureFailsClosed() throws Exception {
        String schema = freshSchema("dbac_pg_savepoint3");
        try (Connection raw = connect(); Connection other = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            raw.setAutoCommit(false);
            Connection racing = DbacTestSupport.insertVersionRowConcurrently(
                connection, other, schema, DbacSchemaConstants.CURRENT_SCHEMA_VERSION);
            Connection broken = DbacTestSupport.failSavepointRollback(racing);

            Assertions.assertThrows(
                DBException.class,
                () -> versionManager().updateCurrentSchemaVersion(
                    MONITOR, broken, schema, DbacSchemaConstants.CURRENT_SCHEMA_VERSION),
                "A failed savepoint rollback must never be reported as an accepted concurrent write");
            raw.rollback();
            raw.setAutoCommit(true);
        }
    }

    /** Two nodes installing at the same time must converge on one valid schema and one version row. */
    @Test
    public void concurrentFreshInitializationConverges() throws Exception {
        String schema = freshSchema("dbac_pg_race");
        runRace(schema, DbacTestSupport.realScriptSource());
    }

    /** Two nodes performing version-only recovery at the same time must converge as well. */
    @Test
    public void concurrentVersionOnlyRecoveryConverges() throws Exception {
        String schema = freshSchema("dbac_pg_race2");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);
        }
        // The create script must stay untouched during a recovery race too.
        runRace(schema, DbacTestSupport.createScriptIsForbidden());
    }

    /**
     * Replaying the create script over an existing PostgreSQL schema must fail. This is the empirical
     * counterpart of {@code DbacScriptTranslationTest}: it shows the consequence, not just the SQL text.
     */
    @Test
    public void createScriptCannotBeReplayedOnPostgres() throws Exception {
        String schema = freshSchema("dbac_pg_replay");
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            DbacTestSupport.deleteVersionRow(connection);

            // Force the create branch the way a replay-based recovery would.
            SQLSchemaManager replay = new SQLSchemaManager(
                DbacSchemaConstants.SCHEMA_ID,
                DbacTestSupport.realScriptSource(),
                monitor -> connection,
                alwaysAbsentVersionManager(),
                DIALECT,
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
                config,
                null);

            Exception error = Assertions.assertThrows(
                Exception.class,
                () -> replay.updateSchema(MONITOR),
                "The translator strips IF NOT EXISTS on PostgreSQL, so a replay cannot succeed. "
                    + "If this ever passes, DbacRecoveryPolicy must be revisited.");
            SQLException sqlError = DbacTestSupport.findSqlException(error);
            Assertions.assertNotNull(sqlError, "Expected a database error: " + DbacTestSupport.describe(error));
        }
    }

    // ---------------------------------------------------------------- helpers

    private void runRace(String schema, SQLSchemaScriptSource scriptSource) throws Exception {
        CyclicBarrier barrier = new CyclicBarrier(2);
        List<AtomicReference<Throwable>> results = List.of(new AtomicReference<>(), new AtomicReference<>());
        // The runner retries a failed statement on the same connection, so on PostgreSQL the exception
        // that escapes is normally 25P02 and says nothing about the real conflict. Capture the first error.
        List<AtomicReference<SQLException>> firstErrors =
            List.of(new AtomicReference<>(), new AtomicReference<>());
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            AtomicReference<Throwable> result = results.get(i);
            AtomicReference<SQLException> firstError = firstErrors.get(i);
            Thread thread = new Thread(() -> {
                try (Connection raw = connect()) {
                    InternalDatabaseConfig config = configFor(schema);
                    Connection connection = DbacTestSupport.recording(
                        new InternalProxyConnection(raw, config), firstError);
                    new SQLSchemaManager(
                        DbacSchemaConstants.SCHEMA_ID,
                        scriptSource,
                        monitor -> connection,
                        DbacTestSupport.barrier(versionManager(), barrier),
                        DIALECT,
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
                    error, firstErrors.get(i).get(), DbacTestSupport.POSTGRES_RACE_SQL_STATES,
                    "concurrent migration in " + schema);
            }
        }
        Assertions.assertTrue(failures <= 1, "Both racing nodes failed, so the race resolved nothing");

        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            if (failures > 0) {
                // A loser is acceptable only if a plain retry then completes, as the next start would.
                schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            }
            DbacSchemaValidator.validate(raw, schema);
            Assertions.assertEquals(
                1, DbacTestSupport.countVersionRows(connection),
                "Concurrent initialization must not create duplicate version rows");
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                DbacTestSupport.readVersion(connection).intValue());
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                versionManager().getCurrentSchemaVersion(MONITOR, connection, schema),
                "The schema left by the race must be usable on the next start");
        }
    }

    /** Forces the create branch of {@code SQLSchemaManager} regardless of the real state. */
    private static SQLSchemaVersionManager alwaysAbsentVersionManager() {
        return new SQLSchemaVersionManager() {
            @Override
            public int getCurrentSchemaVersion(DBRProgressMonitor monitor, Connection connection, String schemaName) {
                return DbacSchemaConstants.SCHEMA_NOT_PRESENT;
            }

            @Override
            public int getLatestSchemaVersion() {
                return DbacSchemaConstants.CURRENT_SCHEMA_VERSION;
            }

            @Override
            public void updateCurrentSchemaVersion(
                DBRProgressMonitor monitor, Connection connection, String schemaName, int version) {
                // not reached: the create script fails first
            }
        };
    }

    private static boolean mentions(String statement, String tableName) {
        return statement.toUpperCase(java.util.Locale.ROOT).contains(tableName);
    }

    private static int count(Connection connection, String sql, String schema) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(sql)) {
            dbStat.setString(1, schema);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                Assertions.assertTrue(dbResult.next());
                return dbResult.getInt(1);
            }
        }
    }

    private static Properties credentials() {
        Properties props = new Properties();
        props.setProperty("user", USER);
        props.setProperty("password", PASSWORD);
        return props;
    }

    private static Connection connect() throws SQLException {
        return driver.connect(URL, credentials());
    }

    private static File findDriverJar() {
        File dir = new File(System.getProperty("user.dir"));
        for (int i = 0; i < 6 && dir != null; i++, dir = dir.getParentFile()) {
            File candidate = new File(dir, "deploy/drivers/postgresql");
            File[] jars = candidate.listFiles((d, name) ->
                name.startsWith("postgresql-") && name.endsWith(".jar"));
            if (jars != null && jars.length > 0) {
                return jars[0];
            }
        }
        return null;
    }

    private static String freshSchema(String name) throws Exception {
        try (Connection connection = connect(); Statement dbStat = connection.createStatement()) {
            dbStat.execute("DROP SCHEMA IF EXISTS " + name + " CASCADE");
            dbStat.execute("CREATE SCHEMA " + name);
        }
        return name;
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

    private static SQLSchemaScriptSource updateScriptsExcept(int missingVersion) {
        return DbacTestSupport.updateScriptsExcept(missingVersion);
    }

    private interface SchemaBody {
        void run(Connection raw, Connection proxied, String schema) throws Exception;
    }

    /** Installs the schema in a fresh namespace through the real migration, then runs the body. */
    private void withInstalledSchema(String name, SchemaBody body) throws Exception {
        String schema = freshSchema(name);
        try (Connection raw = connect()) {
            InternalDatabaseConfig config = configFor(schema);
            Connection connection = new InternalProxyConnection(raw, config);
            schemaManager(connection, config, DbacTestSupport.realScriptSource()).updateSchema(MONITOR);
            body.run(raw, connection, schema);
        }
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
            DIALECT,
            DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
            DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
            config,
            null);
    }

    private static InternalDatabaseConfig configFor(String schema) {
        return DbacTestSupport.config(null, schema);
    }
}

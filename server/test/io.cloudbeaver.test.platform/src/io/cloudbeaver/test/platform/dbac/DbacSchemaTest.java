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
import io.cloudbeaver.service.dbac.db.DbacIdentifiers;
import io.cloudbeaver.service.dbac.db.DbacRecoveryPolicy;
import io.cloudbeaver.service.dbac.db.DbacSchema;
import io.cloudbeaver.service.dbac.db.DbacSchemaConstants;
import io.cloudbeaver.service.dbac.db.DbacSchemaValidator;
import io.cloudbeaver.service.dbac.db.DbacSchemaVersionManager;
import io.cloudbeaver.service.security.EmbeddedSecurityControllerFactory;
import io.cloudbeaver.service.security.db.CBDatabase;
import org.jkiss.dbeaver.model.connection.InternalDatabaseConfig;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor;
import org.jkiss.dbeaver.model.sql.db.InternalProxyConnection;
import org.jkiss.dbeaver.model.sql.schema.ClassLoaderScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Verifies that the fork-owned DBAC metadata schema is created as an independent schema module and
 * that it leaves the CloudBeaver CE schema untouched.
 * <p>
 * These are integration tests: they run against the metadata database of an actually started CE
 * server, which is also the first real verification that the three-argument {@code CBDatabase}
 * constructor path works at runtime.
 */
public class DbacSchemaTest {

    private static final String CE_VERSION_TABLE = "{table_prefix}CB_SCHEMA_INFO";
    private static final String DBAC_VERSION_TABLE = "{table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME;
    private static final String CE_MODULE_ID = "CB_CE";
    /**
     * Pinned on purpose, as a tripwire rather than a convenience.
     * <p>
     * The whole point of the fork-owned schema module is that it never touches the CE version. Reading
     * {@code CBDatabase.CURRENT_SCHEMA_VERSION} here instead would make this test agree with whatever the
     * code does, including the bug it exists to catch. When upstream bumps the CE schema, this constant is
     * meant to fail and be updated deliberately after checking that the DBAC module was not the cause.
     */
    private static final int CE_EXPECTED_VERSION = 29;

    /** Upper case because H2 folds unquoted identifiers up; see {@link #metadataDatabaseIsH2}. */
    private static final String TEST_SCHEMA = "DBAC_PREFIX_TEST";

    private static final DBRProgressMonitor MONITOR = new LoggingProgressMonitor();

    private static CBDatabase database;

    @BeforeAll
    public static void startServer() throws Exception {
        CEAppStarter.startServerIfNotStarted();
        database = EmbeddedSecurityControllerFactory.getDbInstance();
        Assertions.assertNotNull(database, "CBDatabase instance must exist after server startup");
    }

    /**
     * The CE schema must be completely unaffected by adding the DBAC module.
     */
    @Test
    public void ceSchemaVersionIsPreserved() throws Exception {
        try (Connection connection = database.openConnection()) {
            Integer ceVersion = readVersion(connection, CE_VERSION_TABLE, CE_MODULE_ID);
            Assertions.assertNotNull(ceVersion, "CE schema version row must exist");
            Assertions.assertEquals(
                CE_EXPECTED_VERSION, ceVersion.intValue(),
                "CE schema version must not be modified by the DBAC schema module");

            // The DBAC module must never register itself in the CE version table.
            Assertions.assertNull(
                readVersion(connection, CE_VERSION_TABLE, DbacSchemaConstants.SCHEMA_ID),
                "DBAC module must not write a row into CB_SCHEMA_INFO");

            // The whole CE version table must be unchanged, not just the CE row's version value.
            List<String> ceRows = readAllVersionRows(connection, CE_VERSION_TABLE);
            Assertions.assertEquals(
                List.of(CE_MODULE_ID + "=" + CE_EXPECTED_VERSION), ceRows,
                "CB_SCHEMA_INFO must contain exactly the untouched CE row");
        }
    }

    /**
     * The installed schema must satisfy the full structural contract: columns, primary keys, indexes.
     */
    @Test
    public void installedSchemaPassesStructuralValidation() throws Exception {
        try (Connection connection = database.openConnection()) {
            String schema = database.getDatabaseConfig().getSchema();
            if (schema == null || schema.isEmpty()) {
                schema = connection.getSchema();
            }
            DbacSchemaValidator.validate(connection, schema);
        }
    }

    /**
     * All four DBAC tables must be created by the create migration.
     */
    @Test
    public void dbacTablesAreCreated() throws Exception {
        try (Connection connection = database.openConnection()) {
            String schema = database.getDatabaseConfig().getSchema();
            for (String table : new String[]{
                DbacSchemaConstants.VERSION_TABLE_NAME,
                DbacSchemaConstants.TABLE_TW_CURRENT,
                DbacSchemaConstants.TABLE_TW_HISTORY,
                DbacSchemaConstants.TABLE_AUDIT_EVENT
            }) {
                Assertions.assertTrue(
                    tableExists(connection, schema, table),
                    "DBAC table must exist: " + table);
            }
        }
    }

    /**
     * The DBAC version must be recorded in its own version table under its own module id.
     */
    @Test
    public void dbacVersionIsRecordedInOwnTable() throws Exception {
        try (Connection connection = database.openConnection()) {
            Integer dbacVersion = readVersion(connection, DBAC_VERSION_TABLE, DbacSchemaConstants.SCHEMA_ID);
            Assertions.assertNotNull(dbacVersion, "DBAC schema version row must exist");
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION, dbacVersion.intValue(),
                "DBAC schema version must be the current one");

            // The CE module must never appear in the DBAC version table.
            Assertions.assertNull(
                readVersion(connection, DBAC_VERSION_TABLE, CE_MODULE_ID),
                "CE module must not have a row in DBAC_SCHEMA_INFO");
        }
    }

    /**
     * Running the schema update again on an already installed schema must not re-run any migration.
     * <p>
     * This is deliberately not called a replay test: the version manager reports the installed version, so
     * {@code SQLSchemaManager} takes neither the create nor the upgrade branch and no script is opened at
     * all. Actual replay behaviour is covered by {@code DbacSchemaRecoveryTest} on H2 and is impossible by
     * design on PostgreSQL, see {@code DbacSchemaPostgresTest}.
     */
    @Test
    public void repeatedSchemaUpdateDoesNotRerunAnyMigration() throws Exception {
        try (Connection connection = database.openConnection()) {
            long historyRowsBefore = countRows(connection, "{table_prefix}" + DbacSchemaConstants.TABLE_TW_HISTORY);

            // Version manager already reports the installed version, so SQLSchemaManager will neither
            // create nor upgrade.
            int reported = DbacSchema.getSchemaConfig().getVersionManager()
                .getCurrentSchemaVersion(MONITOR, connection, database.getDatabaseConfig().getSchema());
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION, reported,
                "Installed DBAC version must be reported, not -1");

            // Run the real migration path a second time - it must complete without error.
            newSchemaManager(connection, database.getDatabaseConfig()).updateSchema(MONITOR);

            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                readVersion(connection, DBAC_VERSION_TABLE, DbacSchemaConstants.SCHEMA_ID).intValue(),
                "DBAC version must stay unchanged after a repeated update");
            Assertions.assertEquals(
                historyRowsBefore,
                countRows(connection, "{table_prefix}" + DbacSchemaConstants.TABLE_TW_HISTORY),
                "Repeated update must not drop or recreate DBAC tables");
            Assertions.assertEquals(
                CE_EXPECTED_VERSION,
                readVersion(connection, CE_VERSION_TABLE, CE_MODULE_ID).intValue(),
                "Repeated DBAC update must not touch the CE schema version");
        }
    }

    /**
     * A version lookup failure that is not "table missing" must fail initialization instead of being
     * reported as "schema absent", which would replay the create script over a populated schema.
     */
    @Test
    public void unexpectedVersionQueryErrorIsNotTreatedAsMissingSchema() throws Exception {
        try (Connection connection = database.openConnection()) {
            Connection failing = (Connection) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{Connection.class},
                (proxy, method, args) -> {
                    if ("prepareStatement".equals(method.getName())) {
                        throw new SQLException("Injected metadata database failure", "08006");
                    }
                    try {
                        return method.invoke(connection, args);
                    } catch (java.lang.reflect.InvocationTargetException e) {
                        throw e.getTargetException();
                    }
                });

            DbacSchemaVersionManager versionManager = new DbacSchemaVersionManager(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION, DbacSchemaConstants.SCHEMA_ID,
                DbacSchema.getScriptSource());

            // The version table exists (metadata calls are delegated), so the SELECT failure must escape.
            Assertions.assertThrows(
                SQLException.class,
                () -> versionManager.getCurrentSchemaVersion(
                    MONITOR, failing, database.getDatabaseConfig().getSchema()),
                "A real database failure must be propagated, not converted into SCHEMA_NOT_PRESENT");
        }
    }

    /**
     * With a non-default schema prefix, every DBAC object must be created inside that schema, and the
     * version manager must report "absent" there before the migration runs.
     */
    @Test
    public void schemaPrefixIsApplied() throws Exception {
        // TEST_SCHEMA is written upper case, which only survives unquoted use on an upper-folding
        // database. On a PostgreSQL metadata database the module would correctly refuse the name, and this
        // test would fail for an environment reason rather than a defect. Skip rather than mislead.
        Assumptions.assumeTrue(
            metadataDatabaseIsH2(),
            "schemaPrefixIsApplied describes H2 identifier folding; metadata database is not H2");
        try (Connection rawConnection = database.openConnection()) {
            // Start from a clean schema so the test stays valid when the metadata database is reused
            // between runs (this test asserts the "schema absent" state before the migration).
            try (Statement dbStat = rawConnection.createStatement()) {
                dbStat.execute("DROP SCHEMA IF EXISTS " + TEST_SCHEMA + " CASCADE");
                dbStat.execute("CREATE SCHEMA " + TEST_SCHEMA);
            }

            InternalDatabaseConfig prefixedConfig = withSchema(database.getDatabaseConfig(), TEST_SCHEMA);
            Connection prefixed = new InternalProxyConnection(rawConnection, prefixedConfig);

            DbacSchemaVersionManager versionManager = new DbacSchemaVersionManager(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION, DbacSchemaConstants.SCHEMA_ID,
                DbacSchema.getScriptSource());
            Assertions.assertEquals(
                DbacSchemaConstants.SCHEMA_NOT_PRESENT,
                versionManager.getCurrentSchemaVersion(MONITOR, prefixed, TEST_SCHEMA),
                "An empty schema must be reported as absent so the create script runs");

            newSchemaManager(prefixed, prefixedConfig).updateSchema(MONITOR);

            for (String table : new String[]{
                DbacSchemaConstants.VERSION_TABLE_NAME,
                DbacSchemaConstants.TABLE_TW_CURRENT,
                DbacSchemaConstants.TABLE_TW_HISTORY,
                DbacSchemaConstants.TABLE_AUDIT_EVENT
            }) {
                Assertions.assertTrue(
                    tableExists(rawConnection, TEST_SCHEMA, table),
                    "DBAC table must be created inside the prefixed schema: " + table);
            }
            Assertions.assertEquals(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
                versionManager.getCurrentSchemaVersion(MONITOR, prefixed, TEST_SCHEMA),
                "DBAC version must be recorded inside the prefixed schema");

            // The CE schema is still untouched by a prefixed DBAC installation.
            Assertions.assertEquals(
                CE_EXPECTED_VERSION,
                readVersion(rawConnection, CE_VERSION_TABLE, CE_MODULE_ID).intValue(),
                "Prefixed DBAC installation must not touch the CE schema version");
        }
    }

    // ---------------------------------------------------------------- helpers

    private static SQLSchemaManager newSchemaManager(
        Connection connection,
        InternalDatabaseConfig config
    ) {
        return new SQLSchemaManager(
            DbacSchemaConstants.SCHEMA_ID,
            new ClassLoaderScriptSource(
                DbacSchema.class.getClassLoader(),
                DbacSchemaConstants.CREATE_SCRIPT_PATH,
                DbacSchemaConstants.UPDATE_SCRIPT_PREFIX),
            monitor -> connection,
            new DbacSchemaVersionManager(
                DbacSchemaConstants.CURRENT_SCHEMA_VERSION, DbacSchemaConstants.SCHEMA_ID,
                DbacSchema.getScriptSource()),
            database.getDialect(),
            DbacSchemaConstants.CURRENT_SCHEMA_VERSION,
            DbacSchemaConstants.OBSOLETE_SCHEMA_VERSION,
            config,
            null);
    }

    private static List<String> readAllVersionRows(Connection connection, String table) throws SQLException {
        List<String> rows = new ArrayList<>();
        try (PreparedStatement dbStat = connection.prepareStatement(
            "SELECT MODULE_ID, VERSION FROM " + table + " ORDER BY MODULE_ID");
             ResultSet dbResult = dbStat.executeQuery()
        ) {
            while (dbResult.next()) {
                rows.add(dbResult.getString(1) + "=" + dbResult.getInt(2));
            }
        }
        return rows;
    }

    private static Integer readVersion(Connection connection, String table, String moduleId) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "SELECT VERSION FROM " + table + " WHERE MODULE_ID=?")
        ) {
            dbStat.setString(1, moduleId);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                return dbResult.next() ? dbResult.getInt(1) : null;
            }
        }
    }

    private static long countRows(Connection connection, String table) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement("SELECT COUNT(*) FROM " + table);
             ResultSet dbResult = dbStat.executeQuery()
        ) {
            return dbResult.next() ? dbResult.getLong(1) : -1;
        }
    }

    /** True when the running server's metadata database is H2. */
    private static boolean metadataDatabaseIsH2() throws Exception {
        try (Connection connection = database.openConnection()) {
            return DbacRecoveryPolicy.forDatabase(connection.getMetaData())
                == DbacRecoveryPolicy.REPLAY_CREATE_SCRIPT;
        }
    }

    /**
     * Looks a table up with the same folding rule the production code uses.
     * <p>
     * Deliberately not a case-insensitive search over several spellings: {@code DbacIdentifiers} exists
     * precisely because probing accepts an object the migration could never have created, and a test that
     * probes is a test that passes for the wrong reason.
     */
    private static boolean tableExists(Connection connection, String schemaName, String tableName)
        throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        String schema = DbacIdentifiers.fold(metaData, resolveSchema(connection, schemaName));
        String table = DbacIdentifiers.fold(metaData, tableName);
        try (ResultSet dbResult = metaData.getTables(
            null,
            DbacIdentifiers.escapePattern(metaData, schema),
            DbacIdentifiers.escapePattern(metaData, table),
            new String[]{"TABLE"})
        ) {
            while (dbResult.next()) {
                // Every DBAC name contains '_', which is a wildcard in a JDBC pattern. Compare the
                // returned row exactly so a near-miss in another schema cannot satisfy the assertion.
                if (table.equals(dbResult.getString("TABLE_NAME"))
                    && (dbResult.getString("TABLE_SCHEM") == null
                        || schema.equals(dbResult.getString("TABLE_SCHEM")))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * The schema the DBAC objects live in: the configured one, or the connection's own when none is set.
     * Never null - passing null to JDBC metadata means "any schema", which would let a table created by
     * another test in a different schema satisfy the assertion.
     */
    private static String resolveSchema(Connection connection, String configuredSchema) throws SQLException {
        if (configuredSchema != null && !configuredSchema.isEmpty()) {
            return configuredSchema;
        }
        return connection.getSchema();
    }

    private static InternalDatabaseConfig withSchema(InternalDatabaseConfig base, String schema) {
        return new InternalDatabaseConfig() {
            @Override
            public String getDriver() {
                return base.getDriver();
            }

            @Override
            public void setDriver(String driver) {
                throw new UnsupportedOperationException();
            }

            @Override
            public String getUrl() {
                return base.getUrl();
            }

            @Override
            public void setUrl(String url) {
                throw new UnsupportedOperationException();
            }

            @Override
            public String getUser() {
                return base.getUser();
            }

            @Override
            public String getPassword() {
                return base.getPassword();
            }

            @Override
            public String getSchema() {
                return schema;
            }

            @Override
            public void setSchema(String s) {
                throw new UnsupportedOperationException();
            }

            @Override
            public Pool getPool() {
                return base.getPool();
            }

            @Override
            public boolean isBackupEnabled() {
                return false;
            }
        };
    }
}

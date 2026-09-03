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

import io.cloudbeaver.service.dbac.db.DbacSchema;
import io.cloudbeaver.service.dbac.db.DbacSchemaConstants;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.connection.InternalDatabaseConfig;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.schema.ClassLoaderScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.junit.jupiter.api.Assertions;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Shared helpers of the DBAC schema tests.
 * <p>
 * Test only. Nothing here is used by the server; in particular the failure injection never touches the
 * production migration scripts, and no helper ever drops or recreates an object to make an assertion pass.
 */
final class DbacTestSupport {

    /**
     * SQLSTATEs that can be the <b>first cause</b> of losing a concurrent migration race on PostgreSQL.
     * <p>
     * {@code 25P02} is deliberately absent. It means "the transaction is already aborted", which is a
     * consequence of an earlier failure, never a conflict in itself - and it is exactly what
     * {@code SQLSchemaManager.executeScript} surfaces, because it retries a failed statement on the same
     * connection and the retry reports the aborted transaction instead of the original error. Accepting it
     * as evidence of a healthy race would accept any failure whatsoever. {@link #recording} captures the
     * genuine first error so it can be judged instead.
     */
    static final Set<String> POSTGRES_RACE_SQL_STATES = Set.of(
        "42P07", // duplicate_table
        "42710", // duplicate_object
        "23505", // unique_violation, raised on a catalog index
        "23P01", // exclusion_violation
        "40001", // serialization_failure
        "40P01", // deadlock_detected
        "55P03"  // lock_not_available
    );

    /** SQLSTATEs that can be the first cause of losing a concurrent migration race on H2. */
    static final Set<String> H2_RACE_SQL_STATES = Set.of(
        "42S01", // table already exists
        "42501", // object already exists (H2 spelling for some objects)
        "23505", // unique_violation
        "40001", // deadlock
        "90131", // concurrent update
        "HYT00"  // lock timeout
    );

    /** SQLSTATE meaning the transaction was already unusable; a symptom, never a diagnosis. */
    static final String SQL_STATE_IN_FAILED_TRANSACTION = "25P02";

    static SQLSchemaScriptSource realScriptSource() {
        return new ClassLoaderScriptSource(
            DbacSchema.class.getClassLoader(),
            DbacSchemaConstants.CREATE_SCRIPT_PATH,
            DbacSchemaConstants.UPDATE_SCRIPT_PREFIX);
    }

    /**
     * A script source that fails loudly if the create script is opened at all.
     * <p>
     * This is how "the recovery must not replay the create script" is proven rather than assumed: an
     * {@link AssertionError} is not an {@code Exception}, so it is not swallowed by the {@code catch
     * (Exception e)} in {@code SQLSchemaManager.updateSchema} and reaches the test unchanged.
     */
    static SQLSchemaScriptSource createScriptIsForbidden() {
        SQLSchemaScriptSource delegate = realScriptSource();
        return new SQLSchemaScriptSource() {
            @Override
            public Reader openSchemaCreateScript(DBRProgressMonitor monitor, String specificPrefix) {
                throw new AssertionError(
                    "The create script must not be opened: on PostgreSQL the translator strips "
                        + "IF NOT EXISTS, so replaying it over an existing schema cannot work");
            }

            @Override
            public Reader openSchemaUpdateScript(DBRProgressMonitor monitor, int versionNumber, String prefix)
                throws IOException, DBException {
                return delegate.openSchemaUpdateScript(monitor, versionNumber, prefix);
            }
        };
    }

    /**
     * A script source that reports an update script for every version except {@code missingVersion}
     * (pass a value below 1 for a complete chain). Used to drive the update-chain tripwire without
     * touching the shipped resources.
     */
    static SQLSchemaScriptSource updateScriptsExcept(int missingVersion) {
        return new SQLSchemaScriptSource() {
            @Override
            public Reader openSchemaCreateScript(DBRProgressMonitor monitor, String specificPrefix) {
                throw new AssertionError("The chain check must not open the create script");
            }

            @Override
            public Reader openSchemaUpdateScript(DBRProgressMonitor monitor, int version, String prefix) {
                return version == missingVersion ? null : new StringReader("SELECT 1;\n");
            }
        };
    }

    /** Test only script source used to inject a failing migration. */
    static SQLSchemaScriptSource fixedScriptSource(String script) {
        return new SQLSchemaScriptSource() {
            @Override
            public Reader openSchemaCreateScript(DBRProgressMonitor monitor, String specificPrefix) {
                return new StringReader(script);
            }

            @Override
            public Reader openSchemaUpdateScript(DBRProgressMonitor monitor, int versionNumber, String prefix) {
                return null;
            }
        };
    }

    /**
     * Wraps a version manager so that every node waits at the barrier after its version check.
     * <p>
     * Without this the two "nodes" simply run one after the other and the test proves nothing. The barrier
     * is released once both have decided what the schema state is and are about to write to it, which is
     * the only window in which they can actually collide.
     */
    static SQLSchemaVersionManager barrier(SQLSchemaVersionManager delegate, CyclicBarrier barrier) {
        return new SQLSchemaVersionManager() {
            @Override
            public int getCurrentSchemaVersion(DBRProgressMonitor monitor, Connection connection, String schemaName)
                throws DBException, SQLException {
                int version = delegate.getCurrentSchemaVersion(monitor, connection, schemaName);
                await(barrier);
                return version;
            }

            @Override
            public int getLatestSchemaVersion() {
                return delegate.getLatestSchemaVersion();
            }

            @Override
            public void updateCurrentSchemaVersion(
                DBRProgressMonitor monitor, Connection connection, String schemaName, int version
            ) throws DBException, SQLException {
                delegate.updateCurrentSchemaVersion(monitor, connection, schemaName, version);
            }
        };
    }

    private static void await(CyclicBarrier barrier) throws DBException {
        try {
            barrier.await(60, java.util.concurrent.TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new DBException("Concurrency barrier failed", e);
        }
    }

    /**
     * Accepts a racing node's failure only when its <b>first</b> database error is a real object or lock
     * conflict.
     * <p>
     * The exception that reaches the caller is not a reliable diagnosis: on PostgreSQL the migration
     * runner retries a failed statement on the same connection, so what escapes is usually
     * {@code 25P02 in_failed_sql_transaction}, which says nothing about why the first statement failed.
     * {@code firstRecorded} is the error captured by {@link #recording} at the moment it happened, and it
     * is what gets judged. A run that only ever saw {@code 25P02} is rejected outright.
     *
     * @param firstRecorded first SQLException seen on the racing node's connection, or {@code null}
     */
    static void assertAcceptableRaceFailure(
        Throwable error,
        @Nullable SQLException firstRecorded,
        Set<String> allowedSqlStates,
        String context
    ) {
        SQLException cause = firstRecorded != null ? firstRecorded : findSqlException(error);
        Assertions.assertNotNull(
            cause,
            context + ": a racing node must fail with a database conflict, but failed with " + describe(error));
        Assertions.assertNotEquals(
            SQL_STATE_IN_FAILED_TRANSACTION, cause.getSQLState(),
            context + ": " + SQL_STATE_IN_FAILED_TRANSACTION + " only says the transaction was already "
                + "broken, so it cannot justify calling this a normal race. First recorded error: "
                + describe(cause) + "; thrown: " + describe(error));
        Assertions.assertTrue(
            allowedSqlStates.contains(cause.getSQLState()),
            context + ": SQLSTATE " + cause.getSQLState() + " is not an expected conflict ("
                + allowedSqlStates + "). First recorded error: " + describe(cause)
                + "; thrown: " + describe(error));
    }

    /**
     * Wraps a connection so the first {@link SQLException} thrown by any statement executed on it is
     * captured, before the migration runner's retry can replace it with a follow-up error.
     */
    static Connection recording(Connection target, AtomicReference<SQLException> firstError) {
        return (Connection) Proxy.newProxyInstance(
            DbacTestSupport.class.getClassLoader(),
            new Class<?>[]{Connection.class},
            (proxy, method, args) -> {
                Object result = invoke(target, method, args);
                if (result instanceof PreparedStatement prepared) {
                    return recordingStatement(prepared, PreparedStatement.class, firstError);
                }
                if (result instanceof Statement statement) {
                    return recordingStatement(statement, Statement.class, firstError);
                }
                return result;
            });
    }

    private static Object recordingStatement(
        Statement target, Class<?> iface, AtomicReference<SQLException> firstError) {
        return Proxy.newProxyInstance(
            DbacTestSupport.class.getClassLoader(),
            new Class<?>[]{iface},
            (proxy, method, args) -> {
                try {
                    return invoke(target, method, args);
                } catch (SQLException e) {
                    firstError.compareAndSet(null, e);
                    throw e;
                }
            });
    }

    private static Object invoke(Object target, java.lang.reflect.Method method, Object[] args)
        throws Throwable {
        try {
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getTargetException();
        }
    }

    // ---------------------------------------------------------------- failure injection
    //
    // These wrappers exist so the concurrency and error handling branches of
    // DbacSchemaVersionManager.insertVersionRow can be driven deterministically. A real race would
    // exercise them only occasionally, which is not good enough for the branch that decides whether a
    // node may report a version it did not write. None of this touches production code or scripts.

    /**
     * Wraps a connection so that another node inserts the version row on {@code other} just before this
     * connection attempts its own INSERT, producing a genuine unique violation every time.
     */
    static Connection insertVersionRowConcurrently(
        Connection target, Connection other, String schema, int otherVersion) {
        return (Connection) Proxy.newProxyInstance(
            DbacTestSupport.class.getClassLoader(),
            new Class<?>[]{Connection.class},
            (proxy, method, args) -> {
                if (isInsert(method, args)) {
                    try (PreparedStatement dbStat = other.prepareStatement(
                        "INSERT INTO " + schema + "." + DbacSchemaConstants.VERSION_TABLE_NAME
                            + " (MODULE_ID,VERSION,UPDATE_TIME) VALUES(?,?,CURRENT_TIMESTAMP)")) {
                        dbStat.setString(1, DbacSchemaConstants.SCHEMA_ID);
                        dbStat.setInt(2, otherVersion);
                        dbStat.executeUpdate();
                    }
                }
                return invoke(target, method, args);
            });
    }

    /** Wraps a connection so the version INSERT fails with a chosen SQLSTATE. */
    static Connection failVersionInsertWith(Connection target, String sqlState) {
        return (Connection) Proxy.newProxyInstance(
            DbacTestSupport.class.getClassLoader(),
            new Class<?>[]{Connection.class},
            (proxy, method, args) -> {
                if (isInsert(method, args)) {
                    throw new SQLException("Injected version insert failure", sqlState);
                }
                return invoke(target, method, args);
            });
    }

    /** Wraps a connection so rolling back to a savepoint always fails. */
    static Connection failSavepointRollback(Connection target) {
        return (Connection) Proxy.newProxyInstance(
            DbacTestSupport.class.getClassLoader(),
            new Class<?>[]{Connection.class},
            (proxy, method, args) -> {
                if ("rollback".equals(method.getName()) && args != null && args.length == 1) {
                    throw new SQLException("Injected savepoint rollback failure", "58000");
                }
                return invoke(target, method, args);
            });
    }

    private static boolean isInsert(java.lang.reflect.Method method, Object[] args) {
        return "prepareStatement".equals(method.getName())
            && args != null && args.length > 0
            && String.valueOf(args[0]).toUpperCase(java.util.Locale.ROOT).startsWith("INSERT");
    }

    /** True when the connection can still be used, i.e. the transaction was not left aborted. */
    static boolean isUsable(Connection connection, String schema) {
        try (Statement dbStat = connection.createStatement();
             ResultSet dbResult = dbStat.executeQuery(
                 "SELECT COUNT(*) FROM " + schema + "." + DbacSchemaConstants.VERSION_TABLE_NAME)
        ) {
            return dbResult.next();
        } catch (SQLException e) {
            return false;
        }
    }

    static SQLException findSqlException(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof SQLException sqlException) {
                return sqlException;
            }
            if (current.getCause() == current) {
                break;
            }
        }
        return null;
    }

    static String describe(Throwable error) {
        if (error == null) {
            return "no error";
        }
        StringBuilder sb = new StringBuilder();
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (sb.length() > 0) {
                sb.append(" <- ");
            }
            sb.append(current.getClass().getSimpleName());
            if (current instanceof SQLException sqlException) {
                sb.append('[').append(sqlException.getSQLState()).append(']');
            }
            sb.append(": ").append(String.valueOf(current.getMessage()).split("\n")[0]);
            if (current.getCause() == current) {
                break;
            }
        }
        return sb.toString();
    }

    // ---------------------------------------------------------------- schema queries

    static Integer readVersion(Connection connection) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "SELECT VERSION FROM {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " WHERE MODULE_ID=?")
        ) {
            dbStat.setString(1, DbacSchemaConstants.SCHEMA_ID);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                return dbResult.next() ? dbResult.getInt(1) : null;
            }
        }
    }

    static int countVersionRows(Connection connection) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "SELECT COUNT(*) FROM {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " WHERE MODULE_ID=?")
        ) {
            dbStat.setString(1, DbacSchemaConstants.SCHEMA_ID);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                return dbResult.next() ? dbResult.getInt(1) : -1;
            }
        }
    }

    static void deleteVersionRow(Connection connection) throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "DELETE FROM {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME + " WHERE MODULE_ID=?")
        ) {
            dbStat.setString(1, DbacSchemaConstants.SCHEMA_ID);
            dbStat.executeUpdate();
        }
    }

    static void execute(Connection connection, String sql) throws SQLException {
        try (Statement dbStat = connection.createStatement()) {
            dbStat.execute(sql);
        }
    }

    /** Reads the production create script and returns its individual statements, comments removed. */
    static List<String> createScriptStatements() throws Exception {
        StringBuilder text = new StringBuilder();
        try (Reader reader = realScriptSource().openSchemaCreateScript(
            new org.jkiss.dbeaver.model.runtime.LoggingProgressMonitor(), null)) {
            char[] buffer = new char[4096];
            int read;
            while ((read = reader.read(buffer)) > 0) {
                text.append(buffer, 0, read);
            }
        }
        StringBuilder withoutComments = new StringBuilder();
        for (String line : text.toString().split("\n")) {
            if (line.trim().startsWith("--")) {
                continue;
            }
            withoutComments.append(line).append('\n');
        }
        return java.util.Arrays.stream(withoutComments.toString().split(";"))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    /** A minimal config exposing only what {@code SQLSchemaManager} reads. */
    static InternalDatabaseConfig config(InternalDatabaseConfig base, String schema) {
        return new InternalDatabaseConfig() {
            @Override
            public String getDriver() {
                return base == null ? "test" : base.getDriver();
            }

            @Override
            public void setDriver(String driver) {
                throw new UnsupportedOperationException();
            }

            @Override
            public String getUrl() {
                return base == null ? "" : base.getUrl();
            }

            @Override
            public void setUrl(String url) {
                throw new UnsupportedOperationException();
            }

            @Override
            public String getUser() {
                return base == null ? "" : base.getUser();
            }

            @Override
            public String getPassword() {
                return base == null ? "" : base.getPassword();
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
                return base == null ? new Pool() : base.getPool();
            }

            /**
             * Backups are off in tests. In production this matters: the PostgreSQL version-only recovery
             * enters the upgrade branch, and {@code SQLSchemaManager.doBackupDatabase} then shells out to
             * pg_dump when backups are enabled. CE runs headless, where a backup failure is logged and
             * ignored, so recovery still completes.
             */
            @Override
            public boolean isBackupEnabled() {
                return false;
            }
        };
    }

    private DbacTestSupport() {
        // utility class
    }
}

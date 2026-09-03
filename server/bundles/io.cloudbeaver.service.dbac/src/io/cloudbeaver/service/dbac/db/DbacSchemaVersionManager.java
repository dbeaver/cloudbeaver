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
package io.cloudbeaver.service.dbac.db;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaScriptSource;
import org.jkiss.dbeaver.model.sql.schema.SQLSchemaVersionManager;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.io.Reader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Savepoint;
import java.util.ArrayList;
import java.util.List;

/**
 * Version manager of the fork owned DBAC metadata schema.
 * <p>
 * This class intentionally does NOT reuse {@code CBSchemaVersionManager}, which falls back to a
 * {@code MODULE_ID}-less {@code SELECT VERSION FROM CB_SCHEMA_INFO} (so a new module would read the CE
 * version as its own) and issues a {@code WHERE}-less {@code UPDATE ... SET VERSION=?} that overwrites the
 * CE version.
 *
 * <h2>Installation states and what happens to them</h2>
 * <pre>
 *                          | H2 (replay)                 | PostgreSQL (version row only) | other
 * -------------------------+-----------------------------+-------------------------------+-----------
 *  no DBAC object at all   | create script               | create script                 | create script
 *  some objects, no ver.   | replay create script        | fail closed                   | fail closed
 *  full structure, no ver. | replay create script        | record version only (v0 -&gt; v1)| fail closed
 *  version row + mismatch  | fail closed                 | fail closed                   | fail closed
 *  version row + match     | report the version          | report the version            | report the version
 * </pre>
 * "mismatch" is only evaluated for an installation already at the shipped version. A row recording an
 * <i>older</i> version is reported as it is so the upgrade scripts can run: this build knows what the
 * current structure looks like, not what version 1 looked like once version 2 exists. The structure is
 * still verified before the new version is recorded, in {@link #updateCurrentSchemaVersion}.
 *
 * <h2>Why PostgreSQL cannot replay</h2>
 * The migration runner translates every script to the target dialect, and the translator strips
 * {@code IF NOT EXISTS} from {@code CREATE TABLE} whenever the dialect reports
 * {@code supportsCreateIfExists()}, which {@code PostgreDialect} does. See {@link DbacRecoveryPolicy} for
 * the exact call chain.
 *
 * <h2>Why version only recovery returns 0 instead of writing the row here</h2>
 * {@code SQLSchemaManager.updateSchema} calls {@code getCurrentSchemaVersion} and then immediately calls
 * {@code txn.rollback()} - the comment there says it exists precisely so a failed version check cannot
 * poison a PostgreSQL transaction. Anything written from inside this method is therefore discarded. The
 * recovery instead reports {@link DbacSchemaConstants#RECOVERY_PENDING_VERSION}, which routes the run into
 * the upgrade branch: {@code upgradeSchemaVersion} executes {@code dbac_schema_update_1.sql}, calls
 * {@link #updateCurrentSchemaVersion} and commits the transaction itself. No create script is opened and
 * no platform code is modified.
 * <p>
 * {@link DbacSchemaConstants#OBSOLETE_SCHEMA_VERSION} must stay at 0 for this to be safe: version 0 would
 * otherwise satisfy {@code currentSchemaVersion < schemaVersionObsolete} in {@code SQLSchemaManager} and
 * trigger {@code dropSchema}, which runs {@code DROP ALL OBJECTS}.
 */
public class DbacSchemaVersionManager implements SQLSchemaVersionManager {

    private static final Log log = Log.getLog(DbacSchemaVersionManager.class);

    /** SQLSTATE class 23, integrity constraint violation: unique or primary key conflict. */
    private static final String SQL_STATE_UNIQUE_VIOLATION = "23505";

    private static final String SAVEPOINT_NAME = "dbac_version_insert";

    private final int currentSchemaVersion;
    private final String schemaId;
    private final SQLSchemaScriptSource scriptSource;

    /**
     * @param scriptSource the same source {@code InternalDB.updateSchema} builds for this module, used to
     *                     check the update script chain before an upgrade is allowed to start
     */
    public DbacSchemaVersionManager(
        int currentSchemaVersion,
        @NotNull String schemaId,
        @NotNull SQLSchemaScriptSource scriptSource
    ) {
        this.currentSchemaVersion = currentSchemaVersion;
        this.schemaId = schemaId;
        this.scriptSource = scriptSource;
    }

    @Override
    public int getCurrentSchemaVersion(
        DBRProgressMonitor monitor,
        Connection connection,
        String schemaName
    ) throws DBException, SQLException {
        String schema = resolveEffectiveSchema(connection, schemaName);
        DbacSchemaReport report = DbacSchemaValidator.inspect(connection, schema);

        // The version row may only be queried once the version table is known to exist: on PostgreSQL a
        // SELECT against a missing table aborts the whole transaction.
        Integer version = report.hasVersionTable() ? readModuleVersion(connection, schema) : null;

        if (version != null) {
            if (version <= 0 || version > currentSchemaVersion) {
                throw new DBException("Unsupported DBAC schema version " + version
                    + " in schema '" + schema + "' (this build supports 1.." + currentSchemaVersion + ")");
            }
            if (version < currentSchemaVersion) {
                // An older installation is expected to have an older structure, and this build only knows
                // what the current one looks like. Validating it here would reject every schema that is
                // merely out of date and make the upgrade branch unreachable - version 2 could never be
                // released. The upgrade scripts run first, and updateCurrentSchemaVersion validates the
                // finished structure before recording the new version, so nothing is accepted unchecked.
                // That guarantee only holds if the upgrade actually runs, hence the chain check.
                requireCompleteUpdateScriptChain(monitor, version);
                log.debug("DBAC schema in '" + schema + "' is at version " + version
                    + " and will be upgraded to " + currentSchemaVersion);
                return version;
            }
            if (!report.isComplete()) {
                throw new DBException("DBAC schema in '" + schema + "' records version " + version
                    + " but its structure does not match: " + report.describeProblems()
                    + ". Nothing is repaired automatically because these tables hold granted permissions "
                    + "and audit history; fix the schema manually.");
            }
            return version;
        }

        if (report.isAbsent()) {
            log.debug("DBAC schema is absent in schema '" + schema + "' - it will be created");
            return DbacSchemaConstants.SCHEMA_NOT_PRESENT;
        }

        // Objects exist but no version was recorded: a previous migration did not finish.
        DbacRecoveryPolicy policy = DbacRecoveryPolicy.forDatabase(connection.getMetaData());
        switch (policy) {
            case REPLAY_CREATE_SCRIPT:
                log.warn("DBAC version row is missing in schema '" + schema
                    + "' - the create migration will be replayed to complete a partial installation"
                    + (report.isComplete() ? "" : " (" + report.describeProblems() + ")"));
                return DbacSchemaConstants.SCHEMA_NOT_PRESENT;

            case VERSION_ROW_ONLY:
                if (!report.isComplete()) {
                    throw new DBException("DBAC schema in '" + schema
                        + "' is partially installed and cannot be repaired automatically on "
                        + connection.getMetaData().getDatabaseProductName()
                        + ", where the migration runner strips IF NOT EXISTS from CREATE TABLE: "
                        + report.describeProblems()
                        + ". Remove the leftover DBAC objects from this schema and start again.");
                }
                // This path is the upgrade branch too: it reports 0 so the runner walks 0 -> current.
                requireCompleteUpdateScriptChain(monitor, DbacSchemaConstants.RECOVERY_PENDING_VERSION);
                log.warn("DBAC structure in schema '" + schema
                    + "' is complete but its version row is missing - only the version will be recorded");
                return DbacSchemaConstants.RECOVERY_PENDING_VERSION;

            default:
                throw new DBException("DBAC schema in '" + schema
                    + "' is installed without a version row, and automatic recovery is not supported for "
                    + connection.getMetaData().getDatabaseProductName()
                    + ". Only H2 and PostgreSQL are verified for this module.");
        }
    }

    @Override
    public int getLatestSchemaVersion() {
        return currentSchemaVersion;
    }

    /**
     * Refuses to start an upgrade unless every step of it has a script.
     * <p>
     * {@code SQLSchemaManager.upgradeSchemaVersion} does {@code if (ddlStream == null) continue;} - a
     * missing update script is skipped in silence, the version it belongs to is never recorded, and the
     * loop moves on. Two things follow, and both are bad:
     * <ul>
     *     <li>the server finishes migrating and starts on a structure no step ever produced, with no
     *         structural check anywhere on that path;</li>
     *     <li>the next step's compare-and-set expects a predecessor that was never written, so from then
     *         on the installation refuses every upgrade for good.</li>
     * </ul>
     * A build-time test cannot prevent this on its own - the scripts are resources, and a packaging
     * mistake is exactly the kind of thing that only shows up in the artifact. So the chain is verified
     * here, before {@code SQLSchemaManager} takes its upgrade branch, using the very
     * {@code ClassLoaderScriptSource} the runner will use and the same
     * dialect-specific-then-common lookup order.
     *
     * <h3>Why the lookup is deliberately dialect-blind</h3>
     * {@code openSchemaUpdateScript} is called with a {@code null} dialect prefix, so only the common
     * {@code <prefix><version>.sql} counts. The runner itself passes
     * {@code targetDatabaseDialect.getDialectId()} and would additionally accept a
     * {@code <prefix><version>_<dialect>.sql}, so this check is <em>stricter</em> than the runner - never
     * looser. That asymmetry is the safe one, and it removes a way for the two to disagree: this class is
     * handed a {@code Connection}, not a dialect, so anything it inferred about the dialect (from the
     * driver's product name, say) could drift from the dialect the runner was configured with and turn a
     * missing script into a silent pass.
     * <p>
     * The rule this imposes on the module: <b>every DBAC update script must exist in the common form.</b>
     * A dialect-only DBAC update script is not supported, and adding one makes the start fail closed
     * rather than run a half-applied upgrade.
     *
     * @param fromVersion version currently installed; scripts are required for every version above it
     */
    private void requireCompleteUpdateScriptChain(DBRProgressMonitor monitor, int fromVersion)
        throws DBException {
        List<Integer> missing = new ArrayList<>();
        for (int version = fromVersion + 1; version <= currentSchemaVersion; version++) {
            try (Reader script = scriptSource.openSchemaUpdateScript(monitor, version, null)) {
                if (script == null) {
                    missing.add(version);
                }
            } catch (IOException e) {
                throw new DBException(
                    "Cannot read the DBAC update script for version " + version, e);
            }
        }
        if (!missing.isEmpty()) {
            throw new DBException("DBAC upgrade from version " + fromVersion + " to "
                + currentSchemaVersion + " cannot run: the update script is missing for version(s) "
                + missing + " (looked for '" + DbacSchemaConstants.UPDATE_SCRIPT_PREFIX
                + "<version>.sql'; a dialect-specific script alone is not accepted). "
                + "The migration runner would skip the missing step in silence and leave the schema in a "
                + "state no version describes, so the start is refused instead.");
        }
    }

    /**
     * Records the version of this module after verifying the structure produced by the migration.
     * <p>
     * The write is a compare-and-set, not a blind overwrite. Constraining the statement to
     * {@code MODULE_ID} alone would let a build that records version {@code N} silently downgrade an
     * installation already at a higher version - the schema would then be newer than the version row
     * claims, and the next start would happily run migrations that have already been applied.
     * <p>
     * State transitions, for a target version {@code N} with expected predecessor {@code N-1}:
     * <pre>
     *   row VERSION = N-1      -> UPDATE matches 1 row                       -> recorded
     *   no row                 -> UPDATE matches 0 rows -> INSERT succeeds   -> recorded
     *   row VERSION = N        -> UPDATE 0 rows -> INSERT 23505 -> re-read N -> idempotent success
     *   row VERSION = anything -> UPDATE 0 rows -> INSERT 23505 -> re-read M -> FAIL CLOSED (never
     *                             else (M != N, M != N-1)                       overwritten, never
     *                                                                           downgraded)
     * </pre>
     * A lost insert race is recognised by SQLSTATE {@code 23505} only, is undone through a savepoint so
     * the surrounding PostgreSQL transaction stays usable, and is accepted only when the row the winner
     * wrote carries exactly the target version. Every other SQLException is propagated unchanged.
     */
    @Override
    public void updateCurrentSchemaVersion(
        DBRProgressMonitor monitor,
        @NotNull Connection connection,
        @NotNull String schemaName,
        int version
    ) throws DBException, SQLException {
        // Both bounds are checked before anything is read from or written to the database, so a version
        // outside the supported range can never reach a statement or a structure check.
        if (version < DbacSchemaConstants.MINIMUM_STORED_VERSION) {
            // RECOVERY_PENDING_VERSION is an in-memory signal only. Storing it - or anything below it -
            // would make the next start reject the installation as unsupported.
            throw new DBException("Refusing to record DBAC schema version " + version
                + ": only versions " + DbacSchemaConstants.MINIMUM_STORED_VERSION + " and above are stored");
        }
        if (version > currentSchemaVersion) {
            // A version this build does not ship must never be written. The next start would read it back,
            // find it above its own range and refuse - so recording it would brick the installation, and
            // it would also claim a structure that no migration in this build ever produced.
            throw new DBException("Refusing to record DBAC schema version " + version
                + ": this build ships version " + currentSchemaVersion + " and cannot vouch for a higher one");
        }
        String schema = resolveEffectiveSchema(connection, schemaName);

        // Never record the current version for an incomplete schema: that would make the next start treat
        // a broken installation as healthy. Intermediate steps of a multi-version upgrade are deliberately
        // not held to the final structure - only the step that lands on the shipped version is, and that
        // is the one the next start will trust.
        if (version == currentSchemaVersion) {
            DbacSchemaValidator.validate(connection, schema);
        }

        // Sequential migration: version N is only ever reached from N-1.
        if (compareAndSetVersion(connection, version - 1, version) == 1) {
            return;
        }
        insertVersionRow(connection, schema, version);
    }

    /**
     * Inserts the version row, resolving a concurrent insert without leaving the transaction aborted.
     */
    private void insertVersionRow(@NotNull Connection connection, @NotNull String schema, int version)
        throws DBException, SQLException {
        // A savepoint is only possible - and only needed - inside an explicit transaction. In autocommit
        // mode a failed statement rolls back by itself and nothing else is at risk.
        Savepoint savepoint = connection.getAutoCommit() ? null : trySetSavepoint(connection);
        try (PreparedStatement dbStat = connection.prepareStatement(
            "INSERT INTO {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " (MODULE_ID,VERSION,UPDATE_TIME) VALUES(?,?,CURRENT_TIMESTAMP)")
        ) {
            dbStat.setString(1, schemaId);
            dbStat.setInt(2, version);
            dbStat.executeUpdate();
        } catch (SQLException e) {
            if (!SQL_STATE_UNIQUE_VIOLATION.equals(e.getSQLState())) {
                // Anything else is a real failure: propagate the original exception unchanged.
                throw e;
            }
            if (savepoint == null) {
                // Autocommit, or a driver without savepoints. In autocommit there is nothing to undo and
                // the winner's row is already committed. Without savepoints the transaction may be aborted,
                // in which case the read below fails and the migration fails with it - which is correct:
                // this node must not report success it cannot verify.
                confirmConcurrentVersion(connection, schema, version, e);
                return;
            }
            try {
                connection.rollback(savepoint);
            } catch (SQLException rollbackFailure) {
                rollbackFailure.addSuppressed(e);
                throw new DBException("DBAC version row conflicted with a concurrent initialization and the "
                    + "transaction could not be restored to a usable state", rollbackFailure);
            }
            confirmConcurrentVersion(connection, schema, version, e);
            return;
        }
        releaseQuietly(connection, savepoint);
    }

    /**
     * Accepts a lost insert race only when the row that actually won carries the expected version.
     * A different version is never overwritten and never downgraded.
     */
    private void confirmConcurrentVersion(
        @NotNull Connection connection,
        @NotNull String schema,
        int version,
        @NotNull SQLException conflict
    ) throws DBException, SQLException {
        Integer existing = readModuleVersion(connection, schema);
        if (existing == null) {
            throw new DBException("DBAC version insert reported a unique violation in schema '" + schema
                + "' but no version row can be read back", conflict);
        }
        if (existing.intValue() != version) {
            throw new DBException("DBAC version row in schema '" + schema + "' was concurrently set to "
                + existing + " while this node was recording " + version
                + "; refusing to overwrite it", conflict);
        }
        // Reached both when another node won the race and when this node simply re-records the version it
        // already holds; the two are indistinguishable from here and both are correct outcomes.
        log.debug("DBAC version row already holds the expected version " + version + " - nothing to do");
    }

    /**
     * Creates the savepoint that shields the surrounding transaction from a lost insert race.
     * <p>
     * Savepoints are JDBC 3.0 and supported by both verified metadata databases. A driver that does not
     * implement them is not a reason to refuse the installation: without a savepoint a concurrent insert
     * simply aborts this node's migration, which the next start repairs. Only that one narrow exception is
     * tolerated - any other failure escapes.
     */
    @Nullable
    private static Savepoint trySetSavepoint(@NotNull Connection connection) throws SQLException {
        try {
            return connection.setSavepoint(SAVEPOINT_NAME);
        } catch (SQLFeatureNotSupportedException e) {
            log.warn("Metadata database does not support savepoints; a concurrent DBAC initialization will "
                + "abort this migration instead of being absorbed", e);
            return null;
        }
    }

    private static void releaseQuietly(@NotNull Connection connection, @Nullable Savepoint savepoint) {
        if (savepoint == null) {
            return;
        }
        try {
            connection.releaseSavepoint(savepoint);
        } catch (SQLException e) {
            // Releasing is an optimisation; the savepoint disappears with the transaction anyway.
            log.debug("Could not release the DBAC version savepoint: " + e.getMessage());
        }
    }

    /**
     * Advances the version row from {@code expectedPrevious} to {@code target}, and does nothing at all if
     * the row does not currently hold {@code expectedPrevious}.
     * <p>
     * The {@code VERSION=?} predicate is the whole point: it is what makes an unexpected current version -
     * including a higher one - leave the row untouched instead of overwriting it.
     *
     * @return number of rows changed; 1 on success, 0 when the precondition did not hold
     */
    private int compareAndSetVersion(@NotNull Connection connection, int expectedPrevious, int target)
        throws SQLException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "UPDATE {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " SET VERSION=?,UPDATE_TIME=CURRENT_TIMESTAMP WHERE MODULE_ID=? AND VERSION=?")
        ) {
            dbStat.setInt(1, target);
            dbStat.setString(2, schemaId);
            dbStat.setInt(3, expectedPrevious);
            return dbStat.executeUpdate();
        }
    }

    @Nullable
    private Integer readModuleVersion(@NotNull Connection connection, @NotNull String schema)
        throws SQLException, DBException {
        try (PreparedStatement dbStat = connection.prepareStatement(
            "SELECT VERSION FROM {table_prefix}" + DbacSchemaConstants.VERSION_TABLE_NAME
                + " WHERE MODULE_ID=?")
        ) {
            dbStat.setString(1, schemaId);
            try (ResultSet dbResult = dbStat.executeQuery()) {
                if (!dbResult.next()) {
                    return null;
                }
                int version = dbResult.getInt(1);
                if (dbResult.wasNull()) {
                    throw new DBException("DBAC schema version is NULL in schema '" + schema + "'");
                }
                return version;
            }
        }
    }

    /**
     * Determines the schema the DBAC objects live in.
     * <p>
     * When no schema is configured the connection's effective schema is used. {@code null} is never passed
     * to JDBC metadata as "any schema": an unrelated schema holding a table of the same name would then be
     * mistaken for this one.
     */
    @NotNull
    private String resolveEffectiveSchema(@NotNull Connection connection, @Nullable String configuredSchema)
        throws DBException, SQLException {
        String schema = CommonUtils.isEmpty(configuredSchema) ? connection.getSchema() : configuredSchema;
        if (CommonUtils.isEmpty(schema)) {
            throw new DBException(
                "Cannot determine the effective schema of the metadata database connection. "
                    + "The DBAC schema module requires it to avoid matching objects of another schema.");
        }
        return schema;
    }
}

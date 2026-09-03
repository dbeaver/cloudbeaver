# Phase 1 Decision Record — Server-Side DB Access Control (READ_ONLY / TEMP_WRITE)

Scope: PostgreSQL + MySQL only. Fork: CloudBeaver CE, branch `devel`, HEAD `3844792b8`.
Platform sources read from `D:/IdeaProjects/dbeaver` (prefix `PLATFORM:` below).
This record supersedes `docs/db-mutation-surface.md` as the **design basis**. That file remains a frozen
investigation note and was used only as an index; every claim here was re-verified against source in this task.

---

## 1. Verdict

**GO WITH FAIL-CLOSED DEFAULTS.**

Enforcement is achieved by **two** mechanisms, and it is important not to conflate them. For the SQL-text paths (E1–E3,
E6) validation-to-execution identity is achievable and decided: re-parse the final text, then execute a query pinned to
exactly that validated text (§4.3), qualified only by JDBC escape rewriting which the allowlist already denies (I24). For
the stored-query re-execution paths (E4a–E4c, E5) identity on the final text is **not** achievable — the platform
re-derives and re-parses it downstream (I22) — so those are secured at the *input boundary* instead, by validating the
stored query text plus every client filter fragment (D8). Both are fail-closed; neither depends on a DBeaver platform
change. The enforcement set is closed at file+symbol level (16 gates, 7 files, all in the fork, §5), the
`(user, project, connection, expires_at)` model has concrete implementation locations (§6), and every unknown — parse
failure, UNKNOWN type, multi-statement, unrecognised control command, unverified DBMS behaviour — maps onto DENY. I
validated the classifier empirically: 31 of 34 QA-derived cases correct, the 3 exceptions known, documented, and
themselves DENY-by-policy (§10). An adversarial pass found five real additions (all integrated) and two claims that I
refuted against source. No NO-GO condition is met: every reachable write path has an enforcement location, and the
residual runtime uncertainty is absorbed by conservative DENY. No DBMS is claimed as verified.

---

## 2. Confirmed Security Invariants

| # | Invariant | Status | Evidence |
|---|---|---|---|
| I1 | The SQL string reaching JDBC is `sqlQuery.getText()`, optionally wrapped by a limit/fetch-all transformer, computed in one place | STATIC VERIFIED | `PLATFORM:DBUtils.java:1643-1661` |
| I2 | Transformers run **only** when `getType()==SELECT && isPlainSelect()`; otherwise text passes through untouched | STATIC VERIFIED | `PLATFORM:DBUtils.java:1609,1617,1645-1653` |
| I3 | A transformer exception silently falls back to the original text — it cannot smuggle new text in | STATIC VERIFIED | `PLATFORM:DBUtils.java:1654-1657` |
| I4 | Client filter text is merged into the SQL **before** parsing, so a post-parse check sees the merged text | STATIC VERIFIED | `WebSQLProcessor.java:200-205` vs `:218` |
| I5 | `SQLQuery.getScriptElements()` returns `List.of(this)`; only `SQLScript` (AI command) carries several elements | STATIC VERIFIED | `PLATFORM:SQLQuery.java:138-140`; `PLATFORM:SQLScript.java`; sole construction `SQLCommandAI.java:180` |
| I6 | `SQLQuery.isModifying()` returns **false** for `UNKNOWN` — fail-open, must never be used | STATIC VERIFIED | `PLATFORM:SQLQuery.java:511-514` |
| I7 | Parse failure is swallowed and yields `type=UNKNOWN`, not an exception | STATIC VERIFIED | `PLATFORM:SQLQuery.java:219-223` |
| I8 | `parseQuery()` memoises on a `parsed` flag, so a cached `getType()` can be stale w.r.t. later text | STATIC VERIFIED | `PLATFORM:SQLQuery.java:142-146,375-377,450-455` |
| I9 | Connection read-only reaches JDBC **only at connect time** — it cannot expire or be revoked in-session | STATIC VERIFIED | `PLATFORM:JDBCDataSource.java:261-263`; `PLATFORM:PostgreDataSource.java:303-305` |
| I10 | MySQL deliberately clears read-only to switch schema, via a client-reachable operation | STATIC VERIFIED | `PLATFORM:MySQLExecutionContext.java:93-113`; op `sqlContextSetDefaults` |
| I11 | Existing CloudBeaver SQL permission checks are gated on `DBWorkbench.isDistributed()` → inert in standalone CE | STATIC VERIFIED | `WebServiceSQL.java:443,482,605` |
| I12 | `hasModifyPermission()` is connection-scoped (no user argument) → cannot express `(user, connection)` | STATIC VERIFIED | `PLATFORM:DBPDataSourcePermissionOwner.java:30`; `PLATFORM:DataSourceDescriptor.java:487-493` |
| I13 | Admin-only enforcement already exists server-side via `@WebAction(requirePermissions=...)` | STATIC VERIFIED | `DBWServiceAdmin.java:38`; enforced `WebServiceBindingBase.java:312-341` |
| I14 | `EXPLAIN` never enters `processQuery`; it reaches JDBC through a separate API | STATIC VERIFIED | `WebSQLProcessor.java:914-918` → `PLATFORM:PostgreExecutionPlan.java:161` |
| I15 | `connectionReadOnly` short-circuits `hasModifyPermission` **only** for `EDIT_DATA` / `EDIT_METADATA` — it does **not** gate `EXECUTE_SCRIPTS` or `IMPORT_DATA` | STATIC VERIFIED | `PLATFORM:DataSourceDescriptor.java:487-497` (esp. `488-491`) |
| I16 | Connection create/update/delete **are** authorized server-side by project permission — a normal user cannot flip `readOnly` on a project they lack rights to | STATIC VERIFIED | `DBWServiceCore.java:137,144,151` `@WebProjectAction(requireProjectPermissions={PERMISSION_PROJECT_DATASOURCES_EDIT})`; enforced `WebServiceBindingBase.java:209-212,245-249,286-290` |
| I17 | A second, independent `makeStatement`+`executeStatement` pair exists outside `WebSQLProcessor`, on the row-count path | STATIC VERIFIED | `WebSQLQueryDataContainer.java:119-133` → `PLATFORM:DBUtils.java:2822-2828` |
| I18 | Row-count text is re-derived **twice** after any service-layer check: client filter merge, then count transform | STATIC VERIFIED | `WebSQLQueryDataContainer.java:121-132` |
| I19 | Both navigator DDL paths are guarded at connection level; there is no rename/delete asymmetry | STATIC VERIFIED | `WebServiceNavigator.java:464` (rename) and `:550` (delete) → `:607-611` |
| I20 | `JDBCPreparedStatementImpl.executeStatement()` executes the SQL captured at prepare time and ignores the `query` field | STATIC VERIFIED | `PLATFORM:JDBCPreparedStatementImpl.java:197-206` |
| I21 | Stored procedures cannot be invoked through `asyncReadDataFromContainer`: `PostgreProcedure`/`MySQLProcedure` are not `DBSDataContainer` | STATIC VERIFIED | `WebSQLProcessor.java:1061-1067` |
| I22 | A **third** execute pipeline lives in the platform: it re-derives the stored text, re-applies the client filter, builds a new `SQLQuery`, does its own **second parse**, re-substitutes parameters, then `makeStatement`+`executeStatement` | STATIC VERIFIED | `PLATFORM:SQLQueryDataContainer.java:91-152` (new query `:105/:107`, own parser context `:110-121`, exec `:138-152`) |
| I23 | All SQL-editor contexts (tabs) of one connection share **one** JDBC connection and **one** transaction — `contextId` is not a transaction boundary | STATIC VERIFIED | `WebSQLProcessor.java:132-134` (`DBUtils.getDefaultContext`), used by `WebSQLContextInfo.java:305` |
| I24 | JDBC escape processing stays **enabled** for PostgreSQL and MySQL, so the driver rewrites `{call …}`/`{fn …}` after the check point | STATIC VERIFIED | `PLATFORM:JDBCConnectionImpl.java:177-179`; overridden only by `OracleSQLDialect.java:513`, `AltibaseSQLDialect.java:521` |

---

## 3. Final Policy Decisions

| # | Decision | Rationale | Residual risk |
|---|---|---|---|
| D1 | **Allowlist** classifier over an independently re-parsed statement list. ALLOW only positively-recognised reads; DENY everything else | I6/I7 make any WRITE-detector a fail-open blacklist, forbidden by CLAUDE.md §2.1 | Legitimate exotic reads denied → admin-visible reason string |
| D2 | Never call `SQLQuery.isModifying()`; never trust a cached `getType()`. Classify the **final text** with a fresh parse | I6, I8 | None |
| D3 | **DENY any multi-statement request outright** (parsed count > 1), even all-read | T-02/T-04: `Statement()` returns only the first statement with no error, so "validated unit == executed unit" fails for any n>1 | Multi-statement scripts unusable for READ_ONLY (accepted; QA.md §18) |
| D4 | **Full-coverage check**: the parsed elements must account for the entire input; any unconsumed non-whitespace/non-comment residue → DENY | Prevents append-a-statement bypass; not present in the codebase today | None |
| D5 | Allowlisted read node set = `PlainSelect` (with `forMode==null`, `intoTables==null`) and `SetOperationList` whose members are recursively allowlisted | `SELECT 1 UNION SELECT 2` parses as `SetOperationList` → UNKNOWN; omitting it would break lawful reads (QA.md §47) | — |
| D6 | Every `WITH` item must be **provably** a read; inability to determine the inner node type → DENY | T-06/T-08: data-modifying CTEs parse as `PlainSelect` with `isModifying=false` | Must inspect WithItem inner type explicitly, not rely on a null accessor (§10 note) |
| D7 | **Function policy: pure-function allowlist (Option 2).** DENY any function not on a dialect-scoped allowlist | Option 1 rejected: `SELECT modify_test_data()` / `setval()` classify as plain SELECT (T-09/T-10), violating QA.md §25. Option 3 rejected as *primary*: I9/I10, plus a PostgreSQL read-only transaction still permits `nextval` | User-defined read-only functions denied until allowlisted; allowlist upkeep is operational cost |
| D8 | Client raw SQL fragments (`filter.where`, constraint `criteria`, grouping `functions`) are **rejected for READ_ONLY** unless they parse as an expression whose functions are all allowlisted and which contains no statement terminator or non-allowlisted subquery | Client-supplied by schema (`service.sql.graphqls:73` `where: String`, `:60` `criteria: String`, `functions: [String!]`), read verbatim (`WebSQLDataFilter.java:60,118`), then concatenated **unparsed**: `PLATFORM:StandardSQLDialectQueryGenerator.java:180-186` and `PLATFORM:SQLGroupingQueryGenerator.java:122-126`. Note `columnNames` **is** already allowlisted against real result-set attributes (`WebServiceSQL.java:775-778`) — `functions` is the hole | Some UI filter idioms rejected; grouping needs a typed allowlist |
| D9 | **EXPLAIN**: allowlist the `configuration` keys, hard-DENY `ANALYZE` for non-WRITE, and classify the target SQL with the same classifier | Client controls both SQL and option **keys** verbatim; `EXPLAIN (…,ANALYZE)` executes the statement, and the compensating rollback is best-effort only | Non-transactional effects (sequences, advisory locks) are not undone even when rollback succeeds |
| D10 | **Option C = secondary defense only** (§4.4) | I9, I10, I12 — connect-time, client-disturbable, not per-user; and I15 shows it does not even gate `EXECUTE_SCRIPTS` or `IMPORT_DATA` in the permission model | Cannot be relied on for expiry/revoke, nor for script execution or import |
| D11 | COMMIT requires **current** WRITE permission; ROLLBACK is **always** allowed; switching to autocommit with pending changes is treated as an implicit commit | QA.md §50; the platform leaves implicit-commit semantics to the driver | Denying commit can leave an open transaction → policy: allow rollback, surface a clear message |
| D12 | Data Editor and Data Import get **typed** rules (operation × entity), not SQL classification | Those paths build DML after the decision point, so no text exists to classify | — |
| D13 | Enforce **per-request at execution time**, never from session-cached permission state | Requirement for immediate expiry/revoke (QA.md §33/§34/§36) | Adds a permission read per write attempt |

---

## 4. Validation-to-Execution Identity

### 4.1 The actual chain (`asyncSqlExecuteQuery`, `WebSQLProcessor.processQuery`)

```
GraphQL sql:String
  :200  sql = dialect.addFiltersToQuery(sql, dataFilter)        <-- client filter merged into TEXT
  :218  element = SQLScriptParser.extractActiveQuery(ctx,0,len) <-- ONE element for the whole input
  :222  if SQLControlCommand -> executeControlCommand(...)      <-- SIDE EFFECT, before any later gate
  :235  mainQuery.setParameters(...)        (only when useEvents)
  :237  fillQueryParameters(mainQuery,...)  (only when useEvents) <-- mutates text
  :244  tryExecuteRecover {
  :246    for (SQLScriptElement e : mainQuery.getScriptElements())   <-- [this] normally
  :259      DBUtils.makeStatement(..., sqlQuery, offset, limit)      <-- final text computed HERE
  :294      dbStat.executeStatement()
```

### 4.2 The defect in the obvious design

`SQLScriptParser.extractActiveQuery` parses the first statement **only to test whether it is a control command**, then
**discards that parse product** and wraps the *entire* selection in one `SQLQuery`:

```java
// PLATFORM:SQLScriptParser.java:801-811
SQLScriptElement parsedElement = SQLScriptParser.parseQuery(context, ...);
if (parsedElement instanceof SQLControlCommand) { element = parsedElement; }
else { selText = SQLUtils.fixLineFeeds(selText);
       element = new SQLQuery(context.getDataSource(), selText, ...); }   // whole input, unsplit
```

Because `getScriptElements()` is `List.of(this)` (I5), the loop at `:246` executes **one** JDBC statement whose text may
contain many statements. And I measured that `CCJSqlParser.Statement()` — the exact call behind `getType()` — accepts
`SELECT 1; UPDATE t SET v='X'` and returns `PlainSelect`, i.e. **`SQLQueryType.SELECT`, no error** (T-02).
So "check `getType()`, then execute the `SQLQuery`" would forward a write to the DBMS. This is a real
representation mismatch, not a theoretical one.

### 4.3 Chosen design — **execute a validated, pinned canonical text**

Selected: *(ii) execute the validated canonical SQL text*, implemented so the validated object **is** the executed object.

1. Insert the gate between `:242` and `:244` — after control-command transform and after parameter substitution, before
   any execution. At this point `mainQuery.getText()` is final for this path.
2. Take `text = mainQuery.getText()`. Re-parse it **independently** with `SQLScriptParser.parseScript` /
   `SQLSemanticProcessor.parseQueries` — do not reuse `mainQuery`'s memoised parse (I8).
3. Verify full coverage (D4) and statement count == 1 (D3); classify by allowlist (D5–D7).
4. On ALLOW, construct a **fresh** `SQLQuery` from exactly the validated `text` and execute that instance; discard the
   original. Nothing between step 3 and `makeStatement` can then alter the text.
5. Residual rewriting after the gate is bounded by I2/I3 to limit/fetch-all wrappers applied only to statements already
   classified as plain SELECT — non-semantic-expanding, so identity holds.

Three paths are **not** covered by this gate and need their own, stated in §5: `executeControlCommand` at `:222`
(executes before the gate), the entire EXPLAIN path (I14), and the row-count path with its own
`makeStatement`/`executeStatement` pair (I17).

**Why not a lower, "universal" gate at `DBCStatement`?** Tempting, but unsound and out of scope: `executeStatement()` is
overridden by `JDBCPreparedStatementImpl` to run the SQL captured at prepare time, ignoring the `query` field (I20), so
"read the statement's text, then execute it" rests on an unenforced invariant. It would also require modifying the
DBeaver platform, which CLAUDE.md §23/§28 forbid. Validating the text at each fork-side call site is both sound and
upstream-safe.

**Post-submission text window.** When `useEvents=true`, parameter values arrive from the client over a websocket
confirmation round-trip *after* the request was submitted (`WebSQLParametersProvider.java:81-89`), and
`fillQueryParameters` splices them into the text in place. This is a genuine post-submission text-change window — and it
is precisely why the gate must sit after `:237`, not at request entry.

**Identity holds at the Java-String level, with one qualification.** The validated string is what is passed to
`execute(String)`, but JDBC escape processing remains enabled for PostgreSQL and MySQL (I24), so the driver may still
rewrite `{call …}` / `{fn …}` / `{oj …}` client-side before the server parses it. Under D1/D5 such text does not parse as
an allowlisted read and is therefore DENIED, so the gap is absorbed rather than exploitable — but the identity claim is
"identical Java String", not "identical statement as the DBMS parses it".

**Re-execution of stored queries is a separate problem (I22).** For E4a–E4c and E5 the fork never sees the final composed
text: the platform re-derives it from the *stored original* plus a *fresh client filter* and re-parses it. Therefore
those paths cannot be secured by validating a final string — they must be secured by validating **(a)** the stored query
text at the time it was accepted and **(b)** every client filter fragment on each re-read (D8). This is why D8 is
mandatory rather than defence-in-depth.

**Denial must not look like a recoverable error.** The E1 gate sits inside the lambda passed to
`DBExecUtils.tryExecuteRecover`, which retries when `discoverErrorType` classifies a failure as `CONNECTION_LOST` or
`TRANSACTION_ABORTED`. The denial exception type and message must be chosen so classification returns `NORMAL`, and a
test must assert no retry occurs.

### 4.4 Why connection read-only cannot be the primary control

`connection.setReadOnly(true)` is issued once, inside `openConnection`, at connect time
(`PLATFORM:JDBCDataSource.java:261-263`); PostgreSQL additionally receives `readOnly/readOnlyMode` as **connection
properties** (`PLATFORM:PostgreDataSource.java:303-305`). Nothing re-applies it on a live connection, so expiry and
revoke would require a reconnect — violating QA.md §33. MySQL actively clears it to change schema
(`PLATFORM:MySQLExecutionContext.java:93-113`) through the client-callable `sqlContextSetDefaults`. And the flag lives on
the shared connection configuration with no user dimension (I12). Verdict: **secondary defense** — valuable as
defence-in-depth on a dedicated read-only connection, never as the permission mechanism.

---

## 5. Final Enforcement Matrix

There is **no single common enforcement point**. There are six distinct mechanisms (SQL text, typed data manipulation,
DDL command context, import pipeline, transaction manager, execution planner). This is a **distributed enforcement set
of 16 gates across 7 files, all inside the fork** — zero DBeaver platform changes.
`processQuery` is *not* sufficient on its own: EXPLAIN (E6), row count (E5) and the container-read pipeline (E4a–E4c)
each reach JDBC independently of it.

| # | Entry point (GraphQL op) | Final DB API | Existing check | Enforcement location | Status | P2 |
|---|---|---|---|---|---|---|
| E1 | `asyncSqlExecuteQuery` → SQL Editor | `dbStat.executeStatement()` `WebSQLProcessor.java:294` | distributed-only + connection `PERMISSION_EXECUTE_SCRIPTS` (`WebServiceSQL.java:605-611`) | `WebSQLProcessor.java` between `:242`–`:244` | STATIC VERIFIED | yes |
| E2 | control command (`@set`, `@ai`, …) inside E1 | executes at `:222`, before any later gate; `@ai` yields a `SQLScript` with many elements that then flow through `makeStatement` | NONE | `WebSQLProcessor.java:221-230` (before `:222`). **Not a live bypass today** — the registered handlers are DB-side-effect-free (`SQLCommandSet` sets a script variable, `SQLCommandExport` stores a pragma, echo/unset inert). Gate anyway: the set is extensible and `@ai` re-introduces multi-element scripts | STATIC VERIFIED | yes |
| E3 | `asyncSqlGroupingResultSet` | re-enters E1 via `WebSQLUtils.createAsyncTaskExecuteSqlQuery` (`WebServiceSQL.java:808`) | NONE (skips E1's checks) | `WebServiceSQL.java:796` + raw `functions` validation (D8) | STATIC VERIFIED | yes |
| E4a | `asyncReadDataFromContainer` (`WebServiceSQL.java:625`) | `dataContainer.readData(...)` `WebSQLProcessor.java:355` → platform pipeline (I22) | NONE | `WebSQLProcessor.readDataFromContainer` (`:337`) — validate stored text **and** client filter (D8) | STATIC VERIFIED | yes |
| E4b | post-update result refresh (inside E7) | `dataContainer.readData(...)` `WebSQLProcessor.java:560` → platform pipeline (I22) | NONE | `WebSQLProcessor.java:560` | STATIC VERIFIED | yes |
| E4c | cell / LOB value read (`readLobValue`, `sqlReadStringValue`) | `dataContainer.readData(...)` `WebSQLProcessor.java:967` → platform pipeline (I22) | NONE | `WebSQLProcessor.java:967` | STATIC VERIFIED | yes |
| E5 | `asyncSqlRowDataCount` | **own** `makeStatement`+`executeStatement`: `PLATFORM:DBUtils.java:2827-2828` via `WebSQLQueryDataContainer.java:133` | NONE | `WebServiceSQL.java:821` (validate stored filter) **and** treat `WebSQLQueryDataContainer.countData:119` as a second gate — text is re-derived at `:121-132` (I17, I18) | STATIC VERIFIED | yes |
| E6 | `asyncSqlExplainExecutionPlan` | `JDBCStatement.executeQuery` `PLATFORM:PostgreExecutionPlan.java:161` | NONE | `WebSQLProcessor.java:914-918` (before `putAll(configuration)` at `:917`) | STATIC VERIFIED | yes |
| E7 | `asyncUpdateResultsDataBatch`, `updateResultsDataBatch` → Data Editor | `batch.execute(session, options)` `WebSQLProcessor.java:444` | distributed-only (`:443`,`:482`); connection-scoped data-edit check | `WebSQLProcessor.updateResultsDataBatch` before the loop at `:413` (+ service-layer pre-check) | STATIC VERIFIED | yes |
| E8 | `updateResultsDataBatchScript` | generates SQL text only | — | classify generated text if it becomes executable | STATIC VERIFIED | no |
| E9a | `navDeleteNodes` → DDL DROP | `commandContext.saveChanges(...)` `WebServiceNavigator.java:578` | `checkMetadataEditPermission` `:550` → `:607-611` — connection-scoped | `WebServiceNavigator.java:550` and before the loop at `:570` (per-node loop = partial-DDL hazard) | STATIC VERIFIED | yes |
| E9b | `navRenameNode` → DDL ALTER…RENAME | `commandContext.saveChanges(...)` `WebServiceNavigator.java:725` | `checkMetadataEditPermission` `:464` — connection-scoped | `WebServiceNavigator.java:464` | STATIC VERIFIED | yes |
| E10 | `dataTransferImportDataIntoResults` → Import (two-phase: create task, then upload file) | `producer.transferData(...)` `WebServiceDataTransfer.java:428` | `PERMISSION_IMPORT_DATA` at **registration** `:249-251`; the upload servlet re-checks only the session-global permission (`WebDataTransferImportServlet.java:69`) | re-check at **execution** — `runImportDataTask` `:271-317` / `importData` `:298` — not only at `:249` | STATIC VERIFIED | yes |
| E11 | `asyncSqlCommitTransaction` | `txnManager.commit(session)` `WebSQLContextInfo.java:313` | NONE | `WebSQLContextInfo.java:313` | STATIC VERIFIED | yes |
| E12 | `asyncSqlSetAutoCommit` (implicit commit) | `txnManager.setAutoCommit(...)` `WebSQLContextInfo.java:224` | NONE | `WebSQLContextInfo.java:214-224` | STATIC VERIFIED | yes |
| E13 | `asyncSqlRollbackTransaction` | `txnManager.rollback(...)` `WebSQLContextInfo.java:353` | NONE | **always allow** (no gate) | STATIC VERIFIED | no |
| E14 | `sqlContextDestroy` / connection close | platform close path | NONE | ensure rollback-on-close; do not add a commit | NOT VERIFIED | no |
| E15 | `sqlContextSetDefaults` | schema/catalog switch | NONE | relevant only because it clears MySQL read-only (I10) | STATIC VERIFIED | no |
| E16 | stored procedure / function call | no dedicated path — arrives as SQL text through E1. Not reachable via `asyncReadDataFromContainer` (I21) | — | covered by E1 + D7 | STATIC VERIFIED | no |
| E17 | `createConnection` / `updateConnection` / `deleteConnection` | connection config (`setConnectionReadOnly(input.isReadOnly())`, `WebConnectionConfigInputHandler.java:94,109`) | **`@WebProjectAction(requireProjectPermissions={PERMISSION_PROJECT_DATASOURCES_EDIT})`**, enforced `WebServiceBindingBase.java:209-212,286-290` (I16) | no code change — **deployment hardening**: do not grant that project permission to READ_ONLY users, and disable custom connections | STATIC VERIFIED | no |

Note: `CBEmbeddedSecurityController` / `CBDatabase` JDBC calls target CloudBeaver's **own** metadata database, not user
connections, and are out of scope as a mutation surface (they are the TEMP_WRITE storage, §6).

---

## 6. TEMP_WRITE Model

**Key** = `(userId, projectId, connectionId)`. `projectId` is included because connection ids are scoped per project and
a bare connection id is ambiguous across shared/global vs private projects.

| Aspect | Decision | Location / evidence |
|---|---|---|
| Storage | New table in CloudBeaver's internal DB (`CB_TEMP_WRITE_GRANT`), versioned migration | `server/bundles/io.cloudbeaver.service.security/db/`, `CBDatabase.java:75` (`CURRENT_SCHEMA_VERSION=29`), `CBSchemaVersionManager` |
| Columns | `id, user_id, project_id, connection_id, granted_by, granted_at, expires_at, reason, revoked_at, revoked_by` | PLAN.md §TEMP_WRITE |
| Decision rule | ALLOW only if a row matches user+project+connection **and** `revoked_at IS NULL` **and** `expires_at > now()` (server clock, UTC). Any other outcome, including a lookup error, → DENY | CLAUDE.md §7–§9 |
| Status field | Optional and **advisory only**; `expires_at` is always evaluated directly | QA.md §39 |
| Evaluation timing | Per write attempt, at the enforcement point, reading the store at check time | D13; QA.md §32/§33 |
| No scheduler dependency | Scheduler may only clean up rows / refresh admin UI; it is never the basis of a decision | CLAUDE.md §9 |
| Cache | If any cache is added it must be request-scoped or ≤ a few seconds **and** must not extend a grant past `expires_at`; revoke must invalidate. Simplest compliant choice: **no cache** in Phase 2 | QA.md §36 |
| Immediate revoke, existing sessions & tabs | Achieved because nothing is captured into session state — the decision reads the store on each attempt. Must **not** be stored in `WebSession` permissions | QA.md §33/§34; `WebSession.java:224-226` |
| Grant/revoke authorization | New admin-only mutations declared `@WebAction(requirePermissions = DBWConstants.PERMISSION_ADMIN)`; enforced server-side independent of UI | `DBWServiceAdmin.java:38`; `WebServiceBindingBase.java:312-341`; CLAUDE.md §21 |
| Identity at check time | `WebSQLProcessor` holds `webSession` and `connection`; `WebSQLContextInfo.getConnectionId()`; `WebSession.getUserId()` | `WebSQLProcessor.java:88-89` |
| Transactions | New writes DENY after expiry; COMMIT requires current permission (D11); ROLLBACK always allowed | QA.md §50 |
| **Shared transaction across tabs** | All editor contexts of one connection share one JDBC connection and one transaction (I23). So a second tab can commit the first tab's pending writes, and `contextId` gives **no** isolation. Consequence: the COMMIT gate (E11) is not optional — it is the only thing preventing post-expiry persistence of writes made while the grant was valid | `WebSQLProcessor.java:132-134`; `WebSQLContextInfo.java:305`; QA.md §34/§50 |
| Import two-phase gap | The permission decision at task creation must **not** be reused: the upload servlet re-checks only the session-global import permission, never the per-connection one, and `runImportDataTask` re-checks nothing. A grant can be opened, the task created, and the file uploaded after expiry | `WebServiceDataTransfer.java:249-252` vs `:271-317`; `WebDataTransferImportServlet.java:69` |
| ADMIN | May manage grants. ADMIN's own DB-write policy is a separate decision and is **not** implicitly full access | QA.md §43 |

**Upstream-merge caution:** bumping `CURRENT_SCHEMA_VERSION` to 30 will collide with upstream's next migration.
Prefer a fork-owned schema-version namespace or a separately versioned table so `cb_schema_update_30.sql` is not claimed.

---

## 7. Runtime Verification Matrix

| Item | State | Phase 2 impact |
|---|---|---|
| JSQLParser statement typing + multi-statement behaviour | **EXECUTED** (§10, T-01…T-30) | resolved — design fixed |
| Allowlist policy verdicts over the QA corpus | **EXECUTED** (§10, P-01…P-34) | resolved — design validated |
| pgjdbc / MySQL Connector-J actually executing multi-statement strings | NOT EXECUTED — no DB, no server build | **Parallel.** Absorbed by D3 (multi-statement always DENY) |
| `SELECT modifying_function()` real side effect | NOT EXECUTED | **Parallel.** Absorbed by D7 |
| Data-modifying CTE real effect on PostgreSQL | NOT EXECUTED (typing resolved statically) | **Parallel.** Absorbed by D6 |
| `EXPLAIN ANALYZE` executing + rollback not undoing sequences | NOT EXECUTED | **Parallel.** Absorbed by D9 |
| `setAutoCommit(true)` implicit commit per driver | NOT EXECUTED | **Parallel.** Absorbed by D11 |
| `sqlContextSetDefaults` effect on an open transaction | NOT EXECUTED | **Parallel.** Low severity |
| Raw filter / grouping injection reaching the DBMS | NOT EXECUTED (concatenation proven statically) | **Parallel.** Absorbed by D8 |
| PostgreSQL / MySQL connection read-only enforcement strength | NOT EXECUTED | **Parallel.** Option C is secondary only (D10) |
| Rollback on connection close (E14) | NOT EXECUTED | **Parallel.** |
| TEMP_WRITE expiry/revoke in existing sessions | NOT EXECUTED (no implementation yet) | **Parallel** — becomes the Phase 2 acceptance test |
| Non-admin clearing `readOnly` / custom connection (E17) | NOT EXECUTED | **Parallel.** Deferred risk R4 |

**No item is a Phase 2 blocker.** The two questions that could have changed the API/data model or fail-closed
feasibility — statement typing and the enforcement object's shape — are both resolved (§4, §10).

### Minimal runtime experiment plan (≤5 lines each, for Phase 2)

1. **Multi-statement** — Goal: does one request execute >1 statement? Pre: Docker PG + MySQL, READ_ONLY user.
   Send `SELECT 1; CREATE TABLE probe(x int);`. Pass: `probe` absent **and** request denied.
2. **`SELECT modifying_function()`** — Pre: function incrementing a counter table. Call it as READ_ONLY.
   Pass: denied and counter unchanged.
3. **Data-modifying CTE** — `WITH d AS (UPDATE t SET v='X' RETURNING id) SELECT * FROM d` as READ_ONLY.
   Pass: denied and `t` unchanged.
4. **`EXPLAIN ANALYZE`** — Call `asyncSqlExplainExecutionPlan` with `INSERT INTO t SELECT nextval('s')`,
   `configuration={"ANALYZE":true}`. Pass: denied; sequence and row count unchanged.
5. **`setAutoCommit(true)`** — Write in a manual transaction, let TEMP_WRITE expire, then set autocommit true.
   Pass: no commit occurs.
6. **`sqlContextSetDefaults`** — Open a transaction with a write, switch schema, inspect transaction state.
   Pass: no implicit commit.
7. **Raw filter side effect** — `asyncReadDataFromContainer` with `where = "true OR (SELECT nextval('s'))>0"`.
   Pass: denied; sequence unchanged.
8. **Grouping injection** — `asyncSqlGroupingResultSet` with `functions=["count(*)) , (SELECT nextval('s')"]`.
   Pass: denied; sequence unchanged.
9. **PostgreSQL read-only** — Connect with `readOnly=true`, run `SHOW transaction_read_only`, attempt INSERT, then
   `SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE` and retry. Record whether the client can re-enable writes.
10. **MySQL read-only** — Same shape with `SELECT @@session.transaction_read_only` and `SET SESSION TRANSACTION READ WRITE`;
    additionally probe the schema-switch window from I10.
11. **Rollback on close** — Uncommitted write, then `sqlContextDestroy`. Pass: change absent.
12. **TEMP_WRITE expiry/revoke** — Grant, write, revoke; retry in the *same* editor/session and in a second tab.
    Pass: both denied with no reconnect or refresh.
13. **Cross-tab commit after expiry** (I23) — Tab A writes under a valid grant; let it expire; call
    `asyncSqlCommitTransaction` from tab B. Pass: commit denied and Tab A's writes never persist.
14. **JDBC escape rewrite** (I24) — Execute `{call some_mutating_proc()}` as READ_ONLY.
    Pass: denied at classification (never reaches the driver's escape rewriter).
15. **Import upload after expiry** (E10) — Create the import task under a valid grant, let it expire, then upload the
    file. Pass: import denied at execution and target table unchanged.
16. **Denial is not retried** — Assert a denied statement produces exactly one attempt, i.e. `tryExecuteRecover`
    classifies the denial as `NORMAL`. Pass: no connection invalidation, no retry.

---

## 8. Phase 2 Minimal Change Set

No code was written. Files and responsibilities only.

**New (fork-owned, isolated):**

| File / module | Responsibility |
|---|---|
| `io.cloudbeaver.service.accesscontrol` (new bundle) | policy service: statement allowlist classifier, function allowlist, expression validator, decision API |
| ↳ `SqlReadPolicy` | parse → coverage check → count check → allowlist walk → verdict + reason |
| ↳ `TempWritePermissionService` | `(user, project, connection)` lookup, `expires_at`/`revoked_at` evaluation, fail-closed on error |
| ↳ `AccessControlAudit` | `TEMP_WRITE_GRANTED/REVOKED/EXPIRED`, `WRITE_ALLOWED/DENIED`; statement type only, never SQL text or secrets |
| ↳ admin service + `schema/service.accesscontrol.graphqls` | `@WebAction(requirePermissions=PERMISSION_ADMIN)` grant/revoke/list |
| `io.cloudbeaver.service.security/db/` migration | `CB_TEMP_WRITE_GRANT` table (see §6 upstream caution) |

**Modified (upstream files — 6 files, 9 enforcement calls):**

| File | Change |
|---|---|
| `.../service/sql/WebSQLProcessor.java` | gate before `:244` (E1); control-command gate at `:221` incl. all-element pre-flight before `:246` (E2); container-read gates at `:337`/`:355` (E4a), `:560` (E4b), `:967` (E4c); Data Editor gate before `:413` (E7); EXPLAIN gate before `:917` (E6) |
| `.../service/sql/impl/WebServiceSQL.java` | grouping gate `:796` + `functions` validation (E3); row-count gate `:821` (E5) |
| `.../service/sql/WebSQLQueryDataContainer.java` | second row-count gate at `countData:119`, since the text is re-derived at `:121-132` (E5, I17/I18) |
| `.../service/sql/WebSQLContextInfo.java` | commit gate `:313` (E11); autocommit gate `:214-224` (E12); rollback untouched (E13) |
| `.../service/navigator/impl/WebServiceNavigator.java` | DDL gates: delete at `:550` and before the loop at `:570` (E9a); rename at `:464` (E9b) |
| `.../service/data/transfer/impl/WebServiceDataTransfer.java` | re-check at execution `:298`, in addition to `:249` (E10) |
| `CBDatabase.java` / schema version manager | register the new migration |

**Deliberately not modified:** any file under `D:/IdeaProjects/dbeaver` (platform). The design requires zero upstream
platform changes, which keeps CLAUDE.md §23/§28 satisfied.

---

## 9. Deferred Risks

- **R1** `updateResultsDataBatchScript` (E8) returns generated SQL text; harmless unless a client can replay it — it would then arrive via E1 and be gated.
- **R2** `readLobValue` / `sqlReadStringValue` read cell data; read-only in intent, not re-examined here.
- **R3** `sqlContextSetDefaults` effect on an open transaction (low severity; no write of its own).
- **R4** Connection `readOnly` self-service is **not** a code bypass (I16), but remains a **deployment** risk: a user granted `PERMISSION_PROJECT_DATASOURCES_EDIT` on the project holding an operational connection could clear `readOnly` or add JDBC properties (e.g. MySQL `allowMultiQueries=true`). Harden by configuration, not code. Does not affect the primary gate.
- **R5** The 1000 ms parser timeout (`PLATFORM:SQLSemanticProcessor.java:65`) as a DoS/deny-amplification vector; a timeout already maps to DENY.
- **R6** AI `@ai` control command produces `SQLScript` with multiple elements (E2) — gated, but its availability depends on a deployment policy expression not evaluated here.
- **R7** Non-PostgreSQL/MySQL DBMS: explicitly **NOT SUPPORTED** and not claimed safe.
- **R8** The MySQL `@source <file.sql>` control command is declared in the MySQL plugin but its handler class lives in a UI bundle not present in the CE server feature graph, so it currently fails closed by build accident. An upstream merge that pulls that bundle in would turn it into a script-execution bypass — add a regression test that asserts unknown/unavailable control commands are DENIED (E2).
- **R9** `SQLQueryTransformerCount` wraps even unparseable SQL into `SELECT COUNT(*) FROM (…) dbvrcnt` and leaves it to the database, so the row-count path can execute text that no CloudBeaver-side parser accepted (E5, I17).

---

## 10. Tests Executed

Environment: JDK 21.0.2; JSQLParser **5.3.0**, taken from the actual target-platform bundle
`~/.m2/repository/p2/osgi/bundle/com.github.jsqlparser/5.3.0/`, i.e. the version CloudBeaver builds against.
Both probes faithfully replicate `SQLSemanticProcessor.buildParser` (`withAllowComplexParsing(false)`) and
`SQLQuery.parseQuery`'s type mapping. Scratchpad only; nothing added to the repository.

**T — classifier probe (`ClassifyProbe.java`, 30 cases).** Selected results:

| Case | `Statement()` → type | `Statements()` |
|---|---|---|
| T-02 `SELECT …; UPDATE … WHERE id=1` | **SELECT** (`PlainSelect`), no error | n=2 → [SELECT] [UPDATE] |
| T-03 same, trailing `;` | **SELECT** | n=2 |
| T-06 `WITH d AS (UPDATE … RETURNING id) SELECT * FROM d` | **SELECT**, `isModifying=false` | n=1 |
| T-07/T-08 CTE with DELETE / INSERT | **SELECT**, `isModifying=false` | n=1 |
| T-09 `SELECT modify_test_data()` | **SELECT**, `isModifying=false` | n=1 |
| T-10 `SELECT setval('s',1)` | **SELECT**, `isModifying=false` | n=1 |
| T-11 `SELECT … FOR UPDATE` | SELECT, `isModifying=true` | n=1 |
| T-15 `TRUNCATE TABLE t` | **UNKNOWN** (`Truncate` unmapped) | n=1 |
| T-16 `DO $$ … $$` | **UNKNOWN** (ParseException) | threw |
| T-17 `CALL modify_test_data()` | **UNKNOWN** (`Execute`) | n=1 |
| T-18 `GRANT …` | **UNKNOWN** (`Grant`) | n=1 |
| T-19 `COPY … FROM '…'` | **UNKNOWN** (ParseException) | threw |
| T-25 `SELECT 1 UNION SELECT 2` | **UNKNOWN** (`SetOperationList`) | n=1 |
| T-30 `LOCK TABLE …` | **UNKNOWN** (ParseException) | threw |

Consequences: (a) T-02/T-03 prove the identity defect in §4.2 concretely; (b) T-06…T-08 prove data-modifying CTEs are
indistinguishable from reads by type alone → D6; (c) T-15/T-17/T-18/T-19 with I6 prove `isModifying()` is fail-open for
TRUNCATE/CALL/GRANT/COPY → D2; (d) T-25 shows a naive "PlainSelect only" rule would break lawful `UNION` reads → D5.

**P — policy prototype (`PolicyProbe.java`, 34 cases): 31 correct, 3 mismatches, all understood.**

- All 8 lawful-read cases ALLOWED (plain/join/CTE-select/group-by/order-limit/union/union-all/scalar subquery) → no regression on QA.md §47 shapes.
- All DML, DDL, TRUNCATE, MERGE, GRANT, CALL, DO, COPY, LOCK, SET, REFRESH, `FOR UPDATE`, `SELECT INTO`, comment-prefixed UPDATE, and both injection shapes DENIED.
- **Mismatch 1** — `SELECT 1; SELECT 2` was ALLOWED by the draft rule. This is a genuine gap the prototype exposed in my own first formulation, and it produced **D3** (deny all multi-statement outright).
- **Mismatch 2/3** — `SELECT modify_test_data()` and `SELECT setval('s',1)` ALLOWED, i.e. exactly the known limitation; produced **D7**.
- Implementation note: write-CTEs denied via `with-item-opaque` because the inner node was not reachable as a `Select`. That is fail-closed but incidental — Phase 2 must inspect WithItem inner types explicitly rather than depend on a null accessor.

**Static verification performed:** `git status`/`git diff` (clean), toolchain probe, p2/Tycho cache inspection, and
direct reading of every file cited in §2–§6 in both repositories.

**Adversarial pass.** An independent bypass-hunting review re-enumerated every CloudBeaver server-bundle site reaching a
JDBC execute/prepare, `DBSDataManipulator.ExecuteBatch`, or `DBCStatement`, and attacked the enforcement set. I verified
each claim myself rather than accepting it:

| Claim | Outcome |
|---|---|
| EXPLAIN is a second arbitrary-SQL channel outside `processQuery` | **Upheld** — independently confirmed; already E6/D9 |
| Row count has its own `makeStatement`+`executeStatement` outside `WebSQLProcessor` | **Upheld** — confirmed (I17/I18); E5 revised, new gate added |
| `renameDatabaseObject` is a second DDL `saveChanges` site | **Upheld** — confirmed; E9 split into E9a/E9b |
| `connectionReadOnly` does not gate import or script execution | **Upheld** — confirmed (I15); strengthens D10 |
| `JDBCPreparedStatementImpl` decouples `getQueryString()` from what executes | **Upheld** — confirmed (I20); rules out a `DBCStatement`-level gate |
| *"A normal user can POST `updateConnection {readOnly:false}` — no server-side check"* (rated BLOCKS_PHASE2) | **REFUTED** — the reviewer read only the implementations and missed the interface annotation. `DBWServiceCore.java:137,144,151` carry `@WebProjectAction(requireProjectPermissions={PERMISSION_PROJECT_DATASOURCES_EDIT})`, enforced at `WebServiceBindingBase.java:209-212,286-290` which throws `DBWebExceptionAccessDenied`. Recorded as deployment risk R4, not a code bypass |
| `navRenameNode` may lack the metadata-edit check that `navDeleteNodes` has | **REFUTED** (my own earlier suspicion too) — `checkMetadataEditPermission` is called at `:464` (I19) |
| Registered control-command handlers are DB-side-effect-free today | **Upheld** — E2 reworded; gate retained because the set is extensible |
| Platform `SQLQueryDataContainer.readData` is a third pipeline with its own second parse | **Upheld** — confirmed (I22); E4 split into E4a/E4b/E4c and D8 promoted to mandatory |
| All editor tabs share one JDBC connection and one transaction | **Upheld** — confirmed (I23); makes the COMMIT gate E11 load-bearing |
| JDBC escape processing rewrites `{call …}` after the check for PG/MySQL | **Upheld** — confirmed (I24); identity claim qualified in §4.3, absorbed by DENY |
| Import decision at task creation is reused across the upload gap | **Upheld** — confirmed; E10 requires re-check at execution |
| `AI`/`@ai` multi-element scripts partially execute (elements 1..N-1 commit before N is denied) | **Upheld** — E2 requires a pre-flight over **all** elements before the loop at `:246` |
| A DENY inside `tryExecuteRecover` could trigger a retry loop | **Upheld** — recorded as an implementation constraint in §4.3 |
| `mysql.source` (`@source file.sql`) could be a bypass | **Upheld as a merge risk only** — its handler lives in a UI bundle absent from the CE server feature graph, so it fails closed today; recorded as R8 |

---

## 11. Tests Not Executed

- **No CloudBeaver build, no server run, no DBMS test.** The build is Eclipse Tycho and resolves its target platform from
  two remote p2 repositories (`eclipse-p2-repo`, `repo.p2.dbeaver-ce.url` — `dbeaver-common/pom.xml:35-42`, parent chain
  `server/pom.xml:13-18` → `dbeaver` → `dbeaver-common`). The local cache is **partial** (`~/.m2/repository/p2` ≈ 60 MB,
  183 files; Tycho cache ≈ 67 MB) and `org/jkiss` artifacts are absent, so no offline build is possible. I therefore did
  **not** attempt a build rather than burn the single permitted attempt on a predictable failure.
- `java` on `PATH` is **1.8.0_77**; Maven runs on JDK 21.0.2. A build would additionally need `JAVA_HOME` pointed at JDK 21.
- **Yarn is not installed**, so no frontend build or frontend verification.
- All DBMS behaviour (multi-statement execution, function side effects, `EXPLAIN ANALYZE`, implicit commit, session
  read-only strength, rollback-on-close) is **NOT VERIFIED** and is not claimed. Docker 28.2.2 is available, so §7's plan
  is executable in Phase 2 against throwaway containers only — never a shared or production database.
- No TEMP_WRITE behaviour was tested because nothing is implemented yet.
- PostgreSQL and MySQL are **NOT YET VERIFIED**; no DBMS is marked SUPPORTED by this record.

---

## 12. Modified Files

**Production code modified: 0. Commits created: 0. `.omx/` untouched. `docs/db-mutation-surface.md` untouched.**

| File | Change |
|---|---|
| `docs/db-access-control-phase1-decision.md` | **new** — this record |

Scratchpad only (outside the repository, not part of the deliverable):
`…/scratchpad/ClassifyProbe.java`, `…/scratchpad/PolicyProbe.java`.

---

## 13. Git Status

```
Branch: devel
HEAD:   3844792b84052f9eabf92326273b5bed250d4879
Working tree at start: clean (tracked files); untracked: .omx/, docs/
git diff / git diff --cached: empty
Now: docs/db-access-control-phase1-decision.md added (docs/ still untracked as a whole)
Toolchain: java(PATH)=1.8.0_77, Maven 3.9.11 on JDK 21.0.2, JDK 21.0.2 present, Node v22.14.0, Yarn ABSENT, Docker 28.2.2
```

---

## 14. Next Action

Begin Phase 2 with E1 + E2 (the SQL text gate and the control-command gate) plus `TempWritePermissionService`, because
they carry the most risk and validate the whole design. Then E7 (Data Editor), E6 (EXPLAIN), E3/E4/E5 (read-shaped
paths), E9 (DDL), E10 (Import), E11/E12 (transactions). Port `PolicyProbe`'s 34 cases into a real unit test suite as the
first commit — it needs no DBMS and locks D1–D7 in place. Run the §7 experiments against Docker containers as the
enforcement points land, and hand the result to an independent `qa` subagent per CLAUDE.md §27 Step 10.

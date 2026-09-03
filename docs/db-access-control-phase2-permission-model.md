# Phase 2 권한 모델 설계 — READ_ONLY / TEMP_WRITE / ADMIN

대상 DBMS: PostgreSQL, MySQL. Fork: CloudBeaver CE, branch `devel`, HEAD `3844792b8`.
플랫폼(`D:/IdeaProjects/dbeaver`) 인용은 `PLATFORM:` 접두사. 선행 기준: `docs/db-access-control-phase1-decision.md`.
표기: `STATIC VERIFIED`=직접 읽은 코드 / `DECIDED`=본 문서의 확정 결정 / `NOT VERIFIED`=런타임 확인 필요.

**개정 이력.** 초판의 `READY FOR PHASE 3` 판정은 독립 검토에서 반려되었다. 아래 5건은 실제 결함이었고 본 개정판에서 교체했다:
① configuration mode의 관리자 권한 우회(§7.2), ② PENDING_WRITE와 TAINTED를 구분하지 못한 boolean taint 모델(§9),
③ UNIQUE·잠금 없는 동시 grant 설계(§5.3), ④ audit fail-closed 자기모순(§11), ⑤ 계산 규칙이 없던 clock skew 정책(§8.1).
초판의 boolean taint 모델과 단일 grant table 설계는 **폐기**되었다.

## 1. Phase 2 Verdict

**READY FOR PHASE 3.**

반려 사유 5건을 모두 코드 근거와 함께 교체했고 최종 판정 기준 10개를 충족한다. configuration mode에서 `requirePermissions`
검사가 통째로 건너뛰어진다는 사실을 직접 확인해(`WebServiceBindingBase.java:321`) 관리 API에 독립 guard를 의무화했고(§7.2),
transaction 상태를 4-상태 machine으로 교체해 `originalGrantId` provenance를 도입했으며(§9), current-state/history 분리 + PK +
optimistic CAS로 동시성 문제를 제거했고(§5.3), ALLOW audit을 대상 DB 실행 **이전**에 기록하도록 확정했으며(§11), 시간 권위를
**metadata DB clock 단일 domain**으로 바꿔 다중 노드 skew를 구조적으로 제거했다(§8.1). Phase 3 구현자가 추가로 내려야 할
보안 정책 결정은 남기지 않았다.

## 2. 확정된 권한 모델

| 권한 | 의미 | DB WRITE | TEMP_WRITE 관리 |
|---|---|---|---|
| `READ_ONLY` | 기본 상태. 별도 데이터 불필요(grant 부재 = READ_ONLY) | 불가. 안전한 read로 확정된 작업만 | 불가 |
| `TEMP_WRITE` | `(user, project, connection)` 기간 한정 권한 | 유효 기간 내에서만 | 불가 |
| `ADMIN` | `DBWConstants.PERMISSION_ADMIN` 보유 | **자동 허용 없음.** 자신에 대한 TEMP_WRITE 필요 | grant/revoke/list 가능 |

원칙(DECIDED): ① 권한은 저장된 상태가 아니라 **판정 결과**다 — `WebSession` permission 집합에 TEMP_WRITE를 넣지 않는다.
② permission cache를 두지 않는다. ③ ADMIN 여부는 DB WRITE 판정에 **전혀 관여하지 않는다.** ④ enforcement는
configuration mode를 포함한 **모든 서버 모드에서 동작**한다(판정 실패 시 DENY 규칙은 §10).

## 3. Permission Key 결정

### 3.1 저장/판정 key

`PLAN.md`는 `(userId, connectionId)`, Phase 1은 `(userId, projectId, connectionId)`를 제시했다.
**확정: `(USER_ID, PROJECT_ID, CONNECTION_ID)`. 단 `PROJECT_ID`는 새 권한 격리 차원이 아니라 connection을 유일하게
식별하기 위한 namespace다.** DECIDED.

근거(모두 STATIC VERIFIED): 권한 격리 차원은 `USER_ID` × connection 2개이지만(`PLAN.md`), connection id의 **유일성 범위는
project 내부뿐**이다 — registry가 project 단위이고 조회도 그 안에서 수행되며(`WebSessionProjectImpl.java:184`) 전역 유일성을
강제하는 코드가 없다. id는 각 project `data-sources.json`의 `connections` map **key**에서 그대로 오고
(`PLATFORM:DataSourceSerializerModern.java:544-546`), 값은 `driverId + "-" + hex(millis) + "-" + hex(random)`로 UUID가 아니며
길어서 column 폭에 영향을 준다(§5.1). 두 값은 `WebConnectionInfo.getId():114` / `getProjectId():521`로 함께 얻는다.
CE의 `CB_OBJECT_PERMISSIONS`가 `OBJECT_ID`만 쓰는 것은 `validateThatConnectionGlobal`로 global project만 허용해 namespace를
상수로 고정했기 때문이며, 우리는 shared/private도 대상이라 명시가 필요하다. project 간 connection 이동 시 grant를 이전하지
않으므로 자동 READ_ONLY가 된다(fail-closed).

### 3.2 [핵심] 판정 key는 resolve된 container에서 추출한다 — DECIDED

`WebDataSourceUtils.getWebConnectionInfo:208-218`(STATIC VERIFIED)은 `projectId == null`이면 접근 가능한 **모든** project를
`flatMap`으로 훑어 `.filter(e -> e.getId().contains(connectionId))` — 즉 **부분 문자열** 매칭 + `findFirst`로 첫 항목을
고른다. 대부분의 operation에서 `projectId: ID`는 nullable이다(STATIC VERIFIED: `service.sql.graphqls`). 따라서 GraphQL
요청 인자를 그대로 권한 key로 쓰면 **권한을 조회한 대상과 실제 실행되는 대상이 어긋날 수 있다.**

**규칙:** 판정 API 입력은 `(userId, DBPDataSourceContainer, operationCategory, ...)`로 받고 key는 반드시
`container.getId()` / `container.getProject().getId()`에서 뽑는다. GraphQL 인자를 key로 쓰는 것을 금지한다. §13 S12로 검증.

### 3.3 FK 불가 및 익명 처리

metadata DB에 connection/project 테이블이 **없어**(STATIC VERIFIED: `cb_schema_create.sql`의 22개 테이블에 부재 — connection은
파일로 관리) `PROJECT_ID`/`CONNECTION_ID`에 FK를 걸 수 없고 유효성은 registry 조회로 확인한다. 익명 세션에서 `getUserId()`가
`null`인 경로가 실재하므로(STATIC VERIFIED) `userId == null`이면 **조회 전에** READ_ONLY로 확정한다. 익명 project id는 모든
익명 세션이 공유하는 리터럴 `"anonymous"`이며 그 grant는 익명 전체에 권한이 새므로 **grant API와 판정 양쪽에서 거부**한다.

## 4. TEMP_WRITE 상태 및 판정 규칙

판정은 `DBAC_TW_CURRENT`의 단일 row를 읽고, **항상 `EXPIRES_AT`과 `REVOKED_AT`을 직접 비교**한다(§5.1).

| # | 상황 | 판정 | 비고 |
|---|---|---|---|
| 1 | current row 없음 | **DENY** (`NO_GRANT`) | 기본 = READ_ONLY |
| 2 | `REVOKED_AT IS NULL` AND `EXPIRES_AT > DB now` AND 스냅샷 일치 | **ALLOW** | 유일한 ALLOW 조건 |
| 3 | `EXPIRES_AT <= DB now` | **DENY** (`GRANT_EXPIRED`) | 만료 우선. 경계 배타적 |
| 4 | `REVOKED_AT IS NOT NULL` | **DENY** (`GRANT_REVOKED`) | 만료 시각이 남아 있어도 |
| 5 | store 조회 오류/timeout | **DENY** (`PERMISSION_STORE_UNAVAILABLE`) | 예외 전파. null 반환 fail-open 금지 |
| 6 | connection이 registry에 없음 / project·connection 삭제 | **DENY** (`CONNECTION_UNKNOWN`) | current row가 있어도 |
| 7 | user 비활성/삭제 | **DENY** (`USER_INACTIVE`) | `CB_USER.IS_ACTIVE != 'Y'` (STATIC VERIFIED) |
| 8 | ADMIN의 DB write | 조건 2일 때만 **ALLOW** | ADMIN 자체로는 ALLOW 아님 |
| 9 | `USER_ID` null/익명, `PROJECT_ID='anonymous'` | **DENY** (`IDENTITY_MISSING`) | 조회 전 차단 |
| 10 | transaction 상태가 TAINTED / BLOCKED | **DENY** (`TRANSACTION_TAINTED` / `CONNECTION_BLOCKED`) | rollback만 예외(§9) |
| 11 | PENDING_WRITE인데 `originalGrantId`가 현재 current row와 불일치 | **DENY** (`GRANT_SUPERSEDED`) | 재부여 grant로 과거 transaction commit 금지(§9) |
| 12 | connection 스냅샷 불일치 | **DENY** (`GRANT_STALE`) | id 재등장 방어(§5.1) |
| 13 | node의 clock skew가 허용치 초과 | **DENY** (`CLOCK_SKEW_EXCEEDED`) | §8.1 |

판정 SQL의 논리 형태(구현 코드 아님). 비교를 **DB clock**으로 수행하는 것이 핵심이다(§8.1):

```
SELECT GRANT_ID, EXPIRES_AT, REVISION, DRIVER_ID, HOST_SNAPSHOT, DATABASE_SNAPSHOT
  FROM {table_prefix}DBAC_TW_CURRENT WHERE USER_ID=? AND PROJECT_ID=? AND CONNECTION_ID=?
   AND REVOKED_AT IS NULL AND EXPIRES_AT > CURRENT_TIMESTAMP
```

## 5. 데이터 모델

### 5.1 `{table_prefix}DBAC_TW_CURRENT` — current-state (key당 최대 1 row)

접두사에 `CB_`를 쓰지 않는다(upstream 동명 테이블 추가 가능성 제거). **PK가 permission key 자체**이므로 동시 grant가
2개의 active row를 만들 수 없다(§5.3). DECIDED.

| column | 형 | NULL | 의미 |
|---|---|---|---|
| `USER_ID` | `VARCHAR(128)` | NOT NULL | **PK 구성** |
| `PROJECT_ID` / `CONNECTION_ID` | `VARCHAR(255)` | NOT NULL | **PK 구성.** `PROJECT_ID='anonymous'` 거부. id가 driverId 포함해 길다(§3.1) |
| `GRANT_ID` | `VARCHAR(128)` | NOT NULL | 현재 grant의 식별자(UUID). §9의 `originalGrantId` |
| `REVISION` | `BIGINT` | NOT NULL | optimistic CAS용 단조 증가값(§5.3) |
| `GRANTED_BY` | `VARCHAR(128)` | NOT NULL | 부여 ADMIN |
| `GRANTED_AT` / `EXPIRES_AT` | `TIMESTAMP` | NOT NULL | **DB clock 기준**(§8.1). `EXPIRES_AT`이 판정 기준 |
| `REASON` | `VARCHAR(1000)` | NOT NULL | 필수. 공백만 거부 |
| `REVOKED_AT` / `REVOKED_BY` / `REVOKE_REASON` | `TIMESTAMP` / `VARCHAR(128)` / `VARCHAR(1000)` | NULL | 만료 자동표시는 `'SYSTEM'` / `'EXPIRED'` |
| `DRIVER_ID`(NOT NULL,128) / `HOST_SNAPSHOT` / `DATABASE_SNAPSHOT` | `VARCHAR(255)` | NULL | 부여 시점 스냅샷 3개 |

`PRIMARY KEY (USER_ID, PROJECT_ID, CONNECTION_ID)`. 추가 index `(PROJECT_ID, CONNECTION_ID)`(connection별 조회).
FK 없음(§5.5).

**스냅샷 3개의 목적(DECIDED).** connection id는 파일 key이므로 백업 복원이나 수동 편집으로 **같은 id가 다른 물리 DB에
재등장**할 수 있다. 판정 시 현재 container의 driver/host/database가 스냅샷과 다르면 `GRANT_STALE`로 DENY한다(§4-12).
비밀번호·사용자명은 저장하지 않는다.

### 5.2 `{table_prefix}DBAC_TW_HISTORY` — append-only 이력

current row가 덮어써져도 증적이 남도록 분리한다. column: `EVENT_ID VARCHAR(128)` PK, `GRANT_ID VARCHAR(128)`,
`CHANGE_TYPE VARCHAR(16)`(`GRANTED`/`REVOKED`/`EXPIRED`/`SUPERSEDED`), `CHANGE_TIME TIMESTAMP`(DB clock), key 3개,
`ACTOR_ID VARCHAR(128)`, `EXPIRES_AT TIMESTAMP`, `REASON VARCHAR(1000)`, `REVISION BIGINT`.
index `(USER_ID, CHANGE_TIME)`, `(PROJECT_ID, CONNECTION_ID, CHANGE_TIME)`. current row 변경과 history INSERT는
**하나의 metadata DB transaction**이다.

### 5.3 동시 grant/revoke — current-state + PK + optimistic CAS — DECIDED

초판의 "각각 revoke 후 INSERT, 마지막 commit이 승자"는 **오류였다.** READ COMMITTED에서 두 transaction은 서로의 uncommitted
INSERT를 볼 수 없어 active row가 2개 생길 수 있고, "유효 row 하나라도 있으면 ALLOW" 규칙과 결합하면 짧은 새 grant 뒤에 더 긴
과거 concurrent grant가 권한을 계속 유지시킨다. 다음으로 교체한다.

**구조:** current row는 PK로 key당 최대 1개(§5.1), 이력은 §5.2에 append하며 두 갱신은 한 transaction이다.
**갱신 절차(grant·revoke 공통, 한 transaction):**
1. `SELECT REVISION, GRANT_ID FROM DBAC_TW_CURRENT WHERE key` — 없으면 `observedRevision = 0`.
2. 요청 접수 시 기록해 둔 `observedRevisionAtRequestStart`와 1의 값이 다르면 **요청을 폐기**하고 `CONFLICT_SUPERSEDED`를
   반환한다(재시도하지 않는다). 이것이 "revoke commit 이후 지연된 grant가 뒤늦게 살아나는" 경로를 차단한다.
3. row가 없으면 `INSERT ... (REVISION=1)`, 있으면 `UPDATE ... SET ..., REVISION=REVISION+1 WHERE key AND REVISION=?`.
4. INSERT가 PK 위반이거나 UPDATE 영향 건수가 0이면 **다른 transaction이 선행한 것**이므로 1로 돌아가 재시도한다.
   재시도 한도 **3회**, 초과 시 요청을 실패시킨다(**fail-closed** — 부분 반영 금지, current row 불변).
5. history INSERT와 audit(§11)을 같은 transaction에서 수행한다.

**dialect 호환성:** `PRIMARY KEY`, `UPDATE ... WHERE REVISION=?`, PK 위반 감지만 쓰므로 H2·PostgreSQL에서 동일하게 동작한다
(`ON CONFLICT`, partial index, `MERGE`, `SELECT ... FOR UPDATE`, `SERIALIZABLE` 미사용). **단일 JVM lock을 쓰지 않아 다중
노드에서도 안전하다** — 직렬화는 DB의 PK와 row 수준 write 충돌이 담당한다. "코드베이스에 잠금 관행이 없다"는 초판의 근거는
폐기하며, 보안 invariant가 기존 관행보다 우선한다. **최종 상태 결정론:** 동시 grant 2건 중 하나만 성공하고 다른 하나는
2단계에서 폐기되거나 4단계 재시도 후 나중 값으로 수렴하며, current row는 **정확히 0개 또는 1개**이고 history에 전 과정이 남는다.

### 5.4 Migration version 충돌 회피 — DECIDED

**확정: fork 전용 `SQLSchemaConfig` + fork 전용 version table + fork 전용 `SQLSchemaVersionManager` 구현.**

근거(모두 STATIC VERIFIED): `InternalDB`가 `List<SQLSchemaConfig>`를 순회하며 config별 독립 schemaId·version·prefix·version
manager로 migration을 적용하고(`PLATFORM:InternalDB.java:49,55,128-153`, `getSchemaConfigList():211`), `SQLSchemaConfig`가
그 4가지를 모두 파라미터화한다. `CBDatabase`에 `List<SQLSchemaConfig>` public 생성자와 `appendSchemaConfig()`가 있어 CE
schema를 index 0에 고정하고(`CBDatabase.java:102,106-120`), CE 본체는 `SCHEMA_ID "CB_CE"` / `CURRENT_SCHEMA_VERSION 29`
(`:75-87`)이며 주입 지점은 `protected`(`EmbeddedSecurityControllerFactory.java:109`)다. script 탐색은
`prefix + version [+ "_" + dialectId] + ".sql"`이고 dialect 파일이 없으면 공통 파일로 fallback하며
(`PLATFORM:ClassLoaderScriptSource.java:50-84`), `updateSchema`는 하나의 `JDBCTransaction`이다
(`PLATFORM:SQLSchemaManager.java:101-145,167-192`). `CB_SCHEMA_INFO.MODULE_ID`는 `VARCHAR(10)`.

**`CBSchemaVersionManager` 재사용 금지 — 버그 2건(STATIC VERIFIED):** ① `getCurrentSchemaVersion`이 `MODULE_ID = ?`로 못
찾으면 **MODULE_ID 조건 없이** `SELECT VERSION FROM CB_SCHEMA_INFO`를 재시도해(`:41-47`) 신규 module이 CE의 29를 자기
version으로 오인하고, `tryGetVersion` 기본값이 **1**이어서(`:105-107`) 빈 schema 판정(`-1`)에 도달하지 못해 create script가
건너뛰어진다. ② `updateCurrentSchemaVersion`은 `CB_SCHEMA_INFO` row 수가 1이면 `UPDATE ... SET VERSION=?`을 **WHERE 절
없이** 실행해(`:86-95`) **CE의 schema version을 덮어쓴다.**

따라서 fork는 `CB_SCHEMA_INFO`를 **사용하지 않는다.** 확정 값: schemaId `CB_DBAC`, version table
`{table_prefix}DBAC_SCHEMA_INFO (MODULE_ID VARCHAR(64), VERSION INTEGER, UPDATE_TIME TIMESTAMP)`,
script `db/dbac_schema_create.sql` / `db/dbac_schema_update_`, 시작 version `1`, `schemaVersionObsolete = 0`.
version manager는 자체 구현하되 **row/table 없음 → 반드시 `-1` 반환**, 갱신은 항상 `WHERE MODULE_ID=?` 포함 UPSERT로 한다.
주입은 `EmbeddedSecurityControllerFactory`를 상속해 `makeDatabase`를 override하고 3-arg `CBDatabase` 생성자에 config를
전달하며 `CBApplicationCE.java:52,61,70`의 factory 생성만 교체한다(약 4줄). script는 `;`로 단순 분할되므로 문장 내부에
`;`를 쓰지 않고 `CREATE TABLE IF NOT EXISTS`를 선호한다.

### 5.5 FK 및 삭제 정책 — DECIDED

FK를 **걸지 않는다.** upstream migration이 실제로 테이블을 DROP한 전례가 있어(`cb_schema_update_17.sql`) fork FK가 upstream
migration을 실패시킬 수 있고, `GRANTED_BY`에 걸면 관리자 계정 삭제 시 감사 기록이 사라지거나 삭제가 막힌다. 삭제 시 row는
**유지**하고 판정으로 흡수한다: user 삭제·비활성은 §4-7/§4-9, project·connection 삭제는 §4-6, connection id 재등장은 §4-12로
DENY된다. project 삭제 시 일괄 revoke는 **위생 작업이며 보안 판정의 근거로 삼지 않는다.**

## 6. 내부 권한 판정 API

Java 코드는 작성하지 않는다. 책임만 확정한다.

| interface | 메서드(개념) / 책임 | 실패 시 |
|---|---|---|
| `DbAccessPolicyService` | `authorize(WriteAuthorizationRequest) → AuthorizationDecision`. 유일한 판정 진입점 — §4 규칙 + §9 상태 + §11 사전 audit | 예외를 삼키지 않고 DENY 결정으로 변환 |
| `TempWritePermissionService` | `grant`/`revoke`/`listActive`/`listHistory`. §7.2 guard + §7.1 검증 + §5.3 CAS + audit을 한 transaction으로 | 예외 전파(부분 반영 금지) |
| `TempWriteGrantRepository` | `findCurrent`/`upsertWithCas`/`appendHistory`/`listByUser`/`listByConnection`. SQL만, 정책 판단 없음 | `DBCException` 전파. **null 반환 금지** |
| `TransactionStateRegistry` | `get`/`markPendingWrite`/`markTainted`/`markBlocked`/`clearAfterRollback`/`clearAfterCommit`. §9 상태 머신 보관 | 상태 불명 → TAINTED 취급 |
| `AccessControlAuditService` | `recordBeforeExecution`/`recordOutcome`. §11 | §11의 이벤트별 정책 |
| `MetadataDbClock` | `now() → Instant`, `skewFromLocal() → Duration`. §8.1 시간 권위(테스트 주입) | 조회 실패 → DENY |

**`WriteAuthorizationRequest` 입력:** `userId`(필수, null이면 조회 전 DENY), `container`(`DBPDataSourceContainer`, 필수 —
**여기서 key를 뽑는다.** GraphQL 인자 사용 금지, §3.2), `operationCategory`(필수, §12.3), `statementType`(선택, SQL 경로만),
`executionContextId`(필수, §9 상태 조회용), `autoCommit`. **금지:** SQL 원문, parameter 값, credential, connection 접속정보.

**`AuthorizationDecision`:** `decision`(`ALLOW`/`DENY`), `denialReason`, `appliedGrantId`, `expiresAt`, `auditPayload`,
`userMessage`. boolean만 반환하지 않는다 — audit과 사용자 메시지가 같은 판정 결과에서 파생되어야 한다.
`denialReason` 코드값(DECIDED): `NO_GRANT`, `GRANT_EXPIRED`, `GRANT_REVOKED`, `GRANT_STALE`, `GRANT_SUPERSEDED`,
`USER_INACTIVE`, `CONNECTION_UNKNOWN`, `IDENTITY_MISSING`, `TRANSACTION_TAINTED`, `CONNECTION_BLOCKED`,
`PERMISSION_STORE_UNAVAILABLE`, `AUDIT_WRITE_FAILED`, `CLOCK_SKEW_EXCEEDED`, `CONFIGURATION_MODE`,
`STATEMENT_NOT_ALLOWLISTED`, `OPERATION_UNSUPPORTED`. `userMessage`에 내부 경로·stack trace·SQL 원문·secret을 넣지 않는다 —
`DBWebException.getExtensions()`가 stack trace를 응답에 포함시키므로(STATIC VERIFIED) 거부는 `DBWebExceptionAccessDenied`로
던지고 메시지를 짧게 유지한다.

## 7. Admin GraphQL API

| operation | input | output | idempotency | audit |
|---|---|---|---|---|
| `dbacGrantTempWrite` | `userId!`, `projectId!`, `connectionId!`, `durationMinutes!`, `reason!` | grant DTO | 아님. 매 호출 새 `GRANT_ID`(§5.3 CAS) | `TEMP_WRITE_GRANTED` |
| `dbacRevokeTempWrite` | `grantId!` 또는 `(userId!, projectId!, connectionId!)`, `reason` | 영향 건수 | **멱등.** 이미 revoked/없음 → 성공, 건수 0 | `TEMP_WRITE_REVOKED`(건수>0일 때만) |
| `dbacListActiveTempWrite` | `userId`, `projectId`, `connectionId` (선택 필터) | grant DTO 목록 | 읽기 | 없음 |
| `dbacListTempWriteHistory` | 위 + `from`, `to`, `limit!` | 이력 목록 | 읽기(`limit` 상한 강제) | 없음 |

`projectId`를 **필수**로 받아 §3.2의 부분 문자열 경로를 grant API에서 원천 차단하고, `durationMinutes`를 받아
**`EXPIRES_AT`은 서버가 DB clock 기준으로 계산**한다 — 클라이언트가 보낸 만료 시각은 신뢰하지 않는다(§8.1). DECIDED.

### 7.2 [필수] Configuration mode 우회 차단 — DECIDED

초판의 "`@WebAction(requirePermissions = PERMISSION_ADMIN)`만 선언하면 안전하다"와 "일반 사용자는 annotation 때문에 호출할 수
없다"는 **거짓이었다.** `WebServiceBindingBase.checkActionPermissions:305-354`(STATIC VERIFIED)에서 `:321`의
`if (!application.isConfigurationMode()) { ... }` 블록 **안에** `authRequired`(`:322-325`), `requirePermissions`
(`:340-345`), `requireGlobalPermissions`(`:347-352`) 검사가 모두 들어 있다. 즉 **configuration mode에서는 이 검사들이 전혀
실행되지 않고** `:317-320`의 session null 검사만 남아, 익명 세션 객체가 있으면 그대로 통과한다.

따라서 DBAC 관리 API 4종은 annotation과 **별개로** 서비스 구현 진입부에서 공통 guard `requireDbacAdmin(webSession)`을
호출한다. guard는 다음 순서로 검사하며 **하나라도 걸리면 DENY**한다:

① `application.isConfigurationMode()` → DENY (`CONFIGURATION_MODE`). ② `application.isInitializationMode()` → DENY.
③ `session == null` → DENY. ④ `!session.isAuthorizedInSecurityManager()` → DENY(익명 차단).
⑤ `!session.hasPermission(DBWConstants.PERMISSION_ADMIN)` → DENY.

annotation은 **방어선으로 유지하되 유일한 통제로 신뢰하지 않는다.** 정상 운영 상태(configuration mode 종료 후)에서만
ADMIN 검사를 통과해 허용된다. **enforcement(§4 write 판정)는 configuration mode에서도 비활성화되지 않는다** — 오히려
관리 API가 막혀 grant를 만들 수 없으므로 그 모드의 모든 write는 `NO_GRANT`로 DENY된다.

### 7.1 검증 규칙 — 모두 서버에서 강제

| 규칙 | 실패 시 |
|---|---|
| §7.2 guard 통과(configuration/initialization mode, 익명, 비-ADMIN 차단) | `DBWebExceptionAccessDenied` |
| **자기 자신에게 grant 금지**(§7.3) | `DBWebExceptionAccessDenied` |
| `userId` 존재 + `IS_ACTIVE='Y'`; `(projectId, connectionId)`가 registry에 실제 존재; `PROJECT_ID != 'anonymous'` | 거부. 유령 id 저장 방지 |
| `durationMinutes >= 1`(0·음수·과거 시점 거부) 및 `<= 상한` | 거부. **clamp하지 않는다** |
| `reason` trim 후 길이 1~1000; 필수 인자 누락 | 거부. 누락은 `getArgumentVal`로 예외(STATIC VERIFIED: `WebServiceBindingBase.java:180-186`) |

**상한 설정(DECIDED).** `app.resourceQuotas`에 fork 전용 키 `tempWriteMaxDurationMinutes`(기본 240),
`tempWriteDefaultDurationMinutes`(기본 60), `dbacMaxClockSkewSeconds`(기본 5)를 추가하고
`getAppConfiguration().getResourceQuota(key)`로 읽는다(STATIC VERIFIED: `CBAppConfig.java:221,229`). **값이 없거나
0/음수/파싱 실패면 "무제한"이 아니라 코드 상수로 강제한다.** upstream Java 수정 0이며 conf 템플릿에만 항목을 추가한다.
`resourceQuotas`는 GraphQL 입력 매핑에 없어 변조 표면이 가장 작다. **feature flag**는 관리 API 노출에만 쓰고
**enforcement 자체는 감싸지 않는다** — `enabledFeatures`는 런타임 변경 가능하고 configuration mode에서 검사가 skip되므로
enforcement를 끄는 스위치가 생기면 fail-closed가 깨진다.

### 7.3 자기 권한 상승 방지 — DECIDED

**ADMIN이 자기 자신에게 grant하는 것을 금지한다** — `grantor.getUserId().equals(targetUserId)`이면 `isDistributed()` 여부와
무관하게 거부한다. 기존 선례가 자기 권한 편집을 금지하는 방향이며(STATIC VERIFIED: `WebServiceAdmin.java:194-196`,
`:296-300`/`:317-321`, `:407-409`) 그 선례 중 일부의 `!isDistributed()` 조건부 결함은 **복제하지 않는다.** 반면 **revoke는
자기 자신 대상도 허용한다**(권한 축소 방향, audit에는 남긴다). 이 금지 때문에 ADMIN 계정 **2개 이상**이 배포 조건이다.

## 8. 시간 권위·Clock Skew·동시성

### 8.1 [정정] 시간 권위 = metadata DB clock 단일 domain — DECIDED

초판은 application clock을 권위로 삼고 "clock skew는 만료 방향으로만 보수적으로 해석"이라고 썼으나 **계산 규칙이 없어
구현 불가능**했고, 노드 A의 시계가 느리면 만료된 grant가 계속 유효해지는 결함이 있었다. 다음으로 교체한다.

**규칙:** grant 발급과 authorization 판정이 **동일한 clock domain(metadata DB)**을 쓴다. 따라서 application 노드 간
skew는 판정에 영향을 주지 않는다.

* **grant 시각:** grant transaction 내에서 `SELECT CURRENT_TIMESTAMP`로 `dbNow`를 **한 번만** 읽어
  `GRANTED_AT = dbNow`, `EXPIRES_AT = dbNow + durationMinutes`(Java 계산)를 쓰고 history에도 같은 값을 쓴다.
  `CURRENT_TIMESTAMP + INTERVAL` 같은 dialect 구문을 쓰지 않으므로 H2·PostgreSQL 공통이다.
* **authorization 판정:** §4의 SQL처럼 `EXPIRES_AT > CURRENT_TIMESTAMP`를 **SQL 안에서** 비교한다(Java 시각 주입 금지).
  배타적이므로 `EXPIRES_AT == CURRENT_TIMESTAMP`는 DENY다.
* **UTC:** 두 값 모두 metadata DB의 `CURRENT_TIMESTAMP`에서 나와 domain이 일치한다. 표시·API 응답용으로만 UTC `Instant`로
  변환하고, 배포 조건으로 metadata DB 서버 timezone을 UTC로 고정한다.

**application clock의 잔여 사용과 skew guard.** enforcement 코드가 로그·타임아웃 등에 로컬 시각을 쓰므로, 노드가 DB와
심하게 어긋난 상태로 동작하는 것을 막기 위해 다음을 둔다.

```
skew = |localNow - dbNow|
if (skew > dbacMaxClockSkewSeconds)  →  write authorization DENY (CLOCK_SKEW_EXCEEDED)
```

`dbNow`는 authorization 시 이미 읽는 값을 재사용하므로 추가 왕복이 없다. 설정값이 없거나 비정상이면 기본 **5초**를 쓴다
(fail-closed: 설정 누락이 검사 비활성화를 뜻하지 않는다). read operation은 이 검사의 영향을 받지 않는다.
**테스트 가능성:** `MetadataDbClock`을 인터페이스로 두어 `dbNow`를 제어하고, 서로 다른 노드에서 grant와 authorization을
수행하는 시나리오(§13 I13)를 검증한다.

### 8.2 Linearization 및 "즉시 revoke"의 의미 — DECIDED

metadata DB의 권한 변경과 대상 DB의 write는 **하나의 transaction으로 묶을 수 없다.** grant/revoke의 linearization point는
각 transaction이 metadata DB에 commit된 시점이고, write authorization의 point는 §4 판정 SELECT를 수행한 시점이다.
실현 불가능한 원자성을 약속하지 않는다: revoke commit **이전에** authorize를 통과해 이미 DB로 전송된 operation은
**중단을 보장하지 않는다.** 반면 revoke commit **이후** authorize되는 모든 operation은 **DENY가 보장**되며(cache가 없어 다음
판정이 곧 최신 상태) 기존 세션·다른 tab의 다음 operation도 재로그인·reconnect 없이 DENY된다. 미커밋 변경은 **COMMIT되지
않음이 보장**된다(§9). 즉 보장하는 것은 "실행 중 문장의 즉시 중단"이 아니라 **"revoke 이후 새 write가 없고 미커밋 변경이
영구화되지 않음"**이다. grant/revoke 동시 실행의 최종 상태는 §5.3의 CAS로 결정론적이며 revoke는 멱등이다(재호출 성공 +
건수 0, audit은 건수>0일 때만).

## 9. Transaction 권한 상태 머신

초판의 `boolean tainted` 모델은 **폐기한다.** 그 모델은 "유효한 grant로 실행된 정상 미커밋 write"와 "commit하면 안 되는 상태"를
구분하지 못해, 첫 write 직후 taint하면 같은 grant의 두 번째 write까지 막고 taint하지 않으면 재부여된 새 grant로 과거
transaction을 commit할 수 있었다.

### 9.1 상태와 provenance

| 상태 | 의미 |
|---|---|
| `CLEAN` | 미커밋 write 없음 |
| `PENDING_WRITE` | 유효한 grant로 실행된 미커밋 write 존재 |
| `TAINTED` | PENDING_WRITE에 쓰인 grant가 만료·revoke·교체되었거나 판정 불가 |
| `BLOCKED` | rollback 또는 connection 무효화 실패로 재사용 금지 |

상태 key는 `DBCExecutionContext.getContextId()`다. 한 세션의 모든 editor tab이 하나의 JDBC connection과 transaction을
공유하므로(STATIC VERIFIED: `WebSQLProcessor.java:132-134`, `WebSQLContextInfo.java:305`) **동일 physical context를 쓰는 모든
tab이 같은 상태를 공유**한다. `WebSQLContextInfo`(tab 단위)를 key로 쓰면 다른 tab이 우회하고, `WebSQLProcessor`를 쓰면 close
listener로 제거·재생성될 때 상태가 소실되어 fail-open이 된다. `PENDING_WRITE`가 보관하는 provenance: `userId`,
`projectId`, `connectionId`, `executionContextId`, **`originalGrantId`**, `originalGrantExpiresAt`,
`firstWriteAllowedAt`, `lastWriteAllowedAt`.

### 9.2 전이 규칙 — DECIDED

| 현재 | 사건 | 다음 | 비고 |
|---|---|---|---|
| CLEAN | `autoCommit=false`에서 write ALLOW | PENDING_WRITE | provenance 기록 |
| PENDING_WRITE | write 요청, current row의 `GRANT_ID == originalGrantId`이고 여전히 유효 | PENDING_WRITE | **허용.** `lastWriteAllowedAt` 갱신 |
| PENDING_WRITE | grant 만료·revoke·**교체**(`GRANT_ID != originalGrantId`)·조회 실패 | TAINTED | 즉시 강제 rollback 시도 |
| PENDING_WRITE | COMMIT 요청 | `originalGrantId`를 **재조회**해 동일 grant가 현재도 유효할 때만 허용 → CLEAN | 불일치·만료 시 `GRANT_SUPERSEDED`로 DENY 후 TAINTED |
| PENDING_WRITE / TAINTED | rollback 성공 | CLEAN | |
| PENDING_WRITE / TAINTED | rollback 실패 | BLOCKED | §9.4 |
| TAINTED | 새 write / COMMIT / `setAutoCommit(true)` | TAINTED (DENY) | rollback만 허용 |
| BLOCKED | 모든 operation(read 포함) | BLOCKED (DENY) | |
| TAINTED / BLOCKED | reconnect 또는 TEMP_WRITE 재부여 | **변화 없음** | 해제는 rollback 성공으로만 |

**핵심 invariant:** 새 grant가 존재하더라도 `originalGrantId`와 다르면 과거 transaction의 commit을 허용하지 않는다.
이것이 "만료 후 재부여로 과거 변경이 살아나는" 경로를 막는다.

### 9.3 부수 결정 — DECIDED

* **write 실행 실패:** PENDING_WRITE를 **유지**한다(부분 실행 가능성 배제 불가). **autocommit 조회 실패:** 수동 커밋으로
  간주해 PENDING_WRITE로 전이한다(안전 방향). **TAINTED의 read:** 허용한다(BLOCKED는 read도 거부).
* **context invalidation:** 상태를 폐기하지 않는다. TAINTED/BLOCKED는 세션 단위 `blocked` 표시로 승격해 재접속 이후까지
  유지하며, 새 context id는 CLEAN으로 시작하되 세션 `blocked`가 있으면 그 connection은 계속 DENY다.
* **session 종료:** registry를 정리하되 정리 전에 PENDING_WRITE/TAINTED이면 rollback을 시도하고 실패 시 BLOCKED로 기록한다.

### 9.4 rollback 실패 처리 — DECIDED

① `TRANSACTION_ROLLBACK_FAILED` audit 기록(실패해도 다음 단계를 막지 않는다, §11). ②
`DBCExecutionContext.invalidateContext(monitor)`로 커넥션 무효화(STATIC VERIFIED:
`PLATFORM:DBCExecutionContext.java:101,109-112`), 필요하면 데이터소스 연결을 끊어 DB 측 rollback 유도. ③ 그래도 실패하면
BLOCKED로 전이하고 세션 단위 `blocked` 표시를 세워 이후 모든 operation(read 포함)을 `CONNECTION_BLOCKED`으로 DENY한다 —
재접속해도 유지되며 커넥션을 재사용하지 않는다. **Blast radius:** 강제 rollback/종료는 그 세션에서 해당 connection을 쓰는
**모든 tab**의 미커밋 작업을 없애고 result set을 무효화하지만, 세션 단위이므로 **다른 사용자에게는 영향이 없다.**

### 9.5 우회 차단

Import·Data Editor·DDL은 §12.3 category로 동일한 `authorize()`를 통과하므로 TAINTED/BLOCKED에서 동일하게 차단된다. Import는
"task 생성 → 업로드 시 실행" 2단계이므로 **실행 시점에 재판정**한다(Phase 1 §E10). QM 통계는 상태 판정에 쓰지 않고 audit
부가 정보로만 쓴다. 기존 결함 주의: `WebSQLContextInfo.java:248-249`가 `QMUtils.getCurrentConnection`의 null을 검사하지 않아
NPE가 가능하므로(STATIC VERIFIED) 재사용 시 null-safe로 감싼다.

## 10. Fail-Closed 오류 정책

write authorization은 다음 모두에서 **DENY**한다: metadata DB 연결 실패(`PERMISSION_STORE_UNAVAILABLE`), permission query
timeout, parser 실패, operation·category 미매핑(`OPERATION_UNSUPPORTED`), user identity 부재(`IDENTITY_MISSING`),
connection resolve 실패(`CONNECTION_UNKNOWN`), **필수 ALLOW audit 저장 실패**(`AUDIT_WRITE_FAILED`, §11), clock skew
초과(`CLOCK_SKEW_EXCEEDED`, §8.1), configuration/initialization mode의 관리 API 호출(`CONFIGURATION_MODE`, §7.2).
rollback 실패는 §9.4로 처리하고 커넥션을 재사용하지 않으며, grant/revoke 저장 충돌은 §5.3 CAS로 처리하고 재시도 한도
초과 시 요청을 실패시킨다(부분 반영 금지).

read operation은 metadata DB 장애·audit 실패·clock skew에 영향받지 않는다(허용) — READ_ONLY가 기본 상태이고 read 허용에
grant 조회가 필요 없기 때문이다. 장애 시 시스템은 **전체 READ_ONLY로 축퇴한다**(의도된 설계). 단 §9.4로 `blocked` 표시된
커넥션은 read도 DENY한다. DECIDED.

## 11. Audit 정책 — Fail-Closed

**기록 위치(DECIDED): metadata DB의 `DBAC_AUDIT_EVENT`.** 서버 로그는 보조 채널이다. QM은 재사용하지 않는다(STATIC
VERIFIED): `QMExecutionHandler`에 권한 이벤트를 표현할 메서드가 없어 확장하려면 platform 수정이 필요하고(CLAUDE.md §28),
CE 저장소는 in-memory ring buffer이며 파일 로그는 기본 비활성이다. `logback.xml`도 ConsoleAppender 하나뿐이다.

### 11.1 [정정] ALLOW audit은 대상 DB 실행 **이전**에 기록한다 — DECIDED

초판은 "audit 실패를 이유로 WRITE를 허용하지 않는다"와 "`WRITE_ALLOWED` 저장 실패는 log.error 격하 후 계속 허용"을 동시에
기술한 **자기모순**이었다. 다음으로 확정한다.

* `WRITE_ALLOWED`는 **대상 DB 실행 이전에** 기록한다. 저장이 실패하면 대상 DB write를 실행하지 않고 `AUDIT_WRITE_FAILED`로
  **DENY**하며, 이때 **JDBC statement 실행 횟수는 0**이어야 한다.
* audit event의 의미는 "DB 변경이 성공했다"가 아니라 **"서버가 실행을 허가한 시도"**다. 실제 실행 성공·실패가 필요하면 별도
  **outcome event**(`WRITE_EXECUTED` / `WRITE_FAILED`)로 분리하고, 그 저장 실패는 이미 실행된 write를 되돌리지 않으므로
  `log.error` 격하한다.
* **고빈도라는 이유로 fail-open을 허용하지 않는다.** 성능 문제는 metadata DB batch·index로 풀고 정책을 바꾸지 않는다.

### 11.2 이벤트별 실패 정책

| event | 기록 시점 | 저장 실패 시 |
|---|---|---|
| `WRITE_ALLOWED` | 대상 DB 실행 **이전** | **DENY** (`AUDIT_WRITE_FAILED`). JDBC 실행 0회 |
| `WRITE_EXECUTED` / `WRITE_FAILED` | 실행 직후(outcome) | `log.error` 격하. 이미 실행된 결과를 되돌리지 않음 |
| `WRITE_DENIED` / `COMMIT_DENIED` | 판정 DENY 직후 | `log.warn` 격하. **이미 차단된 요청을 다시 허용하지 않는다** |
| `TEMP_WRITE_GRANTED` / `TEMP_WRITE_REVOKED` | grant·revoke와 **같은 transaction** | **해당 조작 전체 rollback**(감사 없는 권한 부여·회수 금지) |
| `TEMP_WRITE_EXPIRED` | §11.3 | `log.warn` 격하 |
| `TRANSACTION_ROLLED_BACK` | 강제 rollback 성공 | `log.warn` 격하 |
| `TRANSACTION_ROLLBACK_FAILED` | rollback 실패 | `log.error` 격하. **BLOCKED 전이를 막지 않는다** |

`DBAC_AUDIT_EVENT` column: `EVENT_ID VARCHAR(128)` PK, `EVENT_TYPE VARCHAR(32)`, `EVENT_TIME TIMESTAMP`(DB clock),
`USER_ID`/`ACTOR_ID VARCHAR(128)`, `PROJECT_ID`/`CONNECTION_ID VARCHAR(255)`, `GRANT_ID VARCHAR(128)`,
`OPERATION_CATEGORY VARCHAR(32)`, `STATEMENT_TYPE VARCHAR(32)`(**분류 enum만, SQL 원문 금지**), `DECISION VARCHAR(16)`,
`DENIAL_REASON VARCHAR(64)`, `EXPIRES_AT TIMESTAMP`, `DETAIL TEXT`(민감정보 제외).
index `(EVENT_TIME)`, `(USER_ID, EVENT_TIME)`, `(PROJECT_ID, CONNECTION_ID, EVENT_TIME)`.

**기록 금지(DECIDED):** SQL 원문, SQL parameter 값, DB password, CloudBeaver password, JWT, session token, API token,
connection secret, SSH secret, SSL private key, connection host/user 등 접속정보. audit 조회 API는 ADMIN 전용이며
노출 시 `CBConstants.SECURED_VALUE("******")` 마스킹 관례를 재사용한다. 사용자 통지는
`WebSession.addWarningMessage`를 쓰되(STATIC VERIFIED) 사용자가 지울 수 있는 in-memory 목록이므로 증적으로 겸용하지 않는다.

### 11.3 `TEMP_WRITE_EXPIRED` 중복 억제 — DECIDED

scheduler가 없으므로 만료는 판정 시점에 발견되며 매 요청마다 기록되면 안 된다. 만료 발견 시 §5.3의 CAS로
`REVOKED_AT = EXPIRES_AT`, `REVOKED_BY = 'SYSTEM'`, `REVOKE_REASON = 'EXPIRED'`를 기록하고 **CAS가 성공한 요청만**
`TEMP_WRITE_EXPIRED`와 history를 남겨 grant당 정확히 1건을 보장한다. 이 갱신은 판정 결과를 바꾸지 않으며(만료는 이미 DENY)
실패해도 DENY는 유지된다. scheduler는 판정 근거로 쓰지 않는다.

## 12. Phase 3 전달 계약

### 12.1 신규 bundle 구성 — `io.cloudbeaver.service.dbac`

기존 admin bundle을 1:1로 복제한다(STATIC VERIFIED). **upstream 파일 수정은 `server/bundles/pom.xml` 1줄 +
`server/features/io.cloudbeaver.server.feature/feature.xml` 1줄뿐이다.** 구성: `pom.xml` / `META-INF/MANIFEST.MF` /
`plugin.xml`(빌드 편입 + `io.cloudbeaver.service` extension에 binding 등록), `build.properties`(`bin.includes`에 `.`,
`META-INF/`, `schema/`, `db/`, `plugin.xml` — **`schema/` 누락 시 GraphQL 확장이 조용히 사라진다**,
`GraphQLEndpoint`가 warn만 남김), `schema/service.dbac.graphqls`, `DBWServiceDbacAdmin`(annotation 선언),
`impl/WebServiceDbacAdmin`(§7.2 guard + §7.1 검증 + audit), `WebServiceBindingDbacAdmin`, §6의 6개 service/repository,
`DbacSchemaConfig` / `DbacSchemaVersionManager` / `db/dbac_schema_*.sql`(§5.4), `DbacConstants`(quota 키 —
upstream `WebSQLConstants`를 수정하지 않는다).

### 12.2 저장소 구현 관행 (STATIC VERIFIED 기반)

커넥션은 반드시 `CBDatabase.openConnection()`으로 얻는다 — `dataSource.getConnection()`을 직접 쓰면 `{table_prefix}` 치환이
사라진다. 쓰기는 `JDBCTransaction`으로 감싸되 `close()`가 rollback을 하지 않으므로
`catch (Exception e) { txn.rollback(); throw e; }`를 명시한다. 조회 실패 시 **null을 반환하지 않고** 예외를 올려 §10에서 DENY로
변환한다. SQL에 `{table_prefix}`를 직접 기입하고 LIMIT/OFFSET은 `getDialect().getOffsetLimitQueryPart(...)`, IN 절은
`SQLUtils.generateParamList(n)`을 쓰며 H2와 PostgreSQL **공통 문법만** 사용한다.

### 12.3 `authorize()`가 호출되어야 하는 operation category

Phase 1의 enforcement 지점 표를 복사하지 않고 category만 정의한다. `SQL_STATEMENT`(분류 결과 동반),
`DATA_EDITOR_MUTATION`(typed), `DDL_OBJECT_CHANGE`(typed), `DATA_IMPORT`(**실행 시점 재판정**), `EXPLAIN_PLAN`(`ANALYZE`
계열은 write 취급), `TRANSACTION_COMMIT`, `TRANSACTION_AUTOCOMMIT_ON` — 이상 7개는 판정 필요하며,
`TRANSACTION_ROLLBACK`은 **판정하지 않고 항상 허용**한다.

### 12.4 제약

dependency 방향은 신규 bundle → (`io.cloudbeaver.model`, `io.cloudbeaver.service.security`, platform)이고 역방향은 금지한다.
upstream 수정은 enforcement 호출 삽입 + `CBApplicationCE.java` factory 교체 + `pom.xml`/`feature.xml` 각 1줄 + conf 템플릿으로
제한하며 **DBeaver platform 수정은 금지**한다. 지원 DBMS는 PostgreSQL·MySQL만이고 그 외는 fail-closed로 write DENY한다.
permission cache는 Phase 3 초기 구현에서 도입 금지, `DataSourceDescriptor.setConnectionReadOnly`는 enforcement 수단으로
쓰지 않는다(Phase 1 D10 — 보조 방어선).

## 13. Phase 3 테스트 요구사항

테스트 코드는 작성하지 않는다. 목록과 성공 기준만 확정한다.

**U — 단위(DBMS 불필요)**
- **U1** §4의 13개 상황 전수: 판정과 `denialReason` 일치. **U2** 만료 경계: `EXPIRES_AT == now` → DENY, `+1ms` → ALLOW.
  **U3** `MetadataDbClock` 주입으로 만료 전/후 결정론적 재현. **U4** grant 기간: 0·음수·상한 초과·비정상 timestamp 거부.
  **U5** `reason`: 빈 값·공백만·길이 초과 거부. **U6** quota 미설정 시 코드 기본값 적용(기간 60분, skew 5초).
- **U7** 상태 머신 §9.2 전이 전수: 각 (상태, 사건) 쌍이 표와 일치. **U8** 같은 `originalGrantId`로 두 번째 write ALLOW.
  **U9** `GRANT_ID` 교체 후 COMMIT → `GRANT_SUPERSEDED` DENY. **U10** reconnect·재부여가 TAINTED/BLOCKED를 해제하지 않음.
- **U11** audit 직렬화에 SQL 원문·credential 부재. **U12** `TEMP_WRITE_EXPIRED`가 반복 판정에도 grant당 1건.
  **U13** 스냅샷 불일치 시 `GRANT_STALE`. **U14** `userId==null`·`PROJECT_ID='anonymous'` 모두 DENY.
  **U15** CAS 재시도 한도(3회) 초과 시 요청 실패 + current row 불변. **U16** skew 계산식(§8.1)이 임계값 경계에서 정확.

**I — 통합(metadata DB + throwaway 대상 DB)**
- **I1** userA+dbA ALLOW. **I2** userA+dbB DENY(connection 격리). **I3** userB+dbA DENY(user 격리).
  **I4** 만료 전 ALLOW, 만료 후 **동일 세션에서** DENY(재로그인·reconnect 없음).
- **I5** revoke 후 기존 세션 DENY. **I6** revoke 후 두 번째 tab DENY. **I7** metadata DB 장애: write DENY, **read는 정상**.
  **I8** project 이동/삭제 시 자동 DENY. **I9** schema migration: fork module이 `DBAC_SCHEMA_INFO`에만 기록하고
  **`CB_SCHEMA_INFO`의 CE version 29 불변**.
- **I10** 두 ADMIN이 같은 key에 **서로 다른 기간으로 동시 grant** → current row 정확히 1개, history 2건, 결정론적.
  **I11** grant와 revoke 동시 실행 → current row 0 또는 1개, 이력·audit이 current state와 모순 없음.
- **I12** **revoke commit 이후 지연된 grant transaction commit** → `CONFLICT_SUPERSEDED`로 폐기, 과거 grant가 살아나지 않음.
  **I13** 서로 다른 application 노드에서 grant와 authorization 수행(노드 로컬 시계를 인위적으로 어긋나게) → 판정이 DB clock
  기준으로 일치하고, skew 초과 노드는 `CLOCK_SKEW_EXCEEDED` DENY.

**S — 보안**
- **S1** 일반 사용자의 grant mutation 직접 호출: `Access denied`(자신·타인 모두). **S2** 일반 사용자의 revoke/expiry 변경 거부.
  **S3** ADMIN의 자기 자신 grant 거부(§7.3). **S4** ADMIN이 grant 없이 write: DENY.
- **S5** 유효기간 중 UPDATE → 만료 → COMMIT: COMMIT DENY **및 강제 rollback**, 원본 유지. **S6** 위 상태에서
  `setAutoCommit(true)`: DENY. **S7** 다른 tab의 COMMIT: DENY. **S8** 만료 후 **재부여** → 과거 transaction COMMIT:
  **`GRANT_SUPERSEDED` DENY**(과거 변경이 살아나지 않음). **S9** rollback 실패 주입: BLOCKED + 재접속 후에도 DENY.
- **S10** Import 2단계 우회: **실행 시점 DENY**, 대상 불변. **S11** 클라이언트가 보낸 만료 시각 무시, 서버 DB clock 계산값 사용.
  **S12** `projectId` 생략 + `connectionId` 부분 문자열 전달 → 권한 없는 connection에 write 불가(§3.2).
  **S13** audit 민감정보: QA.md §42 목록이 저장·로그·응답에 부재.
- **S14 (configuration mode)** ① 익명 session의 직접 GraphQL `dbacGrantTempWrite` 호출 → DENY. ② 일반 session의
  grant/revoke/list 호출 → DENY. ③ 그 모드에서 TEMP_WRITE enforcement 우회 시도 → DENY(write 불가). ④ 정상 mode 복귀 후
  ADMIN만 관리 API 사용 가능.
- **S15 (audit fail-closed)** ① `WRITE_ALLOWED` 저장 실패 주입 → **대상 DB JDBC 실행 0회**. ② grant audit 실패 → current row
  생성 안 됨. ③ revoke audit 실패 → revoke transaction 전체 rollback. ④ DENY audit 실패 → 요청은 계속 DENY.
  ⑤ rollback failure audit 실패 → connection은 계속 BLOCKED.

성공 판정: I1~I13 + S1~S15 전부 통과. 하나라도 실패하면 Phase 3 미완료로 본다.

## 14. 미해결 사항

Phase 3 착수를 막지 않는다. 모두 보수적 기본값으로 흡수했다.

| # | 항목 | 흡수 방법 (모두 NOT VERIFIED) |
|---|---|---|
| M1 | 3-arg `CBDatabase` 생성자 경로가 CE 런타임에서 실제 동작하는지 | I9가 최초 검증 지점. 실패 시 fork 초기화 시 `SQLSchemaManager` 직접 호출 |
| M2 / M5 | `DBCExecutionContext.getContextId()`가 transaction 수명과 1:1인지; `invalidateContext` 실패 시 커넥션 실제 상태 | §9.3 invalidation 규칙 + §9.4 BLOCKED·세션 `blocked` 승격으로 흡수 |
| M3 | H2·PostgreSQL `CURRENT_TIMESTAMP` 정밀도·timezone 취급 차이 | 비교를 배타적(`>`)으로 정의, DB 서버 timezone UTC 고정을 배포 조건화, I13에서 검증 |
| M4 | CAS 재시도 3회가 실사용 경합에서 충분한지 | 초과 시 fail-closed(요청 실패). U15로 경계 검증 후 Phase 3에서 조정 |

## 15. 수정된 파일

**프로덕션 Java·GraphQL schema·DB migration·frontend 수정 0건. `PLAN.md`/Phase 1 문서/`docs/db-mutation-surface.md`/`.omx/`
수정 0건. commit 0건. Phase 3 구현 0건.** 유일한 변경은 본 문서
`docs/db-access-control-phase2-permission-model.md`의 **개정**이다. `docs/db-mutation-surface.md`는 이번 작업에서도 읽지
않았다(크기 155,689 bytes 불변).

## 16. Git 상태

```
Branch: devel / HEAD: 3844792b84052f9eabf92326273b5bed250d4879
git status --short: "?? .omx/", "?? docs/" 두 항목만 / git diff, git diff --cached: 비어 있음 (tracked 수정 0건)
```

working tree는 untracked `.omx/`와 `docs/`가 있으므로 **clean이 아니다.** tracked 파일 기준으로는 변경이 없다.
**실행한 명령:** `git rev-parse`, `git status --short`, `git diff --stat`, 본문 인용 파일의 읽기·검색.
**실행하지 않은 명령:** build, 전체 test, migration 실행, 서버 기동, DBMS 접속 — 어떤 DBMS도 검증되었다고 주장하지 않는다.

## 17. 다음 작업

Phase 3 권고 순서: ① `db/dbac_schema_*.sql`(두 테이블 + audit) + `DbacSchemaVersionManager` + config 주입 후 **I9를 가장 먼저**
통과시켜 M1 조기 해소. ② `TempWriteGrantRepository` CAS와 U15·I10~I12. ③ `DbAccessPolicyService` + §8.1 시간 규칙과
U1~U6·U16·I13. ④ `TransactionStateRegistry` 상태 머신과 U7~U10·S5~S9. ⑤ audit fail-closed와 S15. ⑥ admin GraphQL + §7.2
guard와 S1~S3·S14. ⑦ enforcement 배선(Phase 1 §5의 16개 gate)과 S10·S12.
각 단계 완료 후 CLAUDE.md §27 Step 10에 따라 별도 `qa` subagent에 독립 검증을 위임한다.

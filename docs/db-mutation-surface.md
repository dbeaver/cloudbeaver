# DB Mutation Surface Analysis

CloudBeaver CE fork — 운영 DB 접근통제 기능 Phase 0~1 분석 결과

| 항목 | 값 |
| --- | --- |
| 최초 작성 | 2026-08-14 |
| 재검증(2차) | 2026-08-14 — 이전 분석을 독립적으로 재확인, 오류 3건 정정 |
| 재검증(3차) | 2026-08-14 — `updateConnection` 방어 확인(**DISPROVED**), context transaction lifecycle, grouping 주입 벡터, enforcement matrix 재작성 |
| 재검증(4차) | 2026-08-14 — 중앙 분류 위치 실행 단위 확정(§3A), 제어 명령 보안 영향(§3B), `closeConnection` commit **DISPROVED**(§6C.5), grouping allowlist **REQUIRED**(§6D.5), classifier 한계(§5A), parser 테스트 단계 구분(§15.1) |
| 재검증(5차) | 2026-08-14 — **일반 GraphQL 입력이 단일 `SQLQuery`에 복수 statement를 담을 수 있음 확인(§3C)** — "AI가 유일한 multi-statement 진입점" **DISPROVED**; `getScriptElements()`만으로 분해 불가 → C1-a는 `parseScript` 필요; query transformer 신뢰 경계(§4A); parameter 치환 후 재분해 필수; characterization test harness **BLOCKED** 확정 |
| Repository | `D:\IdeaProjects\cloudbeaver` (fork of `dbeaver/cloudbeaver`) |
| Branch | `devel` |
| Commit | `3844792b84052f9eabf92326273b5bed250d4879` |
| Product version | CloudBeaver CE 26.2.0-SNAPSHOT |
| Platform deps | `dbeaver` @ `1e5ee10`, `dbeaver-common` (shallow clone, depth 1) |

## 검증 상태 선언

```text
Phase 0: BLOCKED / INCOMPLETE
Phase 1: Static analysis completed, runtime verification incomplete
Ready for Phase 2: NO
```

> **이 문서의 모든 결론은 정적 코드 분석 결과이다.**
> 실행 중인 CloudBeaver 인스턴스나 실제 DB를 사용한 런타임 검증은 **한 건도 수행하지 않았다.**
> 각 주장에는 다음 상태 라벨을 붙였다.
>
> | 라벨 | 의미 |
> | --- | --- |
> | `STATIC VERIFIED` | 해당 코드를 직접 읽고 확인함. 런타임 미검증 |
> | `RUNTIME VERIFIED` | 실행 결과로 확인함 — **이 문서에 해당 항목은 0건** |
> | `NOT VERIFIED` | 확인하지 못했거나 런타임 확인이 필요함 |
> | `DISPROVED` | 이전 주장이 코드로 반증됨 |
>
> 3차 재검증 이전에 사용한 `CONFIRMED BY STATIC CODE` 는 `STATIC VERIFIED` 와 동일한 의미이며,
> `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED` 는 "코드 경로는 `STATIC VERIFIED`,
> 실제 동작은 `NOT VERIFIED`" 로 읽는다. 이력 보존을 위해 기존 표기를 남겨 두었다.

---

## 1. Architecture Overview

CloudBeaver 서버는 DBeaver Platform을 OSGi 번들로 임베드한 headless 애플리케이션이다.
사용자 요청은 단일 GraphQL 엔드포인트로 들어와 서비스 계층을 거쳐
DBeaver Platform의 `DBCSession` / `DBCStatement` 추상화로 내려간 뒤 JDBC 드라이버에 도달한다.

```text
Browser (React)
     │  GraphQL over HTTP
     ▼
GraphQLEndpoint                       io.cloudbeaver.server.graphql
     │  DataFetcher 바인딩 (권한 래퍼 없음 — CONFIRMED BY STATIC CODE)
     ▼
┌──────────────────────────────────────────────────────────┐
│ CloudBeaver Service 계층  ← 서버측 권한 검사가 존재하는 유일한 계층 │
│  WebServiceSQL / WebServiceNavigator / WebServiceDataTransfer │
└──────────────────────────────────────────────────────────┘
     │
     ▼
WebSQLProcessor / WebSQLContextInfo
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ DBeaver Platform — 서로 다른 4개 추상화로 분기             │
│  DBCStatement.executeStatement()      (SQL Editor)       │
│  DBSDataManipulator.ExecuteBatch      (Data Editor)      │
│  DatabaseTransferConsumer             (Import)           │
│  DBEPersistAction / DBECommandContext (DDL)              │
└──────────────────────────────────────────────────────────┘
     │
     ▼
JDBC Driver  →  DB
```

### 세션 격리 구조

`WebSessionProjectImpl.createDataSourceRegistry()`
(`server/bundles/io.cloudbeaver.model/src/io/cloudbeaver/WebSessionProjectImpl.java:122-132`)
는 WebSession 마다 독립적인 `DataSourceRegistry` 를 생성한다.

```java
protected DBPDataSourceRegistry createDataSourceRegistry() {
    return createRegistryWithCredentialsProvider();   // → new DataSourceRegistryRM<>(this, ...)
}
```

→ 동일한 공유 Connection이라도 **세션마다 별도의 `DataSourceDescriptor` 인스턴스**를 가진다.
`CONFIRMED BY STATIC CODE`

이는 `User + Connection` 단위 권한 모델의 기술적 근거가 된다.
다만 `DataSourceDescriptor` 상태를 직접 변경하는 방식은 §8 Option C에서 별도로 위험을 평가한다.

---

## 2. Mutation Surface

### 2.1 요약 표

경로 표기: `server/bundles/io.cloudbeaver.server/src/io/cloudbeaver/service/...` 는 `CB:` 로 축약.
DBeaver Platform은 `DBV:` 로 축약.

| # | 기능 | GraphQL | Backend 진입점 | DB 실행 지점 | 기존 서버측 권한 검사 |
| --- | --- | --- | --- | --- | --- |
| 1 | SQL Editor 실행 | `asyncSqlExecuteQuery` | `CB:sql/impl/WebServiceSQL.java:594` `asyncExecuteQuery` | `CB:sql/WebSQLProcessor.java:294` `dbStat.executeStatement()` | `PERMISSION_EXECUTE_SCRIPTS` (`:608`) — 전부 허용 or 전부 차단 |
| 2 | Data Editor 저장 | `asyncUpdateResultsDataBatch` / `updateResultsDataBatch` | `WebServiceSQL.java:509` (private) | `WebSQLProcessor.java:629` `generateUpdateResultsDataBatch` → `DBSDataManipulator.ExecuteBatch` | `PERMISSION_EDIT_DATA` (`:522` `checkDataEditPermission`) ✅ |
| 3 | Data Editor 스크립트 생성 | `updateResultsDataBatchScript` | `WebServiceSQL.java:580` | 실행 없음(생성만) | `PERMISSION_EDIT_DATA` ✅ |
| 4 | 컨테이너 데이터 조회 | `asyncReadDataFromContainer` | `WebServiceSQL.java:625` | `WebSQLProcessor.java:355` `dataContainer.readData()` | **없음** ❌ |
| 5 | Grouping 결과 조회 | `asyncSqlGroupingResultSet` | `WebServiceSQL.java:796` `getGroupingSqlResultSet` | `WebSQLUtils.java:278` → `processQuery` → `:294` | **없음** ❌ |
| 6 | Execution Plan | `asyncSqlExplainExecutionPlan` | `WebServiceSQL.java:708` | `WebSQLProcessor.java:918` `planner.planQueryExecution()` | **없음** ❌ |
| 7 | Row count | `asyncSqlRowDataCount` | `WebServiceSQL.java:821` | `readDataFromContainer` 경유 | **없음** |
| 8 | LOB / 문자열 값 읽기 | `sqlReadLobValue` / `sqlReadStringValue` | `WebServiceSQL.java:535,548` | `WebSQLProcessor.java:929,1023` → `readData` | **없음** |
| 9 | 객체 RENAME | `navRenameNode` | `CB:navigator/impl/WebServiceNavigator.java:440` | `renameDatabaseObject` → `DBEPersistAction` | `PERMISSION_EDIT_METADATA` (`:607`) ✅ |
| 10 | 객체 DROP | `navDeleteNodes` | `WebServiceNavigator.java:533` | 동상 | `PERMISSION_EDIT_METADATA` ✅ |
| 11 | Data Import | `dataTransferImportDataIntoResults` + 업로드 servlet | `CB:data.transfer/impl/WebServiceDataTransfer.java:240`, `:270` | `DBV:DatabaseTransferConsumer.java:177` `fetchStart` → `initExporter` | `PERMISSION_IMPORT_DATA` **2회** (`WebServiceDataTransfer:249` + `DatabaseTransferConsumer:545`) ✅ |
| 12 | Import 시 신규 테이블 생성 | 동상 | 동상 | `DBV:DatabaseTransferUtils.java:729` | `PERMISSION_EDIT_METADATA` ✅ |
| 13 | Catalog/Schema 전환 | `sqlContextSetDefaults` | `CB:sql/WebSQLContextInfo.java:149` `setDefaults` | `DBExecUtils.setExecutionContextDefaults` (`USE` / `SET search_path`) | **없음** |
| 14 | Auto-commit 변경 | `asyncSqlSetAutoCommit` | `WebSQLContextInfo.java:214` `setAutoCommit` | `DBV:JDBCExecutionContext.java:398` `dbCon.setAutoCommit()` | **없음** ❌ |
| 15 | COMMIT | `asyncSqlCommitTransaction` | `WebSQLContextInfo.java:304` `commitTransaction` | `txnManager.commit(session)` | **없음** ❌ |
| 16 | ROLLBACK | `asyncSqlRollbackTransaction` | `WebSQLContextInfo.java:344` `rollbackTransaction` | `txnManager.rollback(session, null)` | **없음** |

### 2.2 SQL Editor 실행 경로

```text
asyncSqlExecuteQuery
  └─ WebServiceSQL.asyncExecuteQuery                       :594
       ├─ [check] DBWConstants.PERMISSION_SQL_EXECUTE_QUERY   (distributed 모드 한정) :604
       ├─ [check] DBPDataSourcePermission.PERMISSION_EXECUTE_SCRIPTS  :608
       └─ WebSQLUtils.createAsyncTaskExecuteSqlQuery        :278   ← 권한 검사 없음
            └─ WebSQLProcessor.processQuery                 :172
                 ├─ filter.makeDataFilter(...)              :198
                 ├─ addFiltersToQuery(...)  ← ★ 여기서 raw where 결합  :200
                 ├─ SQLScriptParser.extractActiveQuery      :218   ← 파싱은 filter 결합 '이후'
                 ├─ confirmDangerousQueryIfNeeded           :238   ← 보안 아님
                 ├─ context.openSession(...)                :245
                 ├─ DBUtils.makeStatement(...)              :259
                 └─ dbStat.executeStatement()               :294   ★ DB 실행
```

`PERMISSION_EXECUTE_SCRIPTS` 는 SELECT 포함 **모든** SQL 실행을 차단하므로
"SELECT 허용 + DML 차단" 요구사항에 그대로 쓸 수 없다. `CONFIRMED BY STATIC CODE`

### 2.3 Data Editor 변경 경로

```text
asyncUpdateResultsDataBatch  (WebServiceSQL:434)  ─┐
updateResultsDataBatch       (WebServiceSQL:474)  ─┤
                                                   ▼
                        WebServiceSQL.updateResultsDataBatch (private) :509
                             ├─ [check] checkDataEditPermission :522 → PERMISSION_EDIT_DATA
                             └─ WebSQLProcessor.updateResultsDataBatch :383
                                  └─ generateUpdateResultsDataBatch    :629
                                       ├─ insertData → ExecuteBatch   ★ INSERT
                                       ├─ updateData → ExecuteBatch   ★ UPDATE
                                       └─ deleteData → ExecuteBatch   ★ DELETE
```

INSERT/UPDATE/DELETE 세 경로가 하나의 private 메서드로 합류하고
그 앞에 단일 권한 검사가 있다. **이 부분은 구조가 양호하다.** `CONFIRMED BY STATIC CODE`

### 2.4 Data Import 경로 — 정정됨

> ⚠ **이전 분석의 오류를 정정한 항목이다.** §13 Corrections 참조.

```text
① dataTransferImportDataIntoResults (GraphQL)
     └─ WebServiceDataTransfer.asyncImportDataContainer          :240
          ├─ [check] validateImportPermission(webSession)         :247
          ├─ [check] PERMISSION_IMPORT_DATA                       :249
          └─ 세션에 import task 등록 (실행 안 함)

② POST 업로드 servlet (WebDataTransferImportServlet)
     ├─ [check] validateImportPermission(session)                 :73
     └─ WebServiceDataTransfer.runImportDataTask                  :270
          └─ importData(...) → DataTransferPipe 실행
               └─ DBV:DatabaseTransferConsumer.fetchStart         :177
                    └─ initExporter(monitor)                      :541
                         ├─ [check] PERMISSION_IMPORT_DATA        :545  ★ 실행 시점 재검사 존재
                         └─ targetContext.openSession(...)        :557
               └─ 신규 테이블 필요 시:
                    DBV:DatabaseTransferUtils.ensureHasEditMetadataPermission :728
                         └─ [check] PERMISSION_EDIT_METADATA      :729
```

**확정 사실** (`CONFIRMED BY STATIC CODE`):
`DatabaseTransferConsumer.initExporter()` 는 `fetchStart()` 에서 호출되며,
이는 **실제 행이 기록되기 직전**이다. 여기서 `PERMISSION_IMPORT_DATA` 가 다시 확인된다.

```java
// DBV:plugins/org.jkiss.dbeaver.data.transfer/src/org/jkiss/dbeaver/tools/transfer/database/DatabaseTransferConsumer.java:541-546
private void initExporter(DBRProgressMonitor monitor) throws DBException {
    DBSObject targetDB = checkTargetContainer(monitor);
    DBPDataSourceContainer dataSourceContainer = targetDB.getDataSource().getContainer();
    if (!dataSourceContainer.hasModifyPermission(DBPDataSourcePermission.PERMISSION_IMPORT_DATA)) {
        throw new DBCException("Data transfer to database [" + ... + "] restricted by connection configuration");
    }
```

→ **"기존 Connection permission의 실행 시점 재검사가 없다"는 이전 주장은 틀렸다.**

**그러나 신규 정책에는 여전히 조치가 필요하다.**
기존/신규 검사를 반드시 구분해야 한다.

| 구분 | 검사 주체 | 실행 시점 재평가 | TEMP_WRITE 만료 인지 |
| --- | --- | --- | --- |
| 기존 Connection permission (`PERMISSION_IMPORT_DATA`) | `DataSourceDescriptor.hasModifyPermission` | ✅ 있음 (`initExporter`) | ❌ 인지 못 함 |
| 신규 TEMP_WRITE 정책 (`AccessPolicyService`) | 우리가 추가할 코드 | ❌ 아직 없음 | — |

즉 TEMP_WRITE를 `hasModifyPermission` 과 **분리된** `AccessPolicyService` 로 관리하면,
`initExporter` 의 기존 검사는 TEMP_WRITE 만료를 전혀 알지 못한다.
따라서 신규 정책은 `runImportDataTask`(`:270`) 또는 consumer 실행 직전에 **별도로** 재평가되어야 한다.

**Severity 재평가: 기존 HIGH → 해당 없음(오류) + 신규 설계 요구사항(MEDIUM)**
기존 구조의 결함이 아니라, 우리 신규 정책의 설계 요구사항이다.

### 2.5 Procedure / Function / Anonymous Block

전용 API 없음. 모두 SQL Editor 경로(§2.2)를 사용한다. `CONFIRMED BY STATIC CODE`
(`service.sql.graphqls` 전체 mutation 목록에 procedure 실행 API 없음)

- `CALL proc()` → `asyncSqlExecuteQuery`
- `SELECT modifying_function()` → `asyncSqlExecuteQuery`
- `DO $$ ... $$` → `asyncSqlExecuteQuery`

→ 별도 차단 지점이 아니라 **SQL classification 정확도 문제**로 귀결된다(§5).

---

## 3. Raw Data Filter 실행 경로 — 신규 상세 분석

이전 분석은 위험만 언급하고 실행 경로와 enforcement 목록을 누락했다. 여기서 보완한다.

### 3.1 raw `where` 결합 경로 (코드 근거)

**① 사용자 입력 수집**

```java
// CB:sql/WebSQLDataFilter.java:60
this.where = CommonUtils.toString(filterProps.get("where"), null);
```

**② DBDDataFilter 로 전달**

```java
// CB:sql/WebSQLDataFilter.java:116-118
public DBDDataFilter makeDataFilter(@Nullable WebSQLResultsInfo resultInfo) throws DBException {
    DBDDataFilter dataFilter = new DBDDataFilter();
    dataFilter.setWhere(where);          // ← 검증/파싱 없음
```

**③ raw SQL fragment 로 결합**

```java
// DBV:plugins/org.jkiss.dbeaver.model/src/org/jkiss/dbeaver/model/impl/sql/StandardSQLDialectQueryGenerator.java:180-186
if (!CommonUtils.isEmpty(filter.getWhere())) {
    if (!constraints.isEmpty()) {
        query.append(operator).append('(').append(filter.getWhere()).append(')');
    } else {
        query.append(filter.getWhere());          // ← 문자열 그대로 append
    }
}
```

→ `filter.where` 는 **파싱·검증 없이 SQL에 문자열로 삽입된다.** `CONFIRMED BY STATIC CODE`

### 3.2 경로별 검사 유무

| 경로 | EXECUTE_SCRIPTS 검사 | SQL 분류 가능 지점 | raw where 결합 |
| --- | --- | --- | --- |
| `asyncSqlExecuteQuery` → `processQuery` | ✅ 있음 (`WebServiceSQL:608`) | `processQuery:218` (filter 결합 **이후**) | `processQuery:200` `addFiltersToQuery` |
| `asyncReadDataFromContainer` → `readDataFromContainer` | ❌ **없음** | **SQL 문자열이 서비스 계층에 존재하지 않음** | 컨테이너 내부 `appendConditionString` |
| `asyncSqlGroupingResultSet` → `createAsyncTaskExecuteSqlQuery` | ❌ **없음** (`asyncExecuteQuery` 를 거치지 않음) | `processQuery:218` | `processQuery:200` |
| `asyncSqlRowDataCount` | ❌ 없음 | 없음 | 컨테이너 내부 |

**핵심 발견 3건** (모두 `CONFIRMED BY STATIC CODE`):

1. **`asyncReadDataFromContainer`(`WebServiceSQL:625-660`)에는 어떤 권한 검사도 없다.**
   메서드 본문 전체를 확인했으며 `hasModifyPermission` / `hasPermission` 호출이 존재하지 않는다.

2. **`asyncSqlGroupingResultSet`(`WebServiceSQL:796`)은 `asyncExecuteQuery` 를 우회한다.**
   공유 헬퍼 `WebSQLUtils.createAsyncTaskExecuteSqlQuery`(`:278`)를 직접 호출하는데,
   이 헬퍼 자체에는 권한 검사가 없다(`:278-308` 전체 확인).
   즉 grouping 경로는 `PERMISSION_EXECUTE_SCRIPTS` 게이트를 통과하지 않고 `processQuery` 에 도달한다.

3. **분류 지점 선택이 결정적이다.**
   `processQuery` 에서 `addFiltersToQuery`(`:200`)가 `extractActiveQuery`(`:218`)보다 **먼저** 실행된다.
   따라서:
   - 분류를 **서비스 계층**(`WebServiceSQL.asyncExecuteQuery`, 기존 EXECUTE_SCRIPTS 검사 위치)에 두면
     → 원본 `sql` 인자만 보게 되어 **filter의 부작용 함수가 검사 대상에서 빠진다.**
   - 분류를 `processQuery` 내부로 옮기면 filter 가 포함된다.
     **단 `:218` 직후로는 부족하다** — control-command 변환(`:225`)과 파라미터 치환(`:237`)이
     그 뒤에 오기 때문이다. 정확한 지점은 §3A.4 참조.
   - 또한 후자여도 `SELECT ... WHERE volatile_fn()` 은 여전히 `SQLQueryType.SELECT` 로 분류된다(§5A).

### 3.3 공격 경로

```text
READ_ONLY user
→ asyncReadDataFromContainer 직접 GraphQL 호출
→ filter.where = "modifying_function() IS NOT NULL"
→ 생성된 SELECT에서 side-effecting function 실행
```

상태: `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED`

동일 문제를 공유하는 경로: `asyncSqlGroupingResultSet`, `asyncSqlRowDataCount`,
그리고 `asyncSqlExecuteQuery`(분류를 서비스 계층에 둘 경우).

### 3.4 대응 방식 비교

| 방식 | 차단 범위 | 기능 회귀 | 한계 |
| --- | --- | --- | --- |
| **(a) READ_ONLY에서 raw `where` 금지** | filter 경유 부작용 전부 | Data Editor의 자유 입력 필터 기능 상실 | SQL Editor 본문의 부작용 함수는 못 막음 |
| **(b) filter 적용 후 최종 SQL 재분류** | 구문 종류 변경 탐지 | 낮음 | `SELECT`로 분류되는 volatile 함수는 못 막음. `readDataFromContainer` 는 SQL 문자열이 없어 적용 불가 |
| **(c) DB session read-only** | 부작용 함수까지 DB가 차단 | 없음(읽기 전용이면) | 드라이버 의존, 만료 시 즉시 적용 문제(§8 Option C) |
| **(d) 구조화된 constraint만 허용** | filter 경유 부작용 전부 | (a)보다 완만 — 컬럼/연산자/값 기반 필터는 유지 | 구현량 증가. SQL Editor 본문은 별도 |

**선택: (d) + (c) 조합, (b)는 보조.**

근거:
- (d)는 `where` 자유 문자열을 막으면서 `constraints`(컬럼·연산자·값 구조체) 기반 필터링은 유지하므로,
  기존 UI 기능 회귀가 (a)보다 작다. `WebSQLDataFilter` 는 이미 `constraints` 를 별도 필드로 갖고 있어
  (`WebSQLDataFilter.java:45,120-124`) 구조적으로 분리가 가능하다.
- (c)는 `SELECT volatile_fn()` 처럼 **분류로는 원리적으로 막을 수 없는** 부작용을 막는 유일한 수단이다.
- (b)만으로는 부족하고, `readDataFromContainer` 경로에는 적용조차 불가능하다.

단, (c)의 실효성은 드라이버별로 다르며 **현재 전혀 검증되지 않았다**(§10).
따라서 (d)를 1차 방어선으로 삼고 (c)를 추가 방어로 둔다.

---

## 3A. 중앙 SQL 분류 위치 — 실행 단위 확정 (4차)

3차 문서의 "`:218` 이후, `:294` 이전" 표현이 불충분함을 확인하고 실행 단위까지 확정한다.

### 3A.1 실제 실행 순서 (`WebSQLProcessor.processQuery:172-317`)

```text
:198  filter.makeDataFilter(...)
:200  addFiltersToQuery(...)              ← ① raw filter.where 가 SQL 에 결합
:218  SQLScriptParser.extractActiveQuery  ← ② element 획득 (아직 SQLControlCommand 일 수 있음)
:221  if (element instanceof SQLControlCommand command)
:222      executeControlCommand(...)      ← ③ 제어 명령 실행 (§3B)
:225      element = controlResult.getTransformed()   ← ④ 여기서 비로소 SQL 로 치환
:231  if (element instanceof SQLQuery mainQuery)
:235      mainQuery.setParameters(...)              [useEvents 일 때만]
:237      fillQueryParameters(mainQuery, ...)       ← ⑤ 파라미터 raw 치환 → setText()
:238      confirmDangerousQueryIfNeeded(...)        ← 보안 아님 (§7.8)
:244  DBExecUtils.tryExecuteRecover(...)  ← ⑥ 여기서부터 실행 시작
:246      List<SQLScriptElement> sqlQueries = mainQuery.getScriptElements()
:247      for (SQLScriptElement sqlElement : sqlQueries)   ← ⑦ 복수 element 순회
:248          if (!(sqlElement instanceof SQLQuery sqlQuery)) { log.error(...); continue; }
:259          DBUtils.makeStatement(..., sqlQuery, ...)    ← ⑧ 최종 SQL text 확정
:294          dbStat.executeStatement()                    ← ⑨ DB 실행
```

### 3A.2 질문별 답변

| 질문 | 답 | 근거 | 상태 |
| --- | --- | --- | --- |
| `:218` 직후에는 control command 가 아직 SQL 로 변환되기 전인가? | **예.** 변환은 `:222-225` 에서 일어난다 | `WebSQLProcessor.java:218-225` | `STATIC VERIFIED` |
| control command 가 변환한 SQL 은 기존 분류를 재사용할 수 있는가? | **아니다. 반드시 재분류해야 한다.** `:225` 에서 element 객체 자체가 교체되고, 원본은 SQL 이 아닌 제어 명령이었다 | 동상 | `STATIC VERIFIED` |
| `getScriptElements()` 가 복수 statement 를 반환할 수 있는가? | **`SQLScript` 일 때만.** 일반 `SQLQuery` 는 `List.of(this)` — **분해하지 않는다** | `SQLScript.java:29, 43-47`; `SQLQuery.java:137-140` | `STATIC VERIFIED` |
| ⚠ **일반 GraphQL 입력이 `SQLScript` 로 생성되는가?** | **아니다.** `processQuery:218` 은 `extractActiveQuery(...,0,sql.length())` 로 **전체 선택**을 넘기고, 이는 `new SQLQuery(dataSource, selText=전체텍스트, ...)` 를 만든다. 따라서 `SELECT ...; UPDATE ...` 는 **전체 문자열을 담은 단일 `SQLQuery`** 가 된다 (§3C) | `SQLScriptParser.java:799-810`; `WebSQLProcessor.java:218` | `STATIC VERIFIED` |
| `SQLScript` 는 실제로 생성되는가? | **`ai` 명령 한 곳.** 단 이는 "복수 statement 진입점"이 아니라 "복수 statement 를 **미리 분해해 리스트로 만드는** 유일 지점"이다 (§3C.4 정정) | `SQLCommandAI.java:176-181` (`new SQLScript(...)`) | `STATIC VERIFIED` |
| 일반 경로가 `parseScript()` 를 호출하는가? | **아니다.** `asyncSqlExecuteQuery → processQuery` 경로에 `parseScript`/`extractScriptQueries` 호출이 없다 | `WebSQLProcessor.java:172-317` 전체 | `STATIC VERIFIED` |
| 외부 `mainQuery` 하나만 검사하면 내부 statement 가 모두 같은 분류인가? | **아니다.** `SQLScript` 의 `getType()` 은 **연결된 전체 텍스트**를 파싱한 결과이고, 내부 element 는 각각 독립 파싱된다 | `SQLScript.java:38` (`super(dataSource, text)`); `SQLQuery.parseQuery:142-220` | `STATIC VERIFIED` |
| 개별 `sqlQuery` 마다 다른 statement type 이 있을 수 있는가? | **예** (예: LLM 이 `SELECT ...; UPDATE ...;` 를 생성) | 위 항목들의 귀결 | `STATIC VERIFIED` |
| 비-`SQLQuery` element 가 섞이면 현재 코드는? | **`log.error` 후 `continue`** — 요청을 거부하지 않고 나머지 element 실행을 계속한다 | `WebSQLProcessor.java:248-251` | `STATIC VERIFIED` |
| 그 동작이 fail-closed 인가? | **아니다.** 알 수 없는 element 를 조용히 건너뛰고 나머지를 실행하는 것은 CLAUDE.md §2.1(`UNKNOWN → DENY`)에 위배된다 | 동상 | `STATIC VERIFIED` |
| 파라미터/변수 치환 전후에 statement type 이 달라질 수 있는가? | **예.** `SQLUtils.fillQueryParameters` 가 파라미터 값을 **raw 문자열로 splice** 하고 `setText()` 로 교체한다 | `SQLUtils.java:1388-1403` | `STATIC VERIFIED` |
| 최종 SQL text 는 어느 객체·시점에 확정되는가? | **`DBUtils.makeStatement` 내부 `:1642-1657`.** `sqlQuery.getText()` 또는 query transformer 결과(`transformQueryString`)가 `queryText` 로 확정된 뒤 `createStatement`(`:1660`)에 전달된다 | `DBUtils.java:1640-1661` | `STATIC VERIFIED` |

### 3A.3 파싱 캐시 함정 (설계상 반드시 반영)

```java
// DBV:model/sql/SQLQuery.java:375-377
public void setText(@NotNull String text) {
    this.text = text;          // ← parsed 플래그를 리셋하지 않는다
}

// 동 파일 :142-146
private void parseQuery() {
    if (parsed) { return; }    // ← 한 번 파싱되면 재파싱하지 않는다
    parsed = true;
```

→ **`getType()` 을 파라미터 치환 이전에 한 번이라도 호출하면, 치환 이후에도 낡은 타입이 캐시된다.**

**`DBUtils.makeStatement` 의 stale type 사용 (5차 확정):**

`makeStatement` 는 `sqlQuery.getType()` 와 `isPlainSelect()` 를 **원본 객체에서** 읽는다
(`DBUtils.java:1609, 1613`). 이는 transformer 선택(§4A)에만 쓰인다.

| 질문 | 답 | 근거 | 상태 |
| --- | --- | --- | --- |
| 치환 전 `getType()` 이 호출되는 경로가 있는가? | `confirmDangerousQueryIfNeeded`(`:238`)가 `isDeleteUpdateDangerous()`→`getType()` 호출. **단 이는 치환(`:237`) 직후**이므로 이 흐름에선 최신 | `WebSQLProcessor.java:237-238` | `STATIC VERIFIED` |
| 치환 후 DBUtils 가 stale type 을 쓸 수 있는가? | 이 흐름 내에서는 아니다(치환→confirm→loop 순, text 안정). 그러나 **분류기가 치환 전에 원본 객체의 `getType()` 을 호출하면** 캐시가 오염되어 이후 makeStatement 가 stale 사용 | 위 + `SQLQuery.java:142-146, 375-377` | `STATIC VERIFIED` |
| UPDATE 로 바뀐 text 를 SELECT 로 오판해 transformer 적용 가능? | 캐시가 오염된 경우 가능. 단 §4A 상 transformer 는 plain SELECT 에 LIMIT append 뿐이라 mutation 을 만들진 않음 | §4A | `STATIC VERIFIED` |
| 분류기가 새 객체로 재파싱해도 DBUtils 는 원본의 stale 캐시를 쓰는가? | **분류기가 원본 객체를 건드리지 않으면** DBUtils 는 원본을 자기 흐름대로(최신 text) 파싱한다. 분류기가 원본에 `getType()` 을 호출한 경우에만 문제 | 위 | `STATIC VERIFIED` |

**설계 규칙 (2가지):**
1. 분류기는 `SQLQuery` 인스턴스의 `getType()` 결과를 신뢰하지 않고, **최종 text 로 새로 파싱**한다.
2. 분류기는 **실행에 쓰이는 원본 `SQLQuery` 객체의 `getType()` 을 호출하지 않는다.**
   호출하면 파싱 캐시가 오염되어 `DBUtils.makeStatement` 의 transformer 판정이 오도될 수 있다.
   분류는 **throwaway 복사본**(`parseScript` 가 만든 새 element, 또는 최종 text 로 만든 새 `SQLQuery`)에서만 수행한다.

**새 `SQLQuery` 생성의 부수영향:** 실행 경로는 반드시 **원본 객체를 그대로 사용**해야 한다.
새 `SQLQuery` 로 교체하면 `offset`/`parameters`/`originalText`/result 처리(예: `fillQueryResults`
의 `sqlElement.getOriginalText()` `:309`)가 어긋난다. 따라서 분류용 복사본과 실행용 원본을 분리한다.
`STATIC VERIFIED`

### 3A.4 중앙 분류 지점 확정

기본 후보가 만족해야 하는 조건과 충족 여부:

| 조건 | 충족 위치 |
| --- | --- |
| filter 결합 이후 | `:200` 이후 → ✅ |
| control-command 변환 이후 | `:225` 이후 → ✅ (`:218` 직후는 **불충족**) |
| 파라미터 치환 이후 | `:237` 이후 → ✅ |
| 개별 executable statement 단위 | **`getScriptElements()` 로는 불충분** (§3C) — `parseScript` 필요 |
| `DBUtils.makeStatement`(`:259`) 이전 | ✅ |
| `executeStatement`(`:294`) 이전 | ✅ |
| 모든 statement 각각 검사 | `parseScript` 로 분해 후 순회 |
| UNKNOWN / parse failure → DENY | 분류기 정책 |
| 비허용 element 를 continue 하지 않고 전체 DENY | `:248-251` 동작 **교체 필요** |
| parser 가 전체 입력을 소비했는지 확인 | **trailing 미소비 text → DENY** (§3C.2) |

**확정 지점 (2단) — 5차 정정:**

> ⚠ **4차의 C1-a 설계는 `mainQuery.getScriptElements()` 순회에 의존했으나, 이는 일반 입력을
> 분해하지 못한다**(§3C). 아래로 정정한다.

- **C1-a — 원자적 사전검증.** `:242` 이후 ~ `:244` `tryExecuteRecover` **이전**.
  파라미터 치환·filter 결합·control-command 변환이 끝난 **최종 text** 를
  `SQLScriptParser.parseScript(dataSource, finalText)` (또는 `extractScriptQueries`)로
  **dialect-aware 하게 재분해**한 뒤, 각 statement 를 독립 분류한다.
  하나라도 WRITE/DDL/UNKNOWN/parse-failure 이거나, parser 가 소비하지 않은
  trailing text(공백·주석·delimiter 제외)가 있으면 **전체 요청 거부**.
  `getScriptElements()` 결과는 신뢰하지 않는다.
- **C1-b — 실행 직전 재확인.** 루프 내 `:248` 직후 ~ `:259` 이전.
  방어 심층성. `:248-251` 의 `log+continue` 를 **전체 DENY** 로 교체.
  단 C1-b 는 makeStatement 내부 transformer 이후의 **최종 SQL 을 보지 못한다**(§4A).

### 3A.5 부분 실행 방지 — 두 설계 비교

| 설계 | 동작 | 부분 실행 |
| --- | --- | --- |
| **(가) 전체 선검사 후 실행** | 모든 element 분류 → 전부 허용 시에만 루프 진입 | **없음** |
| (나) element 별 실행 직전 분류 | element 1 SELECT 실행 → element 2 UPDATE 차단 | **발생** — element 1 은 이미 실행됨 |

**결론: (가) 전체 선검사를 채택한다.**

근거:
- `:247` 루프는 element 를 순차 실행하며 각 반복에서 `:294` `executeStatement` 가 즉시 DB 에 도달한다.
  (나)를 택하면 `SELECT ...; UPDATE ...` 요청에서 SELECT 가 실행된 뒤 UPDATE 가 차단되는
  **부분 실행**이 발생한다. QA.md §18("WRITE statement 가 실행되어서는 안 된다. 필요하면 전체 batch 를 차단한다")은
  전체 차단을 명시적으로 허용한다.
- 원자적 사전검증이 **가능하다**: `SQLScriptParser.parseScript(dataSource, finalText)` 는
  `public static` 이고 부작용 없이 최종 text 를 분해한다(§3C.3). 실행 전에 호출 가능하다.
  **단 `getScriptElements()` 로는 불가능**하다 — 일반 입력을 분해하지 않기 때문(§3C).
- 트랜잭션 롤백에 의존하지 않는다. auto-commit 이 켜져 있으면 element 1 은 되돌릴 수 없다.

(나)는 (가)를 대체하지 않고 **C1-b 로서 보조**한다.

### 3A.6 파라미터 치환과 SQLScript inner/outer 불일치 (5차 신규)

`SQLUtils.fillQueryParameters(query, params)`(`:1388-1403`)는 전달된 `query.setText()` 만 바꾼다.

| 질문 | 답 | 근거 | 상태 |
| --- | --- | --- | --- |
| `mainQuery` 가 `SQLScript` 일 때 outer text 만 바뀌는가? | **예.** `setText` 는 `SQLQuery.text` 필드만 변경 | `SQLQuery.java:375-377` | `STATIC VERIFIED` |
| inner `scriptElements` 도 함께 바뀌는가? | **아니다.** `SQLScript.scriptElements` 는 생성자에서 고정된 리스트 | `SQLScript.java:31, 36-40` | `STATIC VERIFIED` |
| outer 와 inner 가 다른 SQL 을 나타낼 수 있는가? | **예** — 치환은 outer 만, 루프 실행은 inner(`getScriptElements()`) | `WebSQLProcessor.java:237, 246` | `STATIC VERIFIED` |
| 파라미터 값으로 `; UPDATE ...` 를 주입할 수 있는가? | **예.** 값은 client 확인 응답에서 오고(`WebSQLParametersProvider:83-90` `param.setValue(strValue)`), `fillQueryParameters` 가 **raw splice** | `WebSQLParametersProvider.java:80-92`; `SQLUtils.java:1398-1401` | `STATIC VERIFIED` (경로) / **NOT RUNTIME VERIFIED** (실제 주입) |
| C1-a 가 치환된 outer 가 아니라 낡은 inner 를 검사할 수 있는가? | **예 — `getScriptElements()` 에 의존하면 그렇다** | 위 항목들의 귀결 | `STATIC VERIFIED` |

**주입 경로 조건**: `useEvents`(=GraphQL `isInteractive`)가 true 이고 쿼리에 미설정 파라미터가 있을 때만
`collectAndAssignVariables` 가 client 값을 받는다(`WebSQLParametersProvider:60-90`). 제한적이나 실재한다.

**결론 (런타임 무관하게 확정):**
- C1-a 는 **기존 element 목록(`getScriptElements()`)을 신뢰하지 않는다.**
- 파라미터 치환·filter 결합이 끝난 **최종 outer text 를 `parseScript` 로 다시 분해**하여 분류한다.
- 이는 §3C(일반 경로)와 §3A.6(파라미터 주입) 두 경우 모두를 한 번에 커버한다.

---

## 3B. SQLControlCommand 보안 영향 (4차 신규)

### 3B.1 등록된 제어 명령 전수

확장점 `org.jkiss.dbeaver.sqlCommand`(`SQLCommandHandlerDescriptor.java:35`)에 등록된 전부:

| id | 핸들러 클래스 | 제공 plugin | CB CE 서버 런타임 포함 |
| --- | --- | --- | --- |
| `set` | `SQLCommandSet` | `model.sql` | ✅ |
| `unset` | `SQLCommandUnset` | `model.sql` | ✅ |
| `echo` | `SQLCommandEcho` | `model.sql` | ✅ |
| `export` | `SQLCommandExport` | `model.sql` | ✅ |
| `ai` | `SQLCommandAI` | `model.ai` | ✅ — `io.cloudbeaver.service.ai` 가 `Require-Bundle: org.jkiss.dbeaver.model.ai` |
| `include` | `SQLCommandInclude` | `ui.editors.sql` | ❓ `NOT VERIFIED` — CB 번들 중 이 plugin 을 요구하는 것이 없음 |
| `mysql.source` | `SQLCommandInclude` (`ui.editors.sql` 소재) | `ext.mysql` | ❓ `NOT VERIFIED` — `ext.mysql` 은 db.feature 에 포함되나 핸들러 클래스는 UI plugin 소재 |
| `exasol.define` | `SQLCommandSet` | `ext.exasol` | ✅ (핸들러는 `model.sql` 소재) |

디스패치: `SQLScriptContext.executeControlCommand:274-286` →
`SQLCommandsRegistry.getCommandHandler(commandId)` → 없으면 `DBException` throw.

### 3B.2 명령별 분류

| 명령 | 동작 | 범주 | READ_ONLY 정책 |
| --- | --- | --- | --- |
| `set` / `exasol.define` | script 변수 설정. 값은 `GeneralUtils.replaceVariables` 로 문자열 확장만 하고 **DB 질의 없음** (`SQLCommandSet.java:53-58`) | 순수 script 제어 — **단, 변수는 이후 SQL 에 raw 치환됨**(§3A.3) | 조건부 허용. 치환 **이후** 분류가 보장될 때만 |
| `unset` | 변수 제거 (`SQLCommandUnset.java:42-45`) | 순수 script 제어 | 허용 가능 |
| `echo` | 출력 writer 에 문자열 기록 (`SQLCommandEcho.java:36-44`) | 순수 script 제어 | 허용 가능 |
| `export` | pragma 설정 → 이후 data transfer 파이프라인 트리거 (`SQLCommandExport.java:36-48`) | 애플리케이션 상태 변경 | **차단 권장** — export 는 읽기 방향이나 data transfer 경로 진입점이며 CB 서버에서의 동작이 `NOT VERIFIED` |
| `ai` | LLM 이 생성한 SQL 을 `SQLQuery` 또는 **`SQLScript`(복수 문장)** 로 변환 (`SQLCommandAI.java:176-181`) | **SQL 로 변환 → 변환 결과 재분류 필수** | 변환 결과 전체를 §3A.4 로 검사. 검사 없이는 **차단** |
| `include` / `mysql.source` | 외부 스크립트 파일 포함 | 파일/외부 resource 읽기 + SQL 생성 | **차단** — 서버 런타임 존재 여부가 `NOT VERIFIED` 이므로 fail-closed |

### 3B.3 정책 결론

- **`ai` 명령의 변환 결과는 반드시 재분류한다.** 이것이 §3A.1 ④ 이후에 분류해야 하는
  직접적 이유이며, 동시에 유일하게 확인된 복수 statement 진입 경로다.
- `ai` 는 `isGenerated=true` 로 `confirmDangerousQueryIfNeeded`(`:238`)를 트리거하지만,
  이는 보안 통제가 아니다(§7.8). LLM 이 생성한 DML 이 사용자 확인만으로 통과할 수 있다.
- **분석되지 않은 제어 명령은 READ_ONLY 에서 허용하지 않는다.**
  `include` / `mysql.source` / `export` 는 서버 런타임 동작이 미검증이므로 fail-closed 로 차단한다.
- 현재 범위에서 모든 제어 명령이 안전하다고 **증명되지 않았다.**
  → **READ_ONLY 기본 정책: 제어 명령은 allowlist(`echo`, `unset`, 조건부 `set`)만 허용.**

---

## 3C. 일반 GraphQL 입력의 다중 statement 경로 (5차 신규 — 핵심)

4차 문서는 "AI 가 repo 전체에서 유일한 복수 statement 진입 경로"라고 서술했다.
**이는 잘못이다.** 일반 SQL 입력도 단일 `SQLQuery` 안에 복수 statement 를 담는다.

### 3C.1 코드 근거 — 전체 선택이 단일 SQLQuery 가 되는 과정

```java
// CB:WebSQLProcessor.java:218  — 전체 SQL 을 선택 범위로 전달
SQLScriptElement element = SQLScriptParser.extractActiveQuery(parserContext, 0, sql.length());
```

```java
// DBV:SQLScriptParser.java:776-810  extractActiveQuery
final StringJoiner text = ...;                       // 선택 영역 전체
if (text.length() > 0) selText = text.toString();    // selText = 전체 sql
...
if (!CommonUtils.isEmpty(selText)) {
    SQLScriptElement parsedElement = SQLScriptParser.parseQuery(...);  // 첫 요소 (control 여부 판별용)
    if (parsedElement instanceof SQLControlCommand) {
        element = parsedElement;
    } else {
        selText = SQLUtils.fixLineFeeds(selText);
        element = new SQLQuery(context.getDataSource(), selText, ...);  // ★ 전체 selText 를 단일 SQLQuery 로
    }
}
```

→ `SELECT ...; UPDATE ...` 전체 문자열이 **하나의 `SQLQuery`** 가 된다. `STATIC VERIFIED`

### 3C.2 질문별 답변

| 질문 | 답 | 근거 | 상태 |
| --- | --- | --- | --- |
| 일반 입력이 하나의 `SQLQuery` 에 복수 statement 를 담을 수 있는가? | **예** | `SQLScriptParser.java:807-810` | `STATIC VERIFIED` |
| 일반 경로에서 `parseScript()` 가 호출되는가? | **아니다** | `WebSQLProcessor.java:172-317` | `STATIC VERIFIED` |
| 일반 `getScriptElements()` 가 전체 문자열을 재분할하는가? | **아니다.** `List.of(this)` — 통째로 반환 | `SQLQuery.java:137-140` | `STATIC VERIFIED` |
| `getType()` 은 복수 statement 를 어떻게 처리하는가? | `SQLSemanticProcessor.parseQuery` 가 **단일** `parser::Statement` 를 쓴다. 복수 statement 는 parse 실패 → `UNKNOWN` **가능성이 높다.** 단 JSQLParser 가 예외를 던지는지 첫 문장만 파싱하는지는 미검증 | `SQLSemanticProcessor.java:127-129`; `SQLQuery.java:218-221` | `STATIC VERIFIED` (단일 파서 사용) / **NOT RUNTIME VERIFIED** (trailing 처리) |
| trailing statement 가 분류에서 누락될 수 있는가? | **naive 분류(`mainQuery.getType()` 단독)라면 가능.** `getType()` 이 UNKNOWN 이 아니라 첫 SELECT 로 반환되면 뒤 UPDATE 가 통째로 실행된다 | 위 항목의 귀결 | **NOT RUNTIME VERIFIED** |
| JDBC 가 동일 문자열의 복수 statement 를 실행하는가? | 드라이버·설정 의존. `dbStat.executeStatement()` 에 전체 문자열 전달 | `WebSQLProcessor.java:259, 294` | `STATIC VERIFIED` (전달) / **NOT RUNTIME VERIFIED** (드라이버 실행) |
| PostgreSQL / MySQL multi-query 동작 | PG: simple query protocol 은 `;` 구분 복수 실행 허용. MySQL: `allowMultiQueries` 커넥션 파라미터에 의존 | 드라이버 문서 | **NOT RUNTIME VERIFIED** |

### 3C.3 `parseScript` 는 사용 가능

`SQLScriptParser.parseScript(DBPDataSource, String)` 는 `public static` 이며
`extractScriptQueries(...)` 로 dialect·delimiter 인지 분해를 수행한다.
프로덕션 코드 변경 없이 분류기가 호출할 수 있다. `SQLScriptParser.java:1085-1094` `STATIC VERIFIED`

### 3C.4 정정 요지

- **"AI 가 유일한 multi-statement 진입점"은 DISPROVED.**
  구분해야 할 두 개념:
  - **`SQLScript` 생성 지점** = `ai` 명령 한 곳 (복수 statement 를 미리 리스트로 만드는 곳)
  - **사용자 입력에 복수 SQL 이 포함될 수 있는 경로** = 모든 `asyncSqlExecuteQuery` 요청
- 후자가 훨씬 넓다. 일반 입력은 리스트로 분해되지 않고 **통짜 `SQLQuery`** 로 남으므로,
  `getScriptElements()` 순회로는 절대 발견되지 않는다.
- 따라서 C1-a 는 반드시 `parseScript` 로 최종 text 를 재분해해야 한다(§3A.4).

### 3C.5 위험 시나리오

```text
READ_ONLY user
→ asyncSqlExecuteQuery(query: "SELECT 1; UPDATE t SET x='ATTACK'")
→ extractActiveQuery → 단일 SQLQuery(전체 텍스트)
→ [naive classifier: mainQuery.getType() 만 확인]
   - getType()==UNKNOWN 이면 DENY (fail-closed, 안전)
   - getType()==SELECT (첫 문장만 파싱) 이면 ALLOW → UPDATE 실행 위험
→ dbStat.executeStatement("SELECT 1; UPDATE ...") → 드라이버가 복수 실행 시 변경 발생
```

상태: `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED` — Phase 1 런타임 검증 대상.
**설계 결론은 런타임과 무관하게 확정**: C1-a 는 `getType()` 단독이 아니라
`parseScript` 분해 + 전체 소비 확인 + 각 statement 분류로 구현해야 한다.

---

## 4. Transaction Mutation Surface — 신규 상세 분석

이전 분석은 COMMIT만 다뤘다. 여기서 트랜잭션 상태를 바꿀 수 있는 경로 전체를 다룬다.

### 4.1 경로 목록

| 경로 | 진입점 | 권한 검사 | DB 영향 |
| --- | --- | --- | --- |
| `BEGIN` (SQL 문) | `asyncSqlExecuteQuery` | EXECUTE_SCRIPTS | `SQLQueryType` 에 BEGIN 없음 → `UNKNOWN` |
| `COMMIT` (SQL 문) | `asyncSqlExecuteQuery` | EXECUTE_SCRIPTS | `SQLQueryType.COMMIT` (TCL) |
| `ROLLBACK` (SQL 문) | `asyncSqlExecuteQuery` | EXECUTE_SCRIPTS | `SQLQueryType.ROLLBACK` (TCL) |
| `asyncSqlCommitTransaction` | `WebSQLContextInfo:304` | **없음** | `txnManager.commit(session)` — 확정 |
| `asyncSqlRollbackTransaction` | `WebSQLContextInfo:344` | **없음** | `txnManager.rollback(session, null)` — 취소 |
| `asyncSqlSetAutoCommit(false)` | `WebSQLContextInfo:214` | **없음** | 수동 트랜잭션 시작 |
| `asyncSqlSetAutoCommit(true)` | `WebSQLContextInfo:214` | **없음** | ★ **암시적 COMMIT 가능** — §4.2 |
| `sqlContextDestroy` | `WebServiceSQL:411` `destroyContext` | 없음 | **commit/rollback 하지 않음** — `STATIC VERIFIED` (§6C). 트랜잭션 경계가 아니다 |
| `closeConnection` | `WebServiceCore:723` → `disconnectDataSource:170` | 없음 | **명시적 rollback 시도, commit 없음** — `STATIC VERIFIED` (§6C.5). 복구 경로로 분류 |
| session cleanup / reconnect | — | — | `NOT VERIFIED` |

### 4.2 `setAutoCommit(true)` 암시적 COMMIT — 신규 발견

호출 체인 (`CONFIRMED BY STATIC CODE`):

```text
asyncSqlSetAutoCommit                         CB:sql/impl/WebServiceSQL.java:855
  └─ WebSQLContextInfo.setAutoCommit          CB:sql/WebSQLContextInfo.java:214
       └─ txnManager.setAutoCommit(monitor, autoCommit)          :224
            └─ DBV:JDBCExecutionContext.java:390-415
```

```java
// DBV:plugins/org.jkiss.dbeaver.model.jdbc/.../JDBCExecutionContext.java:396-399
Connection dbCon = getConnection();
dbCon.setAutoCommit(autoCommit);      // ← pending transaction 처리 없이 직접 호출
this.autoCommit = dbCon.getAutoCommit();
```

`java.sql.Connection.setAutoCommit(boolean)` 명세:
auto-commit 모드가 트랜잭션 도중 변경되면 **해당 트랜잭션은 커밋된다.**
DBeaver 측에서 사전 rollback이나 차단을 하지 않으므로 그대로 드라이버 동작에 위임된다.

**시나리오:**

```text
10:59  TEMP_WRITE active
10:59  asyncSqlSetAutoCommit(false)     → 수동 트랜잭션 시작
10:59  UPDATE                           → TEMP_WRITE 유효, 허용
11:00  TEMP_WRITE 만료
11:01  asyncSqlSetAutoCommit(true)      → JDBC가 pending transaction 을 COMMIT
       결과: 만료 후에 변경이 확정됨
```

**결론: `asyncSqlCommitTransaction` 만 차단하는 것으로는 불충분하다.**
`asyncSqlSetAutoCommit` 을 enforcement 목록에 **반드시 포함해야 한다.**

상태: `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED`
(JDBC 명세와 코드 경로는 확인했으나, 드라이버별 실제 동작은 미검증)

### 4.3 미확인 항목 (3차에서 일부 해소)

- `sqlContextDestroy` → **해소.** commit/rollback 하지 않으며 트랜잭션 경계가 아님이
  정적으로 확인되었다. 상세는 §6C. `STATIC VERIFIED`
- `closeConnection` / `dataSource.disconnect()` → **해소(정적).** 명시적 `connection.rollback()` 을
  시도하고 commit 호출은 없다. 상세는 §6C.5. `STATIC VERIFIED`
  단 드라이버의 실제 rollback 성공은 `RUNTIME NOT VERIFIED`.
- 세션 만료 시 정리 경로 → `NOT VERIFIED`

### 4.4 정책 권고 (설계만)

TEMP_WRITE 만료 시점에 열린 트랜잭션이 있으면:
- 신규 WRITE 문장 차단 (필수)
- `asyncSqlCommitTransaction` 차단 (필수)
- `asyncSqlSetAutoCommit(true)` 차단 (필수 — §4.2)
- `asyncSqlRollbackTransaction` 은 **허용**한다 (변경을 되돌리는 방향이므로 보안상 안전)
- 만료 시 서버가 능동적으로 rollback 할지는 Phase 2에서 결정

---

## 4A. Query Transformer 신뢰 경계 (5차 신규)

C1-b 가 `DBUtils.makeStatement`(`:259`) **이전**에 있으므로, makeStatement 내부에서
query transformer 가 최종 SQL 을 변형하면 C1-b 가 그 결과를 보지 못한다.
transformer 를 어디까지 신뢰할 수 있는지 확정한다.

### 4A.1 transformer 적용 조건 (`DBUtils.makeStatement:1608-1640`)

```java
boolean selectQuery = sqlQuery.getType() == SQLQueryType.SELECT && sqlQuery.isPlainSelect();  // :1609
...
if (selectQuery) {                                    // limit/fetchAll 은 SELECT 에만
    if (hasLimits) {
        if (pref RESULT_SET_MAX_ROWS_USE_SQL || forceTransform)
            limitTransformer = ...RESULT_SET_LIMIT;   // 조건부
    } else {
        fetchAllTransformer = ...FETCH_ALL_TABLE;
    }
}
...
queryText = (limitTransformer != null) ? limitTransformer.transformQueryString(sqlQuery)
          : (fetchAllTransformer != null) ? fetchAllTransformer.transformQueryString(sqlQuery)
          : sqlQuery.getText();                        // :1650-1656
```

### 4A.2 transformer 표

| transformer | 적용 DBMS | 적용 조건 | 입력 type | 생성 SQL | type 변경 | raw 결합 | mutation 신규생성 | 재검사 필요 | 정적 신뢰 | 런타임 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `QueryTransformerLimit` | generic (PG 포함, MySQL 은 자체 없음→generic) | `selectQuery` **AND** (`RESULT_SET_MAX_ROWS_USE_SQL` pref **or** forceTransform); 기본은 미적용(JDBC setLimit) | plain SELECT 만 | `text + "\nLIMIT ..."` (raw append) | ❌ (SELECT 유지) | ⚠ `query.getText()` 에 append | ❌ | 낮음 (plain SELECT 한정) | plain SELECT 에 LIMIT append 만 하면 안전 | `NOT VERIFIED` |
| `QueryTransformerFetchAll` (PostgreSQL) | PostgreSQL | `selectQuery` AND `!hasLimits` | plain SELECT | **`query.getText()` 그대로 반환** | ❌ | ❌ | ❌ | 불필요 | **안전 — text 불변** | `NOT VERIFIED` |
| `QueryTransformerFetchAll` (MySQL) | MySQL | 동상 | plain SELECT | **`query.getText()` 그대로 반환** | ❌ | ❌ | ❌ | 불필요 | **안전 — text 불변** | `NOT VERIFIED` |
| 기타 DBMS limit/fetch transformer | Cubrid/Vertica/… | 각기 다름 | — | — | — | — | — | 필요 | **미조사 → 신뢰 불가** | `NOT VERIFIED` |

핵심 관찰:
- **PG/MySQL 의 `FetchAll.transformQueryString` 은 text 를 바꾸지 않는다**(JDBC fetch size 는 `transformStatement` 에서 처리). `PG:QueryTransformerFetchAll.java:41`, `MySQL:...:45` — 둘 다 `return query.getText();` `STATIC VERIFIED`
- **limit transformer 는 plain SELECT 에만, 기본 비활성**(JDBC `setLimit` 사용). 활성 시에도 append 대상은 plain SELECT.
- 이 transformer 들은 모두 `selectQuery == (getType()==SELECT && isPlainSelect())` 조건에서만 동작하므로, 복수 statement blob(UNKNOWN) 이나 DML 에는 적용되지 않는다.

### 4A.3 대안 비교

| 대안 | 평가 |
| --- | --- |
| **(가) transformer 를 TCB 로 지정 + 지원 DBMS allowlist** | PG/MySQL 은 `transformQueryString` 이 text 불변(FetchAll) 또는 plain-SELECT LIMIT append(Limit) 임이 `STATIC VERIFIED`. **두 DBMS 한정으로 신뢰 가능.** 미검증 DBMS 는 제외 |
| **(나) READ_ONLY 는 SQL-level transformer 미사용, JDBC limit 사용** | 기본 동작이 이미 JDBC `setLimit`(`makeStatement:1665-1668`). `RESULT_SET_MAX_ROWS_USE_SQL` 을 끄면 limit transformer 자체가 비활성. **추가 보증 수단으로 채택 가능** |
| (다) transformer 결과 문자열을 받아 재분류 | makeStatement 가 `queryText` 를 내부에서만 쓰고 반환하지 않음 → **Platform 수정 없이는 불가** |
| (라) `DBUtils.makeStatement`/Platform 수정 | 별도 repo(`dbeaver`) 수정 → CLAUDE.md §28 중단 조건 |

### 4A.4 결론 — Platform 수정 불필요 (STOP 아님)

**PG/MySQL 한정으로 (가)+(나)를 채택한다.**

- PG/MySQL 의 SELECT transformer 는 최종 text 를 변형하지 않거나(FetchAll) plain SELECT 에
  LIMIT 만 덧붙인다(Limit) — 둘 다 `STATIC VERIFIED` 로 안전.
- 따라서 **C1-b(makeStatement 이전)에서 본 SQL 이 이 두 DBMS 에서는 최종 실행 SQL 과
  실질적으로 동일**하다 (LIMIT append 는 mutation 을 만들지 않음).
- 추가로 `RESULT_SET_MAX_ROWS_USE_SQL` 을 끄면 SQL-level limit transform 자체가 사라진다.
- **Platform(`DBUtils`) 수정은 불필요하다. STOP 판정 아님.**

단 이 신뢰 경계는 **PG/MySQL 에만** 적용된다. 다른 DBMS 의 transformer 는 미조사이므로
"transformer 이후 최종 SQL = C1-b 가 본 SQL" 이 성립하지 않을 수 있고,
따라서 그 DBMS 들은 지원 범위 밖으로 유지한다(§10).

> ⚠ **4차 표현 정정.** 4차 §9.3 은 C1-b 를 "`makeStatement` 직전 재확인"이라고만 적고
> transformer 이후 최종 SQL 을 보지 못한다는 점을 명시하지 않았다. 위와 같이 보완한다.

---

## 5. SQL Classification

### 5.1 사용 가능한 기존 기능

새 parser dependency는 불필요하다. `CONFIRMED BY STATIC CODE`

| 구성요소 | 위치 | 역할 |
| --- | --- | --- |
| JSQLParser (`net.sf.jsqlparser`) | dbeaver 기존 의존성 | 실제 파싱 |
| `SQLSemanticProcessor.parseQuery(dialect, sql)` | `DBV:model/sql/parser/SQLSemanticProcessor.java:127` | dialect 인지 파싱 + 타임아웃 |
| `SQLQuery.getType()` | `DBV:model/sql/SQLQuery.java:436` | `SQLQueryType` 반환 |
| `SQLQueryType` | `DBV:model/sql/SQLQueryType.java` | SELECT/INSERT/UPDATE/DELETE/MERGE/DDL/USE/COMMIT/ROLLBACK/UNKNOWN |
| `SQLQueryCategory` | `DBV:model/sql/SQLQueryCategory.java` | SQL/DML/DDL/TCL/UNKNOWN |
| `SQLQueryCategory.categorizeScript` | 동상 `:38` | script element 목록 → 카테고리 집합 |

CloudBeaver는 이미 `categorizeScript` 를 사용하지만
(`WebSQLProcessor.java:1319`, `confirmDangerousQueryIfNeeded` 내부)
이는 **UI 확인 다이얼로그용이며 보안 검사가 아니다**(§7.6).

### 5.2 Fail-closed 특성

```java
// DBV:model/sql/SQLQuery.java:218-221
} catch (Throwable e) {
    this.type = SQLQueryType.UNKNOWN;
    this.parseError = e;
}
```

파싱 실패 시 예외를 던지지 않고 `UNKNOWN` 을 반환한다. `CONFIRMED BY STATIC CODE`
→ `UNKNOWN` 을 DENY로 처리하면 parse 실패가 자동으로 fail-closed 가 된다.

### 5.3 케이스별 예상 판정

> ⚠ 아래는 `SQLQuery.parseQuery()`(`:142-220`)의 분기를 읽고 도출한 **예상값**이다.
> 파서 단위 테스트로 확정하지 않았다. 상태: `NOT RUNTIME VERIFIED`

| 입력 | 예상 `SQLQueryType` | READ_ONLY 결과 | 안전성 |
| --- | --- | --- | --- |
| `SELECT * FROM t` | `SELECT` | ALLOW | ✅ |
| `INSERT` / `UPDATE` / `DELETE` | 각각 | DENY | ✅ |
| `MERGE` | `MERGE` | DENY | ✅ |
| `CREATE TABLE` / `ALTER` / `DROP` / `CREATE INDEX` / `CREATE VIEW` | `DDL` | DENY | ✅ |
| `TRUNCATE` | `UNKNOWN` (DDL 분기 `:203-208` 에 미포함) | DENY | ✅ fail-closed |
| `GRANT` / `REVOKE` | `UNKNOWN` | DENY | ✅ |
| `CALL modify_data()` | `UNKNOWN` | DENY | ✅ |
| `DO $$ BEGIN UPDATE ... END $$` | `UNKNOWN` | DENY | ✅ |
| `WITH x AS (...) UPDATE t ...` | `UPDATE` | DENY | ✅ |
| 파싱 실패 문법 | `UNKNOWN` | DENY | ✅ |
| **`SELECT modifying_function()`** | **`SELECT`** | **ALLOW** | ❌ **위험** |
| **`WITH x AS (UPDATE t ... RETURNING *) SELECT * FROM x`** | **`SELECT` 가능성** | **ALLOW** | ❌ **위험** |
| `SELECT ... FOR UPDATE` | `SELECT` | ALLOW | ⚠ Lock |

### 5.4 결론

분류기는 재사용 가능하고 fail-closed 성향이지만,
**`SELECT` 로 분류된 문장이 안전하다는 보장은 없다.**
CLAUDE.md §12와 AGENTS.md "SELECT Is Not Automatically Safe" 가 지적한 문제가 실제로 존재한다.

→ **SQL classification 단독으로는 READ_ONLY를 보장할 수 없다.**

---

## 5A. SELECT Side-Effect 와 중앙 Classifier 의 한계 (4차)

### 5A.1 유형별 분류 가능성

| 유형 | `SQLQueryType` 예상 | classifier 가 부작용을 판별하는가 | 상태 |
| --- | --- | --- | --- |
| 일반 SELECT | `SELECT` | 해당 없음 (부작용 없음) | 안전 |
| aggregate SELECT (`COUNT`/`SUM`) | `SELECT` | 해당 없음 | 안전 |
| **SELECT volatile function** | `SELECT` | ❌ **판별 못 함** | 위험 |
| **SELECT stored function** | `SELECT` | ❌ **판별 못 함** | 위험 |
| **data-modifying CTE** (`WITH x AS (UPDATE ... RETURNING) SELECT`) | `SELECT` 가능성 | ❌ 판별 못 함 | 위험 / `NOT VERIFIED` |
| EXPLAIN ANALYZE | classifier 를 **거치지도 않음** (§7.1) | 해당 없음 — 별도 지점 필요 | 위험 |
| DBMS 고유 상태변경 SELECT | dialect 의존 | ❌ 판별 못 함 | `NOT VERIFIED` |
| grouping 이 생성한 SELECT expression | `SELECT` | ❌ 판별 못 함 (§6D.5) | 위험 |

### 5A.2 답: classifier 는 내부 함수 부작용을 판별할 수 없다

`SQLQuery.parseQuery`(`:142-220`)는 JSQLParser AST 의 **최상위 statement 종류**만 보고
`SQLQueryType` 을 결정한다. SELECT 목록·WHERE 절 내부의 함수 호출이 무엇을 하는지에 대한
정보는 어디에도 없다. 함수의 volatility 는 **DB 카탈로그에만** 존재한다. `STATIC VERIFIED`

### 5A.3 명시적으로 기록해야 할 결론

- **statement category 가 READ 라고 해서 안전한 것은 아니다.**
- parser characterization test 는 **현재 분류 동작만** 보여준다.
  "무엇이 SELECT 로 분류되는가"를 알려주지만 "그것이 안전한가"는 알려주지 않는다.
- **parser 단위 테스트만으로 Option A 와 Option C 중 하나를 결정할 수 없다.**
  (3차 문서 §15에서 "그 결과에 따라 아키텍처가 결정된다"고 쓴 것은 과장이었다 — §13.13 정정)
- JDBC read-only 강제력은 **DBMS 별 런타임 검증**이 필요하다.
- 검증되지 않은 function call 을 허용할지·제한할지·모두 차단할지는 **정책 결정 사항**이며,
  Phase 2에서 명시적으로 정해야 한다. 선택지:
  1. 모든 함수 호출 차단 (가장 안전, 기능 회귀 큼)
  2. dialect 내장 함수 allowlist 만 허용 (중간)
  3. 함수 호출 허용 + Option C 로 DB 가 차단 (Option C 실효성에 의존)
- **grouping allowlist 는 일반 SELECT function 정책과 별도로 필수다**(§6D.5).
  일반 SELECT 정책을 3번으로 정하더라도 grouping 은 구조화 입력으로 바꿔야 한다.

---

## 6. Object / Metadata DDL — 유형별 분석

CloudBeaver CE의 Object/Metadata 관련 GraphQL은 다음이 전부다. `CONFIRMED BY STATIC CODE`

- `service.navigator.graphqls` mutations: `navReloadNode`, `navRenameNode`, `navDeleteNodes`, `navMoveNodesToFolder`, `navSetFolderFilter` (5개)
- `service.metadata.graphqls`: `metadataGetNodeDDL`, `metadataGetNodeExtendedDDL` — **Query 전용, 읽기만** (DDL 텍스트 생성, 실행 없음)

| DDL 유형 | 제공 방식 | 근거 |
| --- | --- | --- |
| **CREATE** | ❌ Object API 없음 → **SQL Editor를 통해서만 가능** | navigator schema에 create mutation 부재 |
| **CREATE (예외)** | Import 시 대상 테이블 자동 생성 경로 존재 | `DBV:DatabaseTransferUtils.java:728` `ensureHasEditMetadataPermission` → `PERMISSION_EDIT_METADATA` 검사됨 |
| **ALTER** | ❌ Object API 없음 → **SQL Editor를 통해서만 가능** | 동상 |
| **DROP** | ✅ **Object API로 제공됨** — `navDeleteNodes` | `WebServiceNavigator.java:533`, 권한 `:607` |
| **TRUNCATE** | ❌ Object API 없음 → **SQL Editor를 통해서만 가능** | 동상 |
| **RENAME** | ✅ **Object API로 제공됨** — `navRenameNode` | `WebServiceNavigator.java:440`, 권한 `:463` |
| **COMMENT** | ❌ Object API 없음 → **SQL Editor를 통해서만 가능** | 동상 |

### 6.1 `navRenameNode` 분기 검증

`renameNode`(`:440-470`)에는 두 갈래가 있다.

```java
checkProjectEditAccess(node, session);                    // :452
if (node.supportsRename()) {                              // :453
    ... else { node.rename(monitor, newName); }           // :458  ← 메타데이터 권한 검사 없음
    return node.getNodeUri();
}
if (node instanceof DBNDatabaseNode dbNode) {             // :462
    checkMetadataEditPermission(dbNode);                  // :463  ← 검사 있음
    return renameDatabaseObject(...);
}
```

`supportsRename()` 이 `true` 이면 메타데이터 권한 검사를 건너뛴다.
따라서 DB 객체 노드가 이 분기에 들어갈 수 있는지 확인했다.

`supportsRename()` 재정의 클래스 전수 조사 결과 (`DBV:plugins/` 전체 grep):
`DBNDataSource`, `DBNLocalFolder`, `DBNProject`, `DBNFileSystem`, `DBNFileSystemRoot`,
`DBNPathBase`, `DBNResource` — **`DBNDatabaseNode` 는 재정의하지 않는다.**
기본 구현은 `DBNNode.java:200-202` 의 `return false` 이다.

→ 일반 DB 객체 노드는 항상 `:462` 분기로 가서 권한 검사를 받는다. **문제 없음.**
`DBNDataSource` 는 `DBNDatabaseNode` 를 상속하고 `supportsRename()==true` 이지만,
이 경로는 **CloudBeaver Connection 항목의 이름 변경**이며 DB 객체 DDL이 아니다.
`checkProjectEditAccess`(DATA_SOURCES_EDIT)로 별도 보호된다.
상태: `CONFIRMED BY STATIC CODE`

### 6.2 결론

**Object/Metadata Editor를 통한 DDL 표면은 DROP과 RENAME 두 가지뿐이며, 둘 다 이미 보호되고 있다.**
나머지 DDL(CREATE/ALTER/TRUNCATE/COMMENT)은 SQL Editor 경로로만 가능하므로
**SQL classification이 이들을 담당한다.**

---

## 6A. Connection GraphQL Mutation 전수 목록

기준 스키마: `server/bundles/io.cloudbeaver.server/schema/service.core.graphqls`
서비스 인터페이스: `CB:core/DBWServiceCore.java` — **권한 어노테이션이 선언되는 곳**
구현: `CB:core/impl/WebServiceCore.java`
바인딩: `CB:core/WebServiceBindingCore.java` — dataFetcher 자체에는 래퍼 없음 (`:117-203`)

> ⚠ **2차 문서 정정.** 2차에서는 "바인딩에 권한 래퍼가 없다"는 관찰만으로
> 연결 CRUD 에 서버측 권한 검사가 없다고 서술했다. **이는 틀렸다.**
> 권한은 dataFetcher 가 아니라 **서비스 인터페이스의 어노테이션 + 리플렉션 프록시**에서 강제된다.
>
> ```java
> // CB:service/WebServiceBindingBase.java:198-217 (Proxy.invoke)
> WebProjectAction projectAction = method.getAnnotation(WebProjectAction.class);
> if (projectAction != null) {
>     checkObjectActionPermissions(method, projectAction, args);   // :211-213
> }
> ...
> return method.invoke(impl, args);                                // :217
> ```
>
> `checkObjectActionPermissions`(`:245-291`)는
> `PERMISSION_ADMIN` 우회(`:247`), `@WebObjectId` projectId 추출(`:252-262`),
> `supportsCustomConnections` 기반 private project 차단(`:277-281`),
> `rmProject.hasProjectPermission(...)` 검사(`:286-289`)를 수행한다.
> `STATIC VERIFIED`

| Mutation | Backend 메서드 | 서버측 권한 검사 | DB 연결/실행 | DB mutation 여부 | 신규 정책 필요 |
| --- | --- | --- | --- | --- | --- |
| `createConnection` | `WebServiceCore.java:463` → `WebSessionProjectImpl.createConnection:282` | ✅ `@WebProjectAction(DATA_SOURCES_EDIT)` `DBWServiceCore.java:137` | 없음(설정만) | **DB mutation 아님** | ✅ 간접 — 미등록 connectionId = READ_ONLY 기본값 필요 |
| `updateConnection` | `:472` → `WebSessionProjectImpl.updateConnection:313` | ✅ `DBWServiceCore.java:144` | 없음 | **DB mutation 아님** | 조건부 (§6B.4) |
| `deleteConnection` | `:481` | ✅ `DBWServiceCore.java:151` | 없음 | **DB mutation 아님** | ❌ |
| `copyConnectionFromNode` | `:491` | ✅ `DBWServiceCore.java:158` | 없음(설정 복제) | **DB mutation 아님** | ✅ 간접 — 신규 connectionId 생성 |
| `testConnection` | `:547` | `:640` `setAccessCheckRequired(!hasPermission(PERMISSION_ADMIN))` | **DB 연결 수립함** (`ConnectionTestJob`) | **DB mutation 아님** (연결만) | ❌ (단, credential 관점은 별도) |
| `initConnection` | `:342` | 프로젝트 접근성 | **DB 연결 수립함** | **DB mutation 아님** | ❌ |
| `closeConnection` | `:723` → `WebDataSourceUtils.disconnectDataSource` | 프로젝트 접근성 | 연결 종료 | **DB mutation 아님** — 명시적 rollback 시도, commit 없음 (§6C.5) | ❌ 복구 경로로 분류 |
| `setConnectionNavigatorSettings` | `:811` | 프로젝트 접근성 | 없음 | **DB mutation 아님** | ❌ |
| `clearConnectionNavigatorSettings` | `:836` | 동상 | 없음 | **DB mutation 아님** | ❌ |
| `setObjectSettingsForDatasource` | `:853` | 동상 | 없음 | **DB mutation 아님** | ❌ |
| `createConnectionFolder` | `:750` | 동상 | 없음 | **DB mutation 아님** | ❌ |
| `deleteConnectionFolder` | `:790` | 동상 | 없음 | **DB mutation 아님** | ❌ |

### 6A.1 우회 관점 요약

- **직접 DB 상태를 바꾸는 Connection mutation 은 없다.** `CONFIRMED BY STATIC CODE`
- 실질 위험은 **통제되지 않은 신규 Connection 생성**이다(§7.10).
  `createConnection` / `copyConnectionFromNode` 로 만든 connectionId 는
  우리 TEMP_WRITE 권한 테이블에 존재하지 않으므로,
  **"미등록 = READ_ONLY"** 기본값이 없으면 정책 밖 DB 접근이 가능해진다.
- **`readOnly` 플래그가 클라이언트 입력으로 설정되지만, 권한 게이트가 앞을 막는다.** `STATIC VERIFIED`

  ```java
  // CB:io.cloudbeaver.model/src/io/cloudbeaver/WebConnectionConfigInputHandler.java:94   (update 경로)
  dataSource.setConnectionReadOnly(input.isReadOnly());
  // 동 파일 :109  (create 경로)
  newDataSource.setConnectionReadOnly(input.isReadOnly());
  ```

  일반 사용자는 GLOBAL 프로젝트에서 `DATA_SOURCES_VIEW` 만 보유하므로
  (`LocalResourceController.java:212-214`) `updateConnection` 게이트에서 거부된다.
  → **§7.11 은 DISPROVED.** 전체 추적은 §6B 참조.

  남는 설계 제약: `DATA_SOURCES_EDIT` 보유자는 이 플래그를 변경할 수 있으므로
  **우리 정책의 판정 근거로 `connectionReadOnly` 를 사용하지 않는다.**

---

## 6B. `updateConnection` readOnly 자가 해제 경로 — 전체 추적

3차 재검증 항목. 2차에서 제기한 §7.11(HIGH 조건부)의 사실관계를 확정한다.

### 6B.1 호출 경로

```text
GraphQL updateConnection
  └─ WebServiceBindingCore.java:120   dataFetcher (권한 래퍼 없음)
       └─ ★ java.lang.reflect.Proxy — WebServiceBindingBase.invoke   :198-216
            ├─ WebActionSet   → checkServicePermissions            :203-205
            ├─ WebAction      → checkActionPermissions             :207-209
            └─ WebProjectAction → checkObjectActionPermissions     :211-213   ★ 게이트
                 └─ 통과 시에만 method.invoke(impl, args)          :217
                      └─ WebServiceCore.updateConnection            :472
                           └─ WebSessionProjectImpl.updateConnection :313
                                ├─ getWebConnectionInfo(connectionId)          :315
                                ├─ getInputConfigHandler(config).updateDataSource(dataSource)  :320
                                │    └─ WebConnectionConfigInputHandler.java:94
                                │         dataSource.setConnectionReadOnly(input.isReadOnly())
                                │              └─ DataSourceDescriptor.setConnectionReadOnly:481-483
                                ├─ registry.updateDataSource(dataSource)       :323
                                │    └─ DataSourceRegistryRM.persistDataSourceUpdate:71-87
                                │         (예외를 삼키고 lastError 에 저장)
                                └─ registry.checkForErrors()                   :324
                                     └─ DataSourceRegistry.java:1034-1042 (lastError 재throw)
```

### 6B.2 질문별 답변

| 질문 | 답 | 근거 | 상태 |
| --- | --- | --- | --- |
| 일반 사용자가 `updateConnection` 을 직접 호출할 수 있는가? | **아니오** (GLOBAL/SHARED 프로젝트에 `DATA_SOURCES_EDIT` 가 없으면 차단). 자신의 PRIVATE 프로젝트에서는 가능 | `DBWServiceCore.java:144`; `LocalResourceController.java:212-214, 227` | `STATIC VERIFIED` |
| 서버에서 `DATA_SOURCES_EDIT` 를 검사하는가? | **예.** 어노테이션 기반 리플렉션 프록시에서 검사 | `DBWServiceCore.java:144` + `WebServiceBindingBase.java:211-213, 286-289` | `STATIC VERIFIED` |
| `RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT` 와 `RMProjectPermission.DATA_SOURCES_EDIT` 는 같은 권한인가? | **예.** 동일 id `"project-datasource-edit"` | `RMConstants.java:25`; `RMProjectPermission.java:26` | `STATIC VERIFIED` |
| `supportsCustomConnections` 가 실제 서버측 차단 조건인가? | **예 — UI 조건이 아니다.** 게이트 내부에서 private project 접근을 거부한다 | `WebServiceBindingBase.java:277-281` | `STATIC VERIFIED` |
| descriptor 가 영속화보다 먼저 변경되는가? | **예** (`:320` 변경 → `:323` 영속화) | `WebSessionProjectImpl.java:320-323` | `STATIC VERIFIED` |
| 영속화 실패 시 descriptor 가 rollback 되는가? | **아니오** | `WebSessionProjectImpl.java:322-327`; `DataSourceRegistryRM.java:71-87` | `STATIC VERIFIED` |
| 변경된 `connectionReadOnly` 가 같은 세션 `hasModifyPermission()` 에 즉시 반영되는가? | **예.** 필드를 직접 읽으므로 캐시 없음 | `DataSourceDescriptor.java:477-479, 487-495` | `STATIC VERIFIED` |
| 다른 세션/사용자로 확산되는가? | 세션마다 별도 `DataSourceDescriptor` 이므로 **즉시 확산은 없다.** 단 영속화가 성공하면 이후 세션에 반영된다 | `WebSessionProjectImpl.java:122-132` (§1) | `STATIC VERIFIED` |
| 이 경로로 Data Editor / Metadata mutation 이 가능해지는가? | 권한이 있는 사용자에 한해 **가능** (`connectionReadOnly=false` → `EDIT_DATA`/`EDIT_METADATA` 회복). 권한 없는 사용자는 게이트에서 차단 | `DataSourceDescriptor.java:487-495` | `STATIC VERIFIED` (권한자) / `NOT VERIFIED` (실행) |

### 6B.3 판정

**권한 우회로서는 DISPROVED.** 서버측 게이트가 존재한다.

`NOT VERIFIED` 로 남는 조건:
1. 관리자가 SHARED 프로젝트에 `DATA_SOURCES_EDIT` 를 부여한 사용자가
   해당 프로젝트의 운영 Connection `readOnly` 를 해제할 수 있는지 (`getRmProjectPermissions` 경로)
2. §7.14 rollback 부재의 실제 재현
3. 위 1·2 이후 Data Editor mutation 이 실제로 성공하는지

### 6B.4 Enforcement Set 반영

권한 우회가 아니므로 `updateConnection` 을 **필수 enforcement 지점으로 포함하지 않는다.**
대신 다음 두 가지를 설계 제약으로 기록한다.

- **우리 정책은 `connectionReadOnly` 플래그를 판정 근거로 사용하지 않는다.**
  이 플래그는 `DATA_SOURCES_EDIT` 보유자가 변경할 수 있으므로 신뢰 기반이 될 수 없다.
- Option C(DB session read-only)를 채택하면 이 플래그가 보안 경계가 되므로,
  그 경우에만 `updateConnection` 에 방어 지점을 추가해야 한다(§9 조건부 목록).

---

## 6C. SQL Context 와 Pending Transaction 수명

3차 재검증 항목. 2차 문서에서 `NOT VERIFIED` 로 남겼던 부분을 정적으로 확정한다.

### 6C.1 호출 경로

```text
sqlContextDestroy (GraphQL)
  └─ WebServiceSQL.destroyContext                 CB:sql/impl/WebServiceSQL.java:411
       └─ WebSQLProcessor.destroyContext          CB:sql/WebSQLProcessor.java:164-169
            ├─ context.dispose()                  CB:sql/WebSQLContextInfo.java:201-203
            │    └─ resultInfoMap.clear();        ← 이것이 전부
            └─ contexts.remove(context.getId())   ← 래퍼 맵에서 제거
```

실행 컨텍스트 획득:

```java
// CB:sql/WebSQLProcessor.java:132-134
public DBCExecutionContext getExecutionContext() {
    return DBUtils.getDefaultContext(connection.getDataSource(), false);
}
```

```java
// DBV:model/DBUtils.java:2372-2385
public static DBCExecutionContext getDefaultContext(@Nullable DBSObject object, boolean meta) {
    ...
    return instance.getDefaultContext(new VoidProgressMonitor(), meta);
}
```

→ **모든 WebSQLContextInfo 가 DataSource 인스턴스의 동일한 default execution context 를 공유한다.**

### 6C.2 질문별 답변

| 질문 | 답 | 근거 | 상태 |
| --- | --- | --- | --- |
| SQL context destroy 가 JDBC execution context 를 닫는가? | **아니오** | `WebSQLProcessor.java:164-169`, `WebSQLContextInfo.java:201-203` | `STATIC VERIFIED` |
| pending transaction 을 commit 또는 rollback 하는가? | **둘 다 아니다.** `dispose()` 에 트랜잭션 관련 호출이 전혀 없다 | `WebSQLContextInfo.java:201-203` | `STATIC VERIFIED` |
| result metadata 만 제거하고 underlying connection 은 유지하는가? | **예.** `resultInfoMap.clear()` 만 수행 | 동상 | `STATIC VERIFIED` |
| 새 SQL context 가 같은 default execution context 를 다시 참조하는가? | **예.** `createContext`(`:141-149`)는 wrapper만 만들고, 실행 컨텍스트는 항상 `DBUtils.getDefaultContext(dataSource,false)` 로 조회 | `WebSQLProcessor.java:132-134, 141-149` | `STATIC VERIFIED` |
| TEMP_WRITE 만료/revoke 전 시작한 transaction 이 context destroy 후에도 유지되는가? | **예 — 유지된다** (물리 커넥션과 트랜잭션이 그대로 살아 있음) | 위 항목들의 논리적 귀결 | `STATIC VERIFIED` (메커니즘) / `NOT VERIFIED` (실측) |
| 이후 `commit` / `setAutoCommit(true)` / context 재생성으로 확정 가능한가? | **가능하다.** 새 context 의 `commitTransaction`(`:304`) / `setAutoCommit`(`:214`) 이 동일한 공유 컨텍스트의 txnManager 에 도달 | `WebSQLContextInfo.java:214, 304` | `STATIC VERIFIED` (경로) / `NOT VERIFIED` (실측) |

### 6C.3 두 개념의 구분 (문서 전체에서 혼동하지 않는다)

| 개념 | 대상 | 수행 주체 | 트랜잭션 영향 |
| --- | --- | --- | --- |
| **SQL wrapper/context destroy** | `WebSQLContextInfo` (서버측 result 메타데이터 래퍼) | `sqlContextDestroy` | **없음** — commit/rollback 하지 않음 |
| **JDBC execution context / physical connection close** | `DBCExecutionContext` / JDBC `Connection` | `closeConnection` → `WebDataSourceUtils.disconnectDataSource:170` → `dataSource.disconnect(monitor)` | **명시적 `connection.rollback()` 시도** — §6C.5 |

### 6C.5 `closeConnection` 의 rollback 경로 (4차 확정)

> **정정.** 3차 문서는 "`closeConnection` 이 commit 할 수 있어 필수 지점으로 승격될 수 있다"고
> 서술했다. **코드로 반증되었다.**

```java
// DBV:model.jdbc/JDBCExecutionContext.java:194-204
protected void disconnect(boolean removeContext) {
    synchronized (this) {
        // If we cannot determine if connection is in autocommit mode, assume that it is not
        if (connection != null && !dataSource.closeConnection(connection, purpose, !isAutoCommit(false))) {
```

```java
// DBV:model.jdbc/JDBCDataSource.java:427-446
if (doRollback) {
    try {
        // If we in transaction - rollback it.
        connection.rollback();
    } catch (Throwable e) { /* log only */ }
}
try {
    connection.close();
} catch (Throwable ex) { /* log only */ }
```

| 판정 항목 | 결과 | 근거 | 상태 |
| --- | --- | --- | --- |
| auto-commit 꺼진 connection 에서 명시적 rollback 시도 | **예** — `doRollback = !isAutoCommit(false)` | `JDBCExecutionContext.java:199`; `JDBCDataSource.java:427-431` | `STATIC VERIFIED` |
| auto-commit 상태 판단 실패 시 안전한 방향인가 | **예.** `isAutoCommit(false)` 가 예외 시 `false` 반환 → `!false = true` → rollback 시도. 코드 주석도 명시 | `JDBCExecutionContext.java:380-387, 198-199` | `STATIC VERIFIED` |
| 명시적 `commit()` 호출이 존재하는가 | **아니다 — 이 경로에 commit 호출이 없다** | `JDBCDataSource.java:416-458` 전체 | **DISPROVED** |
| rollback 실패 후 physical close 가 실행되는가 | **예.** 별도 `try` 블록이며 rollback 예외는 로그만 남긴다 | `JDBCDataSource.java:437-441` | `STATIC VERIFIED` |
| PostgreSQL/MySQL 드라이버에서 실제 rollback 성공 | — | — | **RUNTIME NOT VERIFIED** |
| 비-JDBC datasource 구현 | 별도 검증 필요 | `closeConnection` 은 `JDBCDataSource` 구현 | **NOT VERIFIED** |

**결론: `closeConnection` 은 write authorization 지점이 아니라 안전한 transaction 종료·복구 경로다.**

→ **조건부 enforcement 목록에서 제외한다.** (§9.6)
→ DBMS 별 종료 안전성 테스트는 여전히 필요하다(드라이버 rollback 실효성 확인 목적).

### 6C.4 설계 결론

**Context destroy 는 트랜잭션 경계가 아니다.**
따라서 다음이 성립한다.

- TEMP_WRITE 만료 시 "context 를 destroy 하면 안전하다"는 가정은 **성립하지 않는다.**
- 만료 후 확정 차단은 `commitTransaction`(`:304`)과 `setAutoCommit`(`:214`) 지점에서
  **반드시** 이루어져야 한다. context 수명에 의존할 수 없다.
- 공유 default context 구조상, 같은 Connection 의 **다른 SQL Editor 탭**이
  열어 둔 트랜잭션에도 동일 정책이 적용된다(QA.md §34 multi-tab 관련).

`NOT VERIFIED` 로 남는 항목:
- `closeConnection` / `dataSource.disconnect()` 의 pending transaction 처리 (DBMS·드라이버별)
- 세션 만료 시 정리 경로의 동일 동작
- 위 시나리오의 실제 DB 상태 확인

---

## 6D. Grouping 경로 — Gate Bypass 와 Injection 분리

3차 재검증 항목. 2차 문서의 §7.3을 "임의 SQL 실행 우회"로 단정하지 않고 분해한다.

### 6D.1 입력과 호출 경로

```text
asyncSqlGroupingResultSet(columnNames: [String!], functions: [String!], filter: SQLDataFilter, ...)
                                                     service.sql.graphqls:447-461
  └─ WebServiceSQL.getGroupingSqlResultSet            :796
       ├─ generateGroupByQuery(...)                   :765
       │    ├─ columnsList → resultsInfo.getAttributes() 로 필터링   :774-778   ★ metadata 검증
       │    ├─ functions == null ? List.of(DEFAULT_FUNCTION) : functions   :787   ★ 검증 없음
       │    └─ SQLGroupingQueryGenerator.generateGroupingQuery      :80
       │         ├─ subquery 분기:  sql.append(", ").append(func)   :123-124  ★ RAW 삽입
       │         └─ 비subquery 분기: SQLSemanticProcessor.parseExpression(func)  :151-152
       └─ WebSQLUtils.createAsyncTaskExecuteSqlQuery  :278   ← 권한 검사 없음
            └─ WebSQLProcessor.processQuery           :172
                 ├─ addFiltersToQuery (raw filter.where 결합)       :200
                 ├─ extractActiveQuery                              :218
                 └─ dbStat.executeStatement()                       :294
```

### 6D.2 항목별 확인

| 확인 항목 | 결과 | 근거 | 상태 |
| --- | --- | --- | --- |
| grouping function 이름이 allowlist 로 제한되는가? | **아니오.** GraphQL 타입은 `[String!]`, `DEFAULT_FUNCTION` 은 null 일 때의 기본값일 뿐 | `service.sql.graphqls:456`; `WebServiceSQL.java:787` | `STATIC VERIFIED` |
| column 이름이 metadata 로 검증·quoting 되는가? | **예.** 실제 result attribute 목록과 교집합만 사용. 이후 `prepareSqlString` 이 Column ref 를 quoted identifier 로 변환 | `WebServiceSQL.java:774-778`; `SQLGroupingAttribute.java:120-130` | `STATIC VERIFIED` |
| function 입력에 raw SQL fragment 를 삽입할 수 있는가? | **예.** subquery 분기에서 문자열 그대로 SELECT 목록에 append | `SQLGroupingQueryGenerator.java:123-124` | `STATIC VERIFIED` |
| column 입력에 raw SQL fragment 를 삽입할 수 있는가? | **아니오** — metadata 필터가 차단. (단 `prepareSqleString:124` 는 비-Column 표현식을 raw 로 반환하므로, metadata 필터가 유일한 방어선) | 동상 | `STATIC VERIFIED` |
| raw `where` 에 subquery / side-effect function 을 넣을 수 있는가? | **예** — grouping 도 `filter` 파라미터를 받아 `processQuery:200` 으로 전달 | `service.sql.graphqls:458`; §3 | `STATIC VERIFIED` |
| 최종 생성 SQL 을 parser 가 다시 분석하는가? | 파싱은 되지만(`extractActiveQuery:218`) **type 을 검사하는 코드가 없다** | `WebSQLProcessor.java:218-231` | `STATIC VERIFIED` |
| parser 실패 / UNKNOWN 일 때 실행되는가? | 현재는 분류 기반 차단이 아예 없으므로 실행된다. (분류기 도입 후에는 `UNKNOWN` → DENY 가능) | 동상 | `STATIC VERIFIED` |

### 6D.3 판정 — 4개로 분리

| 주장 | 판정 |
| --- | --- |
| **Gate bypass** — `getGroupingSqlResultSet` 이 `PERMISSION_EXECUTE_SCRIPTS` 게이트를 거치지 않음 | **STATIC VERIFIED** |
| **Arbitrary SQL expression injection** — `functions` 를 통한 raw 표현식 삽입 | **STATIC VERIFIED** (코드 경로). 실제 실행은 **NOT VERIFIED** |
| **Arbitrary SQL statement execution** — 임의 *문장*(DML/DDL) 실행 | **NOT VERIFIED.** 외곽 구조가 `SELECT ... GROUP BY` 로 고정되므로 문장 자체 교체는 확인되지 않았다 |
| **Side-effect mutation** — 삽입된 함수로 실제 DB 변경 | **NOT VERIFIED** (부작용 함수를 가진 테스트 DB 필요) |
| **Final SQL classification missing** — 생성된 최종 SQL 을 분류하지 않음 | **STATIC VERIFIED** |

### 6D.4 raw filter 주입의 하위 사례인가?

**아니다. 독립적인 벡터로 취급한다.** 근거:

- 파라미터가 다르다 — `functions` vs `filter.where`
- 코드 경로가 다르다 — `SQLGroupingQueryGenerator:123` vs `StandardSQLDialectQueryGenerator:180`
- 삽입 위치가 다르다 — SELECT 목록 vs WHERE 절
- `filter.where` 를 완전히 금지(§3.4 방식 (d))해도 `functions` 벡터는 그대로 남는다

→ §3.4의 대응책만으로는 grouping 경로를 막을 수 없다.

### 6D.5 Allowlist 필요성 판정 — **REQUIRED** (4차 확정)

**런타임 exploit 성공 여부와 allowlist 필요성을 연결하지 않는다.**
Fail-closed 정책(CLAUDE.md §2.1)상 **클라이언트가 임의 SQL expression 을 전달할 수 있다는
사실만으로 서버측 제한이 필요하다.**

| 주장 | 상태 |
| --- | --- |
| 클라이언트가 raw SQL expression 을 전달할 수 있음 | **STATIC VERIFIED** |
| 특정 DBMS 에서 mutation payload 가 실행됨 | **RUNTIME NOT VERIFIED** |
| server-side allowlist 필요 여부 | **REQUIRED** — 위 두 항목과 독립 |
| 중앙 statement classification 만으로 방어 가능한가 | **아니다** — 아래 참조 |

**중앙 classifier(§3A)로 방어되지 않는 이유:**
주입된 `SUM(x)` 나 `modifying_function()` 은 생성된 SQL 의 SELECT 목록 안에 들어가고,
전체 문장은 `SELECT ... GROUP BY ...` 이므로 `SQLQueryType.SELECT` 로 분류된다.
분류기는 문장 **종류**만 판정하고 SELECT 목록 내부 함수의 부작용은 판정하지 않는다(§5A).
→ **분류기와 allowlist 는 서로를 대체할 수 없다.**

**파서가 expression 을 성공적으로 파싱했다는 사실은 안전성 검증이 아니다.**
비-subquery 분기의 `SQLSemanticProcessor.parseExpression(func)`(`SQLGroupingQueryGenerator.java:151-152`)는
문법 유효성만 확인하며, 임의 함수 호출식도 정상 파싱된다.

### 6D.6 현재 프론트엔드 grouping 함수 처리

| 항목 | 실제 구현 | 근거 |
| --- | --- | --- |
| 기본값 | 문자열 `'COUNT(*)'` | `webapp/packages/plugin-data-viewer-result-set-grouping/src/DEFAULT_GROUPING_QUERY_OPERATION.ts:8` |
| 입력 방식 | **자유 텍스트.** 사용자가 완성된 SQL 식을 직접 타이핑 | `DVGroupingColumnEditorDialog.tsx:43-63, 86` |
| placeholder | `"Enter function (e.g., SUM(salary), AVG(score))"` | `locales/en.ts:13` |
| 상태 타입 | `functions: string[]` | `IGroupingQueryState.ts:11`; `GroupingDataSource.ts:20,49` |
| 클라이언트측 allowlist | **없음** | 위 파일 전수 확인 |

→ **`COUNT`/`SUM`/`AVG`/`MIN`/`MAX` 는 enum 이 아니라 placeholder 예시 문구일 뿐이다.**
클라이언트는 **완성된 SQL expression 문자열**을 서버로 보낸다. `STATIC VERIFIED`

> ⚠ **기능 회귀 주의 (CLAUDE.md §22).** 현재 UI 는 임의 aggregate 식 입력을 **의도적으로** 허용한다.
> allowlist 도입은 이 기능을 축소한다. Phase 2에서 사용자에게 명시적으로 알려야 한다.

### 6D.7 Allowlist API 설계 (구현하지 않음 — 규칙만)

설계 기준과 충족 방안:

| 기준 | 설계 |
| --- | --- |
| 클라이언트가 완성된 SQL expression 을 보내지 않음 | `functions: [String!]` 대신 구조화 입력 도입 |
| function identifier 또는 enum 만 전송 | `enum SQLGroupingFunction { COUNT, COUNT_ALL, SUM, AVG, MIN, MAX }` |
| 서버가 허용된 aggregate function 을 선택 | enum → dialect 표현식 매핑을 서버 보유 |
| column 은 서버 확인 metadata attribute 만 | 기존 `WebServiceSQL:774-778` 필터 재사용 (이미 안전) |
| dialect 별 SQL 표현식은 서버 생성 | `SQLDialect` 기반 서버측 생성 |
| function argument 에 raw SQL 불허 | argument 는 **컬럼 인덱스 또는 검증된 컬럼명만** |
| 알 수 없는 function 은 DENY | enum 외 값 → `DBWebException` |
| 빈 목록 처리 | 빈 목록 → `COUNT_ALL` 기본값 (현재 `functions == null` 동작과 동일) |
| backward compatibility | 기존 `functions: [String!]` 는 deprecated 유지. **서버에서 문자열을 enum 으로 파싱 시도하고 실패 시 DENY** (fail-closed). 정규화 불가한 문자열은 거부 |
| alias 도 서버가 안전하게 생성 | 기존 `makeGroupFunctionAlias`(`:186-198`)는 영숫자·`_` 만 남기므로 이미 안전. enum 기반이면 더 단순해짐 |

제안 입력 형태 (설계안):

```graphql
input SQLGroupingFunctionInput {
    function: SQLGroupingFunction!
    "Ordinal position of a column in the source result set. Omit for COUNT_ALL"
    columnIndex: Int
}
```

> 운영·공유 DB 에서 mutation payload 를 실행하는 검증은 수행하지 않았다.
> 폐기 가능한 테스트 DB 가 준비된 뒤에만 진행한다.

---

## 7. Security Gaps

### 7.1 [CRITICAL] Execution Plan을 통한 임의 SQL 실행

`WebServiceSQL.asyncSqlExplainExecutionPlan`(`:708-730`) 메서드 본문 전체를 재확인했다.
**권한 검사가 전혀 없다.** `PERMISSION_EXECUTE_SCRIPTS` 조차 검사하지 않는다.
`CONFIRMED BY STATIC CODE`

`WebSQLProcessor.explainExecutionPlan`(`:893-926`)은 사용자 SQL과
GraphQL `configuration: Object!` 를 그대로 planner에 전달한다(`:916-918`).

```java
// DBV:plugins/org.jkiss.dbeaver.ext.postgresql/.../plan/PostgreExecutionPlan.java:103-126
explainStat.append("EXPLAIN (FORMAT XML");
for (Map.Entry<String, Object> entry : ... parameters.entrySet()) {
    ...
    if (CommonUtils.toBoolean(entry.getValue())) {
        explainStat.append(",").append(key);        // ← ANALYZE 가 여기로 들어감
    }
}
explainStat.append(") ").append(query);
```

`PostgreQueryPlaner.java:45` — `public static final String PARAM_ANALYSE = "ANALYZE";`

공격:

```text
mutation {
  asyncSqlExplainExecutionPlan(
    connectionId: "...", contextId: "...",
    sql: "UPDATE access_control_test SET value='ATTACK' WHERE id=1",
    configuration: { ANALYZE: true }
  ) { id }
}
```

→ `EXPLAIN (FORMAT XML,ANALYZE) UPDATE ...` 실행.
PostgreSQL에서 `EXPLAIN ANALYZE` 는 대상 문장을 실제로 실행한다.

상태: `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED` — **Phase 3 최우선 검증 대상**

이 경로는 우리 기능뿐 아니라 upstream의 기존 `connectionModifyRestrictions` 설정도 우회한다.

### 7.2 [HIGH] `asyncReadDataFromContainer` 무검사

§3.2 참조. 메서드 전체에 권한 검사 부재. `CONFIRMED BY STATIC CODE`

### 7.3 [HIGH] `asyncSqlGroupingResultSet` — gate bypass + `functions` 표현식 주입

§6D 에서 5개 주장으로 분해했다. 요약:

| 주장 | 상태 |
| --- | --- |
| EXECUTE_SCRIPTS gate bypass | **STATIC VERIFIED** |
| `functions` raw 표현식 주입 | **STATIC VERIFIED** (경로) / **NOT VERIFIED** (실행) |
| 임의 *문장*(DML/DDL) 실행 | **NOT VERIFIED** |
| 부작용 함수로 실제 DB 변경 | **NOT VERIFIED** |
| 최종 SQL 분류 부재 | **STATIC VERIFIED** |

`functions` 는 `filter.where` 와 **독립적인 벡터**이므로 별도 allowlist 가 필요하다(§6D.4).

### 7.4 [HIGH] raw `filter.where` 부작용 함수

§3 참조. `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED`

### 7.5 [HIGH] `SELECT` 분류를 통과하는 부작용 문장

§5.3 참조. `SELECT modifying_function()`, data-modifying CTE.
`NOT RUNTIME VERIFIED`

### 7.6 [HIGH] `setAutoCommit(true)` 암시적 COMMIT

§4.2 참조. `STATICALLY PLAUSIBLE / NOT RUNTIME VERIFIED`

### 7.7 [MEDIUM] COMMIT API 무검사

`WebSQLContextInfo.commitTransaction:303` — 권한 검사 없음. `CONFIRMED BY STATIC CODE`

### 7.8 [MEDIUM] 확인 다이얼로그는 보안 장치가 아님

`WebSQLProcessor.confirmDangerousQueryIfNeeded:1300-1305`:

```java
Boolean skipConfirmations = webSession.getAttribute(WebSQLConstants.SKIP_TASK_CONFIRMATIONS_ATTR);
if (skipConfirmations != null && skipConfirmations) {
    return true;
}
```

세션 속성으로 무력화되며, 사용자 preference(`CONFIRM_DANGER_SQL_KEY`, `:1328`)로도 끌 수 있다.
`CONFIRMED BY STATIC CODE` — **보안 통제로 오인하면 안 된다.**

### 7.9 [MEDIUM] `connectionReadOnly` 의 부분적 효과

```java
// DBV:plugins/org.jkiss.dbeaver.registry/.../DataSourceDescriptor.java:487-495
public boolean hasModifyPermission(@NotNull DBPDataSourcePermission permission) {
    if ((permission == PERMISSION_EDIT_DATA || permission == PERMISSION_EDIT_METADATA)
        && connectionReadOnly) {
        return false;
    }
    ...
}
```

`connectionReadOnly == true` 여도 `PERMISSION_EXECUTE_SCRIPTS` 와 `PERMISSION_IMPORT_DATA` 는
**직접 차단되지 않는다.** `CONFIRMED BY STATIC CODE`

### 7.10 [MEDIUM] Custom Connection

`supportsCustomConnections` 기본값은 `true`(`CBAppConfig.java:80`).
`true` 이면 사용자의 private project가 생성되고(`LocalResourceController.java:177`)
`createConnection` 으로 임의 Connection 생성이 가능하다.
`false` 이면 private project가 목록에 없어 `getProjectById`(`WebServiceCore.java:887-893`)가
"Project not found" 로 거부한다.

> ⚠ **2차 문서 정정.** 2차에서는 "`createConnection` 등에 admin 검사가 없다"고 서술했다.
> 실제로는 `@WebProjectAction(requireProjectPermissions = {DATA_SOURCES_EDIT})` 가
> 리플렉션 프록시에서 강제된다(§6A 상단). `supportsCustomConnections` 도
> `WebServiceBindingBase.java:277-281` 에서 **서버측으로** private project 접근을 차단한다.
> `STATIC VERIFIED`

따라서 남는 위험은 "권한 없는 사용자가 Connection 을 만든다"가 아니라
**"`supportsCustomConnections=true` 인 기본 설정에서 사용자가 자신의 private project 에
통제되지 않은 Connection 을 정당하게 만들 수 있다"** 는 점이다
(private project 에서는 `DATA_SOURCES_EDIT` 가 부여된다 — `LocalResourceController.java:227`).

→ 우리 정책은 **등록되지 않은 connectionId = READ_ONLY** 를 기본값으로 두어야 fail-closed 가 유지된다.
운영상 `supportsCustomConnections=false` 권장.

### 7.11 [DISPROVED] `updateConnection` 을 통한 `readOnly` 자가 해제

> 2차 재검증에서 **HIGH(조건부)** 로 제기했던 항목이다.
> 3차 재검증에서 **서버측 방어가 존재함을 확인하여 DISPROVED 로 정정한다.**
> 상세 추적은 §6B 참조.

`WebConnectionConfigInputHandler.java:94` 가 클라이언트 `readOnly` 입력을
`setConnectionReadOnly()` 에 반영하는 것은 사실이다(`STATIC VERIFIED`).
그러나 그 지점에 도달하기 전에 **어노테이션 기반 서버측 권한 게이트가 요청을 차단한다.**

```java
// CB:core/DBWServiceCore.java:144-149
@WebProjectAction(requireProjectPermissions = {RMConstants.PERMISSION_PROJECT_DATASOURCES_EDIT})
WebConnectionInfo updateConnection(
    @NotNull WebSession webSession,
    @Nullable @WebObjectId String projectId,
    @NotNull Map<String, Object> connectionConfig
) throws DBWebException;
```

일반 사용자는 GLOBAL 프로젝트에서 `DATA_SOURCES_VIEW` 만 갖는다
(`LocalResourceController.java:212-214`) → 게이트에서 `DBWebExceptionAccessDenied`.

**남은 실제 문제**는 권한 우회가 아니라 **오류 처리 fail-open** 이며, §7.14로 분리했다.

설계 결론은 그대로 유효하다:
**우리 TEMP_WRITE 판정 근거를 `connectionReadOnly` 플래그에 두어서는 안 된다.**
판정은 별도 권한 저장소에서 `User + Connection + expires_at` 로 수행한다.

### 7.14 [LOW] `updateConnection` persistence 실패 시 descriptor rollback 없음

`WebSessionProjectImpl.updateConnection:313-329` 는 descriptor를 **먼저 변경한 뒤** 영속화한다.

```java
getInputConfigHandler(config).updateDataSource(dataSource);   // :320  ← descriptor 먼저 변경
connectionInfo.setCredentialsSavedInSession(null);            // :321
try {
    registry.updateDataSource(dataSource);                    // :323
    registry.checkForErrors();                                // :324
} catch (DBException e) {
    throw new DBWebException("Failed to update connection", e);  // :326  ← rollback 없음
}
```

`DataSourceRegistryRM.persistDataSourceUpdate:71-87` 은 영속화 예외를 **삼키고** `lastError` 에 저장한다.
`checkForErrors()`(`DataSourceRegistry.java:1034-1042`)가 이를 다시 던지지만,
**세션 내 descriptor 변경은 되돌려지지 않는다.**

→ 영속화 실패 시 GraphQL 은 오류를 반환하지만 해당 세션의 `connectionReadOnly` 는
변경된 상태로 남아 `hasModifyPermission(EDIT_DATA)` 결과가 바뀔 수 있다.

**severity LOW 근거**: 이 경로에 도달하려면 이미 `DATA_SOURCES_EDIT` 권한이 있어야 하며,
그 권한이 있으면 정상 경로로도 동일한 변경이 가능하다. 권한 상승이 아니라
방어 심층성(defense-in-depth) 및 상태 일관성 문제다.

상태: 코드 경로 `STATIC VERIFIED` / 실제 재현 `NOT VERIFIED`

### 7.12 [LOW] `sqlContextSetDefaults`

`WebSQLContextInfo.setDefaults:149` — 권한 검사 없음.
`USE` / `SET search_path` 수준이며 데이터 변경은 아니다. `CONFIRMED BY STATIC CODE`

### 7.13 미검증 영역

- AI 서비스(`io.cloudbeaver.service.ai`)에서 CloudBeaver 번들 내 직접 SQL 실행은 발견되지 않았으나,
  DBeaver `model.ai` 의 `AIToolboxRegistry` 를 통한 간접 실행 가능성은 `NOT VERIFIED`
- `io.cloudbeaver.service.fs`, `service.rm` — 파일/리소스 대상, 대상 DB 미변경으로 판단하나 `NOT VERIFIED`
- distributed 모드 전용 경로 — CE 범위 밖으로 간주하여 미조사

---

## 8. Common Enforcement Point

### 결론: **Common Enforcement Point: NO**

> **단 하나의 공통 서버측 실행 지점은 존재하지 않는다.** `CONFIRMED BY STATIC CODE`

네 경로가 서로 다른 추상화로 분기하며 합류하지 않는다.

| 경로 | 최종 실행 API |
| --- | --- |
| SQL Editor | `DBCStatement.executeStatement()` |
| Data Editor | `DBSDataManipulator.ExecuteBatch.execute()` |
| Import | `DatabaseTransferConsumer` → `ExecuteBatch` |
| DDL | `DBEPersistAction` → `DBCSession.prepareStatement` |

CloudBeaver Service 계층의 여러 지점을 사용하는 방식은 공통 지점이 아니라
**분산 enforcement set (distributed enforcement set)** 이다. 문서 전체에서 이 표현을 사용한다.

### 8.1 세 방식 비교 (3차 재작성)

| 평가 항목 | **A. Service 계층 분산 enforcement** | **B. 최종 SQL 생성 이후 중앙 classification** | **C. DB session read-only 보완 통제** |
| --- | --- | --- | --- |
| 적용 위치 | §9.1의 9개 지점 + §9.2 B2 | `WebSQLProcessor.processQuery` `:218`~`:294` (§9.3 C1) | `JDBCDataSource:260-263` (커넥션 수립 시) |
| 커버 mutation path | SQL Editor, Data Editor, Import, DDL(DROP/RENAME), Explain, Grouping, Container read, Commit, autoCommit | `asyncSqlExecuteQuery`, `asyncSqlGroupingResultSet` **2경로만** (`processQuery` 로 합류하는 것) | 이론상 해당 커넥션의 **모든** 경로 |
| 커버 못 하는 path | `SELECT volatile_fn()` 등 분류 불가 부작용; upstream 신규 API | Data Editor(batch API, SQL 문자열 없음), Import, DDL, `readDataFromContainer`, Explain, transaction | `isConnectionReadOnlyBroken()==true` 드라이버 (DB2/SQLite/ClickHouse≥0.8) |
| User + Connection 격리 | ✅ 세션별 descriptor + 요청 시점 판정 (§1) | ❌ 인가 정보 없음 — 분류만 담당 | ✅ 세션별 커넥션이므로 격리는 되나, 시간축 제어 불가 |
| 만료·revoke 즉시성 | ✅ 요청마다 재평가 가능 | 해당 없음 (인가 아님) | ❌ **불가** — 커넥션 수립 시 1회. 전환에 reconnect 필요 |
| parser failure fail-closed | ✅ `UNKNOWN`→DENY 구현 가능 (§5.2) | ✅ 동일 지점에서 처리 | 해당 없음 (DB가 판단) |
| raw filter / 생성 SQL 처리 | ⚠ 진입점에서는 filter 미반영 → B 없이는 불완전 | ✅ **유일하게 최종 SQL 을 볼 수 있다** (§3.2) | ✅ 부작용 함수까지 DB가 차단 |
| transaction commit / autoCommit | ✅ `:304`, `:214` 에서 차단 가능 | ❌ SQL 문장이 아니므로 범위 밖 | ⚠ read-only 세션이면 애초에 write 불가하나, 전환 즉시성 문제 잔존 |
| reconnect 필요 여부 | ❌ 불필요 | ❌ 불필요 | ✅ **필요** — CLAUDE.md §10 / QA.md §33 과 충돌 |
| Platform 수정 필요 | ❌ 없음 | ❌ 없음 | ❌ 없음 (기존 기능 활용) |
| upstream 충돌 범위 | 중간 — 5개 파일 (§9.9) | 낮음 — 1개 파일 | 낮음 — 설정/세션 초기화 |
| 수정 파일 수 | 4 (A 단독 시) | 1 | 0~1 |
| 단일 장애 지점 / 누락 위험 | **누락 위험 높음** — 3차 재검증에서 grouping·container-read·autoCommit 등 지점을 계속 추가 발견 | **단일 지점 SPOF** — 여기만 우회되면 2경로 전부 뚫림. 반면 누락 위험은 낮음 | 드라이버 의존. 조용히 무효화될 수 있음 |
| 상태 | STATIC VERIFIED (경로) / NOT VERIFIED (실효성) | STATIC VERIFIED / NOT VERIFIED | **NOT VERIFIED** — 어느 드라이버도 미확인 |

### 8.2 Option B(Platform 저수준) — STOP 유지

원래 검토한 "DBeaver Platform `DBCSession.prepareStatement` 수준 단일 enforcement" 는
별도 repository(`dbeaver`) 수정을 요구한다.

CLAUDE.md §28 중단 조건에 **정면으로 해당**한다.

- "DBeaver Platform 내부 변경이 필요함"
- "CloudBeaver CE 외부 repository 수정이 필요함"

→ **STOP 판정 유지. 구현하지 않는다.**
(위 8.1 표의 B는 Platform 수정이 아니라 **CloudBeaver 내부의 최종 SQL 분류 지점**을 의미한다.
두 개념을 혼동하지 않도록 8.1의 B는 "중앙 classification" 으로 명명했다.)

### 최종 추천

**A + B 를 함께 채택한다. C 는 "채택 확정"이 아니라 "함수 호출을 허용한다면 필요할 수 있는
보완 통제"다.** — 세 방식은 배타적이지 않다.

> **Option C 필요성 ≠ Option C 채택 (5차 명확화).**
> - C 의 **필요성**은 §5A.2 에 따라 정적으로 성립한다: classifier 는 함수 부작용을 판별할 수 없으므로,
>   **함수 호출을 허용하는 정책(§5A.3 의 3번)** 을 택하면 C 또는 동등한 DB 레벨 통제가 필요하다.
> - C 의 **채택 여부는 아직 미결**이다. §5A.3 에서 "함수 호출 전면 차단"(1번)이나
>   "내장 함수 allowlist"(2번)를 택하면 C 없이도 성립할 수 있다.
> - 또한 C 의 **실효성**(PG/MySQL 드라이버의 `setReadOnly` 강제력)은 `NOT VERIFIED`(§10, §15.2 4번).
> → 따라서 "A+B 는 채택 확정, C 는 정책·런타임 결과에 따라 결정" 이 정확한 표현이다.

역할 분담:

| 관심사 | 담당 | 이유 |
| --- | --- | --- |
| **인가** (누가 / 어느 connection / 만료 여부) | **A** — Service 계층 9+1 지점 | 세션·프로젝트 문맥이 있고 요청마다 재평가 가능 |
| **SQL 성격 판정** (READ / DML / DDL / UNKNOWN) | **B** — `processQuery` 중앙 1지점 | filter 가 결합된 **최종 SQL** 을 볼 수 있는 유일한 위치 |
| **분류 불가 부작용** (`SELECT volatile_fn()`) | **C (조건부)** — DB session read-only | 애플리케이션 계층에서 원리적으로 판별 불가 — 단 함수 호출을 허용할 때만 관련 |

A 없이 B만 두면 Data Editor·Import·DDL·transaction 이 전부 무방비다.
B 없이 A만 두면 filter 부작용, grouping 주입, **복수 statement blob(§3C)** 이 검사에서 누락된다.
→ **A와 B는 둘 다 채택 확정.** C 는 §5A.3 함수 정책 결정 후 판단.

C 의 제약 (변경 없음):
- READ_ONLY 세션에서만 적용하고, TEMP_WRITE 부여/만료 시 플래그 전환에 의존하지 않는다.
- **만료 즉시성은 전적으로 A가 책임진다.**
- TEMP_WRITE 사용자의 커넥션은 처음부터 read-only 로 열지 않는다.
- C 를 채택하면 `connectionReadOnly` 가 보안 경계가 되므로
  `updateConnection` 방어 지점을 추가해야 한다(§6B.4, §9.6).

> **런타임 검증 전이므로 이 구성의 안전성이 확정되었다고 표현하지 않는다.**
> 특히 §7.1(EXPLAIN ANALYZE), §5.3(SELECT 부작용), §4.2(autoCommit),
> §6C(transaction lifecycle), §6D(grouping injection)는
> 실제 DB로 재현 확인해야 설계가 확정된다.

---

## 9. Enforcement Matrix (4차 갱신)

> **정정 이력**
> - 1차: "upstream 7개 파일 × 1~3줄" — 파일 수와 지점 수를 혼동. 틀렸다.
> - 2차: "4개 파일 / 14개 지점" — 중복(`asyncSqlSetAutoCommit` + `setAutoCommit`),
>   복구 경로(`rollbackTransaction`), 비실행 경로(`updateResultsDataBatchScript`),
>   미검증 경로(`setDefaults`)를 모두 같은 층위로 셈했다. **확정 구현 범위로 표현한 것도 잘못이다.**
> - 3차: 아래와 같이 **범주별로 분리**하고, 단일 숫자로 단정하지 않는다.

### 9.1 범주 A — 필수 정책 검사 지점 (직접 mutation 또는 확정)

| 사용자 진입 API | 클래스·메서드 | 최종 DB 실행 API | 직접 mutation | 기존 권한 검사 | User+Conn 결합 | 실행시점 만료검사 | 최종 SQL 생성 위치 | 분류기 적용 위치 | 중앙화 | 중복 | 추천 조치 | 정적 | 런타임 | 위험도 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `asyncSqlExecuteQuery` | `WebServiceSQL.asyncExecuteQuery:594` | `dbStat.executeStatement()` `WebSQLProcessor:294` | ✅ | EXECUTE_SCRIPTS `:608` (과잉) | ❌ | ✅ | `processQuery:200` (filter 결합 후) | §3A.4 C1-a/C1-b | ✅ → C1 | — | 분류 기반 판정으로 교체 | STATIC VERIFIED | NOT VERIFIED | CRITICAL |
| `asyncUpdateResultsDataBatch` / `updateResultsDataBatch` | `WebServiceSQL.updateResultsDataBatch(private):509` | `DBSDataManipulator.ExecuteBatch` `WebSQLProcessor:629` | ✅ | EDIT_DATA `:522` ✅ | ❌ | ✅ | SQL 문자열 없음 (batch API) | 적용 불가 | ❌ | — | 기존 검사에 TEMP_WRITE 추가 | STATIC VERIFIED | NOT VERIFIED | HIGH |
| `dataTransferImportDataIntoResults` + 업로드 servlet | `WebServiceDataTransfer.runImportDataTask:270` | `DatabaseTransferConsumer.fetchStart:177` | ✅ | IMPORT_DATA 2회 (`:249`, `DatabaseTransferConsumer:545`) ✅ | ❌ | ✅ | SQL 문자열 없음 | 적용 불가 | ❌ | — | TEMP_WRITE 만료 재평가 추가 (§2.4) | STATIC VERIFIED | NOT VERIFIED | MEDIUM |
| `navRenameNode` / `navDeleteNodes` | `WebServiceNavigator.checkMetadataEditPermission:607` | `DBEPersistAction` | ✅ | EDIT_METADATA ✅ | ❌ | ✅ | 플랫폼 내부 | 적용 불가 | ❌ | — | 기존 검사에 TEMP_WRITE 추가 | STATIC VERIFIED | NOT VERIFIED | HIGH |
| `asyncSqlExplainExecutionPlan` | `WebServiceSQL.asyncSqlExplainExecutionPlan:708` | `planner.planQueryExecution()` `WebSQLProcessor:918` | ✅ (`ANALYZE`) | **없음** ❌ | ❌ | ✅ | `PostgreExecutionPlan:103-126` | 진입점(원본 sql) | ❌ | — | **신규 — 최우선** | STATIC VERIFIED | NOT VERIFIED | **CRITICAL** |
| `asyncSqlGroupingResultSet` | `WebServiceSQL.getGroupingSqlResultSet:796` | `processQuery:294` | ⚠ 표현식 주입 | **없음** ❌ | ❌ | ✅ | `SQLGroupingQueryGenerator:80-183` | §3A.4 C1-a/C1-b | ✅ → C1 | — | **신규** + `functions` allowlist (§6D) | STATIC VERIFIED | NOT VERIFIED | HIGH |
| `asyncReadDataFromContainer` | `WebServiceSQL.asyncReadDataFromContainer:625` | `dataContainer.readData()` `WebSQLProcessor:355` | ⚠ filter 경유 | **없음** ❌ | ❌ | ✅ | 컨테이너 내부 `appendConditionString` | **적용 불가** (SQL 문자열 미노출) | ❌ | — | **신규** + filter 정책 (§3.4 (d)) | STATIC VERIFIED | NOT VERIFIED | HIGH |
| `asyncSqlRowDataCount` | `WebServiceSQL.getRowDataCount:821` | `readDataFromContainer` 경유 | ⚠ filter 경유 | **없음** ❌ | ❌ | ✅ | 컨테이너 내부 | 적용 불가 | ❌ | — | **신규** + filter 정책 | STATIC VERIFIED | NOT VERIFIED | MEDIUM |
| `asyncSqlCommitTransaction` | `WebSQLContextInfo.commitTransaction:304` | `txnManager.commit(session)` | ✅ (확정) | **없음** ❌ | ❌ | ✅ | — | 해당 없음 | ❌ | — | **신규** — 만료 후 차단 | STATIC VERIFIED | NOT VERIFIED | HIGH |

**범주 A 필수 지점 수: 9**

추가 필수 설계 요구사항 (authorization 지점이 아니라 **입력 검증** 지점):

| 요구사항 | 위치 | 성격 | 근거 |
| --- | --- | --- | --- |
| grouping `functions` allowlist | `WebServiceSQL.generateGroupByQuery:765` (+ GraphQL 스키마) | **필수** — 조건부 아님. 중앙 classifier 로 대체 불가 | §6D.5 |
| 제어 명령 allowlist | `WebSQLProcessor:221-230` | **필수** — 분석되지 않은 명령 fail-closed | §3B.3 |
| `:248-251` 비-SQLQuery element 처리 | `WebSQLProcessor:248-251` | **필수** — 현재 `log+continue` 는 fail-open | §3A.2 |

### 9.2 범주 B — 중복 후보 (상·하위 중 하나만 선택)

| 후보 | 위치 | 장점 | 단점 |
| --- | --- | --- | --- |
| **B1-상위** `asyncSqlSetAutoCommit` | `WebServiceSQL.java:855` | 서비스 경계에서 차단 → GraphQL 진입점과 1:1. 감사 로깅에 세션 컨텍스트가 풍부 | `WebSQLContextInfo.setAutoCommit` 을 호출하는 다른 내부 경로가 생기면 누락 |
| **B2-하위** `setAutoCommit` | `WebSQLContextInfo.java:214` | 모든 호출자를 한 곳에서 커버 | 서비스 계층 문맥(세션/프로젝트) 접근이 상대적으로 간접적 |

**선택: B2 (하위, `WebSQLContextInfo.setAutoCommit:214`).**
근거: `WebSQLContextInfo` 는 이미 `processor.getWebSession()` 으로 세션에 접근할 수 있고
(`WebSQLContextInfo.java:205-207`), commit/rollback 도 같은 클래스에 있어
트랜잭션 정책을 한 클래스에 응집시킬 수 있다.
→ **중복 제거 후 이 항목은 1개 지점으로 계산한다.** (2차 문서는 2개로 이중 계산했다)

**주의:** `setAutoCommit(true)` 만 차단하고 `setAutoCommit(false)` 는 허용해야 한다.
`false` 는 트랜잭션 시작이므로 그 자체로 확정 행위가 아니다.

### 9.3 범주 C — 중앙 SQL 분류 지점 (4차에서 실행 단위까지 확정)

> **정정.** 3차 문서는 이를 "`:218` 파싱 직후, `:294` 실행 직전"으로 기술했다.
> **이 범위 표현은 불충분하며 틀렸다.** 상세 근거는 §3A.

| 후보 | 위치 | 문제 |
| --- | --- | --- |
| C2 공유 헬퍼 | `WebSQLUtils.createAsyncTaskExecuteSqlQuery:278` | 원본 sql 만 보임 → filter 미반영 |
| ~~C1-old~~ `:218` 직후 | `extractActiveQuery` 반환 직후 | **control command 변환 전**이라 변환된 SQL 을 못 봄 (§3A.1) |
| **C1** (확정) | §3A.4 의 2단 지점 | filter·변환·파라미터 치환 모두 반영 |

**결정: C1 = 2단 구조** (상세는 §3A.4)

- **C1-a 원자적 사전검증** — `WebSQLProcessor.processQuery` `:244` `tryExecuteRecover` 호출 **이전**,
  `mainQuery.getScriptElements()` 전체를 순회하여 **모든** element 를 분류. 하나라도 DENY면 전체 요청 거부.
- **C1-b 실행 직전 재확인** — 루프 내 `:248` 타입 체크 직후 ~ `:259` `DBUtils.makeStatement` **이전**.

**코드 위치는 1개 파일 1개 메서드지만, 검사 실행 단위는 "실행되는 모든 `sqlQuery` element 각각"이다.**
element 수는 요청마다 가변이므로 "지점 1개"라는 표현은 코드 삽입 위치만을 뜻한다.

C1 채택 시 범주 A의 `asyncSqlExecuteQuery`·`asyncSqlGroupingResultSet` 두 항목은
**인가 검사(누가/어느 connection/만료)** 만 서비스 계층에 남기고,
**SQL 분류**는 C1으로 이관한다.

**중앙 삽입 위치: 1개 파일(`WebSQLProcessor.java`) / 2개 검사 단계 / N개 element 검사**

### 9.4 범주 D — 항상 허용할 트랜잭션 복구 경로

| API | 위치 | 정책 |
| --- | --- | --- |
| `asyncSqlRollbackTransaction` | `WebSQLContextInfo.rollbackTransaction:344` | **항상 허용.** 변경을 되돌리는 방향이므로 write authorization 대상이 아니다 |
| `asyncSqlSetAutoCommit(false)` | `WebSQLContextInfo.setAutoCommit:214` | 허용 (트랜잭션 시작은 확정 행위가 아님) |

**복구 지점 수: 1** (rollback). write 지점으로 계산하지 않는다.
2차 문서는 `rollbackTransaction` 을 14개 목록에 포함시켜 write 지점처럼 셌다 — 잘못이다.

### 9.5 범주 E — SQL 만 생성하고 직접 실행하지 않는 경로

| API | 위치 | 실행 여부 | 조치 |
| --- | --- | --- | --- |
| `updateResultsDataBatchScript` | `WebServiceSQL.java:580` | ❌ **실행하지 않음** — `generateResultsDataUpdateScript` 로 문자열만 반환 (`WebSQLProcessor:587`) | 직접 mutation 지점과 **분리**. 기존 EDIT_DATA 검사(`:582`)는 유지하되 정보 노출 관점으로만 다룸 |
| `sqlGenerateResultSetQuery` / `asyncSqlGenerateEntityQuery` | `WebServiceSQL.java:283, 257` | ❌ 생성만 | 동상 |
| `metadataGetNodeDDL` / `metadataGetNodeExtendedDDL` | `WebServiceMetadata.java:49` | ❌ 생성만 (Query) | 조치 불필요 |

**이 범주는 write enforcement 지점으로 계산하지 않는다. (0개)**

근거: 생성된 스크립트를 실제로 실행하려면 §9.1의 실행 경로를 반드시 통과한다.

### 9.6 범주 F — 조건부 / 런타임 검증 후 결정

| 항목 | 위치 | 미검증 사항 | 포함 조건 |
| --- | --- | --- | --- |
| `sqlContextSetDefaults` | `WebSQLContextInfo.setDefaults:149` | ① session 상태 변경(`USE`/`SET search_path`)인지 ② durable DB mutation 인지 ③ 일부 DBMS 에서 **implicit commit** 을 유발하는지 — 세 가지를 구분해야 함. 모두 **NOT VERIFIED** | ②나 ③이 확인되면 포함. ①만이면 제외. **현재는 확정 지점으로 계산하지 않는다** |
| `updateConnection` | `DBWServiceCore.java:144` | 권한 게이트 존재 (§6B) | **Option C 채택 시에만** 포함 (`connectionReadOnly` 가 보안 경계가 되므로) |

**제외 확정 (4차):**

| 항목 | 제외 근거 |
| --- | --- |
| `closeConnection` | 명시적 `connection.rollback()` 시도, commit 호출 없음 → **복구 경로**로 재분류 (§6C.5). `STATIC VERIFIED` |
| `sqlContextDestroy` | commit/rollback 하지 않으며 트랜잭션 경계가 아님 (§6C). `STATIC VERIFIED` |

**조건부·미검증 지점 수: 2** (`setDefaults`, `updateConnection`)
— 3차의 3개에서 `closeConnection` 을 제외하여 정정.

### 9.7 범주 G — Connection configuration / 권한 관리 경로

| 항목 | 서버측 권한 | 신규 정책 |
| --- | --- | --- |
| `createConnection` / `copyConnectionFromNode` | `@WebProjectAction(DATA_SOURCES_EDIT)` ✅ | **직접 지점 아님.** "미등록 connectionId = READ_ONLY" 기본값으로 대응 |
| TEMP_WRITE grant / revoke API (신규) | 신규 구현 — ADMIN 필수 (CLAUDE.md §21) | 신규 번들에 포함. 기존 파일 수정 아님 |

### 9.8 집계 (단일 숫자로 단정하지 않음)

| 구분 | 수 | 비고 |
| --- | --- | --- |
| **필수 authorization 지점** | **9** | §9.1 |
| **autoCommit(true) 지점** | **1** | §9.2 B2 — 상·하위 2후보 중 하위 1개 선택 (중복 제거) |
| **개별 SQL 사전분류 지점** | **1 삽입 위치 / N statement** | §9.3 C1-a — 코드 위치 1곳. `parseScript` 로 최종 text 를 재분해해 **모든 statement 를 각각 검사**(§3C). `getScriptElements()` 아님 |
| **중앙화 가능한 SQL 실행 지점** | **1** | §9.3 C1-b (`makeStatement` 직전 재확인) |
| **grouping allowlist 검증 지점** | **1 (필수)** | §6D.5 — 조건부 아님. `WebServiceSQL.generateGroupByQuery:765` |
| **transaction commit 지점** | **1** | §9.1 `commitTransaction:304` |
| **항상 허용할 rollback 경로** | **1** | §9.4 — write 지점으로 세지 않음 |
| **connection close rollback 경로** | **1** | §6C.5 — write 지점 아님. 복구 경로 |
| **SQL 생성 전용(비실행) 경로** | **0** | §9.5 — write 지점으로 세지 않음 |
| **조건부·미검증 지점** | **2** | §9.6 (`setDefaults`, `updateConnection`) |
| **DBMS 런타임 검증 전용 경로** | **2** | `closeConnection` 드라이버 rollback 실효성, `setDefaults` implicit commit 여부 |

→ **인가 검사가 필요한 지점: 10** (필수 9 + autoCommit 1)
→ **필수 설계 요구사항 추가: grouping allowlist 1** (분류기로 대체 불가 — §6D.5)
→ **SQL 분류: 삽입 위치 1곳 + 실행 element 수만큼의 검사**
→ **런타임 검증 후 최대 2지점 추가 가능** (3차의 3개에서 정정)

### 9.9 수정이 예상되는 파일

| # | 파일 | 근거 |
| --- | --- | --- |
| 1 | `.../service/sql/impl/WebServiceSQL.java` | §9.1의 6개 항목 진입점 |
| 2 | `.../service/sql/WebSQLContextInfo.java` | commit(§9.1), setAutoCommit(§9.2 B2) |
| 3 | `.../service/sql/WebSQLProcessor.java` | §9.3 C1-a/C1-b 최종 SQL 분류 + `:248-251` fail-closed 교체 — **3차에서 확정** |
| 4 | `.../service/data/transfer/impl/WebServiceDataTransfer.java` | §9.1 `runImportDataTask` |
| 5 | `.../service/navigator/impl/WebServiceNavigator.java` | §9.1 `checkMetadataEditPermission` |

**확정 수정 파일: 5개** (2차의 "4개"는 `WebSQLProcessor` 를 미결로 둔 값이며 정정한다)

조건부로 추가될 수 있는 파일:

| 파일 | 조건 |
| --- | --- |
| `.../service/core/impl/WebServiceCore.java` | §9.6 `updateConnection` (Option C 채택 시) |
| `.../schema/service.sql.graphqls` | §6D.7 grouping 입력 타입 변경 — **후보.** allowlist 는 필수지만, 구현 방식(스키마 enum 변경 vs 서버측 문자열 파싱 후 거부)은 Phase 2에서 선택 |
| `webapp/packages/plugin-data-viewer-result-set-grouping/*` | §6D.7 클라이언트 입력 변경 (Phase 8 UI 작업) |

→ **확정 수정 파일: 서버 Java 5개.**
GraphQL 스키마 변경은 grouping allowlist 의 **구현 방식**에 달렸으므로 **후보**(security requirement 는 필수, 구현 대안은 Phase 2 선택).
`WebServiceCore.java`(updateConnection)는 Option C 채택 시에만 추가되는 **조건부** 파일.

**신규 fork 전용 번들 1개** (`io.cloudbeaver.service.access.control`)에
`AccessPolicyService`, `TempWritePermissionStore`, `StatementClassifier`,
`GroupingFunctionAllowlist`, `AccessAuditLogger` 를 둔다.

> 위 집계는 **정적 분석 기반 설계 추정치이며 확정된 구현 범위가 아니다.**
> §9.6의 런타임 검증 결과에 따라 변동된다.

---

## 10. DBMS 상태

> **런타임 테스트를 한 건도 하지 않았으므로 어떤 DBMS도 `VERIFIED` 또는 `SUPPORTED` 가 아니다.**
> JDBC read-only가 동작하지 않는 것과 애플리케이션 계층 enforcement 구현 가능성은 **별개**이다.

| DBMS | 애플리케이션 계층 enforcement (Option A) | JDBC read-only (Option C) | 종합 상태 |
| --- | --- | --- | --- |
| PostgreSQL | STATICALLY ANALYZED | NOT VERIFIED | **NOT VERIFIED** (1차 목표) |
| MySQL | STATICALLY ANALYZED | NOT VERIFIED | **NOT VERIFIED** (1차 목표) |
| MariaDB | STATICALLY ANALYZED | NOT VERIFIED | **NOT VERIFIED** (1차 목표) |
| Oracle | STATICALLY ANALYZED (경로 공통) | NOT VERIFIED | **NOT VERIFIED** |
| SQL Server | STATICALLY ANALYZED (경로 공통) | NOT VERIFIED | **NOT VERIFIED** |
| DB2 | STATICALLY ANALYZED (경로 공통) | **KNOWN UNSAFE** — `DB2DataSource.java:152` `isConnectionReadOnlyBroken()==true` | **NOT VERIFIED** / Option C 불가 |
| SQLite | STATICALLY ANALYZED (경로 공통) | **KNOWN UNSAFE** — `SQLiteDataSource.java:106` | **NOT VERIFIED** / Option C 불가 |
| ClickHouse (driver ≥ 0.8) | STATICALLY ANALYZED (경로 공통) | **KNOWN UNSAFE** — `ClickhouseDataSource.java:375` | **NOT VERIFIED** / Option C 불가 |

`isConnectionReadOnlyBroken()` 기본 구현은 `JDBCDataSource.java:739` 의 `return false`.
`CONFIRMED BY STATIC CODE`

정책적으로 지원 범위를 좁히기로 결정한 DBMS는 없다.
따라서 현재 `NOT SUPPORTED BY POLICY` 로 분류된 DBMS는 **없다.**

---

## 11. 기존 주요 발견 재검증

| # | 발견 | 상태 | 근거 |
| --- | --- | --- | --- |
| 1 | `asyncSqlExplainExecutionPlan` 권한 검사 누락 | **CONFIRMED BY STATIC CODE** | `WebServiceSQL.java:708-730` 본문 전체 재확인 |
| 2 | PostgreSQL `configuration.ANALYZE=true` 가 클라이언트 제어 | **CONFIRMED BY STATIC CODE** | `service.sql.graphqls` `configuration: Object!`; `PostgreQueryPlaner.java:45` |
| 3 | `EXPLAIN ANALYZE` 를 통한 mutation 가능성 | **NOT RUNTIME VERIFIED** | `PostgreExecutionPlan.java:103-126` 문자열 생성 확인. 실행 미확인 |
| 4 | `SELECT modifying_function()` 이 SELECT로 분류됨 | **NOT RUNTIME VERIFIED** | `SQLQuery.java:153-155` 분기 확인. 파서 테스트 미실행 |
| 5 | data-modifying CTE | **NOT RUNTIME VERIFIED** | 동상. 특히 `WITH ... (UPDATE ... RETURNING) SELECT` 미확인 |
| 6 | parser failure → `UNKNOWN` | **CONFIRMED BY STATIC CODE** | `SQLQuery.java:218-221` |
| 7 | `connectionReadOnly` 가 EXECUTE_SCRIPTS / IMPORT_DATA 를 직접 차단하지 않음 | **CONFIRMED BY STATIC CODE** | `DataSourceDescriptor.java:487-495` |
| 8 | confirmation dialog 는 보안 통제가 아님 | **CONFIRMED BY STATIC CODE** | `WebSQLProcessor.java:1300-1305, 1328` |
| 9 | Import 실행 시점 Connection permission 재검사 없음 | **DISPROVED** | `DatabaseTransferConsumer.java:541-546` 에 검사 존재. §13.1 참조 |
| 10 | `asyncSqlGroupingResultSet` 의 EXECUTE_SCRIPTS gate bypass | **STATIC VERIFIED** | `WebServiceSQL.java:796` → `WebSQLUtils.java:278` (검사 없음). §6D |
| 11 | grouping `functions` 를 통한 raw 표현식 주입 | **STATIC VERIFIED** (경로) / **NOT VERIFIED** (실행) | `SQLGroupingQueryGenerator.java:123-124`; `service.sql.graphqls:456`. §6D |
| 12 | grouping 을 통한 임의 *문장* 실행 | **NOT VERIFIED** | 외곽이 `SELECT ... GROUP BY` 로 고정. §6D.3 |
| 13 | `setAutoCommit(true)` 암시적 COMMIT | **STATIC VERIFIED** (경로) / **NOT VERIFIED** (드라이버 동작) | `JDBCExecutionContext.java:396-399`. §4.2 |
| 14 | `sqlContextDestroy` 가 pending transaction 을 commit/rollback 하지 않음 | **STATIC VERIFIED** | `WebSQLContextInfo.java:201-203`; `WebSQLProcessor.java:164-169`. §6C |
| 15 | 모든 SQL context 가 동일한 default execution context 를 공유 | **STATIC VERIFIED** | `WebSQLProcessor.java:132-134`; `DBUtils.java:2372-2385`. §6C |
| 16 | `updateConnection` 을 통한 `readOnly` 자가 해제 | **DISPROVED** | `DBWServiceCore.java:144` + `WebServiceBindingBase.java:211-213, 286-289`. §6B |
| 17 | 연결 CRUD 에 서버측 권한 검사 없음 | **DISPROVED** | 어노테이션 + 리플렉션 프록시로 강제됨. §6A |
| 18 | `supportsCustomConnections` 가 UI/config 조건에 불과 | **DISPROVED** | `WebServiceBindingBase.java:277-281` 에서 서버측 차단. §6A |

---

## 12. Phase 0 상태

```text
Phase 0: BLOCKED / INCOMPLETE
```

PLAN.md Phase 0 완료 조건("원본 코드 상태에서 정상 build/run")을 **충족하지 못했다.**

### 12.1 미충족 항목

| 항목 | 상태 |
| --- | --- |
| Backend build | ❌ FAILURE |
| Frontend bundle | ❌ FAILURE |
| Frontend test | ⚠ 부분 실패 (38/126 파일 load 실패) |
| CloudBeaver 로컬 실행 | ❌ 미수행 |
| 테스트 DB 연결 | ❌ 미수행 |
| SQL Editor 동작 확인 | ❌ 미수행 |
| Data Editor 동작 확인 | ❌ 미수행 |

### 12.2 환경

| 항목 | 값 | 비고 |
| --- | --- | --- |
| OS | Windows 11 (10.0.26200) | |
| `JAVA_HOME` | `C:\Program Files\Java\jdk-21.0.2` | CI와 동일 ✅ |
| `java` on PATH | 1.8.0_77 | ⚠ 불일치. Maven은 `JAVA_HOME` 사용 |
| Maven | 3.9.11 (`D:\apache-maven-3.9.11`) | |
| Node | v22.14.0 | ❌ CI는 24.13.1 |
| Yarn | 4.14.1 (corepack) | |

### 12.3 필수 사전 조건

`server/pom.xml:20` parent `relativePath` = `../../dbeaver`.
형제 디렉터리에 `dbeaver`, `dbeaver-common` 이 필요하다.

```text
D:\IdeaProjects\
  ├─ cloudbeaver\
  ├─ dbeaver\          ← clone 완료 (depth 1)
  └─ dbeaver-common\   ← clone 완료 (depth 1)
```

### 12.4 저장소 기준 공식 Windows 명령

Windows 공식 스크립트는 `deploy/build.bat` 이며, backend + frontend 를 모두 수행한다.

```text
Build (전체 — 공식 Windows 진입점):
    deploy\build.bat

Build (backend 단독 — build.bat 내부 명령, deploy/build.bat:26-27):
    cd server\product\aggregate
    mvn clean verify -Dheadless-platform

Build (frontend 단독 — build.bat 내부 명령, deploy/build.bat:50-62):
    cd webapp
    yarn
    cd packages\product-default && yarn run bundle
    cd ..\.. && yarn test

Run (build 성공 후):
    cd deploy\cloudbeaver
    run-cloudbeaver-server.bat
```

`deploy/build.bat` 는 `deploy/scripts/*` 를 `deploy/cloudbeaver/` 로 복사한다
(`copy scripts\* cloudbeaver`). 따라서 실행 스크립트의 최종 위치는
`deploy/cloudbeaver/run-cloudbeaver-server.bat` 이며,
**backend build가 성공해야만 생성된다.**
`build.bat` 마지막 줄도 동일하게 안내한다:
`"Cloudbeaver is ready. Run run-cloudbeaver-server.bat in cloudbeaver folder to start the server."`

`deploy/scripts/run-cloudbeaver-server.bat` 는
`server/plugins/org.jkiss.dbeaver.launcher*.jar` 를 찾아
`-product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf` 로 기동한다.
`CONFIRMED BY STATIC CODE`

#### `deploy/build.bat` 의 stale path 결함 (신규 발견)

`build.bat` 는 다음 경로를 참조한다.

```text
copy ..\config\DefaultConfiguration\GlobalConfiguration\.dbeaver\data-sources.json
     cloudbeaver\conf\initial-data-sources.conf
```

그러나 이 저장소에 `config/DefaultConfiguration/` 은 **존재하지 않는다.**
실제 파일 위치는 `config/GlobalConfiguration/.dbeaver/data-sources.json` 이며,
`deploy/build-backend.sh` 는 이쪽 경로를 사용한다.

```bash
cp -rp ../config/GlobalConfiguration/.dbeaver/data-sources.json cloudbeaver/conf/initial-data-sources.conf
```

→ `build.bat` 의 해당 `copy` 는 실패한다. 배치 파일에 이 줄의 오류 검사가 없어
빌드는 계속 진행되지만 `conf/initial-data-sources.conf` 가 생성되지 않는다.
`run-cloudbeaver-server.bat` 는 최초 기동 시 이 파일을 워크스페이스로 복사하므로
초기 데이터소스 구성이 누락될 수 있다.

상태: `CONFIRMED BY STATIC CODE` / 실행 영향은 `NOT RUNTIME VERIFIED`
(backend build 실패로 `build.bat` 를 끝까지 실행해보지 못함)

이는 upstream 스크립트의 문제이며 이번 작업에서 **수정하지 않았다.**

### 12.5 실행하지 못한 이유

**Backend build 실패로 서버 산출물(`deploy/cloudbeaver/`)이 생성되지 않았다.**
따라서 로컬 실행, 테스트 DB 연결, SQL Editor/Data Editor 동작 확인은 모두 수행 불가능했다.

### 12.6 Backend 빌드 실패 근본 원인

```text
[ERROR] Problems downloading artifact: osgi.bundle,org.jkiss.bundle.apache.dbcp,2.12.5.:
[ERROR]    SHA-512 hash is not as expected.
[ERROR]    Expected: ad9ebad4b19e946072df215c7e908e51bf00070c2e5791dd840873740f2896d1...
[ERROR]    found:    c87e787b0b6701d515c3c2e8135c241e71073b516ab0221c5db4263f6f4b1377...
```

진단 절차와 결과:

1. 로컬 Tycho 캐시의 jar 해시 → `c87e78...`
2. `curl` 로 원본 직접 재다운로드 → 동일하게 `c87e78...` → **로컬 캐시 손상 아님**
3. `artifacts.jar`(p2 메타데이터) 직접 확인 → `download.size=369102`, `sha-512=ad9eba...`
   실제 파일 크기도 369102 로 **일치**, 내용 해시만 다름
4. p2 mirror 리다이렉트 없음(HTTP 200 직접 응답)
5. `Last-Modified`: plugin jar `Thu, 13 Aug 2026 21:00:45 GMT`,
   `artifacts.jar` `Thu, 13 Aug 2026 21:00:46 GMT`

**결론**: `https://repo.dbeaver.net/p2/ce/26.2.0` 에 업로드된 jar과
메타데이터의 체크섬이 서로 다른 빌드 산출물이다.
크기 동일·내용 상이는 동일 구성 jar 재빌드(zip 내부 타임스탬프 차이) 시 전형적이다.

→ **우리 repository 밖의 upstream 배포 문제. fork 코드 수정으로 해결 불가.**

| 대응 방안 | 결과 |
| --- | --- |
| 시간을 두고 재시도 | **1순위 권장** — upstream 메타데이터 재생성 시 자동 해소 |
| `-Dtycho.p2.transport=ecf` | **시도함 → 동일 실패.** 전송 계층 문제가 아님 |
| 체크섬 검증 우회 | **권장하지 않음** — 공급망 무결성 검증 비활성화는 이 프로젝트 성격상 부적절 |
| 이전 버전 p2 저장소 고정 | upstream 추적성 훼손. 최후 수단 |

### 12.7 Frontend 빌드 실패

| 단계 | 결과 | 원인 |
| --- | --- | --- |
| `yarn install --immutable` | ❌ FAILURE | `react-data-grid@file:./artifacts` 체크섬 불일치로 lockfile 수정이 필요하다고 판정됨 |
| `yarn install` (일반) | ✅ SUCCESS | `yarn.lock` 2줄 변경(해당 체크섬만) → **분석 후 `git checkout` 으로 원복 완료** |
| `yarn bundle` | ❌ FAILURE | `nanoid@6.0.1` 의 ESM 서브패스(`url-alphabet/index.js`)를 해석하지 못함 |
| `yarn test` | ⚠ 부분 실패 | 테스트 결과 **471 passed / 0 failed / 8 skipped**. 단 126개 파일 중 38개가 load 실패 (`UNDECLARED_DEPENDENCY`, 예: `zod-validation-error@5.0.0` 이 `zod` 미선언) |

**원인 구분:**

- `--immutable` 실패: 파일 내용과 개행(LF)은 정상임을 확인했다
  (`git ls-files --eol` 결과 모두 `i/lf w/lf`).
  Yarn `file:` 프로토콜 tarball 패킹이 이 환경에서 다른 해시를 생성한 것으로 **추정**한다.
  파일 모드 비트 차이가 유력하나 **확정하지 못했다.**
  이는 **이 저장소의 `react-data-grid` 로컬 artifact 의존성에 국한된 현상**이며,
  "Windows에서 `yarn install --immutable` 을 쓸 수 없다"는 일반 명제로 확대 해석하지 않는다.
- `bundle` / `test` 실패: CI가 요구하는 Node 24.13.1 대신 22.14.0 을 사용한 것이 원인으로 **추정**한다.
  Node 24 환경에서 재현되는지 **확인하지 못했다.**

### 12.8 증거 보존 상태

| 항목 | 보존 여부 |
| --- | --- |
| Backend build 전체 로그 (1차, 2차) | 세션 임시 디렉터리에만 존재. **영구 보존 안 됨** |
| Frontend install/bundle/test 로그 | 동상. **영구 보존 안 됨** |
| 실패 메시지·해시값 | **이 문서에 인용 형태로 보존됨** |
| Build duration | `NOT RECORDED` (backend 1차 시도 03:49 min 관측치 외 미기록) |

Phase 3 이후 재현 검증을 위해 로그를 `docs/` 또는 별도 아티팩트로 보존하는 절차가 필요하다.

---

## 13. Corrections From Previous Analysis

이번 재검증에서 이전 문서의 오류 3건을 확인하고 정정했다.

### 13.1 [정정] Import 실행 시점 권한 재검사

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | "권한 검사(GraphQL)와 실행(파일 업로드 servlet)이 분리되어, Connection 단위 `PERMISSION_IMPORT_DATA` 의 실행 시점 재검사가 없다." severity **HIGH** |
| **수정된 내용** | `DatabaseTransferConsumer.initExporter()` 가 `fetchStart()` 에서 호출되며, 실제 데이터 기록 직전에 `PERMISSION_IMPORT_DATA` 를 **다시 검사한다.** 추가로 신규 테이블 생성 시 `DatabaseTransferUtils.ensureHasEditMetadataPermission()` 이 `PERMISSION_EDIT_METADATA` 를 검사한다. |
| **수정 근거** | `DBV:plugins/org.jkiss.dbeaver.data.transfer/src/org/jkiss/dbeaver/tools/transfer/database/DatabaseTransferConsumer.java:177`(호출부), `:541-546`(검사). `DatabaseTransferUtils.java:728-731`. |
| **아키텍처 영향** | 기존 구조의 결함이 아니므로 HIGH에서 제외. 그러나 TEMP_WRITE를 `hasModifyPermission` 과 분리된 `AccessPolicyService` 로 관리하면 이 기존 검사는 만료를 인지하지 못한다. 따라서 `runImportDataTask`(`:270`)에 **신규 정책 재평가를 추가해야 한다**(§9 지점 13). 기존 permission 검사와 신규 TEMP_WRITE 검사는 별개로 취급한다. |

### 13.2 [정정] Enforcement 규모 산정

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | "upstream 7개 파일 × 1~3줄 + 신규 번들 1개" |
| **수정된 내용** | 실제로는 **파일 4개 / enforcement 지점 14개**. 이전 값은 지점 수와 파일 수를 혼동했고, raw filter 경로(4·5·7번)와 autoCommit 경로(8·9번)를 누락했다. |
| **수정 근거** | §9 표. 각 메서드와 라인 번호를 직접 확인. |
| **아키텍처 영향** | 구현 범위가 이전 추정보다 크다. 특히 `WebSQLContextInfo.java` 가 새 수정 대상 파일로 추가되었다. upstream merge 비용 재평가 필요. |

### 13.3 [정정] Common Enforcement Point 판정 표현

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | "PARTIAL — 조건부 YES" |
| **수정된 내용** | 질문이 "단 하나의 공통 실행 지점이 존재하는가"이므로 답은 **NO**. Service 계층 다중 지점 방식은 "공통 지점"이 아니라 **분산 enforcement set** 이다. |
| **수정 근거** | §8. 네 경로가 서로 다른 최종 실행 API로 분기함을 확인. |
| **아키텍처 영향** | 판정 자체는 같지만, "공통 지점이 있다"는 오해는 **지점 누락 위험을 과소평가**하게 만든다. 실제로 이번 재검증에서 grouping·container-read 2개 지점이 추가 발견되었다. 표현 정정이 위험 인식에 직접 영향을 준다. |

### 13.4 [보완] 이전 분석에서 누락되었던 항목

정정은 아니지만 이번에 새로 식별한 것:

| 항목 | 내용 |
| --- | --- |
| `asyncSqlGroupingResultSet` 의 EXECUTE_SCRIPTS 우회 | `WebServiceSQL:796` 이 `asyncExecuteQuery` 를 거치지 않고 `WebSQLUtils.createAsyncTaskExecuteSqlQuery:278` 를 직접 호출 (§7.3) |
| `setAutoCommit(true)` 암시적 COMMIT | `JDBCExecutionContext.java:396-399` (§4.2) |
| Object DDL 유형별 매핑 | CREATE/ALTER/TRUNCATE/COMMENT 는 Object API 자체가 없음 (§6) |
| `renameNode` 의 `supportsRename()` 분기 | 검증 결과 DB 객체는 안전. 새 위험 아님 (§6.1) |
| Import 경유 `CREATE TABLE` 경로 | `DatabaseTransferUtils.java:728` (§6 표) |
| `updateConnection` 의 `readOnly` 자가 해제 가능성 | `WebConnectionConfigInputHandler.java:94` (§7.11) |
| Connection mutation 전수 목록 | §6A |
| `deploy/build.bat` 의 stale config path | §12.4 — 공식 Windows 빌드 스크립트 결함 |

### 13.5 [정정] 이전 보고의 표현 오류

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 표현** | 1차 작업 종료 시 working tree 를 "clean" 이라고 기술했다. |
| **수정된 내용** | tracked 파일의 diff 는 비어 있었으나 `docs/` 가 untracked 상태였다. untracked 파일이 있으면 clean 이 아니다. |
| **수정 근거** | `git status --porcelain` → `?? .omx/`, `?? docs/` |
| **아키텍처 영향** | 없음. 보고 정확성 문제. |

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 표현** | "`yarn install --immutable` 은 Windows에서 사용 불가" |
| **수정된 내용** | 이 저장소의 `react-data-grid` 로컬 `file:` artifact 에 국한된 체크섬 불일치이며, 원인은 **확정하지 못했다(추정)**. 플랫폼 일반 명제로 확대할 근거가 없다. |
| **수정 근거** | §12.7 |
| **아키텍처 영향** | 없음. 다만 근거 없는 일반화는 이후 환경 구성 판단을 오도할 수 있다. |

---

### 13.6 [3차 정정] `updateConnection` / 연결 CRUD 권한 검사

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (2차) "`createConnection`/`updateConnection`/`deleteConnection` 자체에는 admin 검사가 없고, GraphQL 바인딩에도 권한 래퍼가 없다." → 이를 근거로 §7.11 을 **HIGH(조건부)** 로 제기했다. |
| **수정된 내용** | 권한은 dataFetcher 가 아니라 **서비스 인터페이스 어노테이션 + 리플렉션 프록시**에서 강제된다. `@WebProjectAction(requireProjectPermissions={PERMISSION_PROJECT_DATASOURCES_EDIT})` 가 4개 연결 mutation 전부에 선언되어 있고, `WebServiceBindingBase.invoke` 가 이를 검사한다. 일반 사용자는 GLOBAL 프로젝트에서 `DATA_SOURCES_VIEW` 만 가진다. → **§7.11 DISPROVED** |
| **수정 근거** | `DBWServiceCore.java:137,144,151,158`; `WebServiceBindingBase.java:198-217, 245-291`; `LocalResourceController.java:212-214, 227`; `RMConstants.java:25`; `RMProjectPermission.java:26` |
| **아키텍처 영향** | `updateConnection` 이 **필수 enforcement 지점에서 제외**된다(Option C 채택 시에만 조건부 포함). 2차에서 제기한 "HIGH" 를 그대로 두었다면 불필요한 방어 코드를 추가했을 것이다. 설계 결론(`connectionReadOnly` 를 판정 근거로 쓰지 않음)은 다른 이유로 여전히 유효하다. |
| **교훈** | "바인딩에 래퍼가 없다"는 관찰만으로 "권한 검사가 없다"고 결론 내린 것이 오류였다. **어노테이션 기반 AOP 성 검사를 반드시 확인해야 한다.** |

### 13.7 [3차 정정] `supportsCustomConnections` 의 성격

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (2차) 프로젝트 목록 필터링(UI/config) 수준의 조건으로만 서술 |
| **수정된 내용** | `WebServiceBindingBase.java:277-281` 에서 **서버측으로** private project 접근을 거부한다. UI 조건이 아니다. |
| **수정 근거** | 동 라인 |
| **아키텍처 영향** | 운영에서 `supportsCustomConnections=false` 설정이 실제 서버측 통제로 작동한다는 근거가 확보됐다. QA.md §44 대응이 설정만으로 가능하다. |

### 13.8 [3차 정정] Enforcement 집계 방식

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (2차) "4개 파일 / 14개 지점" 을 단일 수치로 제시 |
| **수정된 내용** | 중복(autoCommit 2중 계산), 복구 경로(rollback), 비실행 경로(script 생성), 미검증 경로(setDefaults)를 같은 층위로 셌다. §9 에서 **7개 범주로 분리**하고 단일 숫자 단정을 폐기했다. 확정 수정 파일은 `WebSQLProcessor.java` 를 포함해 **5개**로 정정. |
| **수정 근거** | §9.1~9.9 |
| **아키텍처 영향** | 중앙 분류 지점(C1 = `processQuery`)이 필요하다는 점이 확정되어, 인가와 SQL 분류의 책임 분리가 설계에 반영됐다(§8 최종 추천). |

### 13.9 [3차 보완] Grouping 경로 판정 세분화

| 항목 | 내용 |
| --- | --- |
| **과도했던 표현** | (2차) §7.3 을 "EXECUTE_SCRIPTS 우회" 로만 기술 |
| **수정된 내용** | gate bypass / 임의 표현식 주입 / 임의 문장 실행 / 부작용 mutation / 최종 SQL 분류 부재 **5개로 분리**해 각각 상태를 표기했다. 또한 `functions` 주입이 `filter.where` 의 하위 사례가 **아니라** 독립 벡터임을 확인했다(§6D.4). |
| **수정 근거** | §6D 전체 |
| **아키텍처 영향** | `filter.where` 대응책만으로는 grouping 을 막을 수 없으므로 **`functions` allowlist** 가 별도 요구사항으로 추가됐다. |

### 13.10 [4차 정정] 중앙 분류 위치가 "`:218` 이후"라는 표현

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (3차 §9.3) 중앙 분류 지점을 "`WebSQLProcessor.processQuery` — `:218` 파싱 직후, `:294` 실행 직전" 범위로 기술 |
| **실제 코드 근거** | `WebSQLProcessor.java:221-225` — `SQLControlCommand` → SQL 변환은 `:222-225` 에서 일어난다. `:218` 직후 element 는 아직 제어 명령일 수 있다. 또한 `:237` `fillQueryParameters` → `SQLUtils.java:1401` `setText()` 가 텍스트를 교체하고, `SQLQuery.setText:375-377` 은 `parsed` 플래그를 리셋하지 않는다 |
| **정정된 결론** | 분류는 ① filter 결합(`:200`) ② control-command 변환(`:225`) ③ 파라미터 치환(`:237`) **모두 이후**, ④ `getScriptElements()` 개별 element 단위, ⑤ `makeStatement:259` 이전에 수행해야 한다. 2단 구조(C1-a 사전검증 / C1-b 실행 직전)로 확정 (§3A.4) |
| **enforcement matrix 영향** | 중앙 지점이 "1개"에서 "1개 파일 / 2단계 / N element" 로 재정의. `WebSQLProcessor:248-251` fail-open 교체가 필수 항목으로 추가 |
| **위험도 변화** | 변화 없음(HIGH). 다만 3차 표현대로 구현하면 **control command 로 생성된 SQL 이 분류를 우회**했을 것이다 — 잠재 CRITICAL 을 회피 |

### 13.11 [4차 정정] `closeConnection` commit 가능성

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (3차 §9.6) "`closeConnection` 이 pending transaction 을 commit 하는지 NOT VERIFIED. commit 으로 확인되면 필수 지점으로 승격" |
| **실제 코드 근거** | `JDBCExecutionContext.java:199` `!isAutoCommit(false)` → `JDBCDataSource.java:427-431` `connection.rollback()`. 해당 경로 전체(`:416-458`)에 **commit 호출이 없다**. `isAutoCommit(boolean):380-387` 은 판단 실패 시 `false` 를 반환해 rollback 방향으로 기운다 |
| **정정된 결론** | 명시적 commit 경로 **DISPROVED**. JDBC rollback 시도 **STATIC VERIFIED**. 드라이버 실제 rollback 성공 **RUNTIME NOT VERIFIED**. `closeConnection` 은 **write authorization 지점이 아니라 transaction 복구 경로** |
| **enforcement matrix 영향** | 조건부 지점 **3 → 2** (`setDefaults`, `updateConnection`). `closeConnection` 은 §9.8 "connection close rollback 경로" 범주로 이동 |
| **위험도 변화** | 잠재 HIGH → **해당 없음**. 불필요한 방어 코드를 추가할 위험을 제거 |

### 13.12 [4차 정정] grouping allowlist 를 조건부로 취급

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (3차) grouping `functions` allowlist 를 런타임 exploit 확인 후 결정할 사항처럼 서술 |
| **실제 코드 근거** | `service.sql.graphqls:456` `functions: [String!]`; `SQLGroupingQueryGenerator.java:123-124` raw append; 프론트엔드 `DEFAULT_GROUPING_QUERY_OPERATION.ts:8` = `'COUNT(*)'` 문자열, `locales/en.ts:13` placeholder `"Enter function (e.g., SUM(salary), AVG(score))"` → **클라이언트는 완성된 SQL 식을 자유 텍스트로 전송한다.** allowlist 는 어디에도 없다 |
| **정정된 결론** | **allowlist = REQUIRED.** 런타임 exploit 성공 여부와 무관하다. 중앙 classifier 로 대체 불가(§6D.5) — 주입식은 `SELECT` 로 분류되기 때문 |
| **enforcement matrix 영향** | 조건부가 아니라 **필수 설계 요구사항(security requirement)** 으로 §9.1 하단에 편입. 단 **구현 방식(GraphQL 스키마 변경 여부)은 Phase 2 선택 → 스키마 파일은 후보** |
| **위험도 변화** | HIGH 유지. 단 "런타임 확인 후 판단" 에서 "즉시 필수" 로 격상 |

### 13.13 [4차 정정] parser 테스트의 결정력 과장

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (3차 §15) "`StatementClassifier` 단위 테스트를 프로덕션 코드 변경 없이 작성한다. 그 결과에 따라 Option A 단독 vs A+C 가 결정된다" |
| **실제 근거** | ① `StatementClassifier` 는 **존재하지 않는다** — 존재하지 않는 클래스의 단위 테스트는 불가. ② `SQLQuery.parseQuery:142-220` 은 최상위 statement 종류만 판정하며 함수 volatility 정보는 DB 카탈로그에만 있다(§5A.2) |
| **정정된 결론** | 다음 작업은 **기존 `SQLQuery.getType()` / `SQLQueryCategory` 에 대한 characterization test** 다. 이는 "무엇이 SELECT 로 분류되는가"만 알려주며 **"그것이 안전한가"는 알려주지 않는다.** Option C 필요성은 §5A.2에 따라 이미 정적으로 결정되어 있다 |
| **enforcement matrix 영향** | 없음. Phase 구분(§15.1)이 명확해져 Phase 1/2/3 경계가 정리됨 |
| **위험도 변화** | 없음. 다만 잘못된 기대로 Phase 2 착수를 앞당길 위험을 제거 |

### 13.14 [4차 보완] 신규 확인 사항

| 항목 | 내용 |
| --- | --- |
| `SQLScript` 의 유일한 생성 지점 | `SQLCommandAI.java:180` — `ai` 명령이 LLM 출력 복수 문장을 `SQLScript` 로 변환. ~~repo 전체에서 유일한 복수 statement 진입 경로~~ → **5차에서 이 표현 정정: `SQLScript` 생성 지점일 뿐, 일반 입력도 복수 statement 를 담는다(§3C, §13.15)** |
| `model.ai` 가 CB CE 서버 런타임에 포함됨 | `io.cloudbeaver.service.ai/META-INF/MANIFEST.MF` `Require-Bundle: org.jkiss.dbeaver.model.ai` + `server.feature` 에 `io.cloudbeaver.service.ai` 포함 → `ai` 명령 도달 가능 (§3B.1) |
| `WebSQLProcessor:248-251` fail-open | 비-`SQLQuery` element 를 `log.error` 후 `continue` — 요청을 거부하지 않는다 (§3A.2) |
| `SQLQuery.setText` 가 파싱 캐시를 무효화하지 않음 | `SQLQuery.java:375-377` vs `:142-146` (§3A.3) |
| 최종 SQL text 확정 위치 | `DBUtils.makeStatement:1642-1657` — transformer 적용 시 `sqlQuery.getText()` 와 다를 수 있음 (§3A.2) |
| 제어 명령 전수 8종 및 범주 분류 | §3B.1, §3B.2 |
| grouping 프론트엔드가 자유 텍스트 입력 | §6D.6 — allowlist 도입 시 기능 회귀 발생 (CLAUDE.md §22) |

### 13.15 [5차 정정] "AI 가 유일한 multi-statement 진입점"

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (4차 §3A.2, §13.14) "`SQLScript` 생성 = `ai` 한 곳 = repo 전체에서 유일한 복수 statement 진입 경로" |
| **실제 코드 근거** | `WebSQLProcessor.java:218` 이 `extractActiveQuery(...,0,sql.length())` 로 전체 선택을 넘기고, `SQLScriptParser.java:807-810` 이 이를 `new SQLQuery(dataSource, 전체텍스트, ...)` 로 만든다. `SELECT ...; UPDATE ...` 전체가 단일 `SQLQuery` 가 된다. 일반 `getScriptElements()`(`SQLQuery.java:137-140`)는 `List.of(this)` — 분해하지 않는다 |
| **정정된 결론** | **DISPROVED.** "`SQLScript` 생성 지점(=`ai`)"과 "사용자 입력에 복수 SQL 이 포함될 수 있는 경로(=모든 `asyncSqlExecuteQuery`)"는 다르다. 후자가 훨씬 넓다. 일반 입력은 통짜 `SQLQuery` 로 남아 `getScriptElements()` 순회로 발견되지 않는다 (§3C) |
| **enforcement matrix 영향** | **C1-a 설계 변경.** `getScriptElements()` 순회 → `SQLScriptParser.parseScript(최종 text)` 재분해로 교체. `WebSQLProcessor.java` 수정 범위 확대(다만 파일 수는 그대로 5개) |
| **위험도 변화** | 4차 표현대로 구현했다면 **일반 multi-statement 우회가 그대로 남았을 것** — 잠재 CRITICAL 회피 |

### 13.16 [5차 정정] `getScriptElements()` 만으로 전체 SQL 이 분해된다는 가정

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (4차 §3A.4/§3A.5) C1-a 가 `mainQuery.getScriptElements()` 를 순회하면 모든 statement 를 검사한다 |
| **실제 코드 근거** | 일반 `SQLQuery.getScriptElements()` = `List.of(this)` (통짜). `SQLScript` 일 때만 리스트. 일반 경로는 `SQLScript` 를 만들지 않는다(§3C.1) |
| **정정된 결론** | `getScriptElements()` 는 불충분. C1-a 는 최종 text 를 `parseScript`(public static, `SQLScriptParser.java:1085`)로 dialect-aware 재분해하고 **전체 소비(trailing text 없음)** 를 확인해야 한다 (§3A.4, §3C.3) |
| **enforcement matrix 영향** | C1-a 의 구현 방식 확정. transformer/파라미터/filter 이후의 최종 text 를 대상으로 함 |
| **위험도 변화** | 없음(설계 정확성). 미수정 시 §13.15 와 동일 위험 |

### 13.17 [5차 정정] C1-b 를 "최종 SQL 검사"라고 표현한 부분

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (4차 §9.3) C1-b(=`makeStatement` 직전)가 최종 SQL 을 검사한다 |
| **실제 코드 근거** | `DBUtils.makeStatement:1650-1656` 이 내부에서 query transformer 를 적용해 `queryText` 를 만들며, 이 최종 text 는 반환되지 않는다. C1-b 는 그 이전 text 만 본다 |
| **정정된 결론** | C1-b 는 "makeStatement 이전 text" 검사다. transformer 이후 최종 SQL 은 보지 못한다. **PG/MySQL 한정으로** transformer 가 text 를 바꾸지 않거나(FetchAll) plain SELECT 에 LIMIT append 만 하므로(Limit) 실질 동일하다(§4A). 다른 DBMS 는 미보증 |
| **enforcement matrix 영향** | Platform 수정 불필요(STOP 아님) — PG/MySQL 한정. transformer 를 두 DBMS 에 대해 TCB 로 지정 |
| **위험도 변화** | 없음(PG/MySQL). 미검증 DBMS 는 지원 범위 밖 유지 |

### 13.18 [5차 정정] characterization test 가 빌드 없이 가능하다는 주장

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (4차 §15.2) "1번(characterization test)을 빌드·DB 없이 수행 가능" |
| **실제 코드 근거** | 대상 모듈 `test/org.jkiss.dbeaver.model.sql.test` 가 `eclipse-test-plugin`(Tycho), target platform(p2) resolution 필요. 오프라인 1회 실행 → `Missing requirement: ... org.jkiss.dbeaver.model 0.0.0 ... could not be found`. 온라인은 §12.6 p2 체크섬 blocker |
| **정정된 결론** | **BLOCKED.** characterization test 는 backend build(p2) 복구 이후에만 가능. 체크섬 우회 없이는 실행 불가 (§15.4) |
| **enforcement matrix 영향** | 없음. 다음 단계 순서 변경: build 복구(0번)가 characterization test(1번)의 선행 조건 |
| **위험도 변화** | 없음(절차 정확성) |

### 13.19 [5차 정정] GraphQL 스키마 파일이 확정 수정 대상이라는 표현

| 항목 | 내용 |
| --- | --- |
| **잘못됐던 주장** | (4차 §9.9) grouping allowlist 로 인해 "GraphQL 스키마 변경이 사실상 확정" |
| **실제 근거** | allowlist(security requirement)는 필수지만, 구현 방식은 두 가지 — ① 스키마에 enum 도입 ② 기존 `functions:[String!]` 유지하되 서버에서 문자열을 파싱해 비허용 시 DENY(fail-closed). ②는 스키마 변경이 없다 |
| **정정된 결론** | **security requirement = 필수(확정), 구현 방식 = Phase 2 선택.** 따라서 GraphQL 스키마 파일은 **후보**이지 확정 수정 파일이 아니다. 확정 수정 파일은 서버 Java 5개 |
| **enforcement matrix 영향** | 확정 파일 5개 유지, 스키마·`WebServiceCore` 는 후보/조건부로 분리 |
| **위험도 변화** | 없음(범위 정확성) |

### 13.20 [5차 보완] 신규 확인 사항

| 항목 | 내용 |
| --- | --- |
| 일반 입력이 단일 `SQLQuery` 에 복수 statement 를 담음 | `SQLScriptParser.java:799-810`; `WebSQLProcessor.java:218` (§3C.1) |
| `parseScript` 는 public static, 부작용 없이 재분해 | `SQLScriptParser.java:1085-1094` (§3C.3) |
| 파라미터 값이 client 확인 응답에서 오고 raw splice 됨 | `WebSQLParametersProvider.java:80-92`; `SQLUtils.java:1398-1401` (§3A.6) |
| `SQLScript` 치환 시 outer/inner 불일치 | `SQLScript.java:31,36-40`; `SQLQuery.java:375-377` (§3A.6) |
| PG/MySQL `QueryTransformerFetchAll.transformQueryString` 이 text 불변 | `PG:.../QueryTransformerFetchAll.java:41`; `MySQL:.../QueryTransformerFetchAll.java:45` (§4A.2) |
| `QueryTransformerLimit` 은 plain SELECT 에 LIMIT raw append, 기본 비활성 | `QueryTransformerLimit.java:66-96`; `DBUtils.java:1622-1623` (§4A.2) |
| `DBUtils.makeStatement` 이 원본 객체의 `getType()`/`isPlainSelect()` 사용 | `DBUtils.java:1609,1613` (§3A.3) |
| characterization test harness BLOCKED (오프라인 실행 확인) | §15.4 |

---

## 14. Unsupported / Unverified Areas

1. **모든 런타임 동작** — 실행 중인 CloudBeaver나 실제 DB를 사용한 검증 0건
2. §7.1 EXPLAIN ANALYZE 우회의 실제 성립 여부
3. §4.2 `setAutoCommit(true)` 의 드라이버별 실제 commit 동작
4. ~~§4.3 `sqlContextDestroy` / `closeConnection` 의 commit·rollback 동작~~
   → **정적으로 해소.** 둘 다 commit 하지 않으며 close 는 명시적 rollback 을 시도한다 (§6C, §6C.5).
   남은 것은 드라이버의 실제 rollback 성공 여부(아래 13번)
5. PostgreSQL / MySQL 드라이버의 `setReadOnly(true)` 서버측 강제력
6. data-modifying CTE 의 실제 `SQLQueryType` 분류 결과
7. `SQLScriptParser.parseScript`/`extractScriptQueries` 의 문장 분해가 DB 해석과 항상 일치하는지
   (dollar-quoting, 커스텀 delimiter, procedure body 내부 delimiter 등) — C1-a 의 신뢰성 전제
7b. **§3C — 일반 GraphQL `SELECT ...; UPDATE ...` 가 JDBC 에서 복수 실행되는지, `getType()` 이
    UNKNOWN 을 반환하는지 첫 문장만 파싱하는지** (PG/MySQL 각각)
8. DBeaver `model.ai` toolbox 를 통한 간접 SQL 실행 가능성
9. distributed 모드 전용 경로
10. `WebSQLProcessor` 의 `readData` 호출부(`:560`, `:967`) 세부 도달 조건
11. SHARED 프로젝트에 `DATA_SOURCES_EDIT` 를 부여받은 사용자가
    해당 프로젝트 운영 Connection 의 `readOnly` 를 해제할 수 있는지 (§6B.3)
12. §7.14 persistence 실패 시 descriptor rollback 부재의 실제 재현
13. `connection.rollback()` 이 PostgreSQL/MySQL 드라이버에서 실제로 성공하는지,
    그리고 비-JDBC datasource 구현의 종료 동작 (§6C.5, DBMS별)
14. §6C 시나리오(만료 → context destroy → 새 context → commit)의 실제 DB 상태
15. grouping `functions` 주입이 실제로 실행되는지, 부작용 함수로 DB 변경이 가능한지 (§6D.3)
16. grouping 으로 임의 *문장* 실행이 가능한지 (§6D.3)
17. `sqlContextSetDefaults`(`USE`/`SET search_path`)가 DBMS 별로 실제 상태 변경인지 (§9.6)
18. Frontend 빌드 실패가 Node 24 에서 해소되는지
19. `yarn install --immutable` 체크섬 불일치의 확정 원인
20. `deploy/build.bat` stale path 가 런타임에 미치는 실제 영향 (§12.4)

---

## 15. 다음 단계 제안

### 15.1 세 종류의 "parser 테스트" 구분 (4차 — 용어 정정)

> **정정.** 3차 문서는 "`StatementClassifier` 단위 테스트를 프로덕션 코드 변경 없이 작성한다"고
> 권고했다. **`StatementClassifier` 는 아직 존재하지 않으므로 이 표현은 잘못이다.**
> 존재하지 않는 클래스의 단위 테스트는 작성할 수 없다.

| 구분 | 대상 | Phase | 프로덕션 코드 변경 | 증명할 수 있는 것 | 증명할 수 없는 것 |
| --- | --- | --- | --- | --- | --- |
| **(1) characterization test** | 기존 `SQLQuery.getType()` / `SQLQueryCategory` | **Phase 1 검증** | **없음** (테스트 소스만 추가) | 어떤 입력이 어떤 `SQLQueryType` 으로 분류되는지 (§5.3 표의 실제값) | 분류 결과가 **안전한지** 여부; 부작용 함수 판별; JDBC read-only 실효성 |
| **(2) 테스트 전용 parser spike** | 폐기 예정 실험 코드 | **Phase 2 설계** | 없음 (spike 는 병합하지 않음) | allowlist·fail-closed 규칙의 실현 가능성 | 실제 enforcement 동작 |
| **(3) 신규 `StatementClassifier` test-first 구현** | 신규 fork 번들 | **Phase 3 구현** | **있음** (신규 클래스 생성) | 우리 분류 정책의 정확성 | 서버 전체 enforcement (integration test 별도 필요) |

→ 다음 작업으로 권장하는 것은 정확히 **(1) 기존 `SQLQuery.getType()` 및 `SQLQueryCategory` 에 대한
characterization test** 이며, 신규 classifier 구현이 아니다.

**이 테스트 결과만으로 Option C 필요 여부가 결정된다고 주장하지 않는다.**
(3차 문서의 해당 주장은 §13.13에서 정정)
Option C 필요성은 §5A.2에 따라 **정적으로 이미 결정**되어 있다 —
classifier 는 원리적으로 함수 부작용을 판별할 수 없으므로,
"함수 호출을 허용한다면" Option C 또는 함수 차단 정책이 필요하다.
characterization test 가 알려주는 것은 **분류 경계의 실제 위치**뿐이다.

### 15.2 순서

| 순서 | 작업 | Phase | 이유 |
| --- | --- | --- | --- |
| 0 | **backend build 복구** (upstream p2 정상화 대기) — characterization test harness 의 전제 | Phase 0 | §15.4 — 현재 harness BLOCKED |
| 1 | 기존 `SQLQuery.getType()` / `SQLQueryCategory` characterization test (§5.3 표 + §3C multi-statement) | Phase 1 | **build 복구 후에만 가능**(§15.4). §5.3 "예상값"을 실측값으로 |
| 2 | PostgreSQL / MySQL 테스트 DB(Docker) + QA.md 픽스처 구성 | Phase 1 | 이후 모든 런타임 검증의 전제 |
| 3 | 런타임 실증: §3C multi-statement, §7.1 EXPLAIN ANALYZE, §4.2 autoCommit, §3.3 filter.where, §6D grouping `functions`, §6C transaction lifecycle, §6C.5 close rollback | Phase 1 | Critical/High 확정, §9.6 조건부 2지점 결정 |
| 4 | PostgreSQL/MySQL `setReadOnly(true)` 강제력 실증 | Phase 1 | Option C 실효성 확인 |
| 5 | Phase 2 권한 모델 + 함수 정책 + grouping API 설계 확정 | Phase 2 | §5A.3 정책 결정 3택 포함 |
| 6 | Phase 3 enforcement 구현 — §9.9 파일 5개 + 신규 번들 | Phase 3 | |

> ⚠ **5차 정정.** 4차는 "1번을 빌드·DB 없이 수행 가능"하다고 했다. **틀렸다.**
> characterization test 대상 모듈이 Tycho `eclipse-test-plugin` 이라 target platform(p2)
> resolution 이 필요하고, 이는 backend build 와 동일한 p2 체크섬 blocker 에 걸린다(§15.4).
> 따라서 1번은 **0번(build 복구) 이후에만** 가능하다.

**1번만으로는 Phase 2 착수 조건이 충족되지 않는다** — 3~4번의 런타임 결과가
enforcement 지점 수와 Option C 채택 여부를 확정한다.

### 15.4 Characterization Test Harness — BLOCKED (5차 확정)

| 확인 항목 | 결과 | 상태 |
| --- | --- | --- |
| 대상 모듈 | `dbeaver/test/org.jkiss.dbeaver.model.sql.test` — 관련 테스트 `SQLQueryDangerousDetectionTest`(getType/isDeleteUpdateDangerous 검증) | `STATIC VERIFIED` |
| packaging | `eclipse-test-plugin` (Tycho), `Fragment-Host: org.jkiss.dbeaver.model`, JUnit5 | `test/org.jkiss.dbeaver.model.sql.test/pom.xml:30`; `META-INF/MANIFEST.MF:9` |
| parent / 범위 | parent = `tests` → `dbeaver` root. `tycho-surefire-plugin` 사용, target platform 필요 | `test/pom.xml:6-11, 40` |
| target platform resolution | **필요** — `org.jkiss.dbeaver.model` 을 p2 bundle 로 해석 | `STATIC VERIFIED` |
| p2 체크섬 blocker 영향 | **받는다** — 동일 p2 사이트(`repo.dbeaver.net/p2/ce/26.2.0`)의 `apache.dbcp` 체크섬 불일치(§12.6) | 확인 |
| 네트워크 없이 실행 가능? | **아니다** — 오프라인 시 target platform 미캐시 |
| 정확한 명령 (참고) | `mvn -o -pl test/org.jkiss.dbeaver.model.sql.test -am test -Dtest=SQLQueryDangerousDetectionTest` |
| 실제 실행 결과 | **1회 오프라인 시도 → 실패.** `Missing requirement: org.jkiss.dbeaver.model.sql.test requires 'osgi.bundle; org.jkiss.dbeaver.model 0.0.0' but it could not be found`. 온라인이면 §12.6 체크섬에서 실패 | 실행함, 반복 안 함 |
| CloudBeaver 내부 더 작은 harness | `server/test/io.cloudbeaver.test.platform` 도 `eclipse-test-plugin` — 동일 blocker | `STATIC VERIFIED` |
| 새 테스트를 둘 위치 | (Phase 3) DBeaver 기존 parser 테스트와 병렬로 두거나, CB fork 번들에 신규 classifier 테스트. **이번 작업에서 작성 안 함** |

→ **결론: characterization test 는 "빌드 없이 가능"이 아니다. backend build(p2) 복구가 선행 조건이다.**
체크섬 우회 없이 실행할 방법이 현재 없으므로, harness 는 build 복구 시까지 BLOCKED.
1회 오프라인 시도로 확인했고 반복하지 않았다.

### 15.3 정적으로 이미 결정된 사항 (런타임 blocker 아님)

다음은 런타임 검증을 기다리지 않고 Phase 2 설계에 반영할 수 있다.

| 결정 사항 | 근거 |
| --- | --- |
| grouping `functions` allowlist 필요 | §6D.5 — fail-closed 정책상 자명 |
| JDBC close 는 명시적 rollback 시도 (write 지점 아님) | §6C.5 |
| 개별 script element 각각 분류 필요 | §3A.2 |
| control-command 변환 결과 재분류 필요 | §3A.2, §3B.3 |
| 전체 선검사(원자적) 방식 채택 | §3A.5 |
| `:248-251` fail-open 교체 필요 | §3A.2 |
| 분류기는 `getType()` 캐시를 신뢰하지 말고 재파싱 | §3A.3 |
| `connectionReadOnly` 를 정책 판정 근거로 쓰지 않음 | §6B.4 |

# DBAC 빌드/검증 진입점

이 문서는 **어떻게 검증하는지**만 다룹니다. 설계 결정은
`db-access-control-phase1-decision.md`와 `db-access-control-phase2-permission-model.md`에 있고
그 두 문서는 변경하지 않습니다.

이 문서가 존재하는 이유는 하나입니다. 잘못된 reactor 진입점을 쓰면 upstream p2 장애와 **똑같이 보이는**
오류가 나고, 실제로 그 오진이 두 라운드에 걸쳐 반복됐습니다. 아래 6절에 그 사고 기록을 남겨 둡니다.

---

## 1. Canonical 진입점: `server/product/aggregate`

전체 backend 검증의 유일한 진입점입니다. `deploy/build-backend.sh:27-28`이 쓰는 것과 같습니다.

```
server/product/aggregate/pom.xml
  modules:
    ../../../../dbeaver-common     <- 형제 저장소
    ../../../../dbeaver            <- 형제 저장소
    ../..                          <- cloudbeaver
```

이 aggregate가 **세 소스 트리를 하나의 Maven session으로 빌드**합니다. `org.jkiss.dbeaver.*` 플랫폼 번들은
로컬 소스에서 만들어지며, p2에서 내려오지 않습니다.

## 2. `server/pom.xml`을 전체 검증에 쓰지 말 것

`server/pom.xml`은 CloudBeaver 자체 모듈(`bundles`, `features`, `product`, `tests`)만 담습니다.
`dbeaver-common`도 `dbeaver`도 포함하지 않습니다. 따라서 이 진입점으로는 플랫폼 번들이 빌드되지 않고,
target platform 해석이 다음과 같이 실패합니다.

```
[ERROR] Cannot resolve project dependencies:
[ERROR]   Software being installed: io.cloudbeaver.model 1.0.108.qualifier
[ERROR]   Missing requirement: io.cloudbeaver.model 1.0.108.qualifier requires
[ERROR]   'osgi.bundle; org.jkiss.dbeaver.data.gis 0.0.0' but it could not be found
```

`-pl <module> -am`으로 범위를 좁히면 같은 이유로 다른 번들이 빠집니다. 예:

```
[ERROR]   Missing requirement: io.cloudbeaver.test.platform 1.0.0.qualifier requires
[ERROR]   'osgi.bundle; org.jkiss.dbeaver.osgi.test.runner 0.0.0' but it could not be found
```

`org.jkiss.dbeaver.osgi.test.runner`는 `dbeaver-common`이 제공하므로 `-am`으로는 절대 들어오지 않습니다.

## 3. Canonical command

```bash
cd server/product/aggregate
mvn -B clean verify -Dheadless-platform
```

`JAVA_HOME`은 JDK 21이어야 합니다. 형제 저장소 `../../../../dbeaver`와 `../../../../dbeaver-common`이
체크아웃되어 있어야 합니다(`build-backend.sh:19-20`이 `--depth 1`로 clone합니다).

실측: 138 modules, 단일 Reactor Summary. `[n/138]`이 권위 있는 숫자입니다 —
`grep -c '^\[INFO\] Building '`로 세면 tycho 하위 단계까지 잡혀 244가 나오므로 그렇게 세지 마십시오.

## 4. PostgreSQL required-mode command

DBAC PostgreSQL 시나리오는 기본이 **optional**입니다. 데이터베이스가 없으면
`DbacSchemaPostgresTest`가 `Assumptions`로 클래스 전체를 skip합니다. 컨테이너가 없는 개발자의
`deploy/build-backend.sh`를 깨지 않기 위한 의도된 동작입니다.

**skip을 실패로 승격**하려면:

```bash
docker run -d --name dbac-pg-test \
  -e POSTGRES_PASSWORD=dbactest -e POSTGRES_DB=dbactest \
  -p 55432:5432 postgres:16-alpine

cd server/product/aggregate
mvn -B clean verify -Dheadless-platform \
    -DdebugArgs=-Ddbac.test.postgres.required=true
```

`-DdebugArgs`가 forked test JVM으로 들어가는 경로입니다: `server/test/pom.xml`이 tycho-surefire의
`argLine`에 `${debugArgs}`를 덧붙입니다. Maven CLI의 `-D`만으로는 fork된 JVM에 전달되지 않습니다.

기본 URL은 `jdbc:postgresql://localhost:55432/dbactest`, 사용자 `postgres`,
비밀번호 `dbactest`이며 `dbac.test.postgres.{url,user,password}`로 덮어쓸 수 있습니다.

검증할 것:
- `Tests run: N, Failures: 0, Errors: 0, **Skipped: 0**`
- 로그에 `POSTGRESQL NOT VERIFIED`가 **0회**
- `DbacSchemaPostgresTest`의 testcase 수가 0이 아님

`Skipped: 0`이 아니거나 `POSTGRESQL NOT VERIFIED`가 보이면 PostgreSQL은 검증되지 않은 것이며,
어떤 보고서에도 검증됨으로 적어서는 안 됩니다.

### CI에서의 강제 방식

required mode는 `push-pr-devel.yml`의 `verify-dbac-postgres` job이 강제합니다.

```yaml
verify-dbac-postgres:
  name: DBAC PostgreSQL
  uses: ./.github/workflows/backend-build.yml
```

그 workflow(`backend-build.yml`)가 `postgres:16-alpine` service와 build step의
`MAVEN_COMMON_OPTS` 추가를 담고 있습니다. job에는 `if:`도 `needs:`도 없으므로
`pull_request`(opened/synchronize/reopened/ready_for_review)와 `devel` push에서 항상 실행되며,
기존 job에 의존성을 만들지 않습니다.

### 빌드가 green이어도 다시 확인합니다 — Surefire 자기검증 step

`backend-build.yml`의 마지막 step `Verify DBAC PostgreSQL scenarios actually ran`이
`.github/scripts/verify_dbac_surefire.py`를 실행합니다(Python 표준 라이브러리만 사용, 새 의존성이나
Action 없음). Maven이 green이라는 것만으로는 PostgreSQL 시나리오가 실제로 돌았다는 증거가 되지
않기 때문입니다 — required property가 없으면 `DbacSchemaPostgresTest`는 `Assumptions`로 abort하고,
abort는 실패가 아니라 skip입니다.

step은 Surefire XML을 읽어 다음을 확인하고, 하나라도 어긋나면 non-zero로 종료해 job을 실패시킵니다.

- 리포트 파일이 존재하고 파싱 가능한 XML인가
- `<properties>`에 `dbac.test.postgres.required=true`가 기록되었는가
  (즉 property가 forked test JVM에 실제로 도달했는가)
- DBAC 5개 클래스의 testcase 수가 정확한가 —
  `DbacSchemaPostgresTest` 21, `DbacSchemaRecoveryTest` 17, `DbacScriptTranslationTest` 9,
  `DbacSchemaTest` 7, `DbacScriptStatementsTest` 6
- 그 testcase에 `skipped` / `failure` / `error` / `flakyFailure` / `rerunFailure`가 하나도 없는가

`<testsuite tests="...">` 속성은 **신뢰하지 않습니다.** 이 스위트에서 그 값은 110인데 실제
`<testcase>`는 117개입니다. 검증기는 항상 `<testcase>` 요소를 직접 셉니다.

step에는 `if:`도 `continue-on-error:`도 없습니다. `if: always()`를 쓰지 않는 이유는, 빌드가
실패한 뒤에도 실행되면 없거나 낡은 리포트 때문에 진짜 원인 위에 혼란스러운 두 번째 오류가
겹치기 때문입니다.

**testcase 수는 의도적으로 하드코딩된 tripwire입니다.** 리포트에서 개수를 읽어오면 절반이 사라진
실행도 통과합니다. DBAC 시나리오를 추가·삭제하면 이 step이 한 번 실패하는 것이 정상이며,
`EXPECTED_DBAC_TESTS`를 손으로 갱신해야 합니다. 클래스를 `CEServerTestSuite`의 `@SelectClasses`에서
빼는 것도 여기서 걸립니다.

로컬에서 직접 돌릴 때는 기본 경로에 CI checkout 접두사(`cloudbeaver/`)가 붙어 있으므로 리포트
경로를 인자로 넘기십시오.

```bash
python .github/scripts/verify_dbac_surefire.py \
  server/test/io.cloudbeaver.test.platform/target/surefire-reports/TEST-io.cloudbeaver.test.platform.CEServerTestSuite.xml
```

**왜 별도 job인가.** PR에서 백엔드를 빌드하는 기존 `build-server` job은
`dbeaver/dbeaver-common/.github/workflows/mvn-package.yml@devel`을 사용합니다. 호출자는 남의
재사용 workflow의 job에 `services:`를 붙일 수 없고, `dbeaver-common`은 이 fork가 수정하지 않는
Platform 저장소입니다. 따라서 PostgreSQL을 붙일 수 있는 유일한 방법이 이 fork 소유
`backend-build.yml`을 호출하는 것입니다.

**대가.** PR마다 백엔드 빌드가 한 번 더 돕니다(로컬 warm 실측 2:25~2:33). 그 대가를 치르지
않으려면 `verify-dbac-postgres` job을 삭제하면 되지만, 그러면 `DbacSchemaPostgresTest`가 CI에서
계속 skip되므로 **어떤 보고서에도 PostgreSQL이 CI에서 검증된다고 적을 수 없습니다.**

### 남은 위험

**timeout이 실측되지 않았습니다.** `backend-build.yml`의 `timeout-minutes: 10`은 이 workflow가
한 번도 실행되지 않은 상태에서 정해진 값입니다. cold runner에서는 postgres image pull,
health 대기, `dbeaver`/`dbeaver-common` clone, Tycho p2 해석, 138 모듈 빌드, 117 테스트,
드라이버 다운로드가 모두 이 안에 들어가야 합니다. 첫 CI 실행으로 실제 소요 시간을 확인하고
근거를 갖고 조정하십시오. 초과하면 코드와 무관하게 PR이 red가 됩니다.

### 해소된 위험 — upstream이 property 전달 경로를 없애는 경우

`dbac.test.postgres.required`는 upstream 소유 파일 `server/test/pom.xml`의
`<argLine>… ${debugArgs}</argLine>` 훅으로만 forked JVM에 도달합니다. upstream 병합이
`${debugArgs}`를 없애면 `REQUIRED`는 조용히 `false`가 되고, 여기에 `findDriverJar()`가 null이
되는 사고(5절의 reactor 순서 의존)가 겹치면 PostgreSQL 테스트가 전부 skip된 채 빌드는
green이 됩니다. 데이터베이스 자체는 정상이므로 service health gate가 이 조합을 잡지 못합니다.

이 구멍은 위의 Surefire 자기검증 step이 막습니다. 리포트의 `<properties>`에
`dbac.test.postgres.required=true`가 없거나 PostgreSQL testcase가 21개가 아니면 step이 실패하므로,
전달 경로가 사라지면 CI가 green이 될 수 없습니다. 따라서 **더 이상 로그를 손으로 확인할 필요는
없습니다** — 다만 upstream 병합에서 `server/test/pom.xml`의 `${debugArgs}`가 사라졌다면, 그때는
이 step이 실패로 알려 줄 것이므로 property 전달 경로를 다시 만들어야 합니다.

## 5. 테스트에 PostgreSQL JDBC 드라이버가 있는 이유

`DbacSchemaPostgresTest.findDriverJar()`는 `user.dir`에서 위로 올라가며
`deploy/drivers/postgresql/postgresql-*.jar`를 찾습니다. `build-backend.sh:7`이 `deploy/drivers`를
지우지만, reactor의 `drivers.postgresql`(130/138)이 `io.cloudbeaver.test.platform`(137/138)보다
먼저 실행되어 드라이버를 다시 받아 놓습니다. 이 순서에 의존하므로, 드라이버 모듈을 테스트 뒤로
옮기면 테스트가 드라이버를 찾지 못합니다.

## 6. 사고 기록 — missing bundle 오류를 p2 장애로 단정하지 말 것

두 라운드에 걸쳐 다음 오진이 있었습니다.

1. `server/pom.xml`로 빌드 → `org.jkiss.dbeaver.data.gis` 해석 실패.
2. `repo.dbeaver.net/p2/ce/26.2.0`의 `content.xml`을 열어 보니 27개 unit뿐이고
   `org.jkiss.dbeaver.*`가 하나도 없었음.
3. "upstream이 26.2.0 채널을 잘랐다"고 결론. **틀렸습니다.**

무엇을 놓쳤는지:

- `p2/ce/*` 채널은 **원래** 서드파티 wrapper만 담습니다. `25.2.0`부터 `26.2.0`까지 전 채널이
  11–15 KB, 27개 내외로 같은 형태입니다. 26.2.0만 이상한 게 아닙니다.
- `org.jkiss.dbeaver.data.gis`는 애초에 p2에서 오지 않습니다.
  `dbeaver/plugins/org.jkiss.dbeaver.data.gis`에 소스가 있고 aggregate reactor가 빌드합니다.
- 진짜 원인은 잘못된 진입점 하나였습니다.

다음에 missing bundle 오류를 보면 **이 순서로** 확인하십시오.

1. 진입점이 `server/product/aggregate`인가? 아니면 그것이 원인입니다.
2. 형제 저장소 `../../dbeaver`, `../../dbeaver-common`이 체크아웃되어 있는가?
3. 없어진 번들이 `org.jkiss.dbeaver.*` 또는 `com.dbeaver.*`인가?
   그렇다면 소스에서 빌드되어야 하는 것이며 p2 문제가 아닙니다.
4. `org.jkiss.bundle.*`(서드파티 wrapper)인가? 그때만 p2를 의심하십시오.

p2 채널이 정말 의심되면 `content.xml`을 **여러 버전에 걸쳐** 비교하십시오. 한 버전만 보면
정상 상태를 장애로 오독합니다.

### 실제로 관측된 유일한 외부 사건

`org.jkiss.bundle.gis 2.0.9`의 SHA-512 불일치가 이전 세션에서 1회 발생했고 재현되지 않았습니다.
이 아티팩트는 채널의 정당한 구성원(27개 중 하나)입니다. `p2/ce/26.2.0`은 개발 중 버전의
**가변 채널**이므로 metadata/artifact skew가 다시 생길 수 있습니다. checksum 검증은 절대 우회하지
마십시오 — Tycho가 잡아 주는 덕분에 조용한 오염이 아니라 빌드 실패로 드러납니다.

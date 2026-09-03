#!/usr/bin/env python3
"""Fail the CI build unless the DBAC PostgreSQL scenarios actually ran.

A green Maven build is not evidence that they did. `DbacSchemaPostgresTest` aborts through JUnit
Assumptions when no database is reachable and `dbac.test.postgres.required` is not set, and an abort
is a skip, not a failure - so the suite stays green while verifying nothing about the PostgreSQL
metadata path. The property that turns that abort into a failure travels a fragile route: it is
appended to MAVEN_COMMON_OPTS in the workflow, passed through deploy/build-backend.sh to Maven as
-DdebugArgs, and only reaches the forked test JVM because server/test/pom.xml - an upstream-owned
file this fork does not modify - happens to append ${debugArgs} to the tycho-surefire argLine. If an
upstream merge drops that hook, everything still builds and everything still looks green.

This script closes that hole by reading what the test run actually recorded. It uses only the Python
standard library; no dependency and no extra GitHub Action.

It is written to catch, specifically:
  * the ${debugArgs} delivery route being removed upstream
  * the required property going missing for any other reason
  * the whole PostgreSQL test class being skipped
  * some PostgreSQL test cases disappearing
  * any PostgreSQL test case failing or erroring

Nothing about the environment is printed: no variables, no Maven options, no credentials. Only the
counts this check is about.

Running it by hand: the default path carries the CI checkout prefix, so from a local clone pass the
report explicitly, e.g.

    python .github/scripts/verify_dbac_surefire.py \
        server/test/io.cloudbeaver.test.platform/target/surefire-reports/\
TEST-io.cloudbeaver.test.platform.CEServerTestSuite.xml
"""

import sys
import xml.etree.ElementTree as ET
from pathlib import Path

# Path the CI job produces, relative to the workspace root.
DEFAULT_REPORT = (
    "cloudbeaver/server/test/io.cloudbeaver.test.platform/target/surefire-reports/"
    "TEST-io.cloudbeaver.test.platform.CEServerTestSuite.xml"
)

REQUIRED_PROPERTY = "dbac.test.postgres.required"
REQUIRED_VALUE = "true"

POSTGRES_CLASS = "io.cloudbeaver.test.platform.dbac.DbacSchemaPostgresTest"

# Pinned deliberately, as tripwires rather than conveniences. Reading the counts from the report would
# make this check agree with whatever ran, including a run that lost half its test cases. Adding or
# removing a DBAC scenario is expected to fail here once, and to be updated by hand.
#
# All five DBAC classes are listed, not just the PostgreSQL one: dropping a class from
# CEServerTestSuite's @SelectClasses removes its test cases from the report entirely, and a check that
# only looked at PostgreSQL would stay green while the rest of the regression net quietly disappeared.
EXPECTED_DBAC_TESTS = {
    "io.cloudbeaver.test.platform.dbac.DbacSchemaPostgresTest": 21,
    "io.cloudbeaver.test.platform.dbac.DbacSchemaRecoveryTest": 17,
    "io.cloudbeaver.test.platform.dbac.DbacScriptTranslationTest": 9,
    "io.cloudbeaver.test.platform.dbac.DbacSchemaTest": 7,
    "io.cloudbeaver.test.platform.dbac.DbacScriptStatementsTest": 6,
}
EXPECTED_POSTGRES_TESTS = EXPECTED_DBAC_TESTS[POSTGRES_CLASS]

# A test case is only accepted as having passed if it carries none of these. skipped/failure/error are
# the ordinary outcomes; flakyFailure and rerunFailure appear when Surefire is configured to retry, and
# a scenario that only passed on a retry is not evidence that the enforcement path works. Nothing sets
# rerunFailingTestsCount today, so these two are pre-emptive.
BAD_OUTCOME_ELEMENTS = ("skipped", "failure", "error", "flakyFailure", "rerunFailure")


def fail(message):
    print("DBAC CI CHECK FAILED: " + message, file=sys.stderr)
    raise SystemExit(1)


def main(argv):
    report = Path(argv[1] if len(argv) > 1 else DEFAULT_REPORT)

    if not report.is_file():
        fail(
            "Surefire report not found at {0}. The test run did not produce a report, so there is no "
            "evidence the DBAC PostgreSQL scenarios ran.".format(report)
        )

    try:
        root = ET.parse(report).getroot()
    except ET.ParseError as error:
        fail("Surefire report {0} is not parseable XML: {1}".format(report, error))

    # 1. The required property must be recorded in the report's own <properties> block, which is what
    #    the forked test JVM actually saw. Note that the <testsuite tests="..."> attribute is NOT
    #    trusted anywhere in this script: on this suite it disagrees with the number of <testcase>
    #    elements, because the suite runner and the engine count differently.
    properties = {
        element.get("name"): element.get("value")
        for element in root.iter("property")
    }
    actual = properties.get(REQUIRED_PROPERTY)
    if actual is None:
        fail(
            "{0} is absent from the Surefire properties. The property never reached the forked test "
            "JVM, so DbacSchemaPostgresTest was free to skip instead of fail. Check that the workflow "
            "still appends -DdebugArgs=-D{0}=true and that server/test/pom.xml still appends "
            "${{debugArgs}} to the tycho-surefire argLine.".format(REQUIRED_PROPERTY)
        )
    if actual != REQUIRED_VALUE:
        fail(
            "{0} is '{1}', expected '{2}'. PostgreSQL scenarios may skip silently in this mode."
            .format(REQUIRED_PROPERTY, actual, REQUIRED_VALUE)
        )

    # 2. Every DBAC test case must be present, and every one of them must have run clean.
    by_class = {}
    for case in root.iter("testcase"):
        classname = case.get("classname")
        if classname in EXPECTED_DBAC_TESTS:
            by_class.setdefault(classname, []).append(case)

    for classname, expected in sorted(EXPECTED_DBAC_TESTS.items()):
        cases = by_class.get(classname, [])
        if len(cases) != expected:
            names = sorted(case.get("name", "?") for case in cases)
            fail(
                "expected {0} {1} test cases, found {2}. Either the class was skipped wholesale, was "
                "dropped from CEServerTestSuite, or scenarios were lost. Present: {3}".format(
                    expected, classname, len(cases), names
                )
            )
        for element in BAD_OUTCOME_ELEMENTS:
            offenders = sorted(
                case.get("name", "?") for case in cases if case.find(element) is not None
            )
            if offenders:
                fail(
                    "{0} {1} test case(s) carry <{2}>: {3}. Required mode must turn an unavailable "
                    "database into a failure, never a skip, and a scenario that only passed on a retry "
                    "is not evidence either.".format(len(offenders), classname, element, offenders)
                )

    postgres_cases = by_class[POSTGRES_CLASS]
    total = sum(len(cases) for cases in by_class.values())
    print(
        "DBAC scenarios verified: postgres_testcases={0} dbac_testcases={1} "
        "skipped=0 failures=0 errors=0".format(len(postgres_cases), total)
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

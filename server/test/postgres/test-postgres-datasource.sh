#!/usr/bin/env bash

set -Eeuo pipefail

# Resolve all paths from the script location so the launcher works from any current directory.
# The repositories listed in project.deps are expected to be siblings under DBEAVER_DEV_HOME.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd -P)"
MAVEN_WRAPPER="$REPO_ROOT/../dbeaver-common/mvnw"
COMPOSE_FILE="$SCRIPT_DIR/compose.yml"

# A unique Compose project prevents parallel test runs from sharing containers and volumes.
PROJECT_NAME="cloudbeaver-pg-${UID:-0}-$$-${RANDOM}"
LOG_DIR="${CLOUDBEAVER_TEST_POSTGRES_LOG_DIR:-$SCRIPT_DIR/target}"
LOG_FILE="$LOG_DIR/postgres.log"

# Keep every Compose command scoped to this test run and its dedicated Compose file.
compose() {
  docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_FILE" "$@"
}

# Always remove the temporary database. On failure, preserve its logs before teardown.
cleanup() {
  local status=$?
  trap - EXIT

  if ((status != 0)); then
    mkdir -p "$LOG_DIR"
    compose logs --no-color postgres 2>&1 | tee "$LOG_FILE" >&2 || true
  fi
  compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  exit "$status"
}

# Fail before creating resources when the required local tools are unavailable.
command -v docker >/dev/null 2>&1 || { printf '%s\n' "docker is required" >&2; exit 1; }
[[ -x "$MAVEN_WRAPPER" ]] || {
  printf 'DBeaver Common Maven wrapper not found or not executable: %s\n' "$MAVEN_WRAPPER" >&2
  exit 1
}
docker compose version >/dev/null

# Cleanup also runs when Maven fails or the launcher is interrupted.
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Compose publishes PostgreSQL on port 5430 by default. The port can be overridden with
# CLOUDBEAVER_TEST_POSTGRES_PORT before running this script.
compose up --detach postgres

# Wait for PostgreSQL itself rather than treating a running container as a ready database.
ready=false
for _ in {1..60}; do
  if compose exec --no-TTY postgres pg_isready --username cloudbeaver_test --dbname cloudbeaver_test >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  printf '%s\n' "PostgreSQL did not become ready" >&2
  exit 1
fi

# 5432 is the PostgreSQL port inside the container. Query Compose for the corresponding
# host port, which is 5430 by default or the caller-provided override.
port_mapping="$(compose port postgres 5432)"
postgres_port="${port_mapping##*:}"
if [[ ! "$postgres_port" =~ ^[0-9]+$ ]]; then
  printf '%s\n' "Could not determine the PostgreSQL host port" >&2
  exit 1
fi

# Pass the actual connection settings to the test JVM. Exporting the discovered port keeps
# Maven aligned with Compose even when the host port was overridden.
export CLOUDBEAVER_TEST_POSTGRES_HOST=127.0.0.1
export CLOUDBEAVER_TEST_POSTGRES_PORT="$postgres_port"
export CLOUDBEAVER_TEST_POSTGRES_DATABASE=cloudbeaver_test
export CLOUDBEAVER_TEST_POSTGRES_USER=cloudbeaver_test
export CLOUDBEAVER_TEST_POSTGRES_PASSWORD=cloudbeaver_test

# Run only the CE PostgreSQL datasource test profile with the shared Maven version.
"$MAVEN_WRAPPER" verify \
  --file "$REPO_ROOT/server/product/aggregate/pom.xml" \
  --define headless-platform \
  --activate-profiles ce-postgres-datasource-tests

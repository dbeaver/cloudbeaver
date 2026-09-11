#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/compose.yml"
PROJECT_NAME="cloudbeaver-pg-${UID:-0}-$$-${RANDOM}"
LOG_DIR="${CLOUDBEAVER_TEST_POSTGRES_LOG_DIR:-$SCRIPT_DIR/target}"
LOG_FILE="$LOG_DIR/postgres.log"

compose() {
  docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_FILE" "$@"
}

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

command -v docker >/dev/null 2>&1 || { printf '%s\n' "docker is required" >&2; exit 1; }
command -v mvn >/dev/null 2>&1 || { printf '%s\n' "mvn is required" >&2; exit 1; }
docker compose version >/dev/null

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

compose up --detach postgres

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

port_mapping="$(compose port postgres 5432)"
postgres_port="${port_mapping##*:}"
if [[ ! "$postgres_port" =~ ^[0-9]+$ ]]; then
  printf '%s\n' "Could not determine the PostgreSQL host port" >&2
  exit 1
fi

export CLOUDBEAVER_TEST_POSTGRES_HOST=127.0.0.1
export CLOUDBEAVER_TEST_POSTGRES_PORT="$postgres_port"
export CLOUDBEAVER_TEST_POSTGRES_DATABASE=cloudbeaver_test
export CLOUDBEAVER_TEST_POSTGRES_USER=cloudbeaver_test
export CLOUDBEAVER_TEST_POSTGRES_PASSWORD=cloudbeaver_test

mvn verify \
  --file "$REPO_ROOT/server/product/aggregate/pom.xml" \
  --define headless-platform \
  --activate-profiles ce-postgres-datasource-tests

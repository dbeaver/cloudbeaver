#!/bin/bash
# Validate tools required by CloudBeaver builds (Tycho 5 needs Maven 3.9.9+; frontend needs Yarn 4).
set -Eeuo pipefail

version_ge() {
  # Return 0 if $1 >= $2 (dot-separated numeric versions).
  local IFS=.
  local i
  local -a v1=($1) v2=($2)
  for ((i = 0; i < ${#v1[@]} || i < ${#v2[@]}; i++)); do
    local a=${v1[i]:-0}
    local b=${v2[i]:-0}
    if ((10#$a > 10#$b)); then
      return 0
    fi
    if ((10#$a < 10#$b)); then
      return 1
    fi
  done
  return 0
}

fail() {
  echo "ERROR: $*" >&2
  echo "See deploy/README.md for install instructions." >&2
  exit 1
}

command -v java >/dev/null 2>&1 || fail "Java is required (Java 21)."
command -v mvn >/dev/null 2>&1 || fail "Maven is required (3.9.9 or newer)."
command -v node >/dev/null 2>&1 || fail "Node.js is required (LTS 22.x recommended)."
command -v yarn >/dev/null 2>&1 || fail "Yarn is required (4.x). Enable Corepack: corepack enable && corepack prepare yarn@4.14.1 --activate"

# Strip ANSI color codes — Maven may colorize when stdout is a TTY.
MVN_VERSION="$(
  mvn -v 2>/dev/null \
    | tr -d '\033' \
    | sed 's/\[[0-9;]*m//g' \
    | awk '/Apache Maven/ {print $3; exit}'
)"
# Fallback: digits-only match if formatting still interferes
if [[ ! "${MVN_VERSION}" =~ ^[0-9]+(\.[0-9]+)*$ ]]; then
  MVN_VERSION="$(mvn -v 2>/dev/null | grep -oE 'Apache Maven [0-9]+(\.[0-9]+)+' | head -1 | awk '{print $3}')"
fi
if [[ -z "${MVN_VERSION}" ]]; then
  fail "Could not determine Maven version. Install Apache Maven 3.9.9+ (do not rely on older apt packages)."
fi
if ! version_ge "${MVN_VERSION}" "3.9.9"; then
  fail "Maven ${MVN_VERSION} is too old. CloudBeaver uses Tycho 5, which requires Maven 3.9.9+. Ubuntu apt often ships an older Maven — install from https://maven.apache.org/download.cgi"
fi

NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)"
if [[ -z "${NODE_MAJOR}" ]] || ((NODE_MAJOR < 20)); then
  fail "Node.js $(node -v 2>/dev/null || echo unknown) is too old. Use Node.js 20.19.1+ (LTS 22.x recommended)."
fi

YARN_VERSION="$(yarn -v 2>/dev/null || true)"
if [[ -z "${YARN_VERSION}" ]]; then
  fail "Could not determine Yarn version."
fi
YARN_MAJOR="${YARN_VERSION%%.*}"
if [[ "${YARN_MAJOR}" != "4" ]]; then
  fail "Yarn ${YARN_VERSION} found, but Yarn 4.x is required (packageManager yarn@4.14.1). apt 'yarn' installs Yarn 1.x — use Corepack instead."
fi

echo "Prerequisites OK: Maven ${MVN_VERSION}, Node $(node -v), Yarn ${YARN_VERSION}"

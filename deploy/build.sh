#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=check-prerequisites.sh
source "${SCRIPT_DIR}/check-prerequisites.sh"
source "${SCRIPT_DIR}/build-backend.sh"
source "${SCRIPT_DIR}/build-frontend.sh"
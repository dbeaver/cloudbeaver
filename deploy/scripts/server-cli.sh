#!/bin/bash
set -Eeo pipefail
CLI_OPTS="$@"
if [[ $# -eq 0 ]] ;
  then
    CLI_OPTS='-help'
fi
source run-server.sh
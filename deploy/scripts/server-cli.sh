#!/bin/bash
set -Eeo pipefail
if [[ $# -eq 0 ]] ;
  then
    set -- "$@" -help
fi
set -- "$@" -cli-mode

source run-server.sh "$@"
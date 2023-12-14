#!/bin/bash
set -Eeuo pipefail

#command line arguments
CONFIGURATION_PATH='../config/sample-databases/SQLiteConfiguration'
SAMPLE_DATABASE_PATH='../config/sample-databases/db'

source build-backend.sh 
source build-frontend.sh
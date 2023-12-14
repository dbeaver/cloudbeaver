#!/bin/bash
set -Eeuo pipefail

#command line arguments
CONFIGURATION_PATH="../config/sample-databases/DefaultConfiguration"
SAMPLE_DATABASE_PATH=""

source build-backend.sh 
source build-frontend.sh
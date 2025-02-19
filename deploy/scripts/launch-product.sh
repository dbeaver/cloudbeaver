#!/bin/bash

# This script is needed to change ownership and run the application as user dbeaver during the upgrade from version 24.2.0

# Change ownership of the WORKDIR to the dbeaver user and group
# Variables DBEAVER_<UID|GID> are defined in the Dockerfile and exported to the runtime environment
# PWD equals WORKDIR value from product Dockerfile

if [ "$(id -u)" -eq 0 ]; then
    TARGET_USER=${TARGET_USER:-dbeaver}
    TARGET_UID=${TARGET_UID:-$DBEAVER_UID}
    TARGET_GID=${TARGET_GID:-$DBEAVER_GID}

    chown -R $DBEAVER_UID:$DBEAVER_GID $PWD/workspace
    # Execute run-server.sh as the dbeaver user with the JAVA_HOME and PATH environment variables
    exec su "$TARGET_USER" -c "JAVA_HOME=$JAVA_HOME PATH=$PATH ./run-server.sh"
else
    exec ./run-server.sh
fi
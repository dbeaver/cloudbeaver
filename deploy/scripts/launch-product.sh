#!/bin/bash

# This script is needed to change ownership and run the application as user dbeaver during the upgrade from version 24.2.0

# Change ownership of the WORKDIR to the dbeaver user and group
# Variables DBEAVER_<UID|GID> are inherited from the dbeaver/base-java image
# PWD equals WORKDIR value from product Dockerfile
chown -R $DBEAVER_UID:$DBEAVER_GID $PWD

# Execute run-server.sh as the dbeaver user with the JAVA_HOME and PATH environment variables
exec su $DBEAVER_UID -c "JAVA_HOME=$JAVA_HOME PATH=$PATH ./run-server.sh"
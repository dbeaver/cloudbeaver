#!/bin/bash

# This script is needed to change ownership and run the application as user dbeaver during the upgrade from version 24.2.0

# Define the path to the workspace volume and user/group for ownership changes
VOLUME_PATH="/opt/cloudbeaver/workspace"
NEW_USER="dbeaver"
NEW_GROUP="dbeaver"

# Change ownership of the VOLUME_PATH to the dbeaver user and group
chown -R $NEW_USER:$NEW_GROUP $VOLUME_PATH

# This allows the dbeaver user and group to have read, write, and execute permissions, while others have only read and execute
find $VOLUME_PATH -type d -exec chmod 775 {} +

# This allows the dbeaver user and group to read and write files, while others can only read
find $VOLUME_PATH -type f -exec chmod 664 {} +

# This ensures that the root workspace directory itself has the correct permissions
chmod 775 $VOLUME_PATH

# Execute run-server.sh as the dbeaver user with the JAVA_HOME and PATH environment variables
exec su $NEW_USER -c "JAVA_HOME=$JAVA_HOME PATH=$PATH ./run-server.sh"
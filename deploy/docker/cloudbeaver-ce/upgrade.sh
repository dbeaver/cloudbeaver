#!/bin/bash

VOLUME_PATH="/opt/cloudbeaver/workspace"
NEW_USER="dbeaver"
NEW_GROUP="dbeaver"

chown -R $NEW_USER:$NEW_GROUP $VOLUME_PATH
find $VOLUME_PATH -type d -exec chmod 775 {} +
find $VOLUME_PATH -type f -exec chmod 664 {} +
chmod 775 $VOLUME_PATH

exec su $NEW_USER -c "JAVA_HOME=$JAVA_HOME PATH=$PATH ./run-server.sh"
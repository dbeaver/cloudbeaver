#!/bin/bash

VOLUME_PATH="/opt/cloudbeaver/workspace"
NEW_USER="dbeaver"
NEW_GROUP="dbeaver"

id $NEW_USER &>/dev/null || useradd -m -s /bin/bash $NEW_USER

chown -R $NEW_USER:$NEW_GROUP $VOLUME_PATH
find $VOLUME_PATH -type d -exec chmod 775 {} +
find $VOLUME_PATH -type f -exec chmod 664 {} +
chmod 775 $VOLUME_PATH

exec ./run-server.sh

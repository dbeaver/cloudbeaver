#!/bin/bash
cd server
launcherJar=( plugins/org.eclipse.equinox.launcher*.jar )

echo "Starting Cloudbeaver Server"
export CLOUDBEAVER_HOME=$(pwd)

java -jar ${launcherJar} -product io.cloudbeaver.server.product -web-config ./../conf/cloudbeaver.conf -nl en -registryMultiLanguage -vmargs -Xmx2048M

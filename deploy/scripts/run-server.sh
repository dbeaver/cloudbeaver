#!/bin/bash
cd server
launcherJar=( plugins/org.eclipse.equinox.launcher*.jar )
workspacePath=./../workspace

echo "Starting Cloudbeaver Server"

java -jar ${launcherJar} -product io.cloudbeaver.server.product -data ${workspacePath} -web-config ./../conf/cloudbeaver.conf -nl en -registryMultiLanguage -vmargs -Xmx2048M

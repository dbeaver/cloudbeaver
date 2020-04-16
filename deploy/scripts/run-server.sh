#!/bin/bash
launcherJar=( server/plugins/org.eclipse.equinox.launcher*.jar )

echo "Starting Cloudbeaver Server"
java -jar ${launcherJar} -product io.cloudbeaver.server.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage -vmargs -Xmx2048M

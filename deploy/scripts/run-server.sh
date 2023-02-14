#!/bin/bash

launcherJar=( server/plugins/org.eclipse.equinox.launcher*.jar )

echo "Starting Cloudbeaver Server"

[ ! -d "workspace/.metadata" ] && mkdir -p workspace/.metadata && mkdir -p workspace/GlobalConfiguration/.dbeaver && cp conf/initial-data-sources.conf workspace/GlobalConfiguration/.dbeaver/data-sources.json

java ${JAVA_OPTS} --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED -jar ${launcherJar} -product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage

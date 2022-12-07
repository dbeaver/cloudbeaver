#!/bin/bash

launcherJar=( server/plugins/org.eclipse.equinox.launcher*.jar )

echo "Starting Cloudbeaver Server"

chown -R cloudbeaver:cloudbeaver /opt/cloudbeaver 

[ ! -d "workspace/.metadata" ] && mkdir -p workspace/.metadata && mkdir -p workspace/GlobalConfiguration/.dbeaver && cp conf/initial-data-sources.conf workspace/GlobalConfiguration/.dbeaver/data-sources.json

su cloudbeaver -c "/opt/java/openjdk/bin/java ${JAVA_OPTS} -jar ${launcherJar} -product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage"
# java ${JAVA_OPTS} -jar ${launcherJar} -product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage

#!/bin/bash

launcherJar=( server/plugins/org.eclipse.equinox.launcher*.jar )

echo "Starting Cloudbeaver Server"

if [ ! -d "workspace/.metadata" ]; then
    mkdir -p workspace/.metadata
    touch workspace/.metadata/server.log
    mkdir -p workspace/GlobalConfiguration/.dbeaver
    cp conf/initial-data-sources.conf \
        workspace/GlobalConfiguration/.dbeaver/data-sources.json

VMARGS_OPTS="${JAVA_OPTS:--Xmx2048M}"

java -jar ${launcherJar} -product io.cloudbeaver.product.ce.product -web-config conf/cloudbeaver.conf -nl en -registryMultiLanguage -vmargs ${VMARGS_OPTS}

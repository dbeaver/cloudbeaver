#!/bin/bash

launcherJar=( server/plugins/org.jkiss.dbeaver.launcher*.jar )

echo "Starting Cloudbeaver Server"

[ ! -d "workspace/.metadata" ] && mkdir -p workspace/.metadata \
  && mkdir -p workspace/GlobalConfiguration/.dbeaver  \
  && [ ! -f "workspace/GlobalConfiguration/.dbeaver/data-sources.json" ] \
  && cp conf/initial-data-sources.conf workspace/GlobalConfiguration/.dbeaver/data-sources.json

exec java ${JAVA_OPTS} \
  -Dfile.encoding=UTF-8 \
  --add-modules=ALL-SYSTEM \
  --add-opens=java.base/java.io=ALL-UNNAMED \
  --add-opens=java.base/java.lang=ALL-UNNAMED \
  --add-opens=java.base/java.lang.reflect=ALL-UNNAMED \
  --add-opens=java.base/java.net=ALL-UNNAMED \
  --add-opens=java.base/java.nio=ALL-UNNAMED \
  --add-opens=java.base/java.nio.charset=ALL-UNNAMED \
  --add-opens=java.base/java.text=ALL-UNNAMED \
  --add-opens=java.base/java.time=ALL-UNNAMED \
  --add-opens=java.base/java.util=ALL-UNNAMED \
  --add-opens=java.base/java.util.concurrent=ALL-UNNAMED \
  --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED \
  --add-opens=java.base/jdk.internal.vm=ALL-UNNAMED \
  --add-opens=java.base/jdk.internal.misc=ALL-UNNAMED \
  --add-opens=java.base/sun.nio.ch=ALL-UNNAMED \
  --add-opens=java.base/sun.security.ssl=ALL-UNNAMED \
  --add-opens=java.base/sun.security.action=ALL-UNNAMED \
  --add-opens=java.base/sun.security.util=ALL-UNNAMED \
  --add-opens=java.security.jgss/sun.security.jgss=ALL-UNNAMED \
  --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED \
  --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED \
  --add-opens=java.sql/java.sql=ALL-UNNAMED \
  -jar ${launcherJar} \
  -product io.cloudbeaver.product.ce.product \
  -web-config conf/cloudbeaver.conf \
  ${CLI_OPTS} \
  -nl en \
  -registryMultiLanguage
